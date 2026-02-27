import { createHash } from "node:crypto";

type SubscribeInput = {
  email: string;
  firstName: string;
  consent: boolean;
};

function getDataCenterFromApiKey(apiKey: string): string {
  const match = apiKey.match(/-(\w+)$/);
  if (!match?.[1]) {
    throw new Error("MAILCHIMP_API_KEY is invalid; expected suffix like -us21.");
  }
  return match[1];
}

function getConfig() {
  const apiKey = process.env.MAILCHIMP_API_KEY;
  const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;
  const tag = process.env.MAILCHIMP_TAG ?? "oracle_daily";

  if (!apiKey || !audienceId) {
    throw new Error("Missing MAILCHIMP_API_KEY or MAILCHIMP_AUDIENCE_ID env var.");
  }

  return { apiKey, audienceId, tag, dataCenter: getDataCenterFromApiKey(apiKey) };
}

export async function subscribeToMailchimp(input: SubscribeInput): Promise<void> {
  if (!input.consent) {
    throw new Error("User must consent to subscription before continuing.");
  }

  const { apiKey, audienceId, tag, dataCenter } = getConfig();
  const email = input.email.trim().toLowerCase();
  const subscriberHash = createHash("md5").update(email).digest("hex");

  const url = `https://${dataCenter}.api.mailchimp.com/3.0/lists/${audienceId}/members/${subscriberHash}`;

  const upsertResponse = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString("base64")}`
    },
    body: JSON.stringify({
      email_address: email,
      status_if_new: "subscribed",
      status: "subscribed",
      merge_fields: {
        FNAME: input.firstName
      },
      tags: [tag]
    })
  });

  if (!upsertResponse.ok) {
    const body = await upsertResponse.text();
    throw new Error(`Mailchimp subscription failed: ${body}`);
  }
}
