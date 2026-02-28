import { useEffect, useState } from "react";
import { Search, Edit, Trash2, Plus, Phone, Mail, FileText, MapPin } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { collection, getDocs, deleteDoc, doc, query, where } from "firebase/firestore";
import { getDB } from "../firebase";
import "./Parties.css";

function Parties() {
  const db = getDB();
  const [parties, setParties] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchParties = async () => {
      try {
        const q = query(collection(db, "parties"), where("companyId", "==", JSON.parse(localStorage.getItem('loggedCompany'))?.id)); const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setParties(data);
      } catch (error) {
        console.error("Error fetching parties: ", error);
      }
    };
    fetchParties();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this party?")) {
      try {
        await deleteDoc(doc(db, "parties", id));
        setParties(parties.filter((p) => p.id !== id));
      } catch (error) {
        console.error("Error deleting party: ", error);
      }
    }
  };

  const handleEdit = (id) => {
    navigate(`/edit-party/${id}`);
  };

  const filtered = parties.filter((p) =>
    Object.values(p).some((val) =>
      String(val).toLowerCase().includes(search.toLowerCase()),
    ),
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

        <Link
          to="/add-party"
          className="btn btn-outline-primary btn-icon parties-add-btn"
          title="Add Party"
        >
          <Plus size={23} />
        </Link>
      </div>

      <div className="content-below-fixed parties-content">
        <div className="grid grid-2">
          {filtered.length > 0 ? (
            filtered.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/party/${p.id}`)}
                className="party-card"
              >
                <div className="party-card-header">
                  <h4 className="party-card-title">{p.name}</h4>
                  <div className="party-card-actions">
                    <button
                      className="btn party-card-action-btn edit-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(p.id);
                      }}
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="btn party-card-action-btn delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(p.id);
                      }}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="party-card-details">
                  <div className="party-detail-row">
                    <div className="party-detail-icon"><Phone size={14} /></div>
                    <p>{p.mobile}</p>
                  </div>
                  <div className="party-detail-row">
                    <div className="party-detail-icon"><MapPin size={14} /></div>
                    <p>{p.address || "N/A"}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-parties-message">No parties found.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Parties;
