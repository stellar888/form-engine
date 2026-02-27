import { NextResponse } from "next/server";

import { subscribeToMailchimp } from "@/lib/mailchimp";
import { createSessionToken, SESSION_COOKIE } from "@/lib/session";

function isEmailValid(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      firstName?: string;
      email?: string;
      consent?: boolean;
    };

    const firstName = body.firstName?.trim();
    const email = body.email?.trim().toLowerCase();
    const consent = body.consent === true;

    if (!firstName || firstName.length < 2) {
      return NextResponse.json({ error: "Please enter your first name." }, { status: 400 });
    }

    if (!email || !isEmailValid(email)) {
      return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
    }

    if (!consent) {
      return NextResponse.json({ error: "Subscription consent is required to continue." }, { status: 400 });
    }

    await subscribeToMailchimp({ email, firstName, consent });

    const token = createSessionToken({
      email,
      firstName,
      subscribedAt: new Date().toISOString()
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set({
      name: SESSION_COOKIE,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 14
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Subscription failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
