import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const updateLocationSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  address: z.string().min(1).optional(),
  address2: z.string().optional(),
  city: z.string().min(1).optional(),
  state: z.string().min(1).max(5).optional(),
  zip: z.string().min(1).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

// GET /api/locations/:id
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const location = await db.location.findUnique({
    where: { id },
    include: {
      hours: { orderBy: { dayOfWeek: "asc" } },
      listings: true,
      menus: {
        include: {
          sections: {
            include: { items: { include: { dietaryTags: true } } },
          },
        },
      },
      reviews: {
        orderBy: { publishedAt: "desc" },
        take: 20,
        include: { response: true },
      },
      _count: { select: { reviews: true, listings: true, menus: true } },
    },
  });

  if (!location) {
    return NextResponse.json({ error: "Location not found" }, { status: 404 });
  }

  return NextResponse.json(location);
}

// PATCH /api/locations/:id
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = updateLocationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const location = await db.location.update({
      where: { id },
      data: {
        ...parsed.data,
        email: parsed.data.email || null,
        website: parsed.data.website || null,
      },
    });

    return NextResponse.json(location);
  } catch (err) {
    console.error("Update location error:", err);
    return NextResponse.json(
      { error: "Failed to update location" },
      { status: 500 }
    );
  }
}

// DELETE /api/locations/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await db.location.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete location" },
      { status: 500 }
    );
  }
}
