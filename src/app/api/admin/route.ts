import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { acts, votes, settings } from "@/db/schema";
import { eq, asc, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

function checkPassword(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return false;
  const password = authHeader.replace("Bearer ", "");
  return password === process.env.ADMIN_PASSWORD;
}

// GET: fetch results
export async function GET(request: NextRequest) {
  if (!checkPassword(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const allActs = await db
      .select()
      .from(acts)
      .orderBy(asc(acts.orderNumber));

    // Get vote stats per act
    const voteStats = await db
      .select({
        actId: votes.actId,
        avgScore: sql<number>`round(avg(${votes.score})::numeric, 2)`,
        totalVotes: sql<number>`count(*)`,
        score1: sql<number>`count(*) filter (where ${votes.score} = 1)`,
        score2: sql<number>`count(*) filter (where ${votes.score} = 2)`,
        score3: sql<number>`count(*) filter (where ${votes.score} = 3)`,
        score4: sql<number>`count(*) filter (where ${votes.score} = 4)`,
        score5: sql<number>`count(*) filter (where ${votes.score} = 5)`,
      })
      .from(votes)
      .groupBy(votes.actId);

    const lockSetting = await db
      .select()
      .from(settings)
      .where(eq(settings.key, "voting_locked"));

    const statsMap = new Map(voteStats.map((s) => [s.actId, s]));

    const results = allActs.map((act) => ({
      ...act,
      stats: statsMap.get(act.id) || {
        avgScore: 0,
        totalVotes: 0,
        score1: 0,
        score2: 0,
        score3: 0,
        score4: 0,
        score5: 0,
      },
    }));

    return NextResponse.json({
      results,
      votingLocked: lockSetting[0]?.value === "true",
    });
  } catch (error) {
    console.error("Error fetching admin data:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
