const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const ts = require("typescript");
const memory = new Map();
const driver = {
  async getItem(k) {
    return memory.get(k) ?? null;
  },
  async setItem(k, v) {
    memory.set(k, v);
  },
  async removeItem(k) {
    memory.delete(k);
  },
};
const original = Module._load;
Module._load = function (name, ...args) {
  if (name === "@react-native-async-storage/async-storage")
    return { __esModule: true, default: driver };
  return original.call(this, name, ...args);
};
require.extensions[".ts"] = (module, file) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText,
    file,
  );
const { DEMO_CATALOG } = require("../src/catalog.ts");
const { DEFAULT_PROFILE, CATEGORIES } = require("../src/models.ts");
const {
  outfitEngine,
  productCost,
  outfitTotal,
  eligible,
  validateBudget,
} = require("../src/engine.ts");
const { deliveryEngine } = require("../src/services/delivery.ts");
const {
  DemoProductProvider,
  ApiProductProvider,
  filterProducts,
} = require("../src/providers/products.ts");
const { AppStorage, freshData } = require("../src/storage.ts");
const {
  subscriptionService,
  DEFAULT_SUBSCRIPTION,
} = require("../src/services/subscription.ts");
const { BackendAIProvider } = require("../src/services/ai.ts");
const { ApiWeatherService } = require("../src/services/weather.ts");
const { shareText, retailerUrl } = require("../src/services/commerce.ts");
const { safeLocation } = require("../src/services/location.ts");
const { OutfitImageSharingService } = require("../src/services/imageShare.ts");
const { validLiveProduct } = require("../server/retailers.ts");
const r = (budget = 5000) => ({
  profile: structuredClone(DEFAULT_PROFILE),
  occasion: "Party",
  budget,
  deadline: null,
  location: "London",
  categories: ["top", "bottom", "shoes"],
  owned: [],
  requireVerifiedDelivery: false,
  weather: null,
});
const tests = [];
const test = (name, fn) => tests.push([name, fn]);
test("110 labelled demo products; exact required category counts", () => {
  assert.equal(DEMO_CATALOG.length, 110);
  assert.deepEqual(
    CATEGORIES.map((c) => DEMO_CATALOG.filter((p) => p.category === c).length),
    [30, 30, 20, 15, 15],
  );
  assert.ok(
    DEMO_CATALOG.every(
      (p) => p.source === "demo" && !p.productUrl && !p.deliveryEstimate,
    ),
  );
});
for (const pounds of [30, 50, 100])
  test(`£${pounds}: complete, sized, coherent outfits within budget`, () => {
    const request = r(pounds * 100);
    request.occasion = "Casual";
    const result = outfitEngine.generate(DEMO_CATALOG, request);
    assert.equal(result.length, 3);
    for (const o of result) {
      assert.equal(o.products.length, 3);
      assert.ok(o.totalPrice <= request.budget);
      assert.equal(o.totalPrice, outfitTotal(o.products));
      assert.ok(
        o.products.every((p) => p.availableSizes.includes(p.selectedSize)),
      );
    }
  });
test("All common occasions either meet constraints or explain no match", () => {
  for (const occasion of [
    "Casual",
    "Party",
    "Date",
    "Work",
    "Wedding",
    "Gym",
  ]) {
    const request = { ...r(10000), occasion };
    const o = outfitEngine.generate(DEMO_CATALOG, request)[0];
    assert.ok(o.products.every((p) => p.occasionTags.includes(occasion)));
  }
});
test("No products: useful recovery, no partial outfit", () =>
  assert.throws(
    () => outfitEngine.generate([], r()),
    /Change a size or style/,
  ));
test("Budget too low: explain minimum and wardrobe recovery", () =>
  assert.throws(
    () => outfitEngine.generate(DEMO_CATALOG, r(100)),
    /lowest matching item total/,
  ));
test("No delivery data: unconfirmed; strict deadline returns no outfit", () => {
  assert.equal(
    deliveryEngine.evaluate(DEMO_CATALOG[0], null, "London"),
    "DELIVERY_UNCONFIRMED",
  );
  assert.throws(
    () =>
      outfitEngine.generate(DEMO_CATALOG, {
        ...r(),
        requireVerifiedDelivery: true,
      }),
    /verified delivery/,
  );
});
test("Live delivery requires fresh, location-matching evidence", () => {
  const now = new Date("2026-09-13T10:00:00Z");
  const p = {
    ...DEMO_CATALOG[0],
    source: "live",
    deliveryAvailable: true,
    deliveryEstimate: {
      verified: true,
      latestArrival: "2026-09-14T15:00:00Z",
      checkedAt: now.toISOString(),
      location: "London",
      method: "delivery",
    },
  };
  assert.equal(
    deliveryEngine.evaluate(p, "2026-09-14", "London", now),
    "AVAILABLE_TOMORROW",
  );
  assert.equal(
    deliveryEngine.evaluate(p, "2026-09-13", "London", now),
    "UNAVAILABLE_BEFORE_DEADLINE",
  );
  assert.equal(
    deliveryEngine.evaluate(p, null, "Leeds", now),
    "DELIVERY_UNCONFIRMED",
  );
  assert.equal(
    deliveryEngine.evaluate(p, null, "London", new Date("2026-09-14")),
    "DELIVERY_UNCONFIRMED",
  );
});
test("Known shipping included; unknown live shipping excluded", () => {
  const p = { ...DEMO_CATALOG[0], deliveryCost: 250 };
  assert.equal(productCost(p), p.price + 250);
  assert.equal(
    eligible(
      {
        ...p,
        source: "live",
        productUrl: "https://shop.example/item",
        deliveryCost: null,
      },
      r(),
    ),
    false,
  );
});
test("Unavailable product never selected", () => {
  const p = DEMO_CATALOG.map((x) => ({ ...x, availability: false }));
  assert.throws(() => outfitEngine.generate(p, r()), /No complete outfit/);
});
test("Unavailable size never substituted", () => {
  const request = r();
  request.profile.sizes.shoes = "99";
  assert.throws(
    () => outfitEngine.generate(DEMO_CATALOG, request),
    /No complete outfit/,
  );
});
test("Swap preserves all constraints and budget", () => {
  const o = outfitEngine.generate(DEMO_CATALOG, r())[0];
  for (const p of o.products) {
    const a = outfitEngine.alternatives(o, p.category, DEMO_CATALOG)[0];
    assert.ok(a);
    const next = outfitEngine.swap(o, a);
    assert.notEqual(
      next.products.find((x) => x.category === p.category).id,
      p.id,
    );
    assert.ok(next.totalPrice <= o.request.budget);
  }
});
test("Stale swap is rejected", () => {
  const o = outfitEngine.generate(DEMO_CATALOG, r())[0];
  assert.throws(
    () => outfitEngine.swap(o, { ...o.products[0], availability: false }),
    /no longer available/,
  );
});
test("Make cheaper reduces price without losing occasion or size", () => {
  const o = outfitEngine.generate(DEMO_CATALOG, r(10000))[0];
  const next = outfitEngine.cheaper(o, DEMO_CATALOG);
  assert.ok(next.totalPrice < o.totalPrice);
  assert.ok(next.products.every((p) => eligible(p, next.request)));
});
test("Make it £X performs multiple replacements when needed", () => {
  const request = r(10000);
  request.occasion = "Casual";
  const o = outfitEngine.generate(DEMO_CATALOG, request)[2];
  const next = outfitEngine.cheaper(o, DEMO_CATALOG, 3000);
  assert.ok(next.totalPrice <= 3000);
  assert.equal(next.request.budget, 3000);
});
test("Upgrade stays within budget and improves a matching score or explains", () => {
  const o = outfitEngine.generate(DEMO_CATALOG, r(10000))[1];
  try {
    const next = outfitEngine.upgrade(o, DEMO_CATALOG);
    assert.ok(next.totalPrice <= o.request.budget);
    assert.ok(
      next.overallScore >= o.overallScore ||
        next.styleScore > o.styleScore ||
        next.colourScore > o.colourScore ||
        next.versatilityScore > o.versatilityScore,
    );
  } catch (e) {
    assert.match(e.message, /No better matching upgrade/);
  }
});
test("Owned items remove cost and corresponding shopping category", () => {
  const request = r(2000);
  request.owned = [
    { id: "own", name: "My black jeans", category: "bottom", colour: "Black" },
    { id: "shoe", name: "White trainers", category: "shoes", colour: "White" },
  ];
  const o = outfitEngine.generate(DEMO_CATALOG, request)[0];
  assert.equal(o.products.length, 1);
  assert.equal(o.products[0].category, "top");
  assert.equal(o.request.owned[0].name, "My black jeans");
});
test("Avoid colours and brands persist through alternatives", () => {
  const request = r(10000);
  request.profile.avoidColours = ["Black"];
  request.profile.avoidBrands = "North & Co.";
  const o = outfitEngine.generate(DEMO_CATALOG, request)[0];
  assert.ok(
    o.products.every(
      (p) => !p.colours.includes("Black") && p.brand !== "North & Co.",
    ),
  );
});
test("Save, reopen and restart preserve sizes, request and outfit", async () => {
  const a = new AppStorage(driver);
  const data = freshData();
  data.onboarded = true;
  data.saved = [outfitEngine.generate(DEMO_CATALOG, r())[0]];
  await a.save(data);
  const b = new AppStorage(driver);
  assert.deepEqual(await b.load(), data);
  await b.deleteAll();
  assert.equal((await b.load()).saved.length, 0);
});
test("Storage errors surfaced rather than silently losing data", async () => {
  const a = new AppStorage({
    getItem: async () => "{broken",
    setItem: async () => {},
    removeItem: async () => {},
  });
  await assert.rejects(() => a.load(), /could not be read/);
});
test("Share includes prices and occasion, excludes private fields", () => {
  const request = r();
  request.profile.name = "PRIVATE_NAME";
  request.location = "PRIVATE_LOCATION";
  const text = shareText(outfitEngine.generate(DEMO_CATALOG, request)[0]);
  assert.ok(
    text.includes("FITFIND") && text.includes("£") && text.includes("Party"),
  );
  assert.ok(
    !text.includes("PRIVATE_NAME") && !text.includes("PRIVATE_LOCATION"),
  );
});
test("Demo links disabled; only HTTPS live product links open", () => {
  assert.equal(retailerUrl(DEMO_CATALOG[0]), null);
  assert.equal(
    retailerUrl({
      ...DEMO_CATALOG[0],
      source: "live",
      productUrl: "javascript:alert(1)",
    }),
    null,
  );
  assert.equal(
    retailerUrl({
      ...DEMO_CATALOG[0],
      source: "live",
      productUrl: "https://retailer.example/item",
    }),
    "https://retailer.example/item",
  );
});
test("3 free generations, trial expiry, no repeat trials, mock plans", () => {
  assert.ok(subscriptionService.canGenerate(DEFAULT_SUBSCRIPTION));
  assert.equal(
    subscriptionService.canGenerate({
      ...DEFAULT_SUBSCRIPTION,
      generations: 3,
    }),
    false,
  );
  const trial = subscriptionService.startTrial({
    ...DEFAULT_SUBSCRIPTION,
    generations: 3,
  });
  assert.ok(subscriptionService.canGenerate(trial));
  assert.throws(
    () => subscriptionService.startTrial(trial),
    /already been used/,
  );
  assert.equal(
    subscriptionService.canGenerate({ ...trial, trialStartedAt: "2020-01-01" }),
    false,
  );
  assert.ok(
    subscriptionService.canGenerate(
      subscriptionService.subscribe(trial, "annual"),
    ),
  );
});
test("AI unavailable gracefully returns deterministic explanation", async () => {
  const old = global.fetch;
  global.fetch = async () => {
    throw Error("network");
  };
  try {
    assert.match(
      await new BackendAIProvider(
        "https://api.example",
        async () => "token",
      ).explain(outfitEngine.generate(DEMO_CATALOG, r())[0]),
      /pieces selected/,
    );
  } finally {
    global.fetch = old;
  }
});
test("Weather unavailable and network failure return null", async () => {
  const old = global.fetch;
  global.fetch = async () => {
    throw Error("network");
  };
  try {
    assert.equal(
      await new ApiWeatherService("https://api.example").getWeather(
        "London",
        null,
      ),
      null,
    );
  } finally {
    global.fetch = old;
  }
});
test("Product network failure is surfaced for recovery", async () => {
  const old = global.fetch;
  global.fetch = async () => ({ ok: false });
  try {
    await assert.rejects(
      () =>
        new ApiProductProvider(
          "https://api.example",
          async () => "token",
        ).search({}),
      /Retailer unavailable/,
    );
  } finally {
    global.fetch = old;
  }
});
test("Search filters and sort apply to real data fields", () => {
  const list = filterProducts(DEMO_CATALOG, {
    category: "top",
    colour: "Black",
    maxPrice: 2000,
    sort: "Cheapest",
  });
  assert.ok(list.length > 0);
  assert.ok(
    list.every(
      (p) =>
        p.category === "top" && p.colours.includes("Black") && p.price <= 2000,
    ),
  );
  assert.equal(filterProducts(DEMO_CATALOG, { rating: 4 }).length, 0);
});
test("Location denied recovers to manual entry without fetching coordinates", async () => {
  let queried = false;
  const result = await safeLocation({
    requestForegroundPermissionsAsync: async () => ({ status: "denied" }),
    getCurrentPositionAsync: async () => {
      queried = true;
    },
    reverseGeocodeAsync: async () => [],
  });
  assert.match(result.message, /permission denied/);
  assert.equal(queried, false);
});
test("Location provider failure recovers to manual entry", async () => {
  const result = await safeLocation({
    requestForegroundPermissionsAsync: async () => {
      throw Error("unavailable");
    },
  });
  assert.match(result.message, /unavailable/);
});
test("Image sharing captures the card and releases its temporary PNG", async () => {
  const events = [];
  const service = new OutfitImageSharingService({
    available: async () => true,
    capture: async (view) => {
      events.push(view);
      return "file:///temporary-outfit.png";
    },
    share: async (uri) => events.push(uri),
    release: (uri) => events.push("released:" + uri),
  });
  await service.share("outfit-card");
  assert.deepEqual(events, [
    "outfit-card",
    "file:///temporary-outfit.png",
    "released:file:///temporary-outfit.png",
  ]);
});
test("Image-sharing failure cleans up and unavailable devices get recovery", async () => {
  let released = false;
  const service = new OutfitImageSharingService({
    available: async () => true,
    capture: async () => "file:///temp.png",
    share: async () => {
      throw Error("share cancelled");
    },
    release: () => {
      released = true;
    },
  });
  await assert.rejects(() => service.share({}), /share cancelled/);
  assert.equal(released, true);
  await assert.rejects(
    () =>
      new OutfitImageSharingService({ available: async () => false }).share({}),
    /item list instead/,
  );
});
test("React Native screens contain no raw text outside Text components", () => {
  const walk = (dir) =>
    fs
      .readdirSync(dir, { withFileTypes: true })
      .flatMap((entry) =>
        entry.isDirectory()
          ? walk(dir + "/" + entry.name)
          : [dir + "/" + entry.name],
      );
  const paths = ["App.tsx", ...walk("src").filter((p) => p.endsWith(".tsx"))];
  for (const path of paths) {
    const source = ts.createSourceFile(
      path,
      fs.readFileSync(path, "utf8"),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    function check(node) {
      const literal = ts.isJsxText(node)
        ? node.text.trim()
        : ts.isJsxExpression(node) &&
            node.expression &&
            ts.isStringLiteral(node.expression)
          ? node.expression.text
          : null;
      if (literal) {
        let parent = node.parent;
        while (parent && ts.isJsxFragment(parent)) parent = parent.parent;
        if (parent && ts.isJsxElement(parent))
          assert.equal(
            parent.openingElement.tagName.getText(source),
            "Text",
            `${path}: raw text must be inside Text`,
          );
      }
      ts.forEachChild(node, check);
    }
    check(source);
  }
});
test("Invalid money input is rejected", () => {
  for (const v of ["", "-1", "0", "5.999", "Infinity", "abc"])
    assert.equal(validateBudget(v), undefined);
  assert.equal(validateBudget("50.25"), 5025);
});
test("New visual styles produce matching budget-safe outfits", () => {
  for (const style of [
    "Y2K",
    "Streetwear",
    "Formal",
    "Smart casual",
    "Smart streetwear",
  ]) {
    const req = r(10000);
    req.profile.styles = [style];
    req.occasion =
      style === "Streetwear" || style === "Y2K" ? "Party" : "Dinner";
    const outfits = outfitEngine.generate(DEMO_CATALOG, req);
    assert.ok(outfits.length);
    for (const o of outfits) {
      assert.ok(o.totalPrice <= req.budget);
      assert.ok(o.products.every((p) => p.styleTags.includes(style)));
    }
  }
});
test("Optional fit details survive restart without changing sizes", async () => {
  const s = new AppStorage(driver),
    d = freshData();
  d.profile.heightCm = "175";
  d.profile.weightKg = "70";
  d.profile.bodyShape = "Straight";
  await s.save(d);
  const loaded = await s.load();
  assert.equal(loaded.profile.heightCm, "175");
  assert.equal(loaded.profile.weightKg, "70");
  assert.deepEqual(loaded.profile.sizes, DEFAULT_PROFILE.sizes);
  await s.deleteAll();
});
test("Checkout total charges delivery once per retailer order", () => {
  const a = { ...DEMO_CATALOG[0], price: 1000, deliveryCost: 395 };
  const b = { ...DEMO_CATALOG[1], price: 1200, deliveryCost: 395 };
  assert.equal(outfitTotal([a, b]), 2595);
  assert.equal(outfitTotal([a, { ...b, retailer: "Another retailer" }]), 2990);
});
test("Live recommendations require complete checkout-cost evidence", () => {
  const live = {
    ...DEMO_CATALOG[0],
    source: "live",
    productUrl: "https://shop.example/joggers",
    deliveryCost: 395,
    taxIncluded: true,
    taxAmount: 0,
    mandatoryFees: 0,
    costVerifiedAt: new Date().toISOString(),
    stockStatus: "in_stock",
  };
  assert.equal(eligible(live, r()), true);
  assert.equal(eligible({ ...live, mandatoryFees: null }, r()), false);
  const verified = {
    ...live,
    deliveryEstimate: {
      verified: true,
      latestArrival: "2026-09-16",
      checkedAt: new Date().toISOString(),
      location: "London",
      method: "delivery",
    },
  };
  assert.equal(validLiveProduct(verified), true);
  assert.equal(validLiveProduct({ ...verified, deliveryCost: null }), false);
});
(async () => {
  let failed = 0;
  for (const [name, fn] of tests) {
    try {
      await fn();
      console.log("PASS " + name);
    } catch (e) {
      failed++;
      console.error("FAIL " + name + "\n" + e.stack);
    }
  }
  console.log(`\n${tests.length - failed}/${tests.length} passed`);
  process.exitCode = failed ? 1 : 0;
})();
