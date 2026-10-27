# Sakr Store — Requirements (draft v0.2)

_Last updated: 2026-10-27 — full BRD: https://claude.ai/artifact/9MLN7XFoE8EF2by3uDreKW_

Men's clothing store. Arabic (RTL) + English. Stack: **Next.js 16 + MongoDB**.
Look & feel: **black & white minimal** (sn2studios vibe).

## Confirmed decisions

| # | Topic | Decision |
|---|---|---|
| 1 | Brand | **Sakr Store** |
| 2 | Intro | ~2s animated intro with the Sakr logo — edgy/streetwear (glitch / falcon slash), skippable, shown once per session. |
| 3 | Hero background | AI-generated realistic videos of models (desert / space scenes), each in a different outfit. Random set on every visit. Dark translucent overlay (blur + grain). Background is decorative only (no hover/click on models). |
| 4 | Music | Embedded Spotify player (Central Cee + The Weeknd playlist), muted by default, toggle button. See note on licensing. |
| 5 | Login | Browsing open. Login / sign-up required when adding to cart. |
| 6 | Payments (v1) | Transfer (InstaPay / Vodafone Cash / any e-wallet / bank) + screenshot upload; cash on delivery. Mastercard & Apple Pay icons shown — card option marked "coming soon" until a gateway is connected. |
| 7 | Shipping | Price per Egyptian governorate (editable in admin — can be set equal for all). International: price per country/zone. |
| 8 | Discounts | Coupon codes (general + per-influencer). Influencer sales report. |
| 9 | Loyalty | Points per order, redeemable as discount. |
| 10 | Drops | Upcoming collection page with countdown; "notify me" signup; alert on release. |
| 11 | Notifications | Order status (confirmed / shipped / delivered) by email + WhatsApp. |
| 12 | Exchanges | Within **3 days**, only for a defect/problem in the order. Size exchanges not accepted (stated clearly at checkout + size chart). "Request exchange" button in customer's orders → admin dashboard. |
| 13 | Admin | Single admin (owner). Products, stock, orders, payment-screenshot review, reviews moderation, coupons, drops, shipping prices, reports, invoices. |
| 14 | Reviews | Anyone can write; admin approves before they appear. |
| 15 | Currencies | EGP (base), USD, SAR, AED, EUR — dropdown, auto-updated rates. |
| 16 | Categories | Pants, Hoodies, Jackets, Crewnecks, Sweatpants, **Accessories** (chains, bracelets, sunglasses, socks, boxers), Shop All. |

## Product page

- Tabs: Size chart · Product details · Washing instructions · Delivery
- Available sizes, colors, quantity; "only X left" warning on low stock
- Out-of-stock size → customer leaves WhatsApp / Snapchat / Instagram to be notified
- Live "people viewing now" counter (real)
- Complete the look (this + that = outfit)
- Reviews, then random "you may also like" (changes every visit)

## AI size finder

- Customer uploads a photo + enters height → suggested size
- Runs **in the browser** (pose detection); photo never leaves the device
- Fallback: pick from size chart
- Clear note: "we never see your photo — only you do"

## Checkout

- Saved addresses, shipping price by governorate / country
- Payment method choice; transfer screenshot upload
- Reserve option: pay 50% now, rest before shipping
- Delivery date picker: earliest = 2 business days
- Coupon code + loyalty points

## Admin reports (proposed)

- Sales & revenue (daily / monthly), orders by status
- Best sellers, low-stock alerts
- Per-coupon / per-influencer sales
- PDF invoice per order, Excel export

## Notes / risks

- **Music licensing:** playing Central Cee / The Weeknd tracks directly on a commercial site needs a license. A Spotify embed is the legal route (Spotify handles rights; non-logged-in visitors may hear 30s previews).
- **WhatsApp:** fully automatic messages need the WhatsApp Business (Cloud) API — paid per conversation, needs Meta business verification. v1 fallback: one-click "send on WhatsApp" from admin with a pre-filled message.
- **Exchange policy:** check the 3-day / no-size-exchange policy against Egypt's Consumer Protection Law (No. 181 of 2018) before launch.
- **Sample images** from reference sites (vegaegy, twentyseven-eg, mavin-wear, chromehearts, dolt-eg, sn2studios, synaworldswide, moncler) are for **local testing only** — replace before going live.

## Build phases

1. Project setup, design system (B&W), i18n AR/EN, intro + hero video background
2. Catalog: categories, product page (tabs, sizes/colors/stock, viewers, complete the look, reviews), currency switcher, sample data import
3. Auth, cart, checkout (addresses, shipping zones, payments + screenshot, 50% reserve, delivery date, coupons, points)
4. Customer account: orders, status, exchange requests, out-of-stock notify
5. Admin dashboard: products/stock, orders & payment review, reviews, coupons/influencers, drops, shipping, reports, invoices, Excel
6. AI size finder (in-browser)
7. Drops page + notifications (email / WhatsApp), music player, polish & tests

## Round 3 decisions (2026-10-27) — supersede the table above where they differ

- **Context:** showcase project for the user's senior engineer, not a live business. Priority = wow factor, polish, working live demo, clean code.
- **Brand:** **SAKR** (one word). Logo + falcon, animated. Concepts: https://claude.ai/artifact/SkfRiNuVQCVGSP883M4nrR
- **Intro:** 2 seconds.
- **Exchanges:** size exchange allowed **once within 14 days**, customer pays shipping (replaces the 3-day / no-size rule).
- **Payments:** **Paymob** (test mode) for Visa / Mastercard — inside Egypt and international. Plus InstaPay / wallet transfer + screenshot, and COD (Egypt).
- **Login:** required (at add-to-cart). Checkout collects: name, email, main phone (WhatsApp), second phone, full address (country, governorate, city/area, street, building, floor, apartment, landmark), map pin / "use my location", delivery date, notes.
- **Hero videos:** mood only, sn2studios style (muted tones, slow motion, still camera); real product photos separately.
- **AI size finder:** owned by Claude. Live camera with silhouette guide + 3-2-1 countdown, skeleton + measurement lines animation, saved measurements → "your size" badge on every product page, runs fully in-browser.
- **Drop-based store (new):** when the current drop sells out, the shop **locks** until the next drop opens. Details still being discussed.

## Round 4 decisions (2026-10-27)

- **Catalog:** multi-brand drip store. Seed data from Chrome Hearts (chromeheartswear.com), Corteiz, Trapstar (hypelockeruk), Essentials Egypt (+BAPE/AAPE/Sprayground), Denim Tears, Comme des Garçons, Bexon, Purple Brand & Amiri (skinny + flared jeans only). Men only. `scripts/scrape-catalog.mjs` → `data/catalog.json` (1,196 curated items), `scripts/download-images.mjs` → `public/products/`.
- **Navbar (approved):** HOODIES · CREWNECKS · JACKETS · PANTS · SWEATPANTS · TEES · SHORTS · ACCESSORIES ▾ (chains, bracelets, rings, sunglasses, socks, boxers, caps, bags, belts) · BRANDS ▾ · SHOP ALL. Each category opens a dropdown of the brands in it.
- **Footer:** Chrome Hearts-style layout (logo, contact, socials, categories, info, policies, email join, payment icons) — our own design.
- **Flying bats** animation on the site.
- **Colors:** black background, grey type (e.g. #A3A3A3 body, lighter grey for headings/prices so it stays readable).
- **Logo (chosen):** 01 Gothic Chrome — "Sakr" in UnifrakturMaguntia with a silver chrome gradient, light-sweep shine, tagline "CAIRO · EST 2026". Intro = blur-in + shine (~2s). Source: canvas https://claude.ai/artifact/SkfRiNuVQCVGSP883M4nrR (Main.dc.html).

## Round 5 decisions (2026-10-27)

- **Drop lock:** password access = yes (Corteiz-style). Lock is **manual** from admin (no auto-lock). **No** public archive of past drops.
- **Size finder:** camera mode takes **front, side and back** photos; alternative = enter height + weight. User also wants the product **shown on the customer** (virtual try-on) — approach still open.
- **Deadline:** none set.
- **Exchange policy:** exchange within 14 days only if the item is **unworn, with tags**; worn = no exchange. Underwear/socks: no exchange.
- **Language switcher:** flags (Egypt = Arabic, UK = English), as SVG flags (emoji flags don't render on Windows).
- **Country / language / currency picker (flags):** one flag dropdown — Egypt (AR, EGP), Saudi Arabia (AR, SAR), UAE (AR, AED), USA (EN, USD), Europe (EN, EUR). Picking a flag switches currency (and default language); language can still be toggled separately. Prices shown converted with the EGP original underneath ("≈ 2,500 EGP"); discounted items show was/now.
- **Try-on without photos:** a customer who only enters height + weight should still see the product on a body of his build (approach open: build-matched model via AI try-on vs. 3D mannequin).

## Round 6 decisions (2026-10-27)

- **Try-on:** AI virtual try-on approved (IDM-VTON via Replicate/fal). Measurement stays on-device; "Try it on me" is a separate button with a server-processing consent notice.
- **Flags:** ~30 countries, each with its own currency.
- **New brands:** Rick Owens (official rickowens.eu, men's only) + designer shoes from Stadium Goods (Balenciaga, Dior, Gucci, Lanvin, Asics, Rick Owens) + Gucci (creme321) + Amiri footwear. Catalog now 1,431 products / 18 brands / 3,812 images. New nav item: SHOES.
- BRD fully updated: https://claude.ai/artifact/9MLN7XFoE8EF2by3uDreKW

## Round 7 decisions (2026-10-27)

- **Catalog expansion (in progress):** Off-White, Dior, Louis Vuitton, Gucci, Jordan, Nike — shoes, slides, caps; Nike Tech tracksuits + shorts. Products grouped by model so each model page shows **every colorway** (swatches). Model-grouped items use Shopify CDN images (not downloaded).
- **Music:** a different foreign drip/rap track each visit; customer can pause/skip. Browsers block autoplay with sound until a click → an "ENTER" gate on the intro unlocks audio. Tracks must be licensed/royalty-free or user-provided.
- **Order tracking:** customer tracks where the order is (status timeline + live map, by order number + phone, no login needed).
- **Look:** scary street / gang drip — grunge, smoke, VHS noise, graffiti textures. Black background, **dark grey** type.
- **Home:** an ads / campaign section for the clothes (lookbook banners, managed from admin).
- **Logo:** click → home; chrome shine; when the cursor gets near it plays a falcon screech.

## Round 8 decisions (2026-10-27)

- **Music:** 29 tracks in public/music (17 Kontraa CC BY-ND, 6 CC BY-NC-ND flagged `nonCommercial`, rest CC BY/CC0). `scripts/fetch-music.mjs`.
- **Ideas in scope (BR-49…56):** AI Stylist, Fit Builder, Size Passport, personalized home, levels (Rookie → OG → Legend), VIP early access 3h before drops + private codes, Mystery Box, graffiti wall.

## Round 9 decision (2026-10-27) — zero cost

Everything must run on free tiers, no paid services:
- AI Stylist → free LLM tier (Gemini or Groq) instead of a paid API; rule-based fallback if quota runs out.
- AI try-on → free Hugging Face Space (IDM-VTON / Kolors) via @gradio/client; slow/queued, so keep pre-made demo results as fallback.
- Payments → Paymob test mode (free). Hosting → Vercel Hobby + MongoDB Atlas M0 (512 MB). Maps → Leaflet + OpenStreetMap. Exchange rates → open.er-api.com. Email → Resend free tier or Gmail SMTP.
- Hero videos → free daily credits on AI video tools, or Pexels free stock.
- Images → keep remote CDN URLs or Cloudinary free tier (783 MB of local images is too big to ship as static files).

## Round 10 decisions (2026-10-27)

- **Stylist LLM:** Gemini free tier (chosen by Claude), rule-based fallback.
- **BR-57** Order > 10,000 EGP → 20% coupon for the next order. **BR-58** "My coupons" dropdown (account + checkout); every coupon single-use.
- **BR-59** Last pieces: a color/size variant with ≤ 3 left gets 85% off automatically (threshold + % editable in admin). **BR-60** Discounts don't stack — best single discount wins.
- **BR-61** Home banner auto-shows active discounts. **BR-62** Late orders flagged in admin → admin writes the reason → customer gets apology + 10% coupon (email + WhatsApp button).
- **BR-63** Admin controls everything: products, prices, discounts by product/category/brand/site-wide, coupons for a specific customer. **BR-64** Monthly + yearly PDF sales reports with the SAKR logo.
