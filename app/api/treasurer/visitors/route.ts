import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authCookies, readTreasurerSession } from "@/lib/auth";

function authorized(request: Request) {
  const token = request.headers
    .get("cookie")
    ?.split("; ")
    .find((cookie) => cookie.startsWith(`${authCookies.session}=`))
    ?.split("=")
    .slice(1)
    .join("=");
  return Boolean(readTreasurerSession(token));
}

type PlaceRow = { location: string | null };

type GroupedRow = {
  _sum: { frequency: number | null };
  _max: { lastSeen: Date | null; location: string | null };
};

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const location = searchParams.get("location") || undefined;
  const from = searchParams.get("from") || undefined;
  const to = searchParams.get("to") || undefined;

  const fromDate = from ? new Date(from) : undefined;
  const toDate = to ? new Date(to) : undefined;

  const where = {
    ...(location ? { location: { equals: location } } : {}),
    ...(fromDate || toDate
      ? {
          lastSeen: {
            ...(fromDate ? { gte: fromDate } : {}),
            ...(toDate ? { lte: toDate } : {}),
          },
        }
      : {}),
  };

  const [uniqueIpRows, placeRows, grouped] = await Promise.all([
    prisma.visitor.findMany({ select: { ip: true }, distinct: ["ip"] }),
    prisma.visitor.findMany({
      select: { location: true },
      distinct: ["location"],
      orderBy: { location: "asc" },
    }),
    prisma.visitor.groupBy({
      by: ["ip"],
      where,
      _sum: { frequency: true },
      _max: { lastSeen: true, location: true },
      orderBy: { _max: { lastSeen: "desc" } },
      take: 500,
    }),
  ]);

  const uniqueCount = uniqueIpRows.length;

  const places = (placeRows as PlaceRow[])
    .map((row) => row.location)
    .filter((value): value is string => Boolean(value));

  const rows = (grouped as GroupedRow[]).map((item, index) => ({
    id: index,
    location: item._max.location ?? null,
    frequency: item._sum.frequency ?? 0,
    lastSeen: item._max.lastSeen ? item._max.lastSeen.toISOString() : new Date(0).toISOString(),
  }));

  return NextResponse.json({ count: uniqueCount, rows, places });
}
