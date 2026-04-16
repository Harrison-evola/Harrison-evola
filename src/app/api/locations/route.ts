import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { z } from "zod";

const ORG_ID = process.env.DEFAULT_ORG_ID ?? "demo-org";

const createLocationSchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().min(1),
  address2: z.string().optional().default(""),
  city: z.string().min(1),
  state: z.string().min(1).max(5),
  zip: z.string().min(1),
  country: z.string().default("US"),
  phone: z.string().optional().default(""),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  hours: z
    .array(
      z.object({
        dayOfWeek: z.number().min(0).max(6),
        openTime: z.string(),
        closeTime: z.string(),
        isClosed: z.boolean(),
      })
    )
    .optional(),
});

// GET /api/locations - List all locations
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const search = searchParams.get("search") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "50");
  const offset = (page - 1) * limit;

  const where = {
    organizationId: ORG_ID,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { city: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [locations, total] = await Promise.all([
    db.location.findMany({
      where,
      include: {
        _count: { select: { listings: true, reviews: true, menus: true } },
        listings: { select: { platform: true, status: true, accuracyScore: true } },
      },
      orderBy: { name: "asc" },
      skip: offset,
      take: limit,
    }),
    db.location.count({ where }),
  ]);

  return NextResponse.json({
    locations,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

// POST /api/locations - Create a new location
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createLocationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const slug = slugify(data.name);

    // Ensure org exists (create demo org if needed)
    await db.organization.upsert({
      where: { id: ORG_ID },
      create: { id: ORG_ID, name: "My Organization", slug: "my-org" },
      update: {},
    });

    const location = await db.location.create({
      data: {
        organizationId: ORG_ID,
        name: data.name,
        slug,
        address: data.address,
        address2: data.address2 || null,
        city: data.city,
        state: data.state,
        zip: data.zip,
        country: data.country,
        phone: data.phone || null,
        email: data.email || null,
        website: data.website || null,
        hours: data.hours
          ? {
              create: data.hours.map((h) => ({
                dayOfWeek: h.dayOfWeek,
                openTime: h.isClosed ? null : h.openTime,
                closeTime: h.isClosed ? null : h.closeTime,
                isClosed: h.isClosed,
              })),
            }
          : undefined,
      },
      include: { hours: true },
    });

    return NextResponse.json(location, { status: 201 });
  } catch (err) {
    console.error("Create location error:", err);
    return NextResponse.json(
      { error: "Failed to create location" },
      { status: 500 }
    );
  }
}
