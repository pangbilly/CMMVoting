import { NextResponse } from "next/server";
import { db } from "@/db";
import { acts, settings } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const allActs = await db
      .select()
      .from(acts)
      .orderBy(asc(acts.orderNumber));

    const lockSetting = await db
      .select()
      .from(settings)
      .where(eq(settings.key, "voting_locked"));

    return NextResponse.json({
      acts: allActs,
      votingLocked: lockSetting[0]?.value === "true",
    });
  } catch (error) {
    console.error("Error fetching acts:", error);
    return NextResponse.json(
      { error: "Failed to fetch acts" },
      { status: 500 }
    );
  }
}
