import { NextResponse } from "next/server";
import { Decimal } from "@prisma/client/runtime/library";
import prisma from "@/lib/prisma";
import { authCookies, readTreasurerSession } from "@/lib/auth";

function authorized(request: Request) {
  const token = request.headers
    .get("cookie")
    ?.split("; ")
    .find((cookie) => cookie.startsWith(`${authCookies.session}=`))
    ?.split("=")
    .slice(1)
    .join("=");
  return Boolean(readTreasurerSession(token));
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    action?: "add" | "remove";
    name?: string;
    amount?: number;
    phone?: string;
  };

  if (!body.action || !body.name) {
    return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
  }

  try {
    if (body.action === "add") {
      if (!body.amount || body.amount <= 0) {
        return NextResponse.json({ message: "Amount is required" }, { status: 400 });
      }

      await prisma.donor_list.create({
        data: {
          name: body.name,
          amount: new Decimal(body.amount),
          phone: body.phone || null,
        },
      });
    } else {
      await prisma.donor_list.delete({ where: { name: body.name } });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: "Unable to update donor" }, { status: 400 });
  }
}
