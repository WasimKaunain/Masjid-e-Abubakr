import { Decimal } from "@prisma/client/runtime/library";
import prisma from "@/lib/prisma";
import { addMonths, monthKey, parseMonthKey } from "@/lib/months";

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

export function reportMonthKeyFromDate(value: Date) {
  return reportRowKey(
    monthKey(new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1))),
  );
}

export async function recalculateReportsFrom(selectedMonthKey: string) {
  const reports = await prisma.monthly_report.findMany({
    where: {
      month_name: {
        gte: selectedMonthKey,
      },
    },
    orderBy: {
      month_name: "asc",
    },
    select: {
      month_name: true,
    },
  });

  await Promise.all(
    reports.map((report) => recalculateMonthlyReport(report.month_name)),
  );
}
