import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser, isStaffOrAdmin } from "@/lib/auth";
import { generateReferenceNumber } from "@/lib/reference";
import { createAuditLog } from "@/lib/audit";
import { analyzeReport } from "@/lib/reportRiskAnalyzer";
import { incrementReportCount, isOnCooldown } from "@/lib/userTrust";


export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    const { searchParams } = new URL(req.url);

    const status = searchParams.get("status");
    const categoryId = searchParams.get("categoryId");
    const priority = searchParams.get("priority");
    const agencyId = searchParams.get("agencyId");
    const search = searchParams.get("search");
    const mineOnly = searchParams.get("mine") === "true";
    const publicOnly = searchParams.get("public") === "true";
    const limit = parseInt(searchParams.get("limit") || "30", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    // Filter by ownership if resident or requested
    if (!session || (!isStaffOrAdmin(session.role) && !publicOnly)) {
      if (!session) {
        return NextResponse.json({ reports: [], total: 0 });
      }
      whereClause.residentId = session.id;
    } else if (mineOnly && session) {
      whereClause.residentId = session.id;
    }

    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    if (categoryId && categoryId !== "ALL") {
      whereClause.categoryId = categoryId;
    }

    if (priority && priority !== "ALL") {
      whereClause.priority = priority;
    }

    if (agencyId && agencyId !== "ALL") {
      whereClause.assignedAgencyId = agencyId;
    }

    if (search && search.trim()) {
      const q = search.trim();
      whereClause.OR = [
        { referenceNo: { contains: q } },
        { title: { contains: q } },
        { description: { contains: q } },
        { address: { contains: q } },
      ];
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where: whereClause,
        include: {
          category: true,
          assignedAgency: true,
          assignedStaff: {
            select: { id: true, name: true, email: true },
          },
          photos: true,
          resident: publicOnly
            ? false
            : {
                select: { id: true, name: true, email: true, phone: true },
              },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.report.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      reports,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("Fetch reports error:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Authentication required to submit reports" }, { status: 401 });
    }

    // ─── Anti-Abuse: Check cooldown ─────────────────────────────────────────
    const cooldownStatus = await isOnCooldown(session.id);
    if (cooldownStatus.onCooldown) {
      return NextResponse.json(
        {
          error: `You have temporarily reached the submission limit. Please try again in ${cooldownStatus.minutesRemaining} minute(s).`,
          cooldown: true,
          minutesRemaining: cooldownStatus.minutesRemaining,
        },
        { status: 429 }
      );
    }

    // ─── Anti-Abuse: Basic rate limiting ────────────────────────────────────
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await prisma.report.count({
      where: { residentId: session.id, createdAt: { gte: oneHourAgo } },
    });
    if (recentCount >= 5) {
      return NextResponse.json(
        { error: "You have submitted several reports recently. Please wait a while before submitting another.", cooldown: true },
        { status: 429 }
      );
    }

    const body = await req.json();
    const {
      categoryId,
      title,
      description,
      safetyFlag = "NO",
      latitude,
      longitude,
      accuracy,
      locationSource,
      locationCapturedAt,
      address,
      landmark,
      photos = [],
      duplicateOfId,
    } = body;

    if (!categoryId || !description || latitude === undefined || longitude === undefined || !address) {
      return NextResponse.json(
        { error: "Category, description, location coordinates, and address are required" },
        { status: 400 }
      );
    }

    const parsedLat = parseFloat(latitude);
    const parsedLng = parseFloat(longitude);
    if (isNaN(parsedLat) || isNaN(parsedLng) || parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) {
      return NextResponse.json(
        { error: "Invalid geographic coordinates provided" },
        { status: 400 }
      );
    }

    const validSources = ["DEVICE_GPS", "MANUAL_PIN", "MAP_CLICK", "SEARCH", "PHOTO_EXIF"];
    const resolvedSource = validSources.includes(String(locationSource))
      ? String(locationSource)
      : (accuracy ? "DEVICE_GPS" : "MANUAL_PIN");

    let parsedCapturedAt = new Date();
    if (locationCapturedAt) {
      const d = new Date(locationCapturedAt);
      if (!isNaN(d.getTime())) {
        parsedCapturedAt = d;
      }
    }

    const parsedAccuracy =
      accuracy !== undefined && accuracy !== null && !isNaN(Number(accuracy))
        ? parseFloat(accuracy)
        : null;

    // Verify category and get default priority and agency
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: { defaultAgency: true },
    });

    if (!category) {
      return NextResponse.json({ error: "Invalid category selected" }, { status: 400 });
    }

    // Determine initial priority: urgent safety flag elevates priority to CRITICAL or category default
    let initialPriority = category.defaultPriority;
    if (safetyFlag === "URGENT") {
      initialPriority = "CRITICAL";
    }

    // Calculate SLA target
    const slaHours: Record<string, number> = {
      CRITICAL: 4,
      HIGH: 24,
      MEDIUM: 72,
      LOW: 168,
    };
    const hours = slaHours[initialPriority] || 72;
    const slaDeadline = new Date(Date.now() + hours * 60 * 60 * 1000);

    const referenceNo = await generateReferenceNumber();
    const reportTitle = title?.trim() || `${category.name} at ${address.split(",")[0] || "reported location"}`;

    const report = await prisma.report.create({
      data: {
        referenceNo,
        categoryId,
        residentId: session.id,
        title: reportTitle,
        description: description.trim(),
        safetyFlag,
        priority: initialPriority,
        status: "SUBMITTED",
        latitude: parsedLat,
        longitude: parsedLng,
        accuracy: parsedAccuracy,
        locationSource: resolvedSource,
        locationCapturedAt: parsedCapturedAt,
        address: address.trim(),
        landmark: landmark ? landmark.trim() : null,
        assignedAgencyId: category.defaultAgencyId || null,
        duplicateOfId: duplicateOfId || null,
        slaDeadline,
        photos: {
          create: photos.map((p: any) => ({
            photoUrl: p.url || p,
            photoType: p.type || "BEFORE",
            caption: p.caption || null,
            uploadedByUserId: session.id,
          })),
        },
        statusHistory: {
          create: [
            {
              actorId: session.id,
              previousStatus: null,
              newStatus: "SUBMITTED",
              note: "Report submitted with initial photo and verified coordinates.",
              isInternal: false,
            },
          ],
        },
      },
      include: {
        category: true,
        assignedAgency: true,
        photos: true,
        statusHistory: true,
      },
    });

    // ─── Anti-Abuse: Run risk analysis ──────────────────────────────────────
    let riskResult = null;
    try {
      riskResult = await analyzeReport({
        reportId: report.id,
        userId: session.id,
        description: description.trim(),
        categorySlug: category.slug,
        categoryId,
        latitude: parsedLat,
        longitude: parsedLng,
        photos: photos.map((p: any) => ({ url: p.url || p, type: p.type || "BEFORE" })),
      });
    } catch (err) {
      console.error("Risk analysis error (non-blocking):", err);
    }

    // ─── Anti-Abuse: Update user trust profile ──────────────────────────────
    try {
      await incrementReportCount(session.id);
    } catch (err) {
      console.error("Trust profile update error (non-blocking):", err);
    }

    // Determine final status (may have been changed by risk analyzer)
    const finalReport = await prisma.report.findUnique({
      where: { id: report.id },
      include: {
        category: true,
        assignedAgency: true,
        photos: true,
        statusHistory: true,
      },
    });

    const isPendingVerification = finalReport?.status === "PENDING_VERIFICATION";

    // Notify staff users of new report
    const staffUsers = await prisma.user.findMany({
      where: { role: { in: ["STAFF", "ADMIN"] }, isActive: true },
      select: { id: true },
    });

    if (staffUsers.length > 0) {
      const notificationTitle = isPendingVerification
        ? `⚠ Flagged Report: ${category.name}`
        : `New Report: ${category.name}`;
      const notificationMsg = isPendingVerification
        ? `Report ${report.referenceNo} requires verification. Risk: ${riskResult?.riskLevel || "UNKNOWN"} (score: ${riskResult?.totalScore || 0}). Location: ${report.address}`
        : `Report ${report.referenceNo} submitted at ${report.address}. Priority: ${report.priority}`;

      await prisma.notification.createMany({
        data: staffUsers.map((staff) => ({
          userId: staff.id,
          reportId: report.id,
          title: notificationTitle,
          message: notificationMsg,
          type: isPendingVerification ? "MODERATION" : "STATUS_CHANGE",
        })),
      });
    }

    // Log audit event
    await createAuditLog({
      actorId: session.id,
      action: "REPORT_CREATED",
      entity: "Report",
      entityId: report.id,
      newState: {
        referenceNo: report.referenceNo,
        category: category.name,
        priority: report.priority,
        status: finalReport?.status || report.status,
        riskLevel: riskResult?.riskLevel || null,
        riskScore: riskResult?.totalScore || null,
      },
      ipAddress: req.headers.get("x-forwarded-for") || "local",
    });

    return NextResponse.json({
      report: finalReport || report,
      riskLevel: riskResult?.riskLevel || null,
      isPendingVerification,
    }, { status: 201 });
  } catch (error: any) {
    console.error("Create report error:", error);
    return NextResponse.json({ error: error.message || "Failed to create report" }, { status: 500 });
  }
}

