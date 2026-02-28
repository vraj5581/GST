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
    // If they have not configured their own database, provide a dummy isolated environment
    // to GUARANTEE their data is not saved to the owner's main system DB!
    const dummyId = `tenant_dummy`;
    try {
      const existingApps = getApps();
      let tenantApp = existingApps.find(a => a.name === dummyId);
      if (!tenantApp) {
        tenantApp = initializeApp({
          apiKey: "fake-security-key",
          authDomain: "fake-tenant.firebaseapp.com",
          projectId: "fake-tenant-database",
          storageBucket: "fake-tenant-database.appspot.com",
          messagingSenderId: "000000000000",
          appId: "1:000000000:web:0000000000"
        }, dummyId);
      }
      return getFirestore(tenantApp);
    } catch(e) {
      console.error("Dummy init error", e);
      return mainDb; // Fallback just to not crash react
    }
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