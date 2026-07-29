/**
 * Envoi des e-mails.
 *
 * Trois fournisseurs sont pris en charge, choisis automatiquement selon les
 * variables d'environnement presentes :
 *   1. Resend  (RESEND_API_KEY)          — recommande
 *   2. Brevo   (BREVO_API_KEY)           — alternative
 *   3. SMTP    (SMTP_HOST, SMTP_USER...) — via Nodemailer, si installe
 *
 * Si aucune cle n'est configuree, on bascule en MODE DEVELOPPEMENT : le message
 * est simplement affiche dans les logs du serveur. La reservation reussit
 * malgre tout — jamais un probleme d'e-mail ne doit faire echouer un RDV.
 *
 * Note : les appels sont faits avec `fetch` directement plutot qu'avec les SDK
 * officiels. Cela evite deux dependances lourdes, fonctionne sur tous les
 * runtimes (Node et Edge) et l'API REST de ces services est stable.
 */

export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type SendResult = {
  sent: boolean;
  provider: string;
  /** Renseigne en cas d'echec, pour la journalisation */
  error?: string;
};

function getFromAddress(): string {
  return process.env.EMAIL_FROM || "Kadir Barber <onboarding@resend.dev>";
}

/** Extrait "Nom" et "adresse@domaine" d'une chaine "Nom <adresse@domaine>". */
function parseFrom(value: string): { name: string; email: string } {
  const match = /^\s*(.*?)\s*<\s*([^>]+)\s*>\s*$/.exec(value);
  if (match) return { name: match[1] || "Kadir Barber", email: match[2] };
  return { name: "Kadir Barber", email: value.trim() };
}

/* -------------------------------------------------------------------------- */
/*  Fournisseurs                                                                */
/* -------------------------------------------------------------------------- */

async function sendWithResend(payload: EmailPayload): Promise<SendResult> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getFromAddress(),
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    return {
      sent: false,
      provider: "resend",
      error: `HTTP ${response.status} — ${body.slice(0, 300)}`,
    };
  }
  return { sent: true, provider: "resend" };
}

async function sendWithBrevo(payload: EmailPayload): Promise<SendResult> {
  const sender = parseFrom(getFromAddress());
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY as string,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender,
      to: [{ email: payload.to }],
      subject: payload.subject,
      htmlContent: payload.html,
      textContent: payload.text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    return {
      sent: false,
      provider: "brevo",
      error: `HTTP ${response.status} — ${body.slice(0, 300)}`,
    };
  }
  return { sent: true, provider: "brevo" };
}

async function sendWithSmtp(payload: EmailPayload): Promise<SendResult> {
  try {
    // Import optionnel : nodemailer n'est pas une dependance obligatoire.
    // Installez-le avec `npm install nodemailer` pour activer cette voie.
    //
    // Le nom du module est reconstitue a l'execution et l'import porte le
    // commentaire `webpackIgnore` : le bundler ne cherche donc pas a le
    // resoudre au moment du build, et l'absence du paquet n'empeche pas de
    // compiler le projet.
    const moduleName = ["node", "mailer"].join("");
    const nodemailer = await import(/* webpackIgnore: true */ moduleName).catch(
      () => null,
    );

    if (!nodemailer?.createTransport) {
      return {
        sent: false,
        provider: "smtp",
        error:
          "Nodemailer n'est pas installe. Executez `npm install nodemailer` pour utiliser SMTP.",
      };
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: getFromAddress(),
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });

    return { sent: true, provider: "smtp" };
  } catch (error) {
    return {
      sent: false,
      provider: "smtp",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/* -------------------------------------------------------------------------- */
/*  Point d'entree                                                              */
/* -------------------------------------------------------------------------- */

export function getEmailProvider(): "resend" | "brevo" | "smtp" | "console" {
  if (process.env.RESEND_API_KEY) return "resend";
  if (process.env.BREVO_API_KEY) return "brevo";
  if (process.env.SMTP_HOST) return "smtp";
  return "console";
}

/**
 * Envoie un e-mail. Ne leve jamais d'exception : retourne toujours un resultat,
 * afin qu'un incident chez le fournisseur n'annule pas une reservation.
 */
export async function sendEmail(payload: EmailPayload): Promise<SendResult> {
  const provider = getEmailProvider();

  if (provider === "console") {
    console.info(
      [
        "",
        "──────────────────────────────────────────────────────────────",
        "  [MODE DEV] E-MAIL NON ENVOYE — aucune cle API configuree",
        "──────────────────────────────────────────────────────────────",
        `  A       : ${payload.to}`,
        `  De      : ${getFromAddress()}`,
        `  Objet   : ${payload.subject}`,
        "  ─────────────────────────────────────────────────────────────",
        payload.text
          .split("\n")
          .map((line) => `  ${line}`)
          .join("\n"),
        "──────────────────────────────────────────────────────────────",
        "",
      ].join("\n"),
    );
    return { sent: true, provider: "console" };
  }

  try {
    let result: SendResult;
    if (provider === "resend") result = await sendWithResend(payload);
    else if (provider === "brevo") result = await sendWithBrevo(payload);
    else result = await sendWithSmtp(payload);

    if (!result.sent) {
      console.error(
        `[e-mail] Echec d'envoi via ${result.provider} vers ${payload.to} : ${result.error}`,
      );
    }
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[e-mail] Erreur inattendue (${provider}) : ${message}`);
    return { sent: false, provider, error: message };
  }
}
