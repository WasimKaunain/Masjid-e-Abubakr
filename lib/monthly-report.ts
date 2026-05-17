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
    prisma.$queryRaw<SumRow[]>`
      SELECT
        COALESCE(SUM(CASE WHEN "Type" = 'Credit' THEN "Amount" ELSE 0 END), 0) AS credit,
        COALESCE(SUM(CASE WHEN "Type" = 'Debit' THEN "Amount" ELSE 0 END), 0) AS debit
      FROM transactions
      WHERE "Timestamp" >= ${selectedMonth}
        AND "Timestamp" < ${nextMonth}
    `,
    prisma.$queryRaw<SumRow[]>`
      SELECT
        COALESCE(SUM(CASE WHEN "Type" = 'Credit' THEN "Amount" ELSE 0 END), 0) AS credit,
        COALESCE(SUM(CASE WHEN "Type" = 'Debit' THEN "Amount" ELSE 0 END), 0) AS debit
      FROM transactions
      WHERE "Timestamp" < ${selectedMonth}
    `,
    prisma.monthly_report.findUnique({
      where: { month_name: selectedMonthKey },
    }),
  ]);

  const totalCredit = toNumber(totals[0]?.credit);
  const totalDebit = toNumber(totals[0]?.debit);
  const previousAmount =
    toNumber(previousTotals[0]?.credit) - toNumber(previousTotals[0]?.debit);
  const remainingAmount = totalCredit - totalDebit;
  const totalRemainingAmount = previousAmount + remainingAmount;
  const dueCount =
    options?.dueCount ??
    (existingReport?.due_count ? Number(existingReport.due_count) : 0);

  return prisma.monthly_report.upsert({
    where: { month_name: selectedMonthKey },
    create: {
      month_name: selectedMonthKey,
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
  return monthKey(new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1)));
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
