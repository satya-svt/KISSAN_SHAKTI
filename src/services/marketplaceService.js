// ─────────────────────────────────────────────────────────────────────────────
//  KissanShakthi — MOCK Marketplace Service  (no backend required)
// ─────────────────────────────────────────────────────────────────────────────

const delay = (ms = 400) => new Promise((res) => setTimeout(res, ms));

export const getMarketplaceCrops = async () => {
  await delay();
  return [];
};
