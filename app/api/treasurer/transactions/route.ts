import { NextResponse } from "next/server";
import { Decimal } from "@prisma/client/runtime/library";
import prisma from "@/lib/prisma";
import { authCookies, readTreasurerSession } from "@/lib/auth";
import { transactionTimestampForMonth } from "@/lib/treasurer-data";
import { recalculateReportsFrom } from "@/lib/monthly-report";

function sessionFrom(request: Request) {
  const token = request.headers
    .get("cookie")
    ?.split("; ")
    .find((cookie) => cookie.startsWith(`${authCookies.session}=`))
    ?.split("=")
    .slice(1)
    .join("=");
  return readTreasurerSession(token);
}

export async function POST(request: Request) {
  if (!sessionFrom(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    month?: string;
    type?: "Credit" | "Debit";
    name?: string;
    amount?: number;
    description?: string;
  };

  if (!body.month || !body.type || !body.amount || body.amount <= 0) {
    return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
  }

  if (body.type === "Credit" && !body.name) {
    return NextResponse.json({ message: "Donor name is required" }, { status: 400 });
  }

  if (body.type === "Debit" && !body.description) {
    return NextResponse.json({ message: "Description is required" }, { status: 400 });
  }

  try {
    const amount = body.amount!;
    const month = body.month!;
    const transactionType = body.type!;

    await prisma.$transaction(async (tx) => {
      const donor =
        transactionType === "Credit" && body.name
          ? await tx.donor_list.findUnique({ where: { name: body.name } })
          : null;

      if (transactionType === "Credit" && body.name) {
        if (donor?.paid_or_not) throw new Error("This donor has already paid");
      }

      await tx.transactions.create({
        data: {
          Name: body.name || null,
          Amount: new Decimal(amount),
          Type: transactionType,
          Description: transactionType === "Credit" ? "Donation" : body.description,
          Timestamp: transactionTimestampForMonth(month),
        },
      });

      if (transactionType === "Credit" && donor) {
        await tx.donor_list.update({
          where: { name: donor.name },
          data: { paid_or_not: true },
        });
      }
    });

    await recalculateReportsFrom(month);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to save transaction" },
      { status: 400 },
    );
  }
}
