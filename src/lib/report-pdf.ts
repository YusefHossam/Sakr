import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";
import { REPORT_TZ, type ReportData } from "./admin-data";

const INK = rgb(0.04, 0.04, 0.04);
const STEEL = rgb(0.42, 0.42, 0.42);
const RULE = rgb(0.82, 0.82, 0.82);
const BLOOD = rgb(0.61, 0.07, 0.12);
const egp = (n: number) => `${Math.round(n).toLocaleString("en")} EGP`;
// Helvetica only covers WinAnsi; anything else (Arabic, arrows, CJK) would throw, so swap those characters out.
const ansi = (s: string) => s.replace(/[^ -~ -ÿ‘’“”–—•…]/g, "?");

/** Sales report PDF (A4, English: pdf-lib can't shape Arabic) with the SAKR gothic logo (BR-64). */
export async function buildReportPdf(r: ReportData, kind: "month" | "year"): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const gothic = await pdf.embedFont(await readFile(path.join(process.cwd(), "src/assets/fonts/UnifrakturMaguntia-Book.ttf")));
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  pdf.setTitle(`SAKR ${kind === "month" ? "monthly" : "yearly"} report — ${r.title}`);
  pdf.setAuthor("SAKR");

  let page = pdf.addPage([595, 842]);
  let y = 0;
  const M = 48;
  const W = 595 - M * 2;

  const header = (p: PDFPage) => {
    p.drawRectangle({ x: 0, y: 842 - 110, width: 595, height: 110, color: INK });
    p.drawText("Sakr", { x: M, y: 842 - 78, size: 54, font: gothic, color: rgb(0.85, 0.85, 0.85) });
    const label = kind === "month" ? "MONTHLY SALES REPORT" : "YEARLY SALES REPORT";
    p.drawText(label, { x: 595 - M - bold.widthOfTextAtSize(label, 10), y: 842 - 52, size: 10, font: bold, color: rgb(0.7, 0.7, 0.7) });
    p.drawText(r.title, { x: 595 - M - bold.widthOfTextAtSize(r.title, 20), y: 842 - 80, size: 20, font: bold, color: rgb(0.95, 0.95, 0.95) });
    y = 842 - 140;
  };
  const ensure = (needed: number) => {
    if (y - needed < 60) {
      page = pdf.addPage([595, 842]);
      header(page);
    }
  };
  const text = (s: string, x: number, size = 10, font: PDFFont = sans, color = INK) => page.drawText(ansi(s), { x, y, size, font, color });
  const heading = (s: string) => {
    ensure(40);
    y -= 10;
    text(s.toUpperCase(), M, 11, bold);
    y -= 8;
    page.drawLine({ start: { x: M, y }, end: { x: M + W, y }, thickness: 0.8, color: RULE });
    y -= 16;
  };
  const table = (cols: { label: string; width: number; align?: "right" }[], rows: string[][]) => {
    ensure(20);
    let x = M;
    for (const c of cols) {
      const w = sans.widthOfTextAtSize(c.label, 8);
      text(c.label, c.align === "right" ? x + c.width - w : x, 8, bold, STEEL);
      x += c.width;
    }
    y -= 14;
    for (const row of rows) {
      ensure(16);
      x = M;
      row.forEach((cell, i) => {
        const c = cols[i];
        const clipped = ansi(cell.length > 60 ? `${cell.slice(0, 57)}…` : cell);
        const w = sans.widthOfTextAtSize(clipped, 9);
        text(clipped, c.align === "right" ? x + c.width - w : x, 9);
        x += c.width;
      });
      y -= 14;
    }
    y -= 6;
  };

  header(page);
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: REPORT_TZ, year: "numeric", month: "2-digit", day: "2-digit" });
  const stamp = new Intl.DateTimeFormat("en-CA", { timeZone: REPORT_TZ, dateStyle: "short", timeStyle: "short", hourCycle: "h23" });
  text(`${day.format(r.from)} to ${day.format(new Date(r.to.getTime() - 1))}   ·   generated ${stamp.format(new Date())} Cairo`, M, 9, sans, STEEL);
  y -= 30;

  // Headline numbers.
  const kpis: [string, string][] = [
    ["Revenue", egp(r.totals.revenue)],
    ["Profit", egp(r.totals.profit)],
    ["Orders", r.totals.orders.toLocaleString("en")],
    ["Average order", egp(r.totals.avg)],
  ];
  const boxW = (W - 3 * 10) / 4;
  kpis.forEach(([label, value], i) => {
    const x = M + i * (boxW + 10);
    page.drawRectangle({ x, y: y - 46, width: boxW, height: 56, borderColor: RULE, borderWidth: 0.8 });
    page.drawText(label.toUpperCase(), { x: x + 8, y: y - 6, size: 7, font: bold, color: STEEL });
    page.drawText(value, { x: x + 8, y: y - 30, size: 13, font: bold, color: i === 1 ? BLOOD : INK });
  });
  y -= 70;
  text(`Cost of goods ${egp(r.totals.cost)}   ·   Discounts given ${egp(r.discounts)}   ·   Shipping collected ${egp(r.shipping)}`, M, 9, sans, STEEL);
  y -= 20;

  heading(kind === "month" ? "Sales by day" : "Sales by month");
  const max = Math.max(1, ...r.byBucket.map((b) => b.revenue));
  ensure(130);
  const chartH = 100;
  const barW = W / Math.max(r.byBucket.length, 1);
  r.byBucket.forEach((b, i) => {
    const h = (b.revenue / max) * chartH;
    page.drawRectangle({ x: M + i * barW + 1, y: y - chartH, width: Math.max(barW - 2, 1), height: Math.max(h, 0.5), color: INK });
    if (r.byBucket.length <= 12 || i % 3 === 0) page.drawText(b.label, { x: M + i * barW + 1, y: y - chartH - 10, size: 6, font: sans, color: STEEL });
  });
  page.drawLine({ start: { x: M, y: y - chartH }, end: { x: M + W, y: y - chartH }, thickness: 0.6, color: RULE });
  y -= chartH + 26;

  heading("Best sellers");
  table(
    [{ label: "PRODUCT", width: W * 0.55 }, { label: "BRAND", width: W * 0.2 }, { label: "QTY", width: W * 0.08, align: "right" }, { label: "REVENUE", width: W * 0.17, align: "right" }],
    r.topProducts.map((p) => [p.title, p.brand, String(p.qty), egp(p.revenue)]),
  );
  heading("Brands");
  table(
    [{ label: "BRAND", width: W * 0.6 }, { label: "QTY", width: W * 0.15, align: "right" }, { label: "REVENUE", width: W * 0.25, align: "right" }],
    r.topBrands.map((b) => [b.brand, String(b.qty), egp(b.revenue)]),
  );
  heading("Payment methods");
  table(
    [{ label: "METHOD", width: W * 0.6 }, { label: "ORDERS", width: W * 0.15, align: "right" }, { label: "REVENUE", width: W * 0.25, align: "right" }],
    r.byPayment.map((p) => [p.method === "cod" ? "Cash on delivery" : p.method === "card" ? "Card (Paymob)" : "InstaPay / wallet transfer", String(p.orders), egp(p.revenue)]),
  );
  if (r.coupons.length) {
    heading("Coupons used");
    table(
      [{ label: "CODE", width: W * 0.6 }, { label: "ORDERS", width: W * 0.15, align: "right" }, { label: "DISCOUNT", width: W * 0.25, align: "right" }],
      r.coupons.map((c) => [c.code, String(c.orders), egp(c.discount)]),
    );
  }

  // Footer on every page.
  pdf.getPages().forEach((p, i, all) => {
    p.drawText(`SAKR · Cairo · page ${i + 1} of ${all.length}`, { x: M, y: 30, size: 8, font: sans, color: STEEL });
  });
  return pdf.save();
}
