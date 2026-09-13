import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { suggestCategoryWithAI } from "@/lib/aiService";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(); // optional

    const body = await req.json();
    const { description } = body;

    if (!description || description.trim().length < 5) {
      return NextResponse.json({ suggestion: null });
    }

    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true, description: true },
    });

    const suggestion = await suggestCategoryWithAI(description.trim(), categories);

    return NextResponse.json({
      success: true,
      suggestion,
    });
  } catch (error: any) {
    console.error("AI category suggestion error:", error);
    return NextResponse.json({ suggestion: null });
  }
}
