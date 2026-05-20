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

  const [uniqueCount, placeRows, grouped] = await Promise.all([
    prisma.visitor.findMany({ select: { ip: true }, distinct: ["ip"] }).then((rows) => rows.length),
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

  const places = placeRows
    .map((row) => row.location)
    .filter((value): value is string => Boolean(value));

  const rows = grouped.map((item, index) => ({
    id: index,
    location: item._max.location ?? null,
    frequency: item._sum.frequency ?? 0,
    lastSeen: item._max.lastSeen?.toISOString() ?? new Date(0).toISOString(),
  }));

  return NextResponse.json({ count: uniqueCount, rows, places });
}
