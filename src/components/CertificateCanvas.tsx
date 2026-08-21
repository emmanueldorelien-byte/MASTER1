import { useCallback, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { CERT_COPY, type CertLang } from "@/lib/certificate-copy";

export type CertData = {
  name: string;
  lang: CertLang;
  date: Date;
  verificationId: string;
  verificationUrl?: string;
  courseTitle?: string;
  signerName?: string;
};

const W = 1600;
const H = 1130;

const GOLD = "#c9a227";
const GOLD_LIGHT = "#e8cf7a";
const INK = "#1b1832";
const INK_SOFT = "#5a5478";

function fitFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  family: string,
  weight: string,
  maxSize: number,
  maxWidth: number,
) {
  let size = maxSize;
  do {
    ctx.font = `${weight} ${size}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 2;
  } while (size > 18);
  return size;
}

function drawStatic(
  ctx: CanvasRenderingContext2D,
  data: CertData,
  copy: ReturnType<typeof getCopy>,
) {
  const cx = W / 2;

  // Paper
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#fffdf7");
  bg.addColorStop(0.5, "#fbf7ec");
  bg.addColorStop(1, "#f6f1e2");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Corner glow ornaments
  const corners: [number, number][] = [
    [0, 0],
    [W, 0],
    [0, H],
    [W, H],
  ];
  for (const [cornerX, cornerY] of corners) {
    const g = ctx.createRadialGradient(cornerX, cornerY, 0, cornerX, cornerY, 420);
    g.addColorStop(0, "rgba(201,162,39,0.16)");
    g.addColorStop(1, "rgba(201,162,39,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  // Golden borders
  const outer = ctx.createLinearGradient(0, 0, W, H);
  outer.addColorStop(0, GOLD);
  outer.addColorStop(0.5, GOLD_LIGHT);
  outer.addColorStop(1, GOLD);
  ctx.strokeStyle = outer;
  ctx.lineWidth = 12;
  ctx.strokeRect(34, 34, W - 68, H - 68);
  ctx.lineWidth = 2;
  ctx.strokeRect(58, 58, W - 116, H - 116);
  ctx.strokeStyle = "rgba(201,162,39,0.5)";
  ctx.lineWidth = 1;
  ctx.strokeRect(70, 70, W - 140, H - 140);

  // Corner diamonds
  ctx.fillStyle = GOLD;
  const diamonds: [number, number][] = [
    [58, 58],
    [W - 58, 58],
    [58, H - 58],
    [W - 58, H - 58],
  ];
  for (const [dx, dy] of diamonds) {
    ctx.save();
    ctx.translate(dx, dy);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-9, -9, 18, 18);
    ctx.restore();
  }

  ctx.textAlign = "center";

  // Organisation
  ctx.fillStyle = INK_SOFT;
  ctx.font = "600 26px Rajdhani, sans-serif";
  ctx.letterSpacing = "10px";
  ctx.fillText(copy.org.toUpperCase(), cx, 168);
  ctx.letterSpacing = "0px";

  // Small monogram
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 250, 196);
  ctx.lineTo(cx - 30, 196);
  ctx.moveTo(cx + 30, 196);
  ctx.lineTo(cx + 250, 196);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, 196, 12, 0, Math.PI * 2);
  ctx.stroke();

  // Title
  const titleSize = fitFont(ctx, copy.title, "Cinzel, serif", "700", 78, W - 340);
  ctx.fillStyle = INK;
  ctx.font = `700 ${titleSize}px Cinzel, serif`;
  ctx.fillText(copy.title, cx, 300);

  // Intro
  ctx.fillStyle = INK_SOFT;
  ctx.font = "400 30px Rajdhani, sans-serif";
  ctx.fillText(copy.intro, cx, 372);

  // Name
  const name = data.name.trim() || "—";
  const nameSize = fitFont(ctx, name, "Cinzel, serif", "600", 82, W - 400);
  ctx.fillStyle = "#2a1f5c";
  ctx.font = `600 ${nameSize}px Cinzel, serif`;
  ctx.fillText(name, cx, 470);

  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 420, 508);
  ctx.lineTo(cx + 420, 508);
  ctx.stroke();

  // Body
  ctx.fillStyle = INK_SOFT;
  ctx.font = "400 30px Rajdhani, sans-serif";
  ctx.fillText(copy.body, cx, 566);

  // Course
  const courseText =
    data.courseTitle && data.courseTitle.trim() ? data.courseTitle.trim() : copy.course;
  const courseSize = fitFont(ctx, courseText, "Rajdhani, sans-serif", "700", 40, W - 380);
  ctx.fillStyle = INK;
  ctx.font = `700 ${courseSize}px Rajdhani, sans-serif`;
  ctx.fillText(courseText, cx, 624);

  ctx.fillStyle = INK_SOFT;
  ctx.font = "500 24px Rajdhani, sans-serif";
  ctx.fillText(
    `100% online · Live · ${data.date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })}`,
    cx,
    668,
  );

  // Seal (moved up to accommodate QR + code at bottom)
  const sx = cx;
  const sy = 790;
  const sealGrad = ctx.createLinearGradient(sx - 80, sy - 80, sx + 80, sy + 80);
  sealGrad.addColorStop(0, GOLD_LIGHT);
  sealGrad.addColorStop(1, GOLD);
  ctx.fillStyle = sealGrad;
  ctx.beginPath();
  ctx.arc(sx, sy, 78, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#fffdf7";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(sx, sy, 64, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#41320a";
  ctx.font = "700 34px Cinzel, serif";
  ctx.fillText("AI", sx, sy - 2);
  ctx.font = "600 15px Rajdhani, sans-serif";
  ctx.fillText("MASTERCLASS", sx, sy + 30);

  // Left column: date
  ctx.textAlign = "left";
  const leftX = 170;
  ctx.strokeStyle = "rgba(90,84,120,0.5)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(leftX, 900);
  ctx.lineTo(leftX + 330, 900);
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.font = "600 30px Rajdhani, sans-serif";
  ctx.fillText(data.date.toLocaleDateString(copy.locale, { dateStyle: "long" }), leftX, 890);
  ctx.fillStyle = INK_SOFT;
  ctx.font = "500 20px Rajdhani, sans-serif";
  ctx.fillText(copy.dateLabel.toUpperCase(), leftX, 930);
}

function drawQrSection(
  ctx: CanvasRenderingContext2D,
  qrImg: HTMLImageElement | null,
  data: CertData,
  copy: ReturnType<typeof getCopy>,
) {
  const rightX = W - 170;
  const qrSize = 180;
  const qrX = rightX - qrSize;
  const qrY = 738;

  // Signature above QR — rendered as a handwritten-style signature
  // resembling the administrator's own name with cursive flow.
  const signer = data.signerName?.trim() || "J. Baptiste";
  const sigAnchorX = rightX - 210;
  const sigBaselineY = 884;
  drawSignatureStyleName(ctx, signer, sigAnchorX, sigBaselineY, "right");

  ctx.textAlign = "right";
  ctx.strokeStyle = "rgba(90,84,120,0.5)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(rightX - 330, 904);
  ctx.lineTo(rightX - 210, 904);
  ctx.stroke();
  ctx.fillStyle = INK_SOFT;
  ctx.font = "500 18px Rajdhani, sans-serif";
  ctx.fillText(copy.signature.toUpperCase(), rightX - 210, 932);

  // QR frame
  const framePad = 10;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(qrX - framePad, qrY - framePad, qrSize + framePad * 2, qrSize + framePad * 2);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.strokeRect(qrX - framePad, qrY - framePad, qrSize + framePad * 2, qrSize + framePad * 2);

  // QR image
  if (qrImg) {
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
  } else {
    ctx.fillStyle = "#00000008";
    ctx.fillRect(qrX, qrY, qrSize, qrSize);
    ctx.fillStyle = INK_SOFT;
    ctx.textAlign = "center";
    ctx.font = "500 16px Rajdhani, sans-serif";
    ctx.fillText("QR...", qrX + qrSize / 2, qrY + qrSize / 2 + 6);
  }

  // QR caption
  ctx.textAlign = "center";
  ctx.fillStyle = INK;
  ctx.font = "600 16px Rajdhani, sans-serif";
  ctx.fillText(copy.qrLabel, qrX + qrSize / 2, qrY + qrSize + 32);
  ctx.fillStyle = INK_SOFT;
  ctx.font = "500 14px Rajdhani, sans-serif";
  ctx.fillText(copy.qrSub, qrX + qrSize / 2, qrY + qrSize + 54);

  // Verification code (big, bottom center)
  const cx = W / 2;
  ctx.textAlign = "center";
  ctx.fillStyle = INK_SOFT;
  ctx.font = "600 18px Rajdhani, sans-serif";
  ctx.letterSpacing = "4px";
  ctx.fillText(copy.idLabel.toUpperCase(), cx, 1020);
  ctx.letterSpacing = "0px";

  ctx.fillStyle = "#2a1f5c";
  ctx.font = "700 30px Rajdhani, monospace";
  ctx.letterSpacing = "5px";
  ctx.fillText(data.verificationId, cx, 1062);
  ctx.letterSpacing = "0px";

  ctx.fillStyle = "rgba(90,84,120,0.55)";
  ctx.font = "500 14px Rajdhani, sans-serif";
  if (data.verificationUrl) {
    ctx.fillText(data.verificationUrl.replace(/^https?:\/\//, ""), cx, 1095);
  }
}

function drawSignatureStyleName(
  ctx: CanvasRenderingContext2D,
  name: string,
  anchorX: number,
  baseY: number,
  align: "left" | "center" | "right" = "left",
) {
  // Authentic handwritten SIGNATURE (rubric), NOT a legible "clarification" name.
  // A real signature is deliberately stylised, slanted, partially illegible:
  //   • Large decorative capital swash for the first initial,
  //   • A single flowing stroke for the rest of the first name (letters merged),
  //   • Another stylised initial for the surname,
  //   • A long sweeping underline/termination flourish that doubles as the
  //     signatory stroke.
  // The overall shape is DERIVED from the provided name letters/initials so
  // every admin produces a distinct, consistent but illegible signature.

  const ink = "#2a1f5c";
  const slant = -0.38; // forward lean
  const unit = 26; // base letter unit
  const tokens = name
    .trim()
    .split(/\s+/)
    .filter((s) => s.length > 0);
  if (tokens.length === 0) tokens.push("X");

  const firstToken = tokens[0]!;
  const lastToken = tokens.length > 1 ? tokens[tokens.length - 1]! : firstToken;

  const firstInitial = firstToken[0]?.toUpperCase() ?? "E";
  const lastInitial = lastToken[0]?.toUpperCase() ?? "D";

  // Build a deterministic-but-seemingly-random shape from the name letters
  // (so the same name always renders the identical signature).
  function hash(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }
  const h = hash(name);
  const r1 = ((h >> 0) & 0xff) / 255; // 0..1
  const r2 = ((h >> 8) & 0xff) / 255;
  const r3 = ((h >> 16) & 0xff) / 255;

  // Total signature width (driven by name length).
  const width = 340 + Math.min(120, tokens.join("").length * 7);

  let originX = 0;
  if (align === "right") originX = -width;
  else if (align === "center") originX = -width / 2;

  ctx.save();
  ctx.translate(anchorX, baseY);
  ctx.transform(1, 0, Math.sin(slant), 1, 0, 0);
  ctx.translate(originX, 0);

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // -------- First-name initial large decorative swash --------
  const firstCapHeight = unit * (1.9 + r1 * 0.6);
  ctx.strokeStyle = ink;
  ctx.lineWidth = 3.2;

  // Upstroke & loop of E-like capital (general swash for A..Z)
  const cx1 = unit * 0.4;
  ctx.beginPath();
  ctx.moveTo(cx1 - unit * 0.3, unit * 0.15);
  // Upstroke to top loop
  ctx.bezierCurveTo(
    cx1 - unit * 0.4,
    -firstCapHeight * 0.55,
    cx1 + unit * 0.1,
    -firstCapHeight * 1.15,
    cx1 + unit * 0.9,
    -firstCapHeight * 0.55,
  );
  // Down into baseline & little tail right
  ctx.bezierCurveTo(
    cx1 + unit * 1.6,
    -firstCapHeight * 0.1,
    cx1 + unit * 0.8,
    unit * 0.2,
    cx1 + unit * 1.9,
    unit * 0.05,
  );
  // Horizontal middle bar (E / generic)
  ctx.moveTo(cx1 - unit * 0.2, -firstCapHeight * 0.25);
  ctx.bezierCurveTo(
    cx1 + unit * 0.5,
    -firstCapHeight * 0.18,
    cx1 + unit * 1.1,
    -firstCapHeight * 0.28,
    cx1 + unit * 1.6,
    -firstCapHeight * 0.12,
  );
  ctx.stroke();

  // Shadow / second stroke on the capital so it reads "inked"
  ctx.strokeStyle = "rgba(42,31,92,0.55)";
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(cx1 - unit * 0.3, unit * 0.15);
  ctx.bezierCurveTo(
    cx1 - unit * 0.4,
    -firstCapHeight * 0.55,
    cx1 + unit * 0.1,
    -firstCapHeight * 1.15,
    cx1 + unit * 0.9,
    -firstCapHeight * 0.55,
  );
  ctx.bezierCurveTo(
    cx1 + unit * 1.6,
    -firstCapHeight * 0.1,
    cx1 + unit * 0.8,
    unit * 0.2,
    cx1 + unit * 1.9,
    unit * 0.05,
  );
  ctx.stroke();

  // -------- Flowing connected scribble for the rest of the first name --------
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2.4;

  const firstStartX = cx1 + unit * 1.9;
  const firstEndX = firstStartX + unit * 4.2;
  ctx.beginPath();
  ctx.moveTo(firstStartX, unit * 0.05);
  // A series of fast up-down meanders (merged letters — illegible)
  const bumps = 5 + (((h >> 4) & 0b11) % 2); // 5 or 6
  const stepX = (firstEndX - firstStartX) / bumps;
  let penX = firstStartX;
  let penY = unit * 0.05;
  for (let i = 0; i < bumps; i++) {
    const nextX = firstStartX + stepX * (i + 1);
    const peak = -(unit * 0.45) - ((i * (h & 0b11)) % 3) * 2;
    const valley = unit * (0.25 + ((i * 3 + (r2 * 5) | 0) % 3) * 0.1);
    ctx.bezierCurveTo(
      penX + stepX * 0.25,
      peak,
      penX + stepX * 0.55,
      valley,
      nextX,
      (i % 2 === 0 ? 0 : -0.08) * unit,
    );
    penX = nextX;
    penY = (i % 2 === 0 ? 0 : -0.08) * unit;
  }
  ctx.stroke();

  // -------- Surname stylised initial (second big capital) --------
  const dCx = firstEndX + unit * 0.9;
  const secondCapHeight = unit * (1.4 + r3 * 0.5);

  ctx.strokeStyle = ink;
  ctx.lineWidth = 3.0;
  ctx.beginPath();
  // Vertical stem of "D" (or generic capital)
  ctx.moveTo(dCx, -secondCapHeight * 0.75);
  ctx.bezierCurveTo(
    dCx - unit * 0.05,
    -secondCapHeight * 0.1,
    dCx + unit * 0.02,
    unit * 0.1,
    dCx,
    unit * 0.22,
  );
  // Bowl of D (right arc)
  ctx.moveTo(dCx, -secondCapHeight * 0.75);
  ctx.bezierCurveTo(
    dCx + unit * 1.35,
    -secondCapHeight * 0.7,
    dCx + unit * 1.55,
    unit * 0.0,
    dCx + unit * 0.05,
    unit * 0.22,
  );
  ctx.stroke();

  // Soft inner shadow of the capital bowl
  ctx.strokeStyle = "rgba(42,31,92,0.5)";
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(dCx + unit * 0.1, -secondCapHeight * 0.55);
  ctx.bezierCurveTo(
    dCx + unit * 1.0,
    -secondCapHeight * 0.5,
    dCx + unit * 1.2,
    -unit * 0.02,
    dCx + unit * 0.15,
    unit * 0.14,
  );
  ctx.stroke();

  // -------- Illegible surname tail (meanders ending in a big flourish) --------
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2.3;

  const tailStartX = dCx + unit * 1.55;
  const tailEndX = width - unit * 0.4;
  ctx.beginPath();
  ctx.moveTo(tailStartX, unit * 0.18);
  const tailBumps = 4 + (((h >> 10) & 0b11) % 3); // 4..6
  const tStepX = (tailEndX - tailStartX) / tailBumps;
  for (let i = 0; i < tailBumps; i++) {
    const nx = tailStartX + tStepX * (i + 1);
    const pk = -unit * (0.25 + ((i + (r1 * 5) | 0) % 2) * 0.15);
    const vy = unit * (0.35 + ((i * 2 + (r2 * 7) | 0) % 2) * 0.12);
    ctx.bezierCurveTo(
      tailStartX + tStepX * i + tStepX * 0.2,
      pk,
      tailStartX + tStepX * i + tStepX * 0.55,
      vy,
      nx,
      (i % 2 === 0 ? 0.05 : 0.2) * unit,
    );
  }
  ctx.stroke();

  // -------- Descender loop (little curl under the surname) --------
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  const loopCx = dCx + unit * 0.9;
  const loopTop = unit * 0.18;
  ctx.moveTo(loopCx - unit * 0.2, loopTop);
  ctx.bezierCurveTo(
    loopCx - unit * 0.6,
    unit * 0.9,
    loopCx + unit * 0.9,
    unit * 1.05,
    loopCx + unit * 0.35,
    unit * 0.3,
  );
  ctx.stroke();

  // -------- Long sweeping underline / terminating flourish --------
  // Starts under the first capital, ends far to the right (single line).
  const uStartX = -unit * 0.2;
  const uEndX = width + unit * 0.8;
  const uY1 = unit * 0.62;
  const uY2 = unit * 0.95;

  ctx.strokeStyle = ink;
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.moveTo(uStartX, uY1);
  // Gentle wave dipping down in the middle, then sweeping up and back down
  ctx.bezierCurveTo(
    uStartX + (uEndX - uStartX) * 0.18,
    uY2 - unit * 0.05,
    uStartX + (uEndX - uStartX) * 0.38,
    uY1 + unit * 0.2,
    uStartX + (uEndX - uStartX) * 0.62,
    uY2 - unit * 0.12,
  );
  ctx.bezierCurveTo(
    uStartX + (uEndX - uStartX) * 0.82,
    uY1 + unit * 0.35,
    uStartX + (uEndX - uStartX) * 0.95,
    uY2 - unit * 0.02,
    uEndX,
    uY1 + unit * 0.08,
  );
  ctx.stroke();

  // Second lighter parallel line (classic double-stroke signature underline)
  ctx.strokeStyle = "rgba(42,31,92,0.5)";
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(uStartX + unit * 0.2, uY1 + unit * 0.12);
  ctx.bezierCurveTo(
    uStartX + (uEndX - uStartX) * 0.2,
    uY2 - unit * 0.0,
    uStartX + (uEndX - uStartX) * 0.55,
    uY1 + unit * 0.35,
    uEndX - unit * 0.2,
    uY1 + unit * 0.22,
  );
  ctx.stroke();

  // -------- Tiny dot at the end (signatory punctuation) --------
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.arc(uEndX - unit * 0.1, uY1 + unit * 0.02, 1.9, 0, Math.PI * 2);
  ctx.fill();

  // -------- Fine squiggle on top of the first initial (swash crown) --------
  ctx.strokeStyle = ink;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(cx1 - unit * 0.15, -firstCapHeight * 0.95);
  ctx.bezierCurveTo(
    cx1 - unit * 0.6,
    -firstCapHeight * 1.45,
    cx1 - unit * 1.8,
    -firstCapHeight * 1.35,
    cx1 - unit * 1.55,
    -firstCapHeight * 0.8,
  );
  ctx.stroke();

  ctx.restore();
}

function getCopy(lang: CertLang) {
  return CERT_COPY[lang];
}

export async function drawCertificate(canvas: HTMLCanvasElement, data: CertData) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const copy = getCopy(data.lang);
  canvas.width = W;
  canvas.height = H;

  drawStatic(ctx, data, copy);

  let qrImg: HTMLImageElement | null = null;
  const url = data.verificationUrl ?? buildDefaultVerifyUrl(data.verificationId);
  try {
    const qrDataUrl = await QRCode.toDataURL(url, {
      margin: 1,
      width: 360,
      color: { dark: "#1b1832", light: "#ffffff" },
      errorCorrectionLevel: "M",
    });
    qrImg = await loadImage(qrDataUrl);
  } catch {
    qrImg = null;
  }

  drawQrSection(ctx, qrImg, data, copy);
}

function buildDefaultVerifyUrl(verificationId: string): string {
  try {
    if (typeof window !== "undefined" && window.location?.origin) {
      return `${window.location.origin}/verify?code=${encodeURIComponent(verificationId)}`;
    }
  } catch {
    /* ignore */
  }
  try {
    const loc =
      (typeof globalThis !== "undefined" && (globalThis as { location?: Location }).location) ||
      undefined;
    if (loc?.origin) {
      return `${loc.origin}/verify?code=${encodeURIComponent(verificationId)}`;
    }
  } catch {
    /* ignore */
  }
  return `https://example.com/verify?code=${encodeURIComponent(verificationId)}`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function CertificateCanvas({
  data,
  className,
  canvasRef: externalRef,
}: {
  data: CertData;
  className?: string;
  canvasRef?: { current: HTMLCanvasElement | null };
}) {
  const localRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRef = externalRef ?? localRef;

  const render = useCallback(async () => {
    if (!canvasRef.current) return;
    await drawCertificate(canvasRef.current, data);
  }, [data]);

  useEffect(() => {
    let cancelled = false;
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    const run = () => {
      if (cancelled) return;
      render().catch(() => undefined);
    };
    if (fonts) {
      Promise.all([
        fonts.load("700 78px Cinzel"),
        fonts.load("600 30px Rajdhani"),
        fonts.load("700 40px Rajdhani"),
      ])
        .then(run)
        .catch(run);
    } else {
      run();
    }
    return () => {
      cancelled = true;
    };
  }, [render]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-label="Prévizualizasyon sètifika"
      role="img"
    />
  );
}

export function downloadCertificate(canvas: HTMLCanvasElement, verificationId: string) {
  const url = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = `sertifika-${verificationId}.png`;
  a.click();
}

export function printCertificate(canvas: HTMLCanvasElement) {
  const url = canvas.toDataURL("image/png");
  const win = window.open("", "_blank");
  if (!win) return false;
  win.document.write(
    `<!doctype html><title>Sètifika</title><style>@page{size:landscape;margin:0}body{margin:0}img{width:100%}</style><img src="${url}" onload="window.print()">`,
  );
  win.document.close();
  return true;
}
