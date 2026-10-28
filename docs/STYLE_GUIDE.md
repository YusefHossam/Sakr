# SAKR style guide: what goes with what

Implemented in `src/lib/style.ts` and used by the product page ("Goes with this"), the Drip / Clean / Opium / Old Money
fits pages (`/fits/[mood]`), the AI Stylist and the Fit Check picks. Every pairing carries a reason the customer can read.

## The four moods

| Mood | Taste | Brands |
|---|---|---|
| **Drip** (was "Gang") | heavy street | Corteiz, Trapstar, Chrome Hearts, Denim Tears, Rhude, Heron Preston, Palm Angels, Cactus Jack, BAPE, Sprayground |
| **Clean** | quiet colours, clean cuts | Essentials, ASICS, CDG, Nike, Adidas, AMI, Stussy, The North Face, Jordan |
| **Opium** | black, long, dark | Rick Owens, Chrome Hearts, Balenciaga, Saint Laurent, Margiela, Amiri, McQueen, Purple, Lanvin |
| **Old Money** | quiet luxury, no hoodies/joggers/slides | Polo Ralph Lauren, Zara, Moncler, AMI, Gucci, Dior, LV, Lanvin, Casablanca |

Drip next to Old Money is penalised; shared moods are rewarded.

## Rules, by weight

1. **SAKR picks** (the owner's taste, always surfaced):
   - Balenciaga **Track** on **skinny or flared** denim.
   - Lanvin **Curb** colourways on **flared** denim.
2. **Proportion** (backed by the sources below):
   - A big (oversized) piece wants a slimmer one. Oversized top + baggy bottom is penalised.
   - Flared legs want a shoe with presence: chunky, high-top or boot. A low, slim shoe is penalised under a flare.
   - Skinny / straight legs work with low shoes; chunky shoes still work.
   - Slides only with shorts. Dress shoes (loafers) not with shorts or baggy legs.
   - Heavy outerwear (coat, trench, parka, puffer) over shorts is rejected.
3. **Colour**: a neutral calms anything; two different loud colours clash; the same colour matches.
4. **Fit-worthy accessories only**: caps, sunglasses, chains, bracelets, rings, watches. Underwear, socks, perfume and card holders never appear in a fit.

## What the research said (and where we disagree with it)

The web has little authoritative writing on this; most of it is SEO blogs, so treat it as general guidance.

- Flares and wide legs suit chunky shoes because the volume balances the leg: agreed by every source. [How to Wear Flare Jeans with Sneakers](https://myshoesreview.com/?p=21852), [What Sneakers Work with Flare Jeans](https://myshoesreview.com/?p=59582).
- Balance volume top to bottom: one oversized piece per outfit is the safest formula. [How to Style Oversized Streetwear](https://thriftwallet.in/blogs/the-thrift-journal/how-to-style-oversized-streetwear-for-everyday-impact).
- **Balenciaga Track on skinny jeans**: sources disagree. Some like the streamlined look, others warn the chunky sole looks bulky and prefer a wider leg. We follow the owner's call and show it as a SAKR pick. [How to Wear Balenciaga Track Sneakers](https://myshoesreview.com/?p=48546).
- **Lanvin Curb**: sources recommend straight, slim or slightly relaxed jeans and warn against very baggy or very skinny cuts; none mention flares. The flared pairing is the owner's taste, not something the sources back. [How to Wear Lanvin Curb Sneakers](https://myshoesreview.com/?p=48597), [Culted](https://culted.com/latest-drops/style-guide-lanvins-curb-sneaker/).
- "Drip" versus "clean" has no authoritative definition online; the mood lists above are SAKR's own.

## Known gaps

- **Balenciaga Track sneakers for men are not in any free source we can reach.** Stadium Goods lists Track only in women's size runs (WMNS), which we do not add to a men's store. The rule is live: add a Track from Admin → Products and it is picked up automatically.
- Lanvin Curb: 8 colourways available (the source only has about nine, one is women's).
- The brand fit guide on product pages is hand-written, not derived from returns yet.
