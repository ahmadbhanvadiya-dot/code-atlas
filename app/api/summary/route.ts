import { NextResponse } from "next/server";
import { generateSummary } from "@/lib/temp";

export async function POST(req: Request) {
  try {
    const repoData = await req.json();

    const summary = await generateSummary(repoData);

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate summary",
      },
      { status: 500 }
    );
  }
}