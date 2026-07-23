/**
 * Lightweight fixture test — not a full test suite (no jest/vitest,
 * per "avoid unnecessary libraries"). Run with `npm run test:parser`.
 *
 * The Cliveden and Dex Kiara East fixtures below are trimmed,
 * near-verbatim copies of real speedhome.com/rent/* card markup,
 * captured live via debug logging through the Playwright collector
 * (2026-07-23) — not a guess. They replace an earlier fixture that
 * assumed the words "bed"/"bathroom"/"parking" appeared as visible
 * text; live markup showed that was wrong (those words are only
 * `<img alt="...">` attributes, invisible to `.text()`), which is
 * why the parser was rewritten to use targeted selectors
 * (aria-label, `[class*="propertySpecs"]`, etc.) instead of
 * whole-card text regex.
 *
 * The room-share fixture (word-based bedroom size, no sqft) is
 * still a reasonable synthetic approximation, not something
 * directly re-confirmed against live markup after the rewrite —
 * worth re-checking against a real room-share listing's debug log
 * if one shows up wrong in production.
 */
import assert from "node:assert";

import { parseListingCards } from "@/features/parser/parser";
import { normalizeListings } from "@/features/normalizer/normalizer";

const FIXTURE_HTML = `
<html><body>
  <a class="PropertyCard_propertyCard__V67Lp" aria-label="View details for Cliveden, Plaza Damas 3" href="/details/cliveden-plaza-damas-3-iiswoizn">
    <div class="PropertyCard_propertyCardHeader__1WgW9">
      <span class="PropertyCard_verifiedBadge__aGsum"><img alt="Verified">VERIFIED</span>
    </div>
    <button class="PropertyCard_prevButton__97Vbk" aria-label="Previous slide">\u2039</button>
    <button class="PropertyCard_nextButton__qYffH" aria-label="Next slide">\u203a</button>
    <div class="PropertyCard_propertyCardTags__9f3tX">
      <div class="PropertyCard_tag__MPE_i"><span>ZERO</span><span>DEPOSIT</span></div>
    </div>
    <div class="PropertyCard_propertyCardDetails__LDZYJ">
      <h3 class="PropertyCard_propertyTitle__XqQ4b">Cliveden, Plaza Damas 3</h3>
      <div class="PropertySpecs_propertySpecs__9wrfE">
        <span><svg></svg>500<!-- --> sqft </span>
        <span><img alt="bed"> <!-- -->1</span>
        <span><img alt="bathroom"> <!-- -->1</span>
        <span><img alt="parking"> <!-- -->0</span>
      </div>
      <div class="mich_michDataContainer__Gb9Nw">
        <div class="mich_titleText___7IcY">WFH Ready</div>
        <div class="mich_titleText___7IcY">Fast Lift</div>
        <div class="mich_titleText___7IcY">Fully Furnished</div>
      </div>
      <div class="PropertyCard_propertyAvailability__TFF0b"><span> <!-- -->26 Jul 2026</span></div>
      <div class="PropertyCard_propertyPrice__mcIfX"><span>RM <!-- -->1,600<!-- --> <span class="PropertyCard_priceSuffix__7BZln">/ month</span></span></div>
    </div>
  </a>

  <a class="PropertyCard_propertyCard__V67Lp" aria-label="View details for Dex Kiara East, Jalan Ipoh" href="/details/dex-kiara-east-jalan-ipoh-lcpehfri">
    <span class="PropertyCard_verifiedBadge__aGsum"><img alt="Verified">VERIFIED</span>
    <div class="PropertyCard_propertyCardTags__9f3tX"><span>ZERO</span><span>DEPOSIT</span></div>
    <h3 class="PropertyCard_propertyTitle__XqQ4b">Dex Kiara East, Jalan Ipoh</h3>
    <div class="PropertySpecs_propertySpecs__9wrfE">
      <span><svg></svg>911<!-- --> sqft </span>
      <span><img alt="bed"> <!-- -->3</span>
      <span><img alt="bathroom"> <!-- -->2</span>
      <span><img alt="parking"> <!-- -->2</span>
    </div>
    <div class="PropertyCard_propertyAvailability__TFF0b"><span> <!-- -->Move-in Now</span></div>
    <div class="PropertyCard_propertyPrice__mcIfX"><span>RM <!-- -->1,900<!-- --> <span class="PropertyCard_priceSuffix__7BZln">/ month</span></span></div>
  </a>

  <a class="PropertyCard_propertyCard__V67Lp" aria-label="View details for Taman Sri Segambut, Kuala Lumpur" href="/details/taman-sri-segambut-kuala-lumpur-hsijsllw">
    <div class="PropertyCard_propertyCardTags__9f3tX"><span>ZERO</span><span>DEPOSIT</span></div>
    <h3 class="PropertyCard_propertyTitle__XqQ4b">Taman Sri Segambut, Kuala Lumpur</h3>
    <div class="PropertySpecs_propertySpecs__9wrfE">
      <span><img alt="bed"> <!-- -->MEDIUM</span>
      <span><img alt="bathroom"> <!-- -->SHARED</span>
      <span><img alt="parking"> <!-- -->1</span>
    </div>
    <div class="PropertyCard_propertyAvailability__TFF0b"><span> <!-- -->Move-in Now</span></div>
    <div class="PropertyCard_propertyPrice__mcIfX"><span>RM <!-- -->550<!-- --> <span class="PropertyCard_priceSuffix__7BZln">/ month</span></span></div>
  </a>
</body></html>
`;

const SOURCE_URL = "https://speedhome.com/rent/kuala-lumpur";

function run() {
  const raw = parseListingCards(FIXTURE_HTML, SOURCE_URL);
  assert.strictEqual(raw.length, 3, `expected 3 raw cards, got ${raw.length}`);

  const [cliveden, dex, taman] = raw;

  assert.strictEqual(cliveden?.propertyName, "Cliveden");
  assert.strictEqual(cliveden?.areaRaw, "Plaza Damas 3");
  assert.strictEqual(cliveden?.bedroomRaw, "1");
  assert.strictEqual(cliveden?.sizeRaw, "500 sqft");
  assert.strictEqual(cliveden?.priceRaw, "RM 1,600");
  assert.strictEqual(cliveden?.priceTypeRaw, "monthly");
  assert.strictEqual(cliveden?.furnitureRaw, "Fully Furnished");
  assert.strictEqual(cliveden?.listingUrl, "https://speedhome.com/details/cliveden-plaza-damas-3-iiswoizn");

  assert.strictEqual(dex?.propertyName, "Dex Kiara East");
  assert.strictEqual(dex?.areaRaw, "Jalan Ipoh");
  assert.strictEqual(dex?.bedroomRaw, "3");
  assert.strictEqual(dex?.sizeRaw, "911 sqft");
  assert.strictEqual(dex?.priceRaw, "RM 1,900");
  assert.strictEqual(dex?.furnitureRaw, null, "no mich tags on this fixture card -> no furniture signal");

  assert.strictEqual(taman?.propertyName, "Taman Sri Segambut");
  assert.strictEqual(taman?.areaRaw, "Kuala Lumpur");
  assert.strictEqual(taman?.bedroomRaw, "MEDIUM");
  assert.strictEqual(taman?.sizeRaw, null, "room-share listing should have no sqft");

  const listings = normalizeListings(raw);
  assert.strictEqual(listings.length, 3);

  const clivedenListing = listings.find((l) => l.listingId === "cliveden-plaza-damas-3-iiswoizn");
  assert.strictEqual(clivedenListing?.bedroomType, "1 Bedroom");
  assert.strictEqual(clivedenListing?.monthlyPrice, 1600);
  assert.strictEqual(clivedenListing?.unitSize, 500);
  assert.strictEqual(clivedenListing?.sizeUnit, "sqft");
  assert.strictEqual(clivedenListing?.furnitureStatus, "Fully Furnished");

  const tamanListing = listings.find((l) => l.listingId === "taman-sri-segambut-kuala-lumpur-hsijsllw");
  assert.strictEqual(tamanListing?.bedroomType, "Not Available");
  assert.strictEqual(tamanListing?.monthlyPrice, 550);
  assert.strictEqual(tamanListing?.unitSize, null);
  assert.strictEqual(tamanListing?.furnitureStatus, "Not Available");

  console.log("All parser/normalizer fixture assertions passed \u2714");
}

run();
