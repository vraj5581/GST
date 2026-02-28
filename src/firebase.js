import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your Secondary/Main Firebase config for Vendor auth & companies list
const firebaseConfig = {
  apiKey: "AIzaSy.....",
  authDomain: "billing-app-323f6.firebaseapp.com",
  projectId: "billing-app-323f6",
  storageBucket: "billing-app-323f6.appspot.com",
  messagingSenderId: "258936960912",
  appId: "1:258936960912:web:d4276e4eaba6eacab6e515"
};

// Initialize Main Firebase
const app = initializeApp(firebaseConfig);
export const mainDb = getFirestore(app);

// Dynamic proxy allows any component importing "db" to implicitly interact with the tenant DB
export const db = new Proxy(mainDb, {
  get(target, prop, receiver) {
    const currentDb = getDB();
    const value = currentDb[prop];
    if (typeof value === 'function') {
      return value.bind(currentDb);
    }
    return value;
  },
  has(target, prop) {
    return prop in getDB();
  }
});

const parseConfigStr = (raw) => {
  if (!raw || typeof raw !== 'string') return null;
  try {
    const config = JSON.parse(raw);
    if (config.projectId) return config;
    return null;
  } catch (e) {
    return null;
  }
};

export const getTenantDb = (companyId, configStr) => {
  const config = parseConfigStr(configStr);
  if (!config) return mainDb;

  const tenantId = `tenant_${companyId}`;
  try {
    const existingApps = getApps();
    let tenantApp = existingApps.find(a => a.name === tenantId);
    if (!tenantApp) {
      tenantApp = initializeApp(config, tenantId);
    }
    return getFirestore(tenantApp);
  } catch (e) {
    console.error("Tenant DP init error:", e);
    return mainDb;
  }
};

export const getDB = () => {
  try {
    const raw = localStorage.getItem('loggedCompany');
    if (!raw) return mainDb;
    const company = JSON.parse(raw);
    return getTenantDb(company.id, company.firebaseConfig);
  } catch (e) {
    return mainDb;
  }
};