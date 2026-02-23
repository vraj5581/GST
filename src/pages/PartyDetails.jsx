import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Edit, Trash2, ArrowLeft } from "lucide-react";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import "./Parties.css";

function PartyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [party, setParty] = useState(null);

  useEffect(() => {
    const fetchParty = async () => {
      try {
        const docRef = doc(db, "parties", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setParty(docSnap.data());
        } else {
          console.log("No such party!");
          navigate("/");
        }
      } catch (error) {
        console.error("Error fetching party:", error);
      }
    };
    if (id) {
      fetchParty();
    }
  }, [id, navigate]);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this party?")) {
      try {
        await deleteDoc(doc(db, "parties", id));
        navigate("/");
      } catch (error) {
        console.error("Error deleting party:", error);
      }
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
