import { Routes, Route, NavLink, useLocation, Navigate } from "react-router-dom";
import { Users, Package, FileText, Menu, X, LogOut, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { doc, onSnapshot, collection, getDocs, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

import AddParty from "./pages/AddParty";
import Parties from "./pages/Parties";
import PartyDetails from "./pages/PartyDetails";
import Products from "./pages/Products";
import AddProduct from "./pages/AddProduct";
import ProductDetails from "./pages/ProductDetails";
import Vouchers from "./pages/Vouchers";
import AddVoucher from "./pages/AddVoucher";
import VoucherPrint from "./pages/VoucherPrint";
import VendorDashboard from "./vendor/VendorDashboard";
import CompanyLogin from "./CompanyLogin";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggedCompany, setLoggedCompany] = useState(() => {
    const savedCompany = localStorage.getItem('loggedCompany');
    if (savedCompany) {
      try {
        return JSON.parse(savedCompany);
      } catch (e) {
        console.error("Failed to parse saved company");
        return null;
      }
    }
    return null;
  });

  const handleCompanyLogin = (companyData) => {
    setLoggedCompany(companyData);
    localStorage.setItem('loggedCompany', JSON.stringify(companyData));
  };

  const handleCompanyLogout = () => {
    setLoggedCompany(null);
    localStorage.removeItem('loggedCompany');
  };

  // Real-time listener: kick user out instantly if vendor deactivates them
  useEffect(() => {
    if (!loggedCompany || !loggedCompany.id) return;
    
    const unsubscribe = onSnapshot(doc(db, "companies", loggedCompany.id), (docSnapshot) => {
      if (!docSnapshot.exists() || docSnapshot.data().isActive === false) {
        setLoggedCompany(null);
        localStorage.removeItem('loggedCompany');
        alert("Your account has been deactivated by the administrator.");
      }
    });

    return () => unsubscribe();
  }, [loggedCompany?.id]);

  // Run a one-time sweep to attach any orphaned data to this company
  useEffect(() => {
    if (!loggedCompany || !loggedCompany.id) return;
    
    // Only run this scan once per session to save Firestore reads
    if (sessionStorage.getItem('orphanedDataScanned') === 'true') return;
    
    const attachOrphanedData = async () => {
      try {
        const collectionsToScan = ["parties", "products", "vouchers"];
        let migratedCount = 0;
        
        for (const colName of collectionsToScan) {
          const snapshot = await getDocs(collection(db, colName));
          for (const docSnap of snapshot.docs) {
            const docData = docSnap.data();
            // If the record exists but has no companyId, it's from before the multi-tenant upgrade
            if (!docData.companyId) {
              await updateDoc(doc(db, colName, docSnap.id), {
                companyId: loggedCompany.id
              });
              migratedCount++;
            }
          }
        }
        
        if (migratedCount > 0) {
          console.log(`Successfully attached ${migratedCount} orphaned legacy records to ${loggedCompany.companyName}.`);
        }
        sessionStorage.setItem('orphanedDataScanned', 'true');
      } catch (error) {
        console.error("Error migrating orphaned data:", error);
      }
    };

    attachOrphanedData();
  }, [loggedCompany]);

  const location = useLocation();

  // Dynamic Title Management
  useEffect(() => {
    let pageName = "Dashboard";
    const path = location.pathname;

    if (path.startsWith("/vendor")) {
      pageName = "Vendor Dashboard";
    } else if (!loggedCompany) {
      pageName = "Login";
    } else if (path === "/") {
      pageName = "Parties";
    } else if (path.startsWith("/add-party") || path.startsWith("/edit-party")) {
      pageName = "Manage Party";
    } else if (path.startsWith("/party/")) {
      pageName = "Party Details";
    } else if (path === "/products") {
      pageName = "Products";
    } else if (path.startsWith("/add-product") || path.startsWith("/edit-product")) {
      pageName = "Manage Product";
    } else if (path.startsWith("/product/")) {
      pageName = "Product Details";
    } else if (path === "/vouchers") {
      pageName = "Vouchers";
    } else if (path.startsWith("/add-voucher")) {
      pageName = "Manage Voucher";
    } else if (path.startsWith("/voucher-print")) {
      pageName = "Print Voucher";
    }

    const companySuffix = (loggedCompany && !path.startsWith("/vendor")) 
      ? loggedCompany.companyName 
      : "Billing App";
      
    document.title = `${pageName} - ${companySuffix}`;
  }, [location.pathname, loggedCompany]);

  const isMainPage = ["/", "/products", "/vouchers"].includes(location.pathname);

  const isVendorRoute = location.pathname.startsWith("/vendor");

  if (isVendorRoute) {
    return (
      <Routes>
        <Route path="/vendor/dashboard" element={<VendorDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // If NOT a vendor route, and NO company is logged in, show company login
  if (!loggedCompany) {
    return (
      <Routes>
        <Route path="*" element={<CompanyLogin onLogin={handleCompanyLogin} />} />
      </Routes>
    );
  }

  return (
    <div className="app-container">
        {/* Mobile Overlay */}
        <div 
          className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
          onClick={() => setSidebarOpen(false)}
        ></div>

        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", position: "relative" }}>
              <span style={{ fontWeight: "bold", fontSize: "1.5rem", letterSpacing: "1px" ,paddingRight:"1.5rem"}}>{loggedCompany?.companyName || "COMPANY"}</span>
              <button 
                className="btn btn-icon desktop-hide" 
                onClick={() => setSidebarOpen(false)}
                style={{ position: "absolute", right: "-0.5rem", background: "transparent", color: "var(--text-inverse)", padding: "0.25rem" }}
              >
                <X size={28} />
              </button>
            </div>

          </div>
          <nav className="sidebar-nav">
            <NavLink 
              to="/" 
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Users size={20} />
              <span>Parties</span>
            </NavLink>
            <NavLink 
              to="/products" 
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Package size={20} />
              <span>Products</span>
            </NavLink>
            <NavLink 
              to="/vouchers" 
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              onClick={() => setSidebarOpen(false)}
            >
              <FileText size={20} />
              <span>Vouchers</span>
            </NavLink>
          </nav>
          
          <div style={{ marginTop: "auto", padding: "1rem" }}>
            <button 
              onClick={handleCompanyLogout}
              style={{
                width: "100%", padding: "0.75rem", background: "rgba(239, 68, 68, 0.1)", 
                color: "#ff8f8f", border: "1px solid rgba(239, 68, 68, 0.2)", 
                borderRadius: "8px", display: "flex", alignItems: "center", 
                justifyContent: "center", gap: "0.5rem", cursor: "pointer",
                fontWeight: "600", transition: "all 0.2s"
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)"; e.currentTarget.style.color = "#fff"; }}
              onMouseOut={(e) => { e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"; e.currentTarget.style.color = "#ff8f8f"; }}
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </aside>

        <main className="main-content">
          {isMainPage && !sidebarOpen && (
            <div className="mobile-menu-toggle">
              <button 
                className="btn btn-icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{ 
                  background: "transparent", 
                  color: sidebarOpen ? "var(--text-inverse)" : "var(--text-primary)", 
                  padding: "0.5rem",
                  transition: "color 0.3s"
                }}
              >
                <Menu size={24} />
              </button>
            </div>
          )}

          <div className="page-content">
            <Routes>
              <Route path="/" element={<Parties />} />
              <Route path="/add-party" element={<AddParty />} />
              <Route path="/edit-party/:id" element={<AddParty />} />
              <Route path="/party/:id" element={<PartyDetails />} />
              
              <Route path="/products" element={<Products />} />
              <Route path="/add-product" element={<AddProduct />} />
              <Route path="/edit-product/:id" element={<AddProduct />} />
              <Route path="/product/:id" element={<ProductDetails />} />

              <Route path="/vouchers" element={<Vouchers />} />
              <Route path="/add-voucher" element={<AddVoucher />} />
              <Route path="/add-voucher/:id" element={<AddVoucher />} />
              <Route path="/voucher-print/:id" element={<VoucherPrint />} />
              
              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
    </div>
  );
}

export default App;
