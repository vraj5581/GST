import { useState, useEffect } from "react";
import {
  Search,
  Edit,
  Trash2,
  Plus,
  DollarSign,
  Briefcase,
  Package,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { getDB } from "../firebase";
import "./Services.css";

function Services() {
  const db = getDB();
  const [services, setServices] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const q = query(
          collection(db, "services"),
          where(
            "companyId",
            "==",
            JSON.parse(localStorage.getItem("loggedCompany"))?.id,
          ),
        );
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setServices(data);
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    };
    fetchServices();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      try {
        await deleteDoc(doc(db, "services", id));
        setServices(services.filter((s) => s.id !== id));
      } catch (error) {
        console.error("Error deleting service:", error);
      }
    }
  };

  const handleEdit = (id) => {
    navigate(`/edit-service/${id}`);
  };

  const filtered = services.filter((s) =>
    Object.values(s).some((val) =>
      String(val).toLowerCase().includes(search.toLowerCase()),
    ),
  );

  return (
    <div className="services-page">
      <div className="fixed-header root-page-header">
        <div className="search-bar w-full-search services-search-wrap">
          <Search className="search-icon" size={18} />
          <input
            className="form-input"
            value={search}
            placeholder="Search by Product, Type..."
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Link
          to="/add-service"
          className="btn btn-outline-primary btn-icon services-add-btn"
          title="Add Service"
        >
          <Plus size={23} />
        </Link>
      </div>

      <div className="content-below-fixed">
        <div className="grid grid-2">
          {filtered.length > 0 ? (
            filtered.map((s) => (
              <div
                key={s.id}
                className="service-card"
                onClick={() => navigate(`/service/${s.id}`)}
              >
                <div className="service-header">
                  <div className="service-title-group">
                    <h4 className="service-title">
                      {s.serviceType || "Service"}
                    </h4>
                  </div>
                  <div className="service-actions">
                    <button
                      className="btn btn-action-edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(s.id);
                      }}
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="btn btn-action-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(s.id);
                      }}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="service-details">
                  <div className="party-detail-row">
                    <div className="party-detail-icon">
                      <Package size={14} />
                    </div>
                    <p>{s.productName || "No Product Selected"}</p>
                  </div>

                  <div className="party-detail-row">
                    <div className="party-detail-icon">
                      <DollarSign size={14} />
                    </div>
                    <p>₹{s.servicePrice}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-services-message">
              No services found, add one to get started!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Services;
