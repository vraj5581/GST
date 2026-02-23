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
    const parties =
      JSON.parse(localStorage.getItem("parties")) ||
      JSON.parse(localStorage.getItem("clients")) ||
      [];
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
      <header className="fixed-header party-details-header">
        <button
          className="btn btn-outline btn-icon party-details-back-btn"
          onClick={() => navigate("/")}
          title="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <h3 className="party-details-title">Party Details</h3>
      </header>

      <div className="content-below-fixed">
        <div className="party-details-wrapper">
          <h2 className="party-details-name">{party.name}</h2>

          <div className="grid grid-2 party-details-grid">
            <div className="detail-item">
              <label className="form-label party-details-label">
                Mobile Number
              </label>
              <p className="party-details-value">{party.mobile}</p>
            </div>

            <div className="detail-item">
              <label className="form-label party-details-label">
                Email Address
              </label>
              <p className="party-details-value-break">{party.email}</p>
            </div>

            <div className="detail-item">
              <label className="form-label party-details-label">
                GST Number
              </label>
              <p className="party-details-value">{party.gst || "N/A"}</p>
            </div>

            <div className="detail-item party-details-address-col">
              <label className="form-label party-details-label">Address</label>
              <p className="party-details-address-value">
                {party.address || "N/A"}
              </p>
            </div>
          </div>

          <div className="party-details-actions">
            <button
              className="btn btn-outline-primary btn-mobile-flex"
              onClick={() => navigate(`/edit-party/${id}`)}
            >
              Edit
            </button>
            <button
              className="btn btn-outline-danger btn-mobile-flex"
              onClick={handleDelete}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PartyDetails;
