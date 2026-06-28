// ─────────────────────────────────────────────────────────────────────────────
//  KissanShakthi — MOCK Admin Service  (no backend required)
// ─────────────────────────────────────────────────────────────────────────────

const delay = (ms = 400) => new Promise((res) => setTimeout(res, ms));

let MOCK_VERIFICATION_QUEUE = [];
let MOCK_SYNC_LOGS = [];

export const getVerificationQueue = async () => {
  await delay();
  return [...MOCK_VERIFICATION_QUEUE];
};

export const approveUser = async (userId) => {
  await delay(500);
  MOCK_VERIFICATION_QUEUE = MOCK_VERIFICATION_QUEUE.filter((u) => u.id !== userId);
  return { success: true };
};

export const rejectUser = async (userId) => {
  await delay(500);
  MOCK_VERIFICATION_QUEUE = MOCK_VERIFICATION_QUEUE.filter((u) => u.id !== userId);
  return { success: true };
};

export const scanUserDocument = async (userId) => {
  await delay(800);
  MOCK_VERIFICATION_QUEUE = MOCK_VERIFICATION_QUEUE.map((u) =>
    u.id === userId ? { ...u, blacklistStatus: 'passed' } : u
  );
  return { success: true, blacklistStatus: 'passed' };
};

export const getSyncLogs = async () => {
  await delay();
  return [...MOCK_SYNC_LOGS];
};

export const clearSyncLogs = async () => {
  await delay(300);
  MOCK_SYNC_LOGS = [];
  return { success: true };
};
