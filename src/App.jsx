import { Routes, Route, NavLink, useLocation } from "react-router-dom";
import { Users, Package, FileText, Menu, X } from "lucide-react";
import { useState } from "react";

import AddParty from "./pages/AddParty";
import Parties from "./pages/Parties";
import PartyDetails from "./pages/PartyDetails";
import Products from "./pages/Products";
import AddProduct from "./pages/AddProduct";
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
            {/* Header Content Removed */}
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
          {/* Mobile Menu Toggle - visible on main pages for all devices now */}
          {isMainPage && (
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
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
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
