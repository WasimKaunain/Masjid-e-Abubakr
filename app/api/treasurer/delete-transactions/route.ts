import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authCookies, readTreasurerSession } from "@/lib/auth";
import {
  recalculateReportsFrom,
  reportMonthKeyFromDate,
} from "@/lib/monthly-report";

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

  const body = (await request.json()) as { ids?: number[] };
  if (!body.ids?.length) {
    return NextResponse.json({ message: "Select at least one transaction" }, { status: 400 });
  }

  const rows = await prisma.transactions.findMany({
    where: { id: { in: body.ids } },
    select: { id: true, Name: true, Type: true, Timestamp: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.transactions.deleteMany({ where: { id: { in: body.ids } } });

    const creditDonors = rows
      .filter((row) => row.Type === "Credit" && row.Name)
      .map((row) => row.Name!) ;

    if (creditDonors.length) {
      await tx.donor_list.updateMany({
        where: { name: { in: creditDonors } },
        data: { paid_or_not: false },
      });
    }
  });

  const affectedMonths = new Set(
    rows
      .map((row) => row.Timestamp)
      .filter((value): value is Date => Boolean(value))
      .map((value) => reportMonthKeyFromDate(value)),
  );

  const earliestAffectedMonth = Array.from(affectedMonths).sort()[0];
  if (earliestAffectedMonth) {
    await recalculateReportsFrom(earliestAffectedMonth);
  }

  return NextResponse.json({ success: true });
}
