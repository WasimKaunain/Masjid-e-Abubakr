import { NextResponse } from "next/server";
import { Decimal } from "@prisma/client/runtime/library";
import prisma from "@/lib/prisma";
import { authCookies, readTreasurerSession } from "@/lib/auth";
import { transactionTimestampForMonth } from "@/lib/treasurer-data";

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
    month?: string;
    donorIds?: number[];
  };

  if (!body.month || !body.donorIds?.length) {
    return NextResponse.json({ message: "Choose at least one donor" }, { status: 400 });
  }

  const donors = await prisma.donor_list.findMany({
    where: {
      id: { in: body.donorIds },
      paid_or_not: false,
    },
  });

  if (donors.length !== body.donorIds.length) {
    return NextResponse.json(
      { message: "One or more donors are no longer unpaid" },
      { status: 400 },
    );
  }

  await prisma.$transaction([
    prisma.transactions.createMany({
      data: donors.map((donor) => ({
        Name: donor.name,
        Amount: new Decimal(donor.amount),
        Type: "Credit",
        Description: "Donation",
        Timestamp: transactionTimestampForMonth(body.month!),
      })),
    }),
    prisma.donor_list.updateMany({
      where: { id: { in: body.donorIds } },
      data: { paid_or_not: true },
    }),
  ]);

  return NextResponse.json({ success: true });
}
