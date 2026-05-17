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

  const [transactions, totals, previousTotals] = await Promise.all([
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
  ]);

  const totalCredit = toNumber(totals[0]?.credit);
  const totalDebit = toNumber(totals[0]?.debit);
  const previousBalance =
    toNumber(previousTotals[0]?.credit) - toNumber(previousTotals[0]?.debit);

  return {
    transactions: transactions.map((transaction) => ({
      ...transaction,
      Amount: transaction.Amount ? Number(transaction.Amount) : 0,
      Timestamp: transaction.Timestamp?.toISOString() ?? null,
    })),
    summary: {
      totalCredit,
      totalDebit,
      previousBalance,
      remaining: totalCredit - totalDebit,
      closingBalance: previousBalance + totalCredit - totalDebit,
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
