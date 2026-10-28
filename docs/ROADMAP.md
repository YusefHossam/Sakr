# SAKR roadmap (round 12)

Features the owner picked from the "50 ideas" list (2026-10-28), grouped into phases.
Numbers refer to the idea list in the chat. Everything must stay free-tier.

Done: new brands (Moncler, AMI, Rhude, Marcelo Burlon, Polo, Adidas, Zara, Casablanca, Palm Angels, Stussy, The North Face),
slides category, clean hero, **full admin panel** (customers, catalog bulk tools, analytics, audit log, team, content, invoices, CSV export).

## Phase A: Look and feel
- 1 Falcon 3D in the hero that looks toward the cursor
- 3 Site theme follows Cairo time of day (grey by day, darker with red neon at night)
- 6 Mood filter: Drip / Clean / Opium / **Old Money** (Zara, Polo, Ralph-style pieces) re-tints and re-filters the store
- 43 Falcon cursor
- 41 Page/image transitions (product image flies from card to product page)

## Phase B: AI (all with a non-AI fallback, Gemini free tier is often busy)
- 9 Egyptian Arabic chatbot (order status, size help, product questions from the DB)
- 10 Product descriptions for the whole catalog (AR + EN), using the source pages' real details
- 11 Camera fit check (rates the look, suggests what to add)
- 12 AR try-on for caps and sunglasses, in the browser
- 14 Per-brand size advice ("runs small, take half a size up") from returns and reviews
- 16 "Likely to sell out" prediction from viewers and sales speed
- 35 Search that understands Arabic, English and Franco ("hoodie" = "هودي" = "7oody")

## Phase C: Buying (done 2026-10-28: pre-order, gift mode, wallet, same-day shipping, Egyptian copy)
- 17 Pre-order for the next drop, with a deposit
- 19 Gift mode: message and card, no prices in the parcel
- 20 Account wallet: refunds, gifts, cashback
- 33 Same-day shipping in Greater Cairo for orders before 2 pm, with a countdown
- 38 All site copy in proper street Egyptian (404, empty cart, payment reminders)

## Phase D: Community (done 2026-10-28: Hot or Not duel + fit of the week, public wardrobe profile, badges, Crew mode, Live drop)
- 8 Hot or Not: two looks head to head, best look of the week on the home page
- 26 Public "My wardrobe" profile (what I bought, my level, my badges)
- 27 Badges and achievements
- 29 Crew mode: crews pool points for a group discount
- 30 Live drop stream with a buy button and chat

## Phase E: Engineering (done 2026-10-28; reports still read orders directly, not the event log)
- 39 Live updates (SSE): viewers and stock change without refresh
- 45 Offline cart that syncs when the connection returns
- 46 Event log for every order/payment/shipping event; reports read from it
- 48 Public status page
- 50 Design-system page with every SAKR component
- 15-style items skipped on purpose: 2, 4, 13, 15, 18, 37

## Later
- 36 Ramadan / Eid theme (not now)
- Deploy (Vercel + Atlas), image compression (870 MB), Gemini/HF/Paymob keys
