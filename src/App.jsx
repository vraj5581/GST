import { Routes, Route, NavLink, useLocation } from "react-router-dom";
import { Users, Package, FileText, Menu } from "lucide-react";
import { useState } from "react";

import AddParty from "./pages/AddParty";
import Parties from "./pages/Parties";
import PartyDetails from "./pages/PartyDetails";
import Products from "./pages/Products";
import Vouchers from "./pages/Vouchers";

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
            <h2>GST Billing</h2>
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
          {/* Mobile Menu Toggle - visible only on main pages */}
          {isMainPage && (
            <div className="mobile-menu-toggle" style={{ position: "fixed", top: "0.8rem", left: "1rem", zIndex: 1100 }}>
              <button 
                className="btn btn-icon" 
                onClick={() => setSidebarOpen(true)}
                style={{ background: "transparent", color: "var(--text-primary)", padding: "0.5rem" }}
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
              <Route path="/vouchers" element={<Vouchers />} />
            </Routes>
          </div>
        </main>
    </div>
  );
}

export default App;
