/** Download link for a CSV from /api/admin/export (a file, not a page, so a plain anchor is right). */
export function ExportLink({ type }: { type: "orders" | "customers" | "products" | "coupons" | "audit" }) {
  return (
    <a href={`/api/admin/export?type=${type}`} className="min-h-10 content-center whitespace-nowrap border border-ash px-4 text-xs text-steel hover:text-bone">
      CSV ↓
    </a>
  );
}
