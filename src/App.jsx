import { Routes, Route, NavLink, useLocation } from "react-router-dom";
import { Users, Package, FileText, Menu, X } from "lucide-react";
import { useState } from "react";

import AddParty from "./pages/AddParty";
import Parties from "./pages/Parties";
import PartyDetails from "./pages/PartyDetails";
import Products from "./pages/Products";
import AddProduct from "./pages/AddProduct";
import ProductDetails from "./pages/ProductDetails";
import Vouchers from "./pages/Vouchers";
import AddVoucher from "./pages/AddVoucher";
import VoucherPrint from "./pages/VoucherPrint";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isMainPage = ["/", "/products", "/vouchers"].includes(location.pathname);

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
              <span style={{ fontWeight: "bold", fontSize: "1.5rem", letterSpacing: "1px" ,paddingRight:"1.5rem"}}>HITNISH</span>
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
            </Routes>
          </div>
        </main>
    </div>
  );
}

export default App;
