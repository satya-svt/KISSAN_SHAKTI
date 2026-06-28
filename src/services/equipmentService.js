// ─────────────────────────────────────────────────────────────────────────────
//  KissanShakthi — MOCK Equipment Service  (no backend required)
// ─────────────────────────────────────────────────────────────────────────────

const delay = (ms = 400) => new Promise((res) => setTimeout(res, ms));

let MOCK_EQUIPMENT = [];
let MOCK_RENTAL_REQUESTS = [];

export const getEquipment = async () => {
  await delay();
  return [...MOCK_EQUIPMENT];
};

export const createEquipment = async (equipmentData) => {
  await delay(500);
  const newItem = {
    id: `eq-${Date.now()}`,
    status: 'available',
    ...equipmentData,
  };
  MOCK_EQUIPMENT.push(newItem);
  return { data: newItem };
};

export const updateEquipment = async (id, equipmentData) => {
  await delay(400);
  MOCK_EQUIPMENT = MOCK_EQUIPMENT.map((e) => (e.id === id ? { ...e, ...equipmentData } : e));
  return { data: MOCK_EQUIPMENT.find((e) => e.id === id) };
};

export const deleteEquipment = async (id) => {
  await delay(300);
  MOCK_EQUIPMENT = MOCK_EQUIPMENT.filter((e) => e.id !== id);
  return { success: true };
};

export const getRentalRequests = async () => {
  await delay();
  return [...MOCK_RENTAL_REQUESTS];
};
