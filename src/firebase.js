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

const parseConfigStr = (raw) => {
  if (!raw || typeof raw !== 'string') return null;
  try {
    const config = JSON.parse(raw);
    if (config && config.projectId) return config;
  } catch (e) {
    // Attempt to extract JS object literal if they pasted the whole variable declaration
    try {
      const start = raw.indexOf('{');
      const end = raw.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        const objStr = raw.substring(start, end + 1);
        const relaxed = new Function('return ' + objStr)();
        if (relaxed && relaxed.projectId) return relaxed;
      }
    } catch (e2) {
      console.error("Failed to parse relaxed config:", e2);
    }
  }
  return null;
};

export const getTenantDb = (companyId, configStr) => {
  const config = parseConfigStr(configStr);
  if (!config) {
    alert("Missing or Invalid Firebase Config for this company. Please update the exact JSON in Vendor Dashboard. App will not save data to the vendor's main database anymore to protect privacy!");
    throw new Error("Missing Firebase Config");
  }

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
    alert("Tenant DP init error: " + e.message);
    throw e;
  }
};

export const getDB = () => {
  try {
    const raw = localStorage.getItem('loggedCompany');
    if (!raw) return mainDb;
    const company = JSON.parse(raw);
    return getTenantDb(company.id, company.firebaseConfig);
  } catch (e) {
    console.error("getDB error:", e);
    throw e;
  }
};