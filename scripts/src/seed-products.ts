import { getUncachableStripeClient } from "./stripeClient";

/**
 * Creates the HIVE membership products and prices in Stripe.
 * Idempotent — safe to run multiple times.
 *
 * Run with: pnpm --filter @workspace/scripts exec tsx src/seed-products.ts
 */

type PlanSpec = {
  name: string;
  description: string;
  tier: "gold" | "red";
  prices: { lookupKey: string; unitAmount: number; interval: "month" | "year" }[];
};

const PLANS: PlanSpec[] = [
  {
    name: "HIVE Gold Card",
    description: "Gold Card membership — expanded monthly allowances across the HIVE network.",
    tier: "gold",
    prices: [
      { lookupKey: "hive_gold_monthly", unitAmount: 9000, interval: "month" }, // €90.00
      { lookupKey: "hive_gold_yearly", unitAmount: 70000, interval: "year" }, // €700.00
    ],
  },
  {
    name: "HIVE Red Geriatric Safety Pack",
    description:
      "Red Geriatric Safety Pack — everything in Gold plus geriatric care and monitoring features.",
    tier: "red",
    prices: [
      { lookupKey: "hive_red_monthly", unitAmount: 15000, interval: "month" }, // €150.00
      { lookupKey: "hive_red_yearly", unitAmount: 120000, interval: "year" }, // €1,200.00
    ],
  },
];

async function main() {
  const stripe = await getUncachableStripeClient();

  const existingPrices = await stripe.prices.list({
    lookup_keys: PLANS.flatMap((p) => p.prices.map((pr) => pr.lookupKey)),
    limit: 10,
  });
  const existingKeys = new Set(existingPrices.data.map((p) => p.lookup_key));

  for (const plan of PLANS) {
    const missing = plan.prices.filter((p) => !existingKeys.has(p.lookupKey));
    if (missing.length === 0) {
      console.log(`✓ ${plan.name}: all prices already exist, skipping.`);
      continue;
    }

    const search = await stripe.products.search({
      query: `name:'${plan.name}' AND active:'true'`,
    });
    const product =
      search.data[0] ??
      (await stripe.products.create({
        name: plan.name,
        description: plan.description,
        metadata: { tier: plan.tier },
      }));
    console.log(`Product ready: ${plan.name} (${product.id})`);

    for (const p of missing) {
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: p.unitAmount,
        currency: "eur",
        recurring: { interval: p.interval },
        lookup_key: p.lookupKey,
        metadata: { tier: plan.tier, billing: p.interval === "month" ? "monthly" : "yearly" },
      });
      console.log(
        `  Created price ${p.lookupKey}: €${(p.unitAmount / 100).toFixed(2)}/${p.interval} (${price.id})`,
      );
    }
  }

  console.log("✓ Seeding complete. Webhooks will sync data to the database automatically.");
}

main().catch((err) => {
  console.error("Error seeding products:", err.message ?? err);
  process.exit(1);
});
