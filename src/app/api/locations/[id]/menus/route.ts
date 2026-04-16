import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const createMenuSchema = z.object({
  name: z.string().min(1).max(100),
  isActive: z.boolean().default(true),
  sections: z
    .array(
      z.object({
        name: z.string().min(1),
        items: z
          .array(
            z.object({
              name: z.string().min(1),
              description: z.string().optional(),
              price: z.number().int().min(0),
              calories: z.number().int().optional(),
              isAvailable: z.boolean().default(true),
              dietaryTags: z.array(z.string()).default([]),
            })
          )
          .default([]),
      })
    )
    .default([]),
});

// GET /api/locations/:id/menus
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const menus = await db.menu.findMany({
    where: { locationId: id },
    include: {
      sections: {
        orderBy: { sortOrder: "asc" },
        include: {
          items: {
            orderBy: { sortOrder: "asc" },
            include: { dietaryTags: true },
          },
        },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(menus);
}

// POST /api/locations/:id/menus - Create a menu
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = createMenuSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Get current max sort order
    const lastMenu = await db.menu.findFirst({
      where: { locationId: id },
      orderBy: { sortOrder: "desc" },
    });

    const menu = await db.menu.create({
      data: {
        locationId: id,
        name: data.name,
        isActive: data.isActive,
        sortOrder: (lastMenu?.sortOrder ?? -1) + 1,
        sections: {
          create: data.sections.map((section, sIdx) => ({
            name: section.name,
            sortOrder: sIdx,
            items: {
              create: section.items.map((item, iIdx) => ({
                name: item.name,
                description: item.description ?? null,
                price: item.price,
                calories: item.calories ?? null,
                isAvailable: item.isAvailable,
                sortOrder: iIdx,
                dietaryTags: {
                  connectOrCreate: item.dietaryTags.map((tag) => ({
                    where: { slug: tag.toLowerCase().replace(/\s+/g, "-") },
                    create: {
                      name: tag,
                      slug: tag.toLowerCase().replace(/\s+/g, "-"),
                    },
                  })),
                },
              })),
            },
          })),
        },
      },
      include: {
        sections: {
          include: { items: { include: { dietaryTags: true } } },
        },
      },
    });

    return NextResponse.json(menu, { status: 201 });
  } catch (err) {
    console.error("Create menu error:", err);
    return NextResponse.json(
      { error: "Failed to create menu" },
      { status: 500 }
    );
  }
}
