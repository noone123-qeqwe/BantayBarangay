/**
 * User Trust Management — Manages user trust scores and submission cooldowns.
 * 
 * Trust score:
 *   - Starts at 50
 *   - +2 per approved report (max 100)
 *   - -5 per rejected report (min 0)
 *   - -10 per spam-flagged report (min 0)
 *   - +1 per normal submission (max 100)
 * 
 * Cooldown:
 *   - Auto-triggered when trust drops below 20
 *   - Auto-triggered when 3+ spam reports in 24 hours
 *   - Duration: 30 minutes for low trust, 2 hours for repeat spam
 */

import prisma from "@/lib/db";

export async function getOrCreateTrustProfile(userId: string) {
  let profile = await prisma.userTrustProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    profile = await prisma.userTrustProfile.create({
      data: { userId },
    });
  }

  return profile;
}

export async function incrementReportCount(userId: string) {
  const profile = await getOrCreateTrustProfile(userId);

  await prisma.userTrustProfile.update({
    where: { userId },
    data: {
      totalReports: { increment: 1 },
      lastReportAt: new Date(),
      // Slight trust boost for submitting (legitimate activity signal)
      trustScore: Math.min(profile.trustScore + 1, 100),
    },
  });
}

export async function updateTrustAfterModeration(
  userId: string,
  action: "APPROVE" | "REJECT" | "MARK_SPAM" | "MERGE_DUPLICATE"
) {
  const profile = await getOrCreateTrustProfile(userId);
  let newScore = profile.trustScore;
  const updates: any = {};

  switch (action) {
    case "APPROVE":
      newScore = Math.min(newScore + 2, 100);
      updates.approvedCount = { increment: 1 };
      break;
    case "REJECT":
      newScore = Math.max(newScore - 5, 0);
      updates.rejectedCount = { increment: 1 };
      updates.lastFlaggedAt = new Date();
      break;
    case "MARK_SPAM":
      newScore = Math.max(newScore - 10, 0);
      updates.spamCount = { increment: 1 };
      updates.lastFlaggedAt = new Date();
      break;
    case "MERGE_DUPLICATE":
      newScore = Math.max(newScore - 2, 0);
      updates.duplicateCount = { increment: 1 };
      break;
  }

  updates.trustScore = newScore;

  await prisma.userTrustProfile.update({
    where: { userId },
    data: updates,
  });

  // Auto-cooldown: if trust drops below 20
  if (newScore < 20) {
    await setCooldown(userId, 30); // 30 minute cooldown
  }

  // Auto-cooldown: if 3+ spam in last 24 hours
  if (action === "MARK_SPAM") {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentSpamActions = await prisma.moderationAction.count({
      where: {
        report: { residentId: userId },
        actionType: "MARK_SPAM",
        createdAt: { gte: dayAgo },
      },
    });
    if (recentSpamActions >= 3) {
      await setCooldown(userId, 120); // 2 hour cooldown
    }
  }
}

export async function isOnCooldown(userId: string): Promise<{
  onCooldown: boolean;
  cooldownUntil: Date | null;
  minutesRemaining: number;
}> {
  const profile = await prisma.userTrustProfile.findUnique({
    where: { userId },
    select: { cooldownUntil: true },
  });

  if (!profile?.cooldownUntil) {
    return { onCooldown: false, cooldownUntil: null, minutesRemaining: 0 };
  }

  const now = new Date();
  if (profile.cooldownUntil > now) {
    const remaining = Math.ceil((profile.cooldownUntil.getTime() - now.getTime()) / 60000);
    return {
      onCooldown: true,
      cooldownUntil: profile.cooldownUntil,
      minutesRemaining: remaining,
    };
  }

  return { onCooldown: false, cooldownUntil: null, minutesRemaining: 0 };
}

export async function setCooldown(userId: string, minutes: number) {
  const cooldownUntil = new Date(Date.now() + minutes * 60 * 1000);

  await prisma.userTrustProfile.upsert({
    where: { userId },
    create: {
      userId,
      cooldownUntil,
    },
    update: {
      cooldownUntil,
    },
  });
}

export async function getUserTrustSummary(userId: string) {
  const profile = await getOrCreateTrustProfile(userId);
  const cooldownStatus = await isOnCooldown(userId);

  return {
    ...profile,
    ...cooldownStatus,
    trustLevel: profile.trustScore >= 70
      ? "TRUSTED"
      : profile.trustScore >= 40
        ? "NORMAL"
        : profile.trustScore >= 20
          ? "WATCHED"
          : "RESTRICTED",
  };
}

export async function recordModerationOutcome(params: {
  userId: string;
  reportId?: string;
  action: "APPROVE" | "REJECT" | "MARK_SPAM" | "MERGE_DUPLICATE";
  flagType?: string;
  reason?: string;
  moderatorId?: string;
}) {
  return updateTrustAfterModeration(params.userId, params.action);
}
