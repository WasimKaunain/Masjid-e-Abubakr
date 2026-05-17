import prisma from "@/lib/prisma";
import { addMonths, monthKey, startOfMonth } from "@/lib/months";

type MonthRow = {
  month_start: Date;
};

type SumRow = {
  credit: string | number | null;
  debit: string | number | null;
};

function toNumber(value: string | number | null | undefined) {
  return value == null ? 0 : Number(value);
}

function reportRowKey(monthKeyValue: string) {
  return `transactions_${monthKeyValue.replace(/-/g, "_")}`;
}

export async function getDashboardMonths() {
  const latestTransaction = await prisma.transactions.findFirst({
    where: {
      Timestamp: {
        not: null,
      },
    },
    orderBy: {
      Timestamp: "desc",
    },
    select: {
      Timestamp: true,
    },
  });

  const latestStoredMonth = latestTransaction?.Timestamp
    ? startOfMonth(latestTransaction.Timestamp)
    : startOfMonth(new Date());

  const currentMonth = latestStoredMonth;

  const storedMonths = await prisma.$queryRaw<MonthRow[]>`
    SELECT DATE_TRUNC('month', "Timestamp") AS month_start
    FROM transactions
    WHERE "Timestamp" IS NOT NULL
    GROUP BY DATE_TRUNC('month', "Timestamp")
    ORDER BY month_start DESC
  `;

  return {
    currentMonth,
    latestStoredMonth,
    storedMonths: storedMonths.map((row) => startOfMonth(row.month_start)),
  };
}

export async function getMonthTransactions(selectedMonth: Date) {
  const nextMonth = addMonths(selectedMonth, 1);
  const selectedKey = monthKey(selectedMonth);

  const [transactions, reportRow, monthAgg, previousAgg] = await Promise.all([
    prisma.transactions.findMany({
      where: {
        Timestamp: {
          gte: selectedMonth,
          lt: nextMonth,
        },
      },
      orderBy: {
        Timestamp: "desc",
      },
      select: {
        id: true,
        Name: true,
        Amount: true,
        Type: true,
        Description: true,
        Timestamp: true,
      },
    }),
    prisma.monthly_report.findUnique({
      where: { month_name: reportRowKey(selectedKey) },
    }),
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
  ]);

  const fallbackTotalCredit = Number(
    monthAgg.find((row) => row.Type === "Credit")?._sum.Amount ?? 0,
  );
  const fallbackTotalDebit = Number(
    monthAgg.find((row) => row.Type === "Debit")?._sum.Amount ?? 0,
  );
  const fallbackPreviousBalance =
    Number(previousAgg.find((row) => row.Type === "Credit")?._sum.Amount ?? 0) -
    Number(previousAgg.find((row) => row.Type === "Debit")?._sum.Amount ?? 0);

  const totalCredit = reportRow ? Number(reportRow.total_credit) : fallbackTotalCredit;
  const totalDebit = reportRow
    ? Number(reportRow.total_debit ?? 0)
    : fallbackTotalDebit;
  const remaining = reportRow
    ? Number(reportRow.remaining_amount)
    : totalCredit - totalDebit;
  const closingBalance = reportRow
    ? Number(reportRow.total_remaining_amount ?? remaining)
    : fallbackPreviousBalance + remaining;

  return {
    transactions: transactions.map((transaction) => ({
      ...transaction,
      Amount: transaction.Amount ? Number(transaction.Amount) : 0,
      Timestamp: transaction.Timestamp?.toISOString() ?? null,
    })),
    summary: {
      totalCredit,
      totalDebit,
      previousBalance: reportRow ? Number(reportRow.previous_amount ?? 0) : fallbackPreviousBalance,
      remaining,
      closingBalance,
    },
  };
}

export async function getDonationProgress(currentMonth: Date) {
  const nextMonth = addMonths(currentMonth, 1);
  const [currentCredits, donorTarget] = await Promise.all([
    prisma.transactions.aggregate({
      where: {
        Type: "Credit",
        Timestamp: {
          gte: currentMonth,
          lt: nextMonth,
        },
      },
      _sum: { Amount: true },
    }),
    prisma.donor_list.aggregate({
      _sum: { amount: true },
    }),
  ]);

  return {
    current: currentCredits._sum.Amount ? Number(currentCredits._sum.Amount) : 0,
    target: donorTarget._sum.amount ? Number(donorTarget._sum.amount) : 0,
  };
}

export function buildMonthOptions(currentMonth: Date, storedMonths: Date[]) {
  const monthMap = new Map<string, Date>();

  monthMap.set(monthKey(currentMonth), currentMonth);
  for (const month of storedMonths) {
    monthMap.set(monthKey(month), month);
  }

  return Array.from(monthMap.values()).sort((a, b) => b.getTime() - a.getTime());
}
