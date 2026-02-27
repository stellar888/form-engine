import { createHash } from "node:crypto";

import { ORACLE_CARDS, type OracleCard } from "@/lib/oracle";

function localDayKey(timezone: string): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  return formatter.format(now);
}

export function drawDailyCard(email: string, timezone: string): { card: OracleCard; dateKey: string } {
  const dateKey = localDayKey(timezone);
  const salt = process.env.DRAW_SECRET ?? "oracle-default-draw-secret";

  const hash = createHash("sha256")
    .update(`${email.toLowerCase()}|${dateKey}|${salt}`)
    .digest();

  const value = hash.readUInt32BE(0);
  const card = ORACLE_CARDS[value % ORACLE_CARDS.length];

  return { card, dateKey };
}
