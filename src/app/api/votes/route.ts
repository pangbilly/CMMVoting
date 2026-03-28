import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { votes, settings } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET: fetch all votes for a voter
export async function GET(request: NextRequest) {
  const voterId = request.nextUrl.searchParams.get("voterId");
  if (!voterId) {
    return NextResponse.json({ error: "voterId required" }, { status: 400 });
  }

  try {
    const voterVotes = await db
      .select()
      .from(votes)
      .where(eq(votes.voterId, voterId));

    return NextResponse.json({ votes: voterVotes });
  } catch (error) {
    console.error("Error fetching votes:", error);
    return NextResponse.json(
      { error: "Failed to fetch votes" },
      { status: 500 }
    );
  }
}

// POST: submit or update a vote
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { actId, voterId, score } = body;

    if (!actId || !voterId || !score || score < 1 || score > 5) {
      return NextResponse.json(
        { error: "Invalid vote data" },
        { status: 400 }
      );
    }

    // Check if voting is locked
    const lockSetting = await db
      .select()
      .from(settings)
      .where(eq(settings.key, "voting_locked"));

    if (lockSetting[0]?.value === "true") {
      return NextResponse.json(
        { error: "Voting is locked" },
        { status: 403 }
      );
    }

    // Upsert: insert or update on conflict
    const existing = await db
      .select()
      .from(votes)
      .where(and(eq(votes.actId, actId), eq(votes.voterId, voterId)));

    if (existing.length > 0) {
      await db
        .update(votes)
        .set({ score, updatedAt: new Date() })
        .where(and(eq(votes.actId, actId), eq(votes.voterId, voterId)));
    } else {
      await db.insert(votes).values({ actId, voterId, score });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error submitting vote:", error);
    return NextResponse.json(
      { error: "Failed to submit vote" },
      { status: 500 }
    );
  }
}
