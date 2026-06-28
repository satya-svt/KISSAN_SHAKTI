// ─────────────────────────────────────────────────────────────────────────────
//  KissanShakthi — MOCK Crop Service  (no backend required)
// ─────────────────────────────────────────────────────────────────────────────

const delay = (ms = 400) => new Promise((res) => setTimeout(res, ms));

let MOCK_CROPS = [];

export const getCrops = async () => {
  await delay();
  return [...MOCK_CROPS];
};

export const createCrop = async (cropData) => {
  await delay(500);
  const newCrop = {
    id: `crop-${Date.now()}`,
    ...cropData,
    quantity_kg: cropData.quantity,
    price_per_kg: cropData.price,
    harvest_date: cropData.harvestDate,
  };
  MOCK_CROPS.push(newCrop);
  return { data: newCrop };
};

export const updateCrop = async (id, cropData) => {
  await delay(400);
  MOCK_CROPS = MOCK_CROPS.map((c) => (c.id === id ? { ...c, ...cropData } : c));
  return { data: MOCK_CROPS.find((c) => c.id === id) };
};

export const deleteCrop = async (id) => {
  await delay(300);
  MOCK_CROPS = MOCK_CROPS.filter((c) => c.id !== id);
  return { success: true };
};
