import { Decimal } from "@prisma/client/runtime/library";
import prisma from "@/lib/prisma";
import { addMonths, monthKey, parseMonthKey, startOfMonth } from "@/lib/months";

type SumRow = {
  credit: string | number | null;
  debit: string | number | null;
};

function toNumber(value: string | number | null | undefined) {
  return value == null ? 0 : Number(value);
}

function reportRowKey(monthKeyValue: string) {
  const value = monthKeyValue.replace(/-/g, "_");
  return `transactions_${value}`;
}

function monthKeyFromReportRowKey(value: string) {
  const match = /^transactions_(\d{4})_(\d{2})$/.exec(value);
  if (!match) return null;
  return `${match[1]}-${match[2]}`;
}

export async function recalculateMonthlyReport(
  selectedMonthKey: string,
  options?: {
    dueCount?: number;
  },
) {
  const selectedMonth = parseMonthKey(selectedMonthKey);
  if (!selectedMonth) {
    throw new Error("Invalid report month");
  }

  const nextMonth = addMonths(selectedMonth, 1);

  const [totals, previousTotals, existingReport] = await Promise.all([
    prisma.transactions.groupBy({
      by: ["Type"],
      where: {
        
        Timestamp: {
          gte: selectedMonth,
          lt: nextMonth,
        },
        Type: { in: ["Credit", "Debit"] },
      },
      _sum: { Amount: true },
    }),
    prisma.transactions.groupBy({
      by: ["Type"],
      where: {
        Timestamp: {
          lt: selectedMonth,
        },
        Type: { in: ["Credit", "Debit"] },
      },
      _sum: { Amount: true },
    }),
    prisma.monthly_report.findUnique({
      where: { month_name: reportRowKey(selectedMonthKey) },
    }),
  ]);

  const totalCredit = Number(
    totals.find((row) => row.Type === "Credit")?._sum.Amount ?? 0,
  );
  const totalDebit = Number(
    totals.find((row) => row.Type === "Debit")?._sum.Amount ?? 0,
  );
  const previousAmount =
    Number(previousTotals.find((row) => row.Type === "Credit")?._sum.Amount ?? 0) -
    Number(previousTotals.find((row) => row.Type === "Debit")?._sum.Amount ?? 0);

  const remainingAmount = totalCredit - totalDebit;
  const totalRemainingAmount = previousAmount + remainingAmount;
  const dueCount =
    options?.dueCount ??
    (existingReport?.due_count ? Number(existingReport.due_count) : 0);

  return prisma.monthly_report.upsert({
    where: { month_name: reportRowKey(selectedMonthKey) },
    create: {
      month_name: reportRowKey(selectedMonthKey),
      total_credit: new Decimal(totalCredit),
      total_debit: new Decimal(totalDebit),
      remaining_amount: new Decimal(remainingAmount),
      previous_amount: new Decimal(previousAmount),
      total_remaining_amount: new Decimal(totalRemainingAmount),
      due_count: new Decimal(dueCount),
    },
    update: {
      total_credit: new Decimal(totalCredit),
      total_debit: new Decimal(totalDebit),
      remaining_amount: new Decimal(remainingAmount),
      previous_amount: new Decimal(previousAmount),
      total_remaining_amount: new Decimal(totalRemainingAmount),
      due_count: new Decimal(dueCount),
    },
  });
}

export function monthKeyFromDate(value: Date) {
  return monthKey(startOfMonth(value));
}

export async function recalculateReportsFrom(selectedMonthKey: string) {
  const selectedMonth = parseMonthKey(selectedMonthKey);
  if (!selectedMonth) {
    throw new Error("Invalid report month");
  }

  const startReportKey = reportRowKey(selectedMonthKey);
  const [transactionMonths, reports] = await Promise.all([
    prisma.$queryRaw<{ month_start: Date }[]>`
      SELECT DATE_TRUNC('month', "Timestamp") AS month_start
      FROM transactions
      WHERE "Timestamp" IS NOT NULL
        AND "Timestamp" >= ${selectedMonth}
      GROUP BY DATE_TRUNC('month', "Timestamp")
      ORDER BY month_start ASC
    `,
    prisma.monthly_report.findMany({
      where: {
        month_name: {
          gte: startReportKey,
        },
      },
      orderBy: {
        month_name: "asc",
      },
      select: {
        month_name: true,
      },
    }),
  ]);

  const monthKeys = new Set<string>([
    ...transactionMonths.map((row) => monthKey(startOfMonth(row.month_start))),
    ...reports
      .map((report) => monthKeyFromReportRowKey(report.month_name))
      .filter((value): value is string => Boolean(value)),
  ]);

  const orderedMonthKeys = Array.from(monthKeys).sort();
  for (const key of orderedMonthKeys) {
    await recalculateMonthlyReport(key);
  }
}
