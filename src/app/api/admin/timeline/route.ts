import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { votes, acts } from "@/db/schema";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

function checkPassword(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return false;
  const password = authHeader.replace("Bearer ", "");
  return password === process.env.ADMIN_PASSWORD;
}

// GET: all votes ordered by time, plus acts list
export async function GET(request: NextRequest) {
  if (!checkPassword(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const allActs = await db
      .select({
        id: acts.id,
        nameZh: acts.nameZh,
        nameEn: acts.nameEn,
        church: acts.church,
        orderNumber: acts.orderNumber,
      })
      .from(acts)
      .orderBy(asc(acts.orderNumber));

    const allVotes = await db
      .select({
        actId: votes.actId,
        score: votes.score,
        createdAt: votes.createdAt,
      })
      .from(votes)
      .orderBy(asc(votes.createdAt));

    return NextResponse.json({ acts: allActs, votes: allVotes });
  } catch (error) {
    console.error("Error fetching timeline:", error);
    return NextResponse.json(
      { error: "Failed to fetch timeline" },
      { status: 500 }
    );
  }
}
