# Astrokarma Oracle Engine (MVP)

Mobile-first Next.js flow:

1. Collect first name + email + marketing consent.
2. Enforce Mailchimp single opt-in subscription before unlock.
3. Draw one deterministic daily oracle card per email/timezone.
4. Generate personalized reading using card content + current Sun/Moon signs.
5. Offer share action and CTA to book Astrokarma services.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Required env vars

- `SESSION_SECRET`
- `DRAW_SECRET`
- `MAILCHIMP_API_KEY` (required unless `MAILCHIMP_BYPASS=true` in local non-production testing)
- `MAILCHIMP_AUDIENCE_ID` (required unless `MAILCHIMP_BYPASS=true` in local non-production testing)
- `OPENAI_API_KEY` (optional; fallback reading used if omitted)

Optional:

- `MAILCHIMP_TAG` (default `oracle_daily`)
- `MAILCHIMP_BYPASS` (set `true` only for local testing; ignored in production)
- `OPENAI_MODEL` (default `gpt-4.1-mini`)
- `NEXT_PUBLIC_SERVICES_URL`

## Notes

- Oracle cards are sourced from `oracle_cards.json`.
- Local image paths like `images/oracle/*.jpg` are served through `/api/image/*`.
- Existing cards that use remote URLs continue to render directly.
