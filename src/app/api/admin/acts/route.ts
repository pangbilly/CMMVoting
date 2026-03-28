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

// POST: add a new act
export async function POST(request: NextRequest) {
  if (!checkPassword(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { nameZh, nameEn, church, orderNumber } = body;

    if (!nameZh || !nameEn || !church || orderNumber == null) {
      return NextResponse.json(
        { error: "All fields required" },
        { status: 400 }
      );
    }

    const result = await db
      .insert(acts)
      .values({ nameZh, nameEn, church, orderNumber })
      .returning();

    return NextResponse.json({ act: result[0] });
  } catch (error) {
    console.error("Error adding act:", error);
    return NextResponse.json(
      { error: "Failed to add act" },
      { status: 500 }
    );
  }
}

// PUT: update an act
export async function PUT(request: NextRequest) {
  if (!checkPassword(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, nameZh, nameEn, church, orderNumber, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (nameZh !== undefined) updateData.nameZh = nameZh;
    if (nameEn !== undefined) updateData.nameEn = nameEn;
    if (church !== undefined) updateData.church = church;
    if (orderNumber !== undefined) updateData.orderNumber = orderNumber;
    if (isActive !== undefined) updateData.isActive = isActive;

    await db.update(acts).set(updateData).where(eq(acts.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating act:", error);
    return NextResponse.json(
      { error: "Failed to update act" },
      { status: 500 }
    );
  }
}

// DELETE: remove an act
export async function DELETE(request: NextRequest) {
  if (!checkPassword(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    await db.delete(acts).where(eq(acts.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting act:", error);
    return NextResponse.json(
      { error: "Failed to delete act" },
      { status: 500 }
    );
  }
}
