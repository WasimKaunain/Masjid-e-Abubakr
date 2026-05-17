import { NextResponse } from "next/server";
import { Decimal } from "@prisma/client/runtime/library";
import prisma from "@/lib/prisma";
import { authCookies, readTreasurerSession } from "@/lib/auth";
import { transactionTimestampForMonth } from "@/lib/treasurer-data";
import { recalculateMonthlyReport } from "@/lib/monthly-report";

export async function POST(request: Request) {
  const token = request.headers
    .get("cookie")
    ?.split("; ")
    .find((cookie) => cookie.startsWith(`${authCookies.session}=`))
    ?.split("=")
    .slice(1)
    .join("=");

  if (!readTreasurerSession(token)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    payerName?: string;
    amount?: number;
    month?: string;
  };

  if (!body.payerName || !body.amount || !body.month) {
    return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
  }

  const dueCount = await prisma.donor_list.count({
    where: { paid_or_not: false },
  });

  await prisma.$transaction([
    prisma.transactions.create({
      data: {
        Name: body.payerName,
        Amount: new Decimal(body.amount),
        Type: "Debit",
        Description: "Imam Sahab ka Nazrana",
        Timestamp: transactionTimestampForMonth(body.month),
      },
    }),
    prisma.donor_list.updateMany({
      data: {
        paid_or_not: false,
      },
    }),
  ]);

  await recalculateMonthlyReport(body.month, { dueCount });

  return NextResponse.json({ success: true });
}
