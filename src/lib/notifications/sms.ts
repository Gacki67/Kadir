/**
 * Envoi des SMS.
 *
 * Deux fournisseurs pris en charge, selon les variables d'environnement :
 *   1. Twilio (TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_PHONE_NUMBER)
 *   2. Brevo SMS (BREVO_API_KEY + BREVO_SMS_SENDER)
 *
 * Sans configuration, le message est affiche dans les logs (mode developpement)
 * et la reservation se deroule normalement.
 */

export type SmsPayload = {
  /** Numero au format international E.164, ex. +33612345678 */
  to: string;
  message: string;
};

export type SendResult = {
  sent: boolean;
  provider: string;
  error?: string;
};

async function sendWithTwilio(payload: SmsPayload): Promise<SendResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID as string;
  const authToken = process.env.TWILIO_AUTH_TOKEN as string;
  const from = process.env.TWILIO_PHONE_NUMBER as string;

  const body = new URLSearchParams({
    To: payload.to,
    Body: payload.message,
  });

  // Twilio accepte soit un numero emetteur, soit un Messaging Service SID.
  if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
    body.set("MessagingServiceSid", process.env.TWILIO_MESSAGING_SERVICE_SID);
  } else {
    body.set("From", from);
  }

  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString(
    "base64",
  );

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    },
  );

  if (!response.ok) {
    const text = await response.text();
    return {
      sent: false,
      provider: "twilio",
      error: `HTTP ${response.status} — ${text.slice(0, 300)}`,
    };
  }
  return { sent: true, provider: "twilio" };
}

async function sendWithBrevo(payload: SmsPayload): Promise<SendResult> {
  const response = await fetch("https://api.brevo.com/v3/transactionalSMS/sms", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY as string,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      // Brevo attend le numero sans le "+"
      recipient: payload.to.replace(/^\+/, ""),
      sender: process.env.BREVO_SMS_SENDER || "KadirBarber",
      content: payload.message,
      type: "transactional",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    return {
      sent: false,
      provider: "brevo",
      error: `HTTP ${response.status} — ${text.slice(0, 300)}`,
    };
  }
  return { sent: true, provider: "brevo" };
}

export function getSmsProvider(): "twilio" | "brevo" | "console" {
  if (
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    (process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_MESSAGING_SERVICE_SID)
  ) {
    return "twilio";
  }
  if (process.env.BREVO_API_KEY && process.env.BREVO_SMS_SENDER) return "brevo";
  return "console";
}

/** Envoie un SMS. Ne leve jamais d'exception. */
export async function sendSms(payload: SmsPayload): Promise<SendResult> {
  const provider = getSmsProvider();

  if (provider === "console") {
    console.info(
      [
        "",
        "──────────────────────────────────────────────────────────────",
        "  [MODE DEV] SMS NON ENVOYE — aucune cle API configuree",
        "──────────────────────────────────────────────────────────────",
        `  A       : ${payload.to}`,
        `  Message : ${payload.message}`,
        "──────────────────────────────────────────────────────────────",
        "",
      ].join("\n"),
    );
    return { sent: true, provider: "console" };
  }

  try {
    const result =
      provider === "twilio"
        ? await sendWithTwilio(payload)
        : await sendWithBrevo(payload);

    if (!result.sent) {
      console.error(
        `[sms] Echec d'envoi via ${result.provider} vers ${payload.to} : ${result.error}`,
      );
    }
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[sms] Erreur inattendue (${provider}) : ${message}`);
    return { sent: false, provider, error: message };
  }
}
