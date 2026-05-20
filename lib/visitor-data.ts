import prisma from "@/lib/prisma";

export type VisitorFilters = {
  location?: string;
  from?: string; // ISO date
  to?: string; // ISO date
};

export async function getVisitorCount() {
  const rows = await prisma.visitor.findMany({
    select: { ip: true },
    distinct: ["ip"],
  });
  return rows.length;
}

export async function getVisitors(filters: VisitorFilters) {
  const fromDate = filters.from ? new Date(filters.from) : undefined;
  const toDate = filters.to ? new Date(filters.to) : undefined;

  return prisma.visitor.findMany({
    where: {
      ...(filters.location ? { location: { contains: filters.location, mode: "insensitive" } } : {}),
      ...(fromDate || toDate
        ? {
            lastSeen: {
              ...(fromDate ? { gte: fromDate } : {}),
              ...(toDate ? { lte: toDate } : {}),
            },
          }
        : {}),
    },
    orderBy: { lastSeen: "desc" },
    select: {
      id: true,
      ip: true,
      location: true,
      frequency: true,
      lastSeen: true,
    },
    take: 500,
  });
}
