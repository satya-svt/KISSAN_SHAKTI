// ─────────────────────────────────────────────────────────────────────────────
//  KissanShakthi — LocalStorage-backed Mock Auth Service
//  Simulates a backend database of users using window.localStorage.
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_USERS_KEY = 'kissan_mock_users_db';

// Default demo users list (only Admin)
const DEFAULT_DEMO_USERS = [
  {
    id: 'mock-admin-001',
    name: 'Admin KissanShakthi',
    role: 'admin',
    phone: '9000000000',
    email: 'admin@kissan.com',
    password: 'admin@123',
    isVerified: true,
    verificationStep: 'completed',
  },
];

// Helper to get users database from localStorage
const getUsersDb = () => {
  const data = localStorage.getItem(MOCK_USERS_KEY);
  if (!data) {
    // Initialize default users if db doesn't exist
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(DEFAULT_DEMO_USERS));
    return DEFAULT_DEMO_USERS;
  }
  try {
    const parsed = JSON.parse(data);
    // Auto-clean any old demo users that exist in localStorage
    const filtered = parsed.filter(u => 
      u.id !== 'mock-buyer-001' && 
      u.id !== 'mock-farmer-001' && 
      u.id !== 'mock-laborer-001'
    );
    if (filtered.length !== parsed.length) {
      localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(filtered));
    }
    return filtered;
  } catch (e) {
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(DEFAULT_DEMO_USERS));
    return DEFAULT_DEMO_USERS;
  }
};

// Helper to save users database to localStorage
const saveUsersDb = (db) => {
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(db));
};

// Artificial delay to simulate network latency
const delay = (ms = 400) => new Promise((res) => setTimeout(res, ms));

/**
 * login(role, identifier, password)
 */
export const login = async (role, identifier, password) => {
  await delay();

  const db = getUsersDb();
  const cleanId = (identifier || '').trim().toLowerCase();
  const cleanPw = (password || '').trim();

  const found = db.find((u) => {
    if (u.role !== role) return false;
    const matchPhone = u.phone === cleanId;
    const matchEmail = (u.email || '').toLowerCase() === cleanId;
    return (matchPhone || matchEmail) && u.password === cleanPw;
  });

  if (!found) {
    throw new Error('Invalid login credentials.');
  }

  // Return safe copy without password
  const { password: _pw, ...safeUser } = found;
  return {
    user: safeUser,
    token: `mock-token-${safeUser.id}-${Date.now()}`,
  };
};

/**
 * register(registrationData)
 */
export const register = async (registrationData) => {
  await delay(600);

  const db = getUsersDb();
  const { name, phone, email, role, region, daily_rate, skills, companyName, password } = registrationData;

  const cleanPhone = (phone || '').trim();
  const cleanEmail = (email || '').trim();

  // Duplicate checks
  const phoneExists = db.some((u) => u.phone === cleanPhone && u.role === role);
  if (phoneExists) {
    throw new Error('An account with this phone number already exists for this role.');
  }

  if (cleanEmail) {
    const emailExists = db.some((u) => u.email.toLowerCase() === cleanEmail.toLowerCase() && u.role === role);
    if (emailExists) {
      throw new Error('An account with this email address already exists for this role.');
    }
  }

  const newUser = {
    id: `mock-${role}-${Date.now()}`,
    name: (name || '').trim(),
    role,
    phone: cleanPhone,
    email: cleanEmail,
    password: password || 'default@123',
    isVerified: role === 'admin' || role === 'buyer', // Admins and Buyers are auto-verified in mock flow
    verificationStep: (role === 'admin' || role === 'buyer') ? 'completed' : 'onboarding',
    region: region || '',
    ...(role === 'laborer' && { daily_rate: Number(daily_rate), skills: skills || [] }),
    ...(role === 'buyer' && { companyName: companyName || '' }),
  };

  db.push(newUser);
  saveUsersDb(db);

  // Return safe copy without password
  const { password: _pw, ...safeUser } = newUser;
  return {
    user: safeUser,
    token: `mock-token-${safeUser.id}-${Date.now()}`,
  };
};

export const logout = async () => {
  return { success: true };
};
