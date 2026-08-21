import type { CertLang } from "@/lib/certificate-copy";

export type ConfirmationEmailProps = {
  fullName: string;
  verificationId: string;
  eventDate?: string | null;
  youtubeLink?: string | null;
  lang: CertLang;
  origin: string;
  trainingTitle?: string | null;
};

const DEFAULT_TRAINING = "Masterclass AI: Kreye Kontni & Fè Aplikasyon";

function copyByLang(lang: CertLang) {
  if (lang === "fr") {
    return {
      hello: (n: string) => `Bonjour ${n},`,
      subject: (t: string) => `✅ Inscription confirmée — ${t}`,
      h1: "Inscription confirmée",
      intro: (t: string) =>
        `Merci pour votre inscription à <strong>${t}</strong>. Votre place est maintenant réservée.`,
      details: "Détails de votre inscription",
      nameLabel: "Nom",
      certCodeLabel: "Code du certificat",
      certCodeDesc:
        "Notez bien ce code — c'est avec lui que vous générerez et vérifierez votre certificat plus tard.",
      eventDateLabel: "Date de la formation",
      youtubeLabel: "Lien YouTube (live)",
      youtubeCta: "Ouvrir la chaîne / rappel",
      stepsTitle: "Prochaines étapes",
      steps: [
        "Ajoutez la date à votre agenda pour ne pas manquer le live.",
        "Le jour J, connectez-vous sur YouTube pour suivre la formation en direct.",
        "Après la formation, allez sur la page Certificat, entrez votre email et téléchargez-le dans la langue de votre choix.",
        "Pour vérifier un certificat (le vôtre ou celui d'un autre), utilisez le QR ou le code sur la page Vérification.",
      ],
      verifyCta: "Vérifier un certificat",
      certCta: "Générer mon certificat (après le live)",
      signOff: "À très bientôt pour la formation !",
      team: "L'équipe Masterclass AI",
      footer: "Si vous n'êtes pas à l'origine de cette inscription, ignorez simplement cet e-mail.",
      dateFallback: "Annoncée prochainement",
      notYet: "À venir",
    };
  }
  if (lang === "es") {
    return {
      hello: (n: string) => `Hola ${n},`,
      subject: (t: string) => `✅ Inscripción confirmada — ${t}`,
      h1: "Inscripción confirmada",
      intro: (t: string) =>
        `Gracias por inscribirte en <strong>${t}</strong>. Tu lugar ya está reservado.`,
      details: "Detalles de tu inscripción",
      nameLabel: "Nombre",
      certCodeLabel: "Código del certificado",
      certCodeDesc:
        "Guarda bien este código: es con él que generarás y verificarás tu certificado después.",
      eventDateLabel: "Fecha de la formación",
      youtubeLabel: "Enlace YouTube (live)",
      youtubeCta: "Abrir el canal / recordatorio",
      stepsTitle: "Próximos pasos",
      steps: [
        "Añade la fecha a tu agenda para no perderte el directo.",
        "El día J, conecta en YouTube para seguir la formación en vivo.",
        "Después de la formación, ve a la página Certificado, introduce tu email y descárgalo en el idioma que prefieras.",
        "Para verificar un certificado (el tuyo o el de otro), usa el QR o el código en la página Verificación.",
      ],
      verifyCta: "Verificar un certificado",
      certCta: "Generar mi certificado (después del live)",
      signOff: "¡Nos vemos muy pronto en la formación!",
      team: "El equipo Masterclass AI",
      footer: "Si no has sido tú quien se inscribió, ignora este correo sin problema.",
      dateFallback: "Se anunciará próximamente",
      notYet: "Próximamente",
    };
  }
  if (lang === "en") {
    return {
      hello: (n: string) => `Hi ${n},`,
      subject: (t: string) => `✅ Registration confirmed — ${t}`,
      h1: "Registration confirmed",
      intro: (t: string) =>
        `Thanks for registering for <strong>${t}</strong>. Your seat is now reserved.`,
      details: "Your registration details",
      nameLabel: "Name",
      certCodeLabel: "Certificate code",
      certCodeDesc:
        "Save this code — you'll need it to generate and verify your certificate later.",
      eventDateLabel: "Training date",
      youtubeLabel: "YouTube link (live)",
      youtubeCta: "Open channel / set reminder",
      stepsTitle: "Next steps",
      steps: [
        "Add the date to your calendar so you don't miss the live.",
        "On the day, join us on YouTube to follow the training live.",
        "After the training, go to the Certificate page, enter your email and download it in the language you want.",
        "To verify a certificate (yours or someone else's), use the QR or code on the Verify page.",
      ],
      verifyCta: "Verify a certificate",
      certCta: "Generate my certificate (after the live)",
      signOff: "See you very soon for the training!",
      team: "The Masterclass AI team",
      footer: "If you didn't register, you can safely ignore this email.",
      dateFallback: "To be announced soon",
      notYet: "Coming soon",
    };
  }
  return {
    hello: (n: string) => `Bonjou ${n},`,
    subject: (t: string) => `✅ Enskripsyon konfime — ${t}`,
    h1: "Enskripsyon ou konfime",
    intro: (t: string) => `Mèsi paske w enskri nan <strong>${t}</strong>. Plas ou rezève kounye a.`,
    details: "Detay sou enskripsyon ou an",
    nameLabel: "Non",
    certCodeLabel: "Kòd sètifika a",
    certCodeDesc:
      "Sere kòd sa a byen — se li ou pral itilize pou jenere ak pou verifye sètifika ou pita.",
    eventDateLabel: "Dat fòmasyon an",
    youtubeLabel: "Lyen YouTube (live)",
    youtubeCta: "Louvri chenn lan / rapèl",
    stepsTitle: "Etap kap vini yo",
    steps: [
      "Mete dat la nan ajanda ou pou w pa rate live la.",
      "Nan jou J, konekte sou YouTube pou w swiv fòmasyon an an dirèk.",
      "Apre fòmasyon an, ale nan paj Sètifika, mete imel ou, epi telechaje l nan lang ou vle a.",
      "Pou verifye yon sètifika (pa ou oswa yon lòt moun), itilize QR la oswa kòd la nan paj Verifye.",
    ],
    verifyCta: "Verifye yon sètifika",
    certCta: "Jenere sètifika mwen an (apre live la)",
    signOff: "Nou wè trè byento pou fòmasyon an !",
    team: "Ekip Masterclass AI",
    footer: "Si se pa ou ki te enskri, ou ka inyore imel sa a san pwoblèm.",
    dateFallback: "P'ap fèt konnen byento",
    notYet: "Ap vini",
  };
}

export function buildConfirmationEmail(props: ConfirmationEmailProps): {
  subject: string;
  html: string;
  text: string;
} {
  const c = copyByLang(props.lang);
  const training = props.trainingTitle?.trim() || DEFAULT_TRAINING;
  const subject = c.subject(training);

  const dateText = props.eventDate
    ? new Date(props.eventDate).toLocaleDateString(props.lang === "ht" ? "fr-FR" : props.lang, {
        dateStyle: "long",
      }) +
      " · " +
      new Date(props.eventDate).toLocaleTimeString(props.lang === "ht" ? "fr-FR" : props.lang, {
        hour: "2-digit",
        minute: "2-digit",
      })
    : c.dateFallback;

  const verifyUrl = `${props.origin}/verify?code=${encodeURIComponent(props.verificationId)}`;
  const certUrl = `${props.origin}/sertifika`;
  const youtube = props.youtubeLink?.trim();

  const html = `<!doctype html>
<html lang="${props.lang}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${subject}</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; padding: 0; background: #0b0820; font-family: Rajdhani, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #e9e6ff; }
  .wrap { max-width: 620px; margin: 0 auto; padding: 28px 20px; }
  .hero { border-radius: 22px; padding: 32px 28px; background: linear-gradient(135deg, #3b0764 0%, #1e1b4b 55%, #0b0820 100%); border: 1px solid rgba(168,85,247,0.35); box-shadow: 0 20px 60px -20px rgba(168,85,247,0.55); }
  .logo { display:flex; align-items:center; gap:10px; color:#e9d5ff; font-weight:700; letter-spacing:2px; text-transform:uppercase; font-size:14px; }
  .logo-badge { width:32px; height:32px; border-radius:10px; display:grid; place-items:center; background:linear-gradient(135deg,#22d3ee,#a855f7); color:#fff; font-weight:900; }
  h1 { margin:18px 0 10px; font-size: 30px; line-height:1.15; color:#faf5ff; font-weight: 900; letter-spacing: 0.5px; text-transform:uppercase;}
  .grad { background: linear-gradient(90deg,#22d3ee 0%, #c084fc 100%); -webkit-background-clip: text; background-clip:text; color: transparent;}
  p.lead { margin:0; color:#ddd6fe; font-size:17px; line-height:1.55;}
  p.lead strong { color:#fff; }
  .card { margin-top: 22px; background: #131033; border:1px solid rgba(148,163,184,0.15); border-radius:20px; padding: 22px 22px 18px;}
  .card h2 { margin:0 0 16px; font-size:15px; letter-spacing:2.5px; color:#c4b5fd; font-weight:800; text-transform:uppercase; }
  .row { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; padding:10px 0; border-bottom:1px dashed rgba(148,163,184,0.18);}
  .row:last-of-type { border-bottom: none; padding-bottom: 0;}
  .row:first-of-type { padding-top: 0;}
  .k { color:#a78bfa; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; font-weight:700;}
  .v { color:#fff; font-weight:600; font-size:16px; text-align:right; }
  .code { display:inline-block; padding:7px 12px; border-radius:10px; background:#0b0820; border:1px solid rgba(168,85,247,0.35); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing:3px; color:#f0abfc;}
  .hint { margin-top: 10px; color:#c4b5fd; font-size:13.5px; line-height:1.5;}
  .steps { margin-top: 22px;}
  .steps h2 { margin:0 0 14px; font-size:15px; letter-spacing:2.5px; color:#c4b5fd; font-weight:800; text-transform:uppercase; }
  .steps ol { margin:0; padding:0 0 0 20px; color:#ddd6fe; }
  .steps li { margin: 8px 0; font-size: 15.5px; line-height:1.55;}
  .ctas { display:flex; flex-wrap:wrap; gap: 10px; margin-top: 22px;}
  .btn { display:inline-block; padding: 12px 18px; border-radius:12px; font-weight:700; text-decoration:none; letter-spacing:0.4px;}
  .btn-primary { background:linear-gradient(90deg,#22d3ee,#a855f7); color:#0b0820; }
  .btn-secondary { background:#131033; color:#fff; border:1px solid rgba(168,85,247,0.4);}
  .sign { margin-top: 26px; color:#ddd6fe; font-size:16px; }
  .sign p { margin: 4px 0;}
  .sign .team { color:#c4b5fd; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; font-size:13px; }
  .footer { margin-top: 28px; padding: 16px 18px; color:#a5b4fc; font-size:12.5px; line-height:1.55; opacity:0.9; border-top:1px solid rgba(148,163,184,0.15); }
</style>
</head>
<body>
  <div class="wrap">
    <div class="hero">
      <div class="logo"><span class="logo-badge">AI</span> MASTERCLASS</div>
      <h1><span class="grad">${c.h1}</span></h1>
      <p class="lead">${c.hello(props.fullName)} ${c.intro(training)}</p>
    </div>

    <div class="card">
      <h2>${c.details}</h2>
      <div class="row"><div class="k">${c.nameLabel}</div><div class="v">${escapeHtml(props.fullName)}</div></div>
      <div class="row">
        <div class="k">${c.certCodeLabel}</div>
        <div class="v"><span class="code">${escapeHtml(props.verificationId)}</span></div>
      </div>
      <p class="hint">ℹ️ ${c.certCodeDesc}</p>
      <div class="row"><div class="k">${c.eventDateLabel}</div><div class="v">${escapeHtml(dateText)}</div></div>
      <div class="row">
        <div class="k">${c.youtubeLabel}</div>
        <div class="v">
          ${youtube ? `<a href="${escapeAttr(youtube)}" class="btn btn-secondary" target="_blank" rel="noopener">${c.youtubeCta}</a>` : `<span style="opacity:.8">${c.notYet}</span>`}
        </div>
      </div>
    </div>

    <div class="steps">
      <h2>${c.stepsTitle}</h2>
      <ol>
        ${c.steps.map((s) => `<li>${s}</li>`).join("")}
      </ol>
    </div>

    <div class="ctas">
      <a class="btn btn-primary" href="${escapeAttr(certUrl)}" target="_blank" rel="noopener">${c.certCta}</a>
      <a class="btn btn-secondary" href="${escapeAttr(verifyUrl)}" target="_blank" rel="noopener">${c.verifyCta}</a>
      ${youtube ? `<a class="btn btn-secondary" href="${escapeAttr(youtube)}" target="_blank" rel="noopener">${c.youtubeCta}</a>` : ""}
    </div>

    <div class="sign">
      <p>${c.signOff}</p>
      <p class="team">— ${c.team}</p>
    </div>

    <div class="footer">${c.footer}</div>
  </div>
</body>
</html>`;

  const text = `
${c.subject(training)}

${c.hello(props.fullName)}
${stripHtml(c.intro(training))}

— ${c.details} —
${c.nameLabel}: ${props.fullName}
${c.certCodeLabel}: ${props.verificationId}
   ${c.certCodeDesc}
${c.eventDateLabel}: ${dateText}
${c.youtubeLabel}: ${youtube ?? c.notYet}

— ${c.stepsTitle} —
${c.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}

${c.certCta}: ${certUrl}
${c.verifyCta}: ${verifyUrl}
${youtube ? `${c.youtubeCta}: ${youtube}` : ""}

${c.signOff}
— ${c.team}

${c.footer}
`.trim();

  return { subject, html, text };
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
function escapeAttr(str: string) {
  return escapeHtml(str);
}
function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, "");
}
