import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { acts } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

function checkPassword(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return false;
  return authHeader.replace("Bearer ", "") === process.env.ADMIN_PASSWORD;
}

// POST: reorder acts — expects array of { id, orderNumber }
export async function POST(request: NextRequest) {
  if (!checkPassword(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { orders } = await request.json();
    if (!Array.isArray(orders)) {
      return NextResponse.json(
        { error: "Orders array required" },
        { status: 400 }
      );
    }

    for (const { id, orderNumber } of orders) {
      await db
        .update(acts)
        .set({ orderNumber })
        .where(eq(acts.id, id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering acts:", error);
    return NextResponse.json(
      { error: "Failed to reorder" },
      { status: 500 }
    );
  }
}
