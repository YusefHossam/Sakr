import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { ProductCard as Card } from "@/lib/catalog";
import { LAST_PIECES_DISCOUNT } from "@/lib/pricing";
import { Price } from "./price";

export function ProductCard({ product, priority = false }: { product: Card; priority?: boolean }) {
  const t = useTranslations("common");
  return (
    <Link href={`/product/${product.slug}`} className="group flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden bg-tile">
        {product.image && (
          // eslint-disable-next-line @next/next/no-img-element -- remote CDN images, already resized
          <img
            src={product.image}
            alt={product.title}
            loading={priority ? "eager" : "lazy"}
            className="size-full object-contain p-4 mix-blend-multiply grayscale-[30%] transition duration-500 group-hover:scale-105 group-hover:grayscale-0"
          />
        )}
        {product.salePrice != null && (
          <span className="absolute start-2 top-2 bg-blood px-2 py-0.5 font-display text-xs tracking-wider text-chrome" dir="ltr">
            -{Math.round(LAST_PIECES_DISCOUNT * 100)}%
          </span>
        )}
        {product.piecesLeft != null && (
          <span className="absolute inset-x-0 bottom-0 bg-ink/80 py-1 text-center text-[11px] tracking-wide text-bone">
            {t("lastPieces", { count: product.piecesLeft })}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-[11px] tracking-[0.2em] text-dust uppercase" dir="ltr">{product.brand}</p>
        <p className="line-clamp-2 text-sm text-steel transition-colors group-hover:text-bone" dir="ltr">{product.title}</p>
        <Price price={product.price} salePrice={product.salePrice} />
      </div>
    </Link>
  );
}
