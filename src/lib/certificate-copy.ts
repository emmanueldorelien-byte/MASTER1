export type CertLang = "ht" | "fr" | "es" | "en";

export const CERT_LANGS: { value: CertLang; label: string; title: string }[] = [
  { value: "ht", label: "Kreyòl Ayisyen", title: "Sètifika Patisipasyon" },
  { value: "fr", label: "Fransè", title: "Certificat de Participation" },
  { value: "es", label: "Panyòl", title: "Certificado de Participación" },
  { value: "en", label: "Anglè", title: "Certificate of Participation" },
];

type Copy = {
  title: string;
  intro: string;
  body: string;
  courseLabel: string;
  course: string;
  dateLabel: string;
  idLabel: string;
  qrLabel: string;
  qrSub: string;
  signature: string;
  org: string;
  locale: string;
};

export const CERT_COPY: Record<CertLang, Copy> = {
  ht: {
    title: "Sètifika Patisipasyon",
    intro: "Sa a se pou sètifye ke",
    body: "te patisipe nan masterclass sou entèlijans atifisyèl la",
    courseLabel: "Fòmasyon",
    course: "Masterclass AI — Kreye Kontni & Fè Aplikasyon",
    dateLabel: "Dat",
    idLabel: "Kòd verifikasyon",
    qrLabel: "Verifye otantisite",
    qrSub: "Eskane QR la",
    signature: "PDG MASTERCLASS",
    org: "Akademi AI Ayiti",
    locale: "fr-FR",
  },
  fr: {
    title: "Certificat de Participation",
    intro: "Il est certifié que",
    body: "a participé à la masterclass sur l'intelligence artificielle",
    courseLabel: "Formation",
    course: "Masterclass AI — Création de contenu & d'applications",
    dateLabel: "Date",
    idLabel: "Code de vérification",
    qrLabel: "Vérifier l'authenticité",
    qrSub: "Scannez le QR",
    signature: "PDG MASTERCLASS",
    org: "Académie AI Haïti",
    locale: "fr-FR",
  },
  es: {
    title: "Certificado de Participación",
    intro: "Se certifica que",
    body: "participó en la masterclass de inteligencia artificial",
    courseLabel: "Formación",
    course: "Masterclass AI — Creación de contenido y aplicaciones",
    dateLabel: "Fecha",
    idLabel: "Código de verificación",
    qrLabel: "Verificar autenticidad",
    qrSub: "Escanea el QR",
    signature: "PDG MASTERCLASS",
    org: "Academia AI Haití",
    locale: "es-ES",
  },
  en: {
    title: "Certificate of Participation",
    intro: "This certifies that",
    body: "has participated in the artificial intelligence masterclass",
    courseLabel: "Program",
    course: "Masterclass AI — Content & App Creation",
    dateLabel: "Date",
    idLabel: "Verification Code",
    qrLabel: "Verify authenticity",
    qrSub: "Scan the QR",
    signature: "PDG MASTERCLASS",
    org: "AI Academy Haiti",
    locale: "en-US",
  },
};
