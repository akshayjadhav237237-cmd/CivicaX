/**
 * Hardcoded demo credentials and users for instant offline / mock authentication.
 * Bypasses database queries for all demo accounts.
 */
const DEMO_USERS = [
  {
    id: 'demo-citizen-id-001',
    name: 'Priya Citizen',
    email: 'citizen@civicax.demo',
    role: 'citizen',
    city: 'Lonavla',
    phone: '+919876543210',
    smsAlertsEnabled: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'demo-dept-id-002',
    name: 'Ramesh Dept',
    email: 'dept@civicax.demo',
    role: 'department_op',
    city: 'Lonavla',
    phone: '+919876543211',
    smsAlertsEnabled: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'demo-gov-id-003',
    name: 'Collector Singh',
    email: 'gov@civicax.demo',
    role: 'government',
    city: 'Pune',
    phone: '+919876543212',
    smsAlertsEnabled: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'demo-admin-id-004',
    name: 'Admin CivicaX',
    email: 'admin@civicax.demo',
    role: 'admin',
    city: 'Lonavla',
    phone: '+919876543213',
    smsAlertsEnabled: true,
    createdAt: new Date().toISOString()
  }
];

const DEMO_USERS_BY_EMAIL = DEMO_USERS.reduce((acc, user) => {
  acc[user.email.toLowerCase()] = user;
  return acc;
}, {});

const DEMO_USERS_BY_ID = DEMO_USERS.reduce((acc, user) => {
  acc[user.id] = user;
  return acc;
}, {});

function getDemoUserByEmail(email) {
  if (!email) return null;
  return DEMO_USERS_BY_EMAIL[email.toLowerCase().trim()] || null;
}

function getDemoUserById(id) {
  if (!id) return null;
  return DEMO_USERS_BY_ID[id] || null;
}

module.exports = {
  DEMO_USERS,
  DEMO_USERS_BY_EMAIL,
  DEMO_USERS_BY_ID,
  getDemoUserByEmail,
  getDemoUserById,
};
