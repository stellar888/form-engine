"use client";

import { FormEvent, useMemo, useState } from "react";

type Card = {
  id: number;
  title: string;
  image: string;
  description: string;
  readingNotes: string;
  questions: string[];
  relatedEnergies: {
    chakra: string;
    planet: string;
    sign: string;
  };
  quote: string;
};

type DrawResponse = {
  ok: true;
  dateKey: string;
  firstName: string;
  card: Card;
};

type ReadingResponse = {
  ok: true;
  reading: string;
  astro: {
    timezone: string;
    localTimestamp: string;
    sunSign: string;
    moonSign: string;
  };
};

function imageSrc(cardImage: string): string {
  if (cardImage.startsWith("http://") || cardImage.startsWith("https://")) {
    return cardImage;
  }

  const normalized = cardImage.replace(/^images\//, "");
  return `/api/image/${normalized}`;
}

export default function HomePage() {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [draw, setDraw] = useState<DrawResponse | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [reading, setReading] = useState<ReadingResponse | null>(null);
  const [readingLoading, setReadingLoading] = useState(false);

  const timezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", []);
  const servicesUrl = process.env.NEXT_PUBLIC_SERVICES_URL ?? "https://astrokarma.ro";

  async function handleSubscribe(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const subscribeResp = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, email, consent })
      });

      if (!subscribeResp.ok) {
        const payload = (await subscribeResp.json()) as { error?: string };
        throw new Error(payload.error || "Could not subscribe.");
      }

      const drawResp = await fetch("/api/draw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timezone })
      });

      if (!drawResp.ok) {
        const payload = (await drawResp.json()) as { error?: string };
        throw new Error(payload.error || "Could not draw a card.");
      }

      const drawPayload = (await drawResp.json()) as DrawResponse;
      setDraw(drawPayload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReveal() {
    if (!draw || readingLoading || reading) return;

    setRevealed(true);
    setReadingLoading(true);
    setError(null);

    try {
      const resp = await fetch("/api/generate-reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: draw.card.id, timezone })
      });

      if (!resp.ok) {
        const payload = (await resp.json()) as { error?: string };
        throw new Error(payload.error || "Could not generate reading.");
      }

      const payload = (await resp.json()) as ReadingResponse;
      setReading(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reading failed.");
    } finally {
      setReadingLoading(false);
    }
  }

  async function handleShare() {
    if (!draw || !reading) return;

    const shareText = [
      `My Astrokarma card today is "${draw.card.title}".`,
      reading.reading,
      "Draw yours here:",
      typeof window !== "undefined" ? window.location.href : ""
    ].join("\n\n");

    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Astrokarma Daily Card",
          text: shareText,
          url: window.location.href
        });
        return;
      } catch {
        // Fall through to clipboard fallback.
      }
    }

    await navigator.clipboard.writeText(shareText);
    alert("Reading copied. Paste into Instagram story caption or DM.");
  }

  return (
    <main>
      <section className="panel">
        <h1 className="hero-title">Astrokarma Daily Oracle</h1>
        <p className="hero-copy">
          Subscribe for your daily card and receive a personalized reading tuned to current Sun/Moon energy.
        </p>

        {!draw ? (
          <form className="form" onSubmit={handleSubscribe}>
            <label>
              First name
              <input
                type="text"
                autoComplete="given-name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="Your first name"
                required
              />
            </label>

            <label>
              Email
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@email.com"
                required
              />
            </label>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                required
              />
              <span>I agree to subscribe to Astrokarma updates via Mailchimp.</span>
            </label>

            <button className="primary" type="submit" disabled={loading}>
              {loading ? "Subscribing..." : "Unlock My Card"}
            </button>

            <p className="small">Single opt-in enabled for this campaign.</p>
          </form>
        ) : (
          <>
            <div className="card-stage">
              {!revealed ? (
                <button className="card-back" onClick={handleReveal}>
                  <p>Tap To Reveal</p>
                </button>
              ) : (
                <div className="card-front">
                  <img src={imageSrc(draw.card.image)} alt={draw.card.title} />
                </div>
              )}
            </div>

            {revealed ? <h2>{draw.card.title}</h2> : null}

            {readingLoading ? <p className="hero-copy">Receiving your message...</p> : null}

            {reading ? (
              <>
                <p className="reading">{reading.reading}</p>
                <p className="meta">
                  {reading.astro.localTimestamp} | Sun in {reading.astro.sunSign} | Moon in {reading.astro.moonSign}
                </p>

                <div className="actions">
                  <button className="primary" type="button" onClick={handleShare}>
                    Share Reading
                  </button>
                  <button
                    className="ghost"
                    type="button"
                    onClick={() => window.open(imageSrc(draw.card.image), "_blank", "noopener,noreferrer")}
                  >
                    Open Card Image
                  </button>
                </div>

                <div className="cta">
                  <p>Want a deeper personal reading? Book a full session with Astrokarma.</p>
                  <button
                    className="primary"
                    type="button"
                    onClick={() => window.open(servicesUrl, "_blank", "noopener,noreferrer")}
                  >
                    Book a Session
                  </button>
                </div>
              </>
            ) : null}
          </>
        )}

        {error ? <p className="error">{error}</p> : null}
      </section>
    </main>
  );
}
