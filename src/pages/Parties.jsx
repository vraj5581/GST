import { useEffect, useState } from "react";
import { Search, Edit, Trash2, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import "./Parties.css";

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
    <div className="parties-page">
      <div className="fixed-header root-page-header parties-header">
        <div className="search-bar w-full-search parties-search-container">
          <Search className="search-icon" size={18} />
          <input
            className="form-input"
            value={search}
            placeholder="Ex: Search by Name, Mobile..."
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <Link to="/add-party" className="btn btn-primary btn-icon" style={{ flexShrink: 0 }} title="Add Party">
          <Plus size={18} />
        </Link>
      </div>

      <div className="content-below-fixed parties-content">
      <div className="grid grid-2">
        {filtered.length > 0 ? (
          filtered.map((p) => (
            <div 
              key={p.originalIndex} 
              onClick={() => navigate(`/party/${p.originalIndex}`)}
              className="party-card"
            >
              <div className="party-card-header">
                <h4 className="party-card-title">{p.name}</h4>
                <div className="party-card-actions">
                  <button 
                    className="btn party-card-action-btn edit-btn" 
                    onClick={(e) => { e.stopPropagation(); handleEdit(p.originalIndex); }}
                    title="Edit"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    className="btn party-card-action-btn delete-btn" 
                    onClick={(e) => { e.stopPropagation(); handleDelete(p.originalIndex); }}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="party-card-details">
                <p><strong>Mobile:</strong> {p.mobile}</p>
                <p><strong>Email:</strong> {p.email}</p>
                <p><strong>GST:</strong> {p.gst || "N/A"}</p>
                <p><strong>Address:</strong> {p.address || "N/A"}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="no-parties-message">
            No parties found.
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

export default Parties;
