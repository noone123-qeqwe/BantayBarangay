import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting BantayBarangay database seed...");

  // 1. Clean existing data (safely in order of dependencies)
  await prisma.otpVerification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.reportUpdate.deleteMany();
  await prisma.reportStatusHistory.deleteMany();
  await prisma.reportPhoto.deleteMany();
  await prisma.report.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.category.deleteMany();
  await prisma.agency.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.user.deleteMany();

  // 2. Hash default password
  const defaultPasswordHash = await bcrypt.hash("Password123!", 10);

  // 3. Create Users
  const superAdmin = await prisma.user.create({
    data: {
      name: "Super Admin Officer",
      email: "superadmin@bantay.ph",
      passwordHash: defaultPasswordHash,
      role: "SUPER_ADMIN",
      phone: "+639171110000",
      birthDate: new Date("1980-01-15"),
      age: 46,
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=superadmin",
    },
  });

  const admin = await prisma.user.create({
    data: {
      name: "Captain Roberto Mendoza",
      email: "admin@bantay.ph",
      passwordHash: defaultPasswordHash,
      role: "ADMIN",
      phone: "+639182221111",
      birthDate: new Date("1975-06-20"),
      age: 51,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
    },
  });

  const staff1 = await prisma.user.create({
    data: {
      name: "Officer Alex Santos",
      email: "staff@bantay.ph",
      passwordHash: defaultPasswordHash,
      role: "STAFF",
      phone: "+639193332222",
      birthDate: new Date("1992-11-08"),
      age: 33,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
    },
  });

  const resident1 = await prisma.user.create({
    data: {
      name: "Juan Dela Cruz",
      email: "juan@resident.ph",
      passwordHash: defaultPasswordHash,
      role: "RESIDENT",
      phone: "+639204443333",
      birthDate: new Date("1998-03-15"),
      age: 28,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=juan",
    },
  });

  const resident2 = await prisma.user.create({
    data: {
      name: "Maria Santos",
      email: "maria@resident.ph",
      passwordHash: defaultPasswordHash,
      role: "RESIDENT",
      phone: "+639215554444",
      birthDate: new Date("2001-07-22"),
      age: 25,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=maria",
    },
  });

  console.log("✅ Users created (09204443333 / juan@resident.ph, 09193332222 / staff@bantay.ph, etc. / Password123!)");

  // 4. Create Agencies
  const agencyBrgy = await prisma.agency.create({
    data: {
      name: "Barangay San Antonio Operations & Maintenance",
      code: "BARANGAY",
      description: "Immediate barangay-level maintenance, clearing, and peacekeeping crew.",
      contactEmail: "ops@sanantonio.pasig.ph",
      contactPhone: "(02) 8643-1111",
      coverageArea: "Barangay San Antonio, Pasig City",
    },
  });

  const agencyCityEng = await prisma.agency.create({
    data: {
      name: "Pasig City Engineering Department",
      code: "LGU_ENG",
      description: "City engineering, road repairs, street lighting, and major public infrastructure.",
      contactEmail: "engineering@pasigcity.gov.ph",
      contactPhone: "(02) 8643-2222",
      coverageArea: "City-wide Pasig",
    },
  });

  const agencyDPWH = await prisma.agency.create({
    data: {
      name: "DPWH Metro Manila 1st District",
      code: "DPWH",
      description: "Department of Public Works and Highways - National road and flood control.",
      contactEmail: "dpwh.mm1st@dpwh.gov.ph",
      contactPhone: "(02) 8641-3333",
      coverageArea: "National Corridors & Major Avenues",
    },
  });

  const agencyMeralco = await prisma.agency.create({
    data: {
      name: "Meralco Electric Utility Dispatch",
      code: "MERALCO",
      description: "Power lines, electric posts, transformers, and emergency electrical hazards.",
      contactEmail: "emergency@meralco.com.ph",
      contactPhone: "16211",
      coverageArea: "Franchise Area",
    },
  });

  const agencyManilaWater = await prisma.agency.create({
    data: {
      name: "Manila Water Company",
      code: "MANILA_WATER",
      description: "Main water lines, broken pipes, sewer lines, and water service leaks.",
      contactEmail: "care@manilawater.com",
      contactPhone: "1627",
      coverageArea: "East Zone Concession",
    },
  });

  const agencyWaste = await prisma.agency.create({
    data: {
      name: "City Solid Waste Management (CENRO)",
      code: "WASTE_MGMT",
      description: "Garbage collection, illegal dumping removal, and segregation monitoring.",
      contactEmail: "cenro@pasigcity.gov.ph",
      contactPhone: "(02) 8643-4444",
      coverageArea: "City-wide Pasig",
    },
  });

  console.log("✅ Civic Agencies created");

  // 5. Create Categories
  const catPothole = await prisma.category.create({
    data: {
      name: "Road / Pothole",
      slug: "road-pothole",
      description: "Craters, road cracks, asphalt degradation, or dangerous asphalt depressions.",
      icon: "AlertTriangle",
      defaultPriority: "HIGH",
      defaultAgencyId: agencyCityEng.id,
      sortOrder: 1,
    },
  });

  const catStreetlight = await prisma.category.create({
    data: {
      name: "Busted Streetlight",
      slug: "streetlight",
      description: "Unlit lamp posts, flickering fixtures, or dark public alleys.",
      icon: "Lightbulb",
      defaultPriority: "MEDIUM",
      defaultAgencyId: agencyBrgy.id,
      sortOrder: 2,
    },
  });

  const catElectricPost = await prisma.category.create({
    data: {
      name: "Broken Electric Post",
      slug: "electrical-post",
      description: "Leaning, cracked, or struck utility posts threatening pedestrian safety.",
      icon: "Zap",
      defaultPriority: "CRITICAL",
      defaultAgencyId: agencyMeralco.id,
      sortOrder: 3,
    },
  });

  const catElectricWire = await prisma.category.create({
    data: {
      name: "Exposed Electrical Wire",
      slug: "electrical-wire",
      description: "Dangling wires, sparked overhead cables, or low-hanging power lines.",
      icon: "Flame",
      defaultPriority: "CRITICAL",
      defaultAgencyId: agencyMeralco.id,
      sortOrder: 4,
    },
  });

  const catDrainage = await prisma.category.create({
    data: {
      name: "Clogged Drainage",
      slug: "drainage",
      description: "Blocked culverts, overflowing storm canals, or silted drainage grates.",
      icon: "Droplets",
      defaultPriority: "HIGH",
      defaultAgencyId: agencyCityEng.id,
      sortOrder: 5,
    },
  });

  const catFlooding = await prisma.category.create({
    data: {
      name: "Street Flooding",
      slug: "flooding",
      description: "Standing flood water blocking traffic or threatening nearby homes.",
      icon: "Waves",
      defaultPriority: "HIGH",
      defaultAgencyId: agencyBrgy.id,
      sortOrder: 6,
    },
  });

  const catGarbage = await prisma.category.create({
    data: {
      name: "Garbage / Waste Pile",
      slug: "garbage-waste",
      description: "Uncollected trash, illegal dumping on sidewalks, or biohazard waste.",
      icon: "Trash2",
      defaultPriority: "MEDIUM",
      defaultAgencyId: agencyWaste.id,
      sortOrder: 7,
    },
  });

  const catTree = await prisma.category.create({
    data: {
      name: "Fallen Tree / Branches",
      slug: "fallen-tree",
      description: "Fallen or dangerously hanging tree limbs obstructing roads or cables.",
      icon: "TreePine",
      defaultPriority: "HIGH",
      defaultAgencyId: agencyBrgy.id,
      sortOrder: 8,
    },
  });

  const catWaterPipe = await prisma.category.create({
    data: {
      name: "Water Leak / Pipe Burst",
      slug: "water-pipe",
      description: "Ruptured water mains, gushing pipe joints, or low-pressure leaks.",
      icon: "Pipette",
      defaultPriority: "HIGH",
      defaultAgencyId: agencyManilaWater.id,
      sortOrder: 9,
    },
  });

  const catRoadSign = await prisma.category.create({
    data: {
      name: "Damaged Road Sign",
      slug: "road-sign",
      description: "Missing street names, bent stop signs, or unreadable warning signs.",
      icon: "Signpost",
      defaultPriority: "LOW",
      defaultAgencyId: agencyCityEng.id,
      sortOrder: 10,
    },
  });

  const catPublicFacility = await prisma.category.create({
    data: {
      name: "Damaged Public Facility",
      slug: "public-facility",
      description: "Broken basketball court boards, damaged park benches, or cracked plaza pavers.",
      icon: "Building2",
      defaultPriority: "LOW",
      defaultAgencyId: agencyBrgy.id,
      sortOrder: 11,
    },
  });

  console.log("✅ Categories created");

  // 6. System Settings
  await prisma.systemSetting.createMany({
    data: [
      {
        key: "SLA_CRITICAL_HOURS",
        value: "4",
        description: "Target response turnaround for Critical safety-hazard reports (in hours).",
      },
      {
        key: "SLA_HIGH_HOURS",
        value: "24",
        description: "Target response turnaround for High priority reports (in hours).",
      },
      {
        key: "SLA_MEDIUM_HOURS",
        value: "72",
        description: "Target response turnaround for Medium priority reports (in hours).",
      },
      {
        key: "EMERGENCY_HOTLINE",
        value: "911 / (02) 8643-1111",
        description: "Public direct emergency hotline for life-threatening events.",
      },
      {
        key: "BARANGAY_JURISDICTION",
        value: "Barangay San Antonio, Pasig City",
        description: "Active local barangay coverage zone.",
      },
    ],
  });

  // 7. Announcements
  await prisma.announcement.create({
    data: {
      title: "Scheduled Drainage Declogging Along San Miguel Ave",
      content:
        "City Engineering and Barangay Environmental teams will conduct proactive desilting this Saturday from 7:00 AM to 1:00 PM. Expect slight traffic slowdowns.",
      priority: "NORMAL",
      createdById: admin.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.announcement.create({
    data: {
      title: "Urgent Safety Advisory: Report Low Cables After Thunderstorms",
      content:
        "Please inspect nearby service drops and street poles. Use BantayBarangay with photo evidence to expedite utility dispatch.",
      priority: "URGENT",
      createdById: admin.id,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("✅ System settings & announcements created");

  // 8. Sample Reports across different statuses
  // Base coordinates around Barangay San Antonio, Pasig (14.5839, 121.0615)
  
  // Report 1: SUBMITTED (New pothole by Juan)
  const report1 = await prisma.report.create({
    data: {
      referenceNo: "BB-2026-000101",
      categoryId: catPothole.id,
      residentId: resident1.id,
      title: "Deep crater pothole near San Antonio covered court",
      description:
        "A large 12-inch pothole has opened up right along the lane toward the basketball court. Motorbikes have been swerving dangerously into oncoming traffic.",
      safetyFlag: "POSSIBLY",
      priority: "HIGH",
      status: "SUBMITTED",
      latitude: 14.5842,
      longitude: 121.0621,
      address: "Corner Amber St & Emerald Ave, Brgy San Antonio, Pasig City",
      landmark: "Near Barangay Multi-purpose Covered Court",
      slaDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
      photos: {
        create: [
          {
            photoUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
            photoType: "BEFORE",
            caption: "Deep asphalt depression with exposed aggregates",
            uploadedByUserId: resident1.id,
          },
        ],
      },
      statusHistory: {
        create: [
          {
            actorId: resident1.id,
            previousStatus: null,
            newStatus: "SUBMITTED",
            note: "Report submitted with initial photo and GPS coordinates.",
            isInternal: false,
          },
        ],
      },
    },
  });

  // Report 2: IN_PROGRESS (Dangling electrical wire - Critical)
  const report2 = await prisma.report.create({
    data: {
      referenceNo: "BB-2026-000102",
      categoryId: catElectricWire.id,
      residentId: resident2.id,
      assignedAgencyId: agencyMeralco.id,
      assignedStaffId: staff1.id,
      title: "Sparking dangling wire over sidewalk near Daycare Center",
      description:
        "Black overhead cable snapped and is hanging less than 5 feet from sidewalk level. Sparks seen during rain yesterday afternoon.",
      safetyFlag: "URGENT",
      priority: "CRITICAL",
      status: "IN_PROGRESS",
      latitude: 14.5855,
      longitude: 121.0608,
      address: "Garnet Road, near San Antonio Daycare, Pasig City",
      landmark: "Opposite Daycare Center gate",
      slaDeadline: new Date(Date.now() + 4 * 60 * 60 * 1000),
      photos: {
        create: [
          {
            photoUrl: "https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?auto=format&fit=crop&w=800&q=80",
            photoType: "BEFORE",
            caption: "Low hanging snapped cable obstructing pedestrian path",
            uploadedByUserId: resident2.id,
          },
        ],
      },
      statusHistory: {
        create: [
          {
            actorId: resident2.id,
            previousStatus: null,
            newStatus: "SUBMITTED",
            note: "Urgent hazard report filed by resident.",
            isInternal: false,
          },
          {
            actorId: staff1.id,
            previousStatus: "SUBMITTED",
            newStatus: "UNDER_REVIEW",
            note: "Staff verified photos. Immediate danger confirmed.",
            isInternal: false,
          },
          {
            actorId: staff1.id,
            previousStatus: "UNDER_REVIEW",
            newStatus: "ASSIGNED",
            note: "Assigned directly to Meralco emergency dispatch crew.",
            isInternal: false,
          },
          {
            actorId: staff1.id,
            previousStatus: "ASSIGNED",
            newStatus: "IN_PROGRESS",
            note: "Meralco technical bucket truck en route to location.",
            isInternal: false,
          },
        ],
      },
      updates: {
        create: [
          {
            authorId: staff1.id,
            message: "Barangay tanods have cordoned off the sidewalk area with hazard tape.",
            isInternal: false,
          },
          {
            authorId: staff1.id,
            message: "Meralco dispatch ticket #ME-98442 assigned to team leader Engr. David.",
            isInternal: true,
          },
        ],
      },
    },
  });

  // Report 3: RESOLVED (Busted streetlight - awaiting resident Juan's confirmation!)
  const report3 = await prisma.report.create({
    data: {
      referenceNo: "BB-2026-000103",
      categoryId: catStreetlight.id,
      residentId: resident1.id,
      assignedAgencyId: agencyBrgy.id,
      assignedStaffId: staff1.id,
      title: "Busted sodium bulb on street lamp post #14",
      description: "The entire curve of Sapphire Road is completely dark at night, making it unsafe for evening pedestrians.",
      safetyFlag: "NO",
      priority: "MEDIUM",
      status: "RESOLVED",
      latitude: 14.5828,
      longitude: 121.0635,
      address: "Sapphire Road corner Pearl St, Brgy San Antonio, Pasig City",
      landmark: "Behind Barangay Health Center",
      resolvedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      photos: {
        create: [
          {
            photoUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80",
            photoType: "BEFORE",
            caption: "Completely dark road section at night",
            uploadedByUserId: resident1.id,
          },
          {
            photoUrl: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80",
            photoType: "RESOLUTION",
            caption: "New 100W energy-efficient LED fixture installed and verified glowing.",
            uploadedByUserId: staff1.id,
          },
        ],
      },
      statusHistory: {
        create: [
          {
            actorId: resident1.id,
            previousStatus: null,
            newStatus: "SUBMITTED",
            note: "Report filed by resident.",
            isInternal: false,
          },
          {
            actorId: staff1.id,
            previousStatus: "SUBMITTED",
            newStatus: "ASSIGNED",
            note: "Assigned to Barangay electrical crew.",
            isInternal: false,
          },
          {
            actorId: staff1.id,
            previousStatus: "ASSIGNED",
            newStatus: "IN_PROGRESS",
            note: "Maintenance ladder deployed.",
            isInternal: false,
          },
          {
            actorId: staff1.id,
            previousStatus: "IN_PROGRESS",
            newStatus: "RESOLVED",
            note: "Replaced blown ballast and upgraded lamp to LED luminaire. Awaiting resident confirmation.",
            photoUrl: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80",
            isInternal: false,
          },
        ],
      },
      updates: {
        create: [
          {
            authorId: staff1.id,
            message: "Barangay Maintenance completed LED lamp replacement at 3:30 PM today.",
            isInternal: false,
          },
        ],
      },
    },
  });

  // Report 4: CLOSED (Clogged drainage verified fixed)
  const report4 = await prisma.report.create({
    data: {
      referenceNo: "BB-2026-000104",
      categoryId: catDrainage.id,
      residentId: resident1.id,
      assignedAgencyId: agencyCityEng.id,
      assignedStaffId: staff1.id,
      title: "Blocked canal inlet causing street gutter overflow",
      description: "Plastic trash and mud accumulated in the storm intake grate along Topaz St.",
      safetyFlag: "NO",
      priority: "MEDIUM",
      status: "CLOSED",
      latitude: 14.5815,
      longitude: 121.0592,
      address: "Topaz Street, Pasig City",
      resolvedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      closedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      photos: {
        create: [
          {
            photoUrl: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80",
            photoType: "BEFORE",
            caption: "Trash accumulation blocking drainage grate",
            uploadedByUserId: resident1.id,
          },
          {
            photoUrl: "https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&w=800&q=80",
            photoType: "RESOLUTION",
            caption: "Canal fully cleared and desilted with water flowing freely",
            uploadedByUserId: staff1.id,
          },
        ],
      },
      statusHistory: {
        create: [
          {
            actorId: resident1.id,
            previousStatus: null,
            newStatus: "SUBMITTED",
            note: "Report submitted.",
            isInternal: false,
          },
          {
            actorId: staff1.id,
            previousStatus: "SUBMITTED",
            newStatus: "RESOLVED",
            note: "Desilting crew flushed the line.",
            isInternal: false,
          },
          {
            actorId: resident1.id,
            previousStatus: "RESOLVED",
            newStatus: "CLOSED",
            note: "Resident confirmed: Yes, water drains quickly now with no foul smell. Thank you!",
            isInternal: false,
          },
        ],
      },
    },
  });

  // Report 5: Hotspot duplicate demonstration (Pothole nearby Report 1)
  await prisma.report.create({
    data: {
      referenceNo: "BB-2026-000105",
      categoryId: catPothole.id,
      residentId: resident2.id,
      title: "Another deep road fissure 50m from court",
      description: "Right after the first pothole, another fissure has developed across the right wheel path.",
      safetyFlag: "POSSIBLY",
      priority: "HIGH",
      status: "UNDER_REVIEW",
      latitude: 14.5845,
      longitude: 121.0624,
      address: "Amber St near Emerald Ave, Brgy San Antonio, Pasig City",
      photos: {
        create: [
          {
            photoUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
            photoType: "BEFORE",
            caption: "Secondary road crack widening under heavy trucks",
            uploadedByUserId: resident2.id,
          },
        ],
      },
      statusHistory: {
        create: [
          {
            actorId: resident2.id,
            previousStatus: null,
            newStatus: "SUBMITTED",
            note: "Report filed.",
            isInternal: false,
          },
          {
            actorId: staff1.id,
            previousStatus: "SUBMITTED",
            newStatus: "UNDER_REVIEW",
            note: "Under review by staff. Flagged as part of Amber Street pothole cluster.",
            isInternal: false,
          },
        ],
      },
    },
  });

  console.log("✅ Realistic reports created with photos & timeline histories");

  // 9. Create Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: resident1.id,
        reportId: report3.id,
        title: "Action Required: Verify Resolution",
        message: "Your report BB-2026-000103 (Busted Streetlight) has been marked as Resolved. Please confirm if the light is working.",
        type: "RESOLUTION",
        isRead: false,
      },
      {
        userId: resident2.id,
        reportId: report2.id,
        title: "Report In Progress",
        message: "Your critical hazard report BB-2026-000102 has been assigned to Meralco emergency dispatch crew.",
        type: "STATUS_CHANGE",
        isRead: false,
      },
      {
        userId: staff1.id,
        reportId: report1.id,
        title: "New High Priority Report",
        message: "New pothole report BB-2026-000101 submitted along Amber St needing review.",
        type: "STATUS_CHANGE",
        isRead: false,
      },
    ],
  });

  // 10. Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        actorId: resident1.id,
        action: "REPORT_CREATED",
        entity: "Report",
        entityId: report1.id,
        newState: JSON.stringify({ referenceNo: "BB-2026-000101", priority: "HIGH", status: "SUBMITTED" }),
      },
      {
        actorId: staff1.id,
        action: "STATUS_UPDATED",
        entity: "Report",
        entityId: report2.id,
        previousState: JSON.stringify({ status: "ASSIGNED" }),
        newState: JSON.stringify({ status: "IN_PROGRESS" }),
      },
      {
        actorId: staff1.id,
        action: "STATUS_UPDATED",
        entity: "Report",
        entityId: report3.id,
        previousState: JSON.stringify({ status: "IN_PROGRESS" }),
        newState: JSON.stringify({ status: "RESOLVED" }),
      },
      {
        actorId: resident1.id,
        action: "RESOLUTION_VERIFIED",
        entity: "Report",
        entityId: report4.id,
        previousState: JSON.stringify({ status: "RESOLVED" }),
        newState: JSON.stringify({ status: "CLOSED", confirmed: true }),
      },
    ],
  });

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
