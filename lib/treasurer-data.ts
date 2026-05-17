import prisma from "@/lib/prisma";
import { buildMonthOptions, getDashboardMonths } from "@/lib/dashboard-data";
import { addMonths, parseMonthKey } from "@/lib/months";

export async function getTreasurerMonthOptions() {
  const { currentMonth, storedMonths } = await getDashboardMonths();

  // Add one extra future month so treasurer can start a new month with no rows yet.
  const nextMonth = addMonths(currentMonth, 1);
  return buildMonthOptions(nextMonth, [currentMonth, ...storedMonths]);
}

export async function getDonors() {
  const donors = await prisma.donor_list.findMany({
    orderBy: { name: "asc" },
  });

  return donors.map((donor) => ({
    ...donor,
    amount: Number(donor.amount),
  }));
}

export async function getUnpaidDonors() {
  const donors = await prisma.donor_list.findMany({
    where: { paid_or_not: false },
    orderBy: { name: "asc" },
  });

  return donors.map((donor) => ({
    ...donor,
    amount: Number(donor.amount),
  }));
}

export function transactionTimestampForMonth(month: string) {
  const selected = parseMonthKey(month);
  if (!selected) {
    throw new Error("Invalid month");
  }

  const now = new Date();
  const lastDay = new Date(
    Date.UTC(selected.getUTCFullYear(), selected.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const day = Math.min(now.getUTCDate(), lastDay);

  return new Date(
    Date.UTC(
      selected.getUTCFullYear(),
      selected.getUTCMonth(),
      day,
      now.getUTCHours(),
      now.getUTCMinutes(),
      now.getUTCSeconds(),
      now.getUTCMilliseconds(),
    ),
  );
}

export async function getTransactionsForMonth(month: string) {
  const start = parseMonthKey(month);
  if (!start) return [];
  const end = addMonths(start, 1);

  const rows = await prisma.transactions.findMany({
    where: {
      Timestamp: {
        gte: start,
        lt: end,
      },
    },
    orderBy: { Timestamp: "desc" },
  });

  return rows.map((row) => ({
    ...row,
    Amount: row.Amount ? Number(row.Amount) : 0,
    Timestamp: row.Timestamp?.toISOString() ?? null,
  }));
}
