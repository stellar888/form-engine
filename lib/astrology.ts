export type AstroContext = {
  timezone: string;
  localTimestamp: string;
  sunSign: string;
  moonSign: string;
};

const ZODIAC_SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces"
] as const;

function normalizeDegrees(value: number): number {
  const result = value % 360;
  return result < 0 ? result + 360 : result;
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function julianDate(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

function zodiacSignFromLongitude(longitude: number): string {
  const index = Math.floor(normalizeDegrees(longitude) / 30);
  return ZODIAC_SIGNS[index] ?? "Aries";
}

// Low-complexity solar longitude approximation is sufficient for zodiac sign mapping.
function solarLongitude(date: Date): number {
  const d = julianDate(date) - 2451545.0;
  const g = normalizeDegrees(357.529 + 0.98560028 * d);
  const q = normalizeDegrees(280.459 + 0.98564736 * d);
  const l = q + 1.915 * Math.sin(toRadians(g)) + 0.02 * Math.sin(toRadians(2 * g));
  return normalizeDegrees(l);
}

// Approximate lunar ecliptic longitude for sign-level resolution.
function lunarLongitude(date: Date): number {
  const d = julianDate(date) - 2451545.0;

  const l0 = normalizeDegrees(218.316 + 13.176396 * d);
  const mMoon = normalizeDegrees(134.963 + 13.064993 * d);
  const mSun = normalizeDegrees(357.529 + 0.98560028 * d);
  const dMoon = normalizeDegrees(297.85 + 12.190749 * d);

  const lon =
    l0 +
    6.289 * Math.sin(toRadians(mMoon)) +
    1.274 * Math.sin(toRadians(2 * dMoon - mMoon)) +
    0.658 * Math.sin(toRadians(2 * dMoon)) +
    0.214 * Math.sin(toRadians(2 * mMoon)) -
    0.186 * Math.sin(toRadians(mSun));

  return normalizeDegrees(lon);
}

export function buildAstroContext(timezone: string): AstroContext {
  const now = new Date();
  const localTimestamp = new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: timezone
  }).format(now);

  return {
    timezone,
    localTimestamp,
    sunSign: zodiacSignFromLongitude(solarLongitude(now)),
    moonSign: zodiacSignFromLongitude(lunarLongitude(now))
  };
}
