import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, IndianRupee, Package, Briefcase } from "lucide-react";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { getDB } from "../firebase";
import "./ServiceDetails.css";

function ServiceDetails() {
  const db = getDB();
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);

  useEffect(() => {
    const fetchService = async () => {
      try {
        const docRef = doc(db, "services", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setService(docSnap.data());
        } else {
          console.log("No such service!");
          navigate("/services");
        }
      } catch (error) {
        console.error("Error fetching service:", error);
      }
    };
    if (id) {
      fetchService();
    }
  }, [id, navigate]);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      try {
        await deleteDoc(doc(db, "services", id));
        navigate("/services");
      } catch (error) {
        console.error("Error deleting service:", error);
      }
    }
  };

  const handleEdit = () => {
    navigate(`/edit-service/${id}`);
  };

  if (!service) return <div>Loading...</div>;

  return (
    <div className="services-page">
      <header className="fixed-header service-details-header">
        <button
          className="btn btn-outline btn-icon service-details-back-btn"
          onClick={() => navigate("/services")}
          title="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <h3 className="service-details-title">Service Details</h3>
      </header>

      <div className="content-below-fixed">
        <div className="service-details-wrapper">
          <h2 className="service-details-name">{service.serviceType}</h2>

          <div className="grid grid-2 service-details-grid">
            <div className="detail-item">
              <label className="form-label service-details-label">
                Product Name
              </label>
              <div className="party-detail-row">
                <div className="party-detail-icon">
                  <Package size={14} />
                </div>
                <p className="service-details-value">
                  {service.productName || "No Product"}
                </p>
              </div>
            </div>

            <div className="detail-item">
              <label className="form-label service-details-label">
                Service Price
              </label>
              <div className="party-detail-row">
                <div className="party-detail-icon">
                  <IndianRupee size={14} />
                </div>
                <p className="service-details-value">₹{service.servicePrice}</p>
              </div>
            </div>
          </div>

          <div className="service-details-actions">
            <button
              className="btn btn-outline-primary btn-mobile-flex"
              onClick={handleEdit}
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

export default ServiceDetails;
