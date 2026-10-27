// Shipping zones and delivery dates. Client-safe.

/** Egyptian governorates with a default shipping fee (EGP). The admin can override any of them. */
export const GOVERNORATES: Record<string, { ar: string; en: string; fee: number }> = {
  cairo: { ar: "القاهرة", en: "Cairo", fee: 70 },
  giza: { ar: "الجيزة", en: "Giza", fee: 70 },
  alexandria: { ar: "الإسكندرية", en: "Alexandria", fee: 85 },
  qalyubia: { ar: "القليوبية", en: "Qalyubia", fee: 80 },
  sharqia: { ar: "الشرقية", en: "Sharqia", fee: 90 },
  dakahlia: { ar: "الدقهلية", en: "Dakahlia", fee: 90 },
  gharbia: { ar: "الغربية", en: "Gharbia", fee: 90 },
  monufia: { ar: "المنوفية", en: "Monufia", fee: 90 },
  beheira: { ar: "البحيرة", en: "Beheira", fee: 95 },
  "kafr-el-sheikh": { ar: "كفر الشيخ", en: "Kafr El Sheikh", fee: 95 },
  damietta: { ar: "دمياط", en: "Damietta", fee: 95 },
  "port-said": { ar: "بورسعيد", en: "Port Said", fee: 95 },
  ismailia: { ar: "الإسماعيلية", en: "Ismailia", fee: 95 },
  suez: { ar: "السويس", en: "Suez", fee: 95 },
  faiyum: { ar: "الفيوم", en: "Faiyum", fee: 100 },
  "beni-suef": { ar: "بني سويف", en: "Beni Suef", fee: 100 },
  minya: { ar: "المنيا", en: "Minya", fee: 110 },
  asyut: { ar: "أسيوط", en: "Asyut", fee: 115 },
  sohag: { ar: "سوهاج", en: "Sohag", fee: 120 },
  qena: { ar: "قنا", en: "Qena", fee: 125 },
  luxor: { ar: "الأقصر", en: "Luxor", fee: 125 },
  aswan: { ar: "أسوان", en: "Aswan", fee: 130 },
  "red-sea": { ar: "البحر الأحمر", en: "Red Sea", fee: 130 },
  "new-valley": { ar: "الوادي الجديد", en: "New Valley", fee: 140 },
  matrouh: { ar: "مطروح", en: "Matrouh", fee: 130 },
  "north-sinai": { ar: "شمال سيناء", en: "North Sinai", fee: 140 },
  "south-sinai": { ar: "جنوب سيناء", en: "South Sinai", fee: 140 },
};

/** Default international fee (EGP) by region; Gulf and Arab countries ship cheaper than far markets. */
export function defaultIntlFee(code: string): number {
  if (["SA", "AE", "KW", "QA", "BH", "OM", "JO", "LB", "IQ"].includes(code)) return 1_200;
  if (["MA", "DZ", "TN", "LY", "SD", "TR"].includes(code)) return 1_500;
  return 2_200;
}

/** Earliest delivery date: two business days after `from` (Friday is the weekend in Egypt). */
export function earliestDelivery(from = new Date()): Date {
  const d = new Date(from);
  d.setHours(12, 0, 0, 0);
  let added = 0;
  while (added < 2) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 5) added++;
  }
  return d;
}

export const toDateInput = (d: Date) => d.toISOString().slice(0, 10);
