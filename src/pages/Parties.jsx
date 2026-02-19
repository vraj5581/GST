import { useEffect, useState } from "react";
import { Search, Edit, Trash2, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

function Parties() {
  const [parties, setParties] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Migrate old 'clients' data to 'parties' if 'parties' doesn't exist yet
    const existingParties = localStorage.getItem("parties");
    if (!existingParties) {
      const oldClients = localStorage.getItem("clients");
      if (oldClients) {
        localStorage.setItem("parties", oldClients);
      }
    }

    const data = JSON.parse(localStorage.getItem("parties")) || [];
    setParties(data);
  }, []);

  const handleDelete = (index) => {
    if (window.confirm("Are you sure you want to delete this party?")) {
      const updated = parties.filter((_, i) => i !== index);
      localStorage.setItem("parties", JSON.stringify(updated));
      setParties(updated);
    }
  };

  const handleEdit = (index) => {
    navigate(`/edit-party/${index}`);
  };

  const filtered = parties.map((party, index) => ({ ...party, originalIndex: index }))
                         .filter(p => 
                           Object.values(p).some(val => 
                             String(val).toLowerCase().includes(search.toLowerCase())
                           )
                         );

  return (
    <div>
      <div className="fixed-header">
        <div className="search-bar w-full-search" style={{ flex: 1, marginBottom: 0 }}>
          <Search className="search-icon" size={18} />
          <input
            className="form-input"
            value={search}
            placeholder="Ex: Search by Name, Mobile..."
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <Link to="/add-party" className="btn btn-primary btn-icon" style={{ flexShrink: 0 }} title="Add Party">
          <Plus size={16} />
        </Link>
      </div>

      <div className="content-below-fixed">
      <div className="grid grid-2">
        {filtered.length > 0 ? (
          filtered.map((p) => (
            <div 
              key={p.originalIndex} 
              onClick={() => navigate(`/party/${p.originalIndex}`)}
              style={{ 
                border: "1px solid var(--border-color)", 
                padding: "0.5rem", 
                borderRadius: "var(--radius-md)",
                background: "#ffffff",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "var(--shadow-md)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "0.5rem" }}>
                <h4 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{p.name}</h4>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button 
                    className="btn" 
                    style={{ padding: "0.4rem", color: "var(--color-primary)", background: "transparent", border: "none", boxShadow: "none" }}
                    onClick={(e) => { e.stopPropagation(); handleEdit(p.originalIndex); }}
                    title="Edit"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    className="btn" 
                    style={{ padding: "0.4rem", color: "var(--color-danger)", background: "transparent", border: "none", boxShadow: "none" }}
                    onClick={(e) => { e.stopPropagation(); handleDelete(p.originalIndex); }}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                <p style={{ margin: "4px 0" }}><strong>Mobile:</strong> {p.mobile}</p>
                <p style={{ margin: "4px 0" }}><strong>Email:</strong> {p.email}</p>
                <p style={{ margin: "4px 0" }}><strong>GST:</strong> {p.gst || "N/A"}</p>
                <p style={{ margin: "4px 0" }}><strong>Address:</strong> {p.address || "N/A"}</p>
              </div>
            </div>
          ))
        ) : (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
            No parties found.
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

export default Parties;
