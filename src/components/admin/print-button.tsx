"use client";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="self-start border border-black px-4 py-2 text-xs tracking-widest uppercase print:hidden">
      Print
    </button>
  );
}
