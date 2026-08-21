import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import nodemailer from "nodemailer";
import { buildConfirmationEmail, type ConfirmationEmailProps } from "@/lib/email-templates";
import type { CertLang } from "@/lib/certificate-copy";

const confirmSchema = z.object({
  toEmail: z.string().trim().email(),
  fullName: z.string().trim().min(2).max(100),
  verificationId: z.string().trim().min(5).max(80),
  lang: z.enum(["ht", "fr", "es", "en"] as const satisfies CertLang[] as unknown as [
    CertLang,
    ...CertLang[],
  ]),
  origin: z.string().trim().url(),
});

function env(name: string): string | undefined {
  return (
    (process.env[name] as string | undefined) ??
    (typeof import.meta !== "undefined" && (import.meta.env as Record<string, unknown>)[name]
      ? ((import.meta.env as Record<string, unknown>)[name] as string)
      : undefined)
  );
}

type AnyTransporter = ReturnType<typeof nodemailer.createTransport>;
let _transporter: AnyTransporter | null = null;

function getTransporter(): AnyTransporter | null {
  if (_transporter !== null) return _transporter;
  const host = env("SMTP_HOST");
  const user = env("SMTP_USER");
  const pass = env("SMTP_PASS");
  const portStr = env("SMTP_PORT");
  const secureStr = env("SMTP_SECURE");

  if (!host || !user || !pass) {
    _transporter = null as unknown as AnyTransporter;
    return _transporter;
  }
  const port = portStr ? parseInt(portStr, 10) : 587;
  const secure =
    typeof secureStr === "string"
      ? secureStr === "1" || secureStr.toLowerCase() === "true"
      : port === 465;
  _transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
  return _transporter;
}

export type SendConfirmationResult =
  | { sent: true; messageId: string }
  | { sent: false; skipped: true; reason: "smtp_not_configured" }
  | { sent: false; skipped: false; reason: string };

export const sendConfirmationEmail = createServerFn({ method: "POST" })
  .validator(confirmSchema)
  .handler(async ({ data }): Promise<SendConfirmationResult> => {
    const transporter = getTransporter();
    if (!transporter) {
      console.warn("[email] SMTP not configured. Skipping confirmation email to:", data.toEmail);
      return { sent: false, skipped: true, reason: "smtp_not_configured" };
    }

    let liveYoutube: string | null = null;
    let eventDate: string | null = null;
    let trainingTitle: string | null = null;
    try {
      const { getLiveData } = await import("@/admin.functions");
      const live = await getLiveData();
      liveYoutube = live.youtubeLink ?? null;
      eventDate = live.eventDate ?? live.certificateEmissionDate ?? null;
      trainingTitle = live.trainingTitle ?? null;
    } catch (e) {
      console.warn("[email] Could not fetch live data for email:", e);
    }

    const props: ConfirmationEmailProps = {
      fullName: data.fullName,
      verificationId: data.verificationId,
      eventDate,
      youtubeLink: liveYoutube,
      lang: data.lang,
      origin: data.origin,
      trainingTitle,
    };
    const built = buildConfirmationEmail(props);

    const from =
      env("SMTP_FROM") || `Masterclass AI <${env("SMTP_USER") ?? "noreply@masterclass.ai"}>`;
    try {
      const info = (await transporter.sendMail({
        from,
        to: data.toEmail,
        subject: built.subject,
        html: built.html,
        text: built.text,
        replyTo: env("SMTP_REPLY_TO") || undefined,
      })) as { messageId?: unknown };
      const messageId = String(info.messageId ?? `local-${Date.now()}`);
      console.log(`[email] Confirmation email sent to ${data.toEmail} (${messageId})`);
      return { sent: true, messageId };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err ?? "unknown");
      console.error(`[email] Failed to send confirmation email to ${data.toEmail}:`, msg);
      return { sent: false, skipped: false, reason: msg };
    }
  });
