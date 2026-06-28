// ─────────────────────────────────────────────────────────────────────────────
//  KissanShakthi — MOCK Worker & Jobs Service  (no backend required)
// ─────────────────────────────────────────────────────────────────────────────

const delay = (ms = 400) => new Promise((res) => setTimeout(res, ms));

let MOCK_WORKERS = [];
let MOCK_JOBS = [];

// ── Workers ───────────────────────────────────────────────────────────────────
export const getWorkers = async () => {
  await delay();
  return [...MOCK_WORKERS];
};

export const createWorker = async (workerData) => {
  await delay(500);
  const newWorker = { id: `worker-${Date.now()}`, ...workerData };
  MOCK_WORKERS.push(newWorker);
  return { data: newWorker };
};

export const updateWorker = async (id, workerData) => {
  await delay(400);
  MOCK_WORKERS = MOCK_WORKERS.map((w) => (w.id === id ? { ...w, ...workerData } : w));
  return { data: MOCK_WORKERS.find((w) => w.id === id) };
};

export const deleteWorker = async (id) => {
  await delay(300);
  MOCK_WORKERS = MOCK_WORKERS.filter((w) => w.id !== id);
  return { success: true };
};

// ── Jobs ──────────────────────────────────────────────────────────────────────
export const getJobs = async () => {
  await delay();
  return [...MOCK_JOBS];
};

export const createJob = async (jobData) => {
  await delay(500);
  const newJob = {
    id: `job-${Date.now()}`,
    ...jobData,
    status: 'open',
    assigned_worker_id: jobData.assignedWorkerId || null,
    posted_at: new Date().toISOString().split('T')[0],
  };
  MOCK_JOBS.push(newJob);
  return { data: newJob };
};

export const updateJob = async (id, jobData) => {
  await delay(400);
  MOCK_JOBS = MOCK_JOBS.map((j) => (j.id === id ? { ...j, ...jobData } : j));
  return { data: MOCK_JOBS.find((j) => j.id === id) };
};

export const deleteJob = async (id) => {
  await delay(300);
  MOCK_JOBS = MOCK_JOBS.filter((j) => j.id !== id);
  return { success: true };
};

// ── Assignment Flow ───────────────────────────────────────────────────────────
export const applyForJob = async (jobId, workerId) => {
  await delay(400);
  MOCK_JOBS = MOCK_JOBS.map((j) =>
    j.id === jobId ? { ...j, applicant_id: workerId } : j
  );
  return { success: true };
};

export const assignWorkerToJob = async (jobId, workerId) => {
  await delay(400);
  MOCK_JOBS = MOCK_JOBS.map((j) =>
    j.id === jobId ? { ...j, assigned_worker_id: workerId, status: 'assigned' } : j
  );
  return { success: true };
};

export const unassignWorker = async (jobId) => {
  await delay(300);
  MOCK_JOBS = MOCK_JOBS.map((j) =>
    j.id === jobId ? { ...j, assigned_worker_id: null, status: 'open' } : j
  );
  return { success: true };
};
