import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { drawDailyCard } from "@/lib/draw";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      timezone?: string;
    };

    const timezone = body.timezone?.trim() || "UTC";
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (!token) {
      return NextResponse.json({ error: "Not subscribed in this session." }, { status: 401 });
    }

    const session = verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ error: "Session invalid or expired." }, { status: 401 });
    }

    const { card, dateKey } = drawDailyCard(session.email, timezone);

    return NextResponse.json({
      ok: true,
      dateKey,
      firstName: session.firstName,
      card
    });
  } catch {
    return NextResponse.json({ error: "Unable to draw card." }, { status: 500 });
  }
}
