import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Edit, Trash2, ArrowLeft } from "lucide-react";
import "./Parties.css";

function PartyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [party, setParty] = useState(null);

  useEffect(() => {
    // Try 'parties' first, then 'clients'
    const parties = JSON.parse(localStorage.getItem("parties")) || JSON.parse(localStorage.getItem("clients")) || [];
    if (parties[id]) {
      setParty(parties[id]);
    }
  }, [id]);

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this party?")) {
      let parties = JSON.parse(localStorage.getItem("parties"));
      if (!parties) {
         parties = JSON.parse(localStorage.getItem("clients")) || [];
      }
      const updated = parties.filter((_, i) => i !== parseInt(id));
      localStorage.setItem("parties", JSON.stringify(updated));
      navigate("/");
    }
  };

  if (!party) return <div>Loading...</div>;

  return (
    <div className="parties-page">
      <header className="fixed-header" style={{ justifyContent: "flex-start" }}>
        <button className="btn btn-outline btn-icon" onClick={() => navigate("/")} style={{ flexShrink: 0 }} title="Back">
          <ArrowLeft size={20} />
        </button>
        <h3 style={{ margin: 0, border: "none" }}>Party Details</h3>
      </header>
      
      <div className="content-below-fixed">
      <div style={{ padding: "1rem" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem", color: "var(--color-primary)" }}>{party.name}</h2>
        
        <div className="grid grid-2" style={{ gap: "2rem" }}>
          <div className="detail-item">
            <label className="form-label" style={{ marginBottom: "0.25rem" }}>Mobile Number</label>
            <p style={{ fontSize: "1.1rem" }}>{party.mobile}</p>
          </div>
          
          <div className="detail-item">
            <label className="form-label" style={{ marginBottom: "0.25rem" }}>Email Address</label>
            <p style={{ fontSize: "1.1rem", wordBreak: "break-word" }}>{party.email}</p>
          </div>
          
          <div className="detail-item">
            <label className="form-label" style={{ marginBottom: "0.25rem" }}>GST Number</label>
            <p style={{ fontSize: "1.1rem" }}>{party.gst || "N/A"}</p>
          </div>
          
          <div className="detail-item" style={{ gridColumn: "1 / -1" }}>
            <label className="form-label" style={{ marginBottom: "0.25rem" }}>Address</label>
            <p style={{ fontSize: "1.1rem", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{party.address || "N/A"}</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem", marginTop: "3rem", borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem" }}>
          <button 
            className="btn btn-primary btn-mobile-flex" 
            onClick={() => navigate(`/edit-party/${id}`)}
          >
            <Edit size={18} /> Edit
          </button>
          <button 
            className="btn btn-danger btn-mobile-flex" 
            onClick={handleDelete}
          >
            <Trash2 size={18} /> Delete
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}

export default PartyDetails;
