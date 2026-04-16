import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/locations/:id/reviews
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const searchParams = req.nextUrl.searchParams;
  const platform = searchParams.get("platform");
  const rating = searchParams.get("rating");
  const responded = searchParams.get("responded");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "50");
  const offset = (page - 1) * limit;

  const where: Record<string, unknown> = { locationId: id };
  if (platform) where.platform = platform;
  if (rating) where.rating = parseInt(rating);
  if (responded === "true") where.respondedAt = { not: null };
  if (responded === "false") where.respondedAt = null;

  const [reviews, total] = await Promise.all([
    db.review.findMany({
      where,
      include: { response: true },
      orderBy: { publishedAt: "desc" },
      skip: offset,
      take: limit,
    }),
    db.review.count({ where }),
  ]);

  return NextResponse.json({
    reviews,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}
