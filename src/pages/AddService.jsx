import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Select from "react-select";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import { getDB } from "../firebase";
import "./AddService.css";

function AddService() {
  const db = getDB();
  const { id } = useParams();
  const navigate = useNavigate();

  const [service, setService] = useState({
    productId: "",
    productName: "",
    serviceType: "",
    servicePrice: "",
  });

  const [products, setProducts] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const q = query(
          collection(db, "products"),
          where(
            "companyId",
            "==",
            JSON.parse(localStorage.getItem("loggedCompany"))?.id,
          ),
        );
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((doc) => ({
          value: doc.id,
          label: doc.data().name,
        }));
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (id) {
      const fetchService = async () => {
        try {
          const docRef = doc(db, "services", id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setService(docSnap.data());
          }
        } catch (error) {
          console.error("Error fetching service:", error);
        }
      };
      fetchService();
    }
  }, [id]);

  const validate = () => {
    const newErrors = {};

    if (!service.productId) {
      newErrors.productId = "Product Name is required";
    }

    if (!service.serviceType.trim()) {
      newErrors.serviceType = "Service Type is required";
    }

    if (!service.servicePrice) {
      newErrors.servicePrice = "Service Price is required";
    } else if (
      isNaN(service.servicePrice) ||
      Number(service.servicePrice) < 0
    ) {
      newErrors.servicePrice = "Price must be a valid positive number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    let { name, value, type } = e.target;

    if (type === "number" && typeof value === "string" && value.includes("-")) {
      value = value.replace(/-/g, "");
    }

    setService({ ...service, [name]: value });

    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      if (id) {
        // Update existing
        const docRef = doc(db, "services", id);
        await updateDoc(docRef, service);
      } else {
        // Create new
        await addDoc(collection(db, "services"), {
          ...service,
          companyId: JSON.parse(localStorage.getItem("loggedCompany"))?.id,
        });
      }
      navigate("/services");
    } catch (error) {
      console.error("Error saving service:", error);
      alert("Failed to save service. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct =
    products.find((p) => p.value === service.productId) || null;

  return (
    <div className="add-service-page">
      <header className="fixed-header add-service-header">
        <button
          className="btn btn-outline btn-icon add-service-back-btn"
          onClick={() => navigate("/services")}
          title="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <h3 className="add-service-title">
          {id ? "Edit Service" : "Add New Service"}
        </h3>
      </header>

      <div className="content-below-fixed">
        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">
                Product Name <span className="required-asterisk">*</span>
              </label>
              <Select
                options={products}
                value={selectedProduct}
                onChange={(selected) => {
                  setService({
                    ...service,
                    productId: selected ? selected.value : "",
                    productName: selected ? selected.label : "",
                  });
                  if (errors.productId) {
                    setErrors({ ...errors, productId: "" });
                  }
                }}
                className={`react-select-container ${errors.productId ? "select-error" : ""}`}
                classNamePrefix="react-select"
                placeholder="Select a Product"
                isClearable
              />
              {errors.productId && (
                <span className="error-text">{errors.productId}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                Service Type <span className="required-asterisk">*</span>
              </label>
              <input
                className={`form-input ${errors.serviceType ? "input-error" : ""}`}
                name="serviceType"
                value={service.serviceType}
                placeholder="Ex: Repair, Installation"
                onChange={handleChange}
              />
              {errors.serviceType && (
                <span className="error-text">{errors.serviceType}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                Service Price (₹) <span className="required-asterisk">*</span>
              </label>
              <input
                className={`form-input ${errors.servicePrice ? "input-error" : ""}`}
                name="servicePrice"
                type="number"
                min="0"
                onKeyDown={(e) => {
                  if (["-", "+", "e", "E"].includes(e.key)) {
                    e.preventDefault();
                  }
                }}
                value={service.servicePrice}
                placeholder="Ex: 500"
                onChange={handleChange}
              />
              {errors.servicePrice && (
                <span className="error-text">{errors.servicePrice}</span>
              )}
            </div>
          </div>

          <div className="add-service-form-actions">
            <button
              type="submit"
              className="btn btn-outline-primary btn-mobile-flex"
              disabled={loading}
            >
              {loading ? "Processing..." : id ? "Update" : "Save"}
            </button>
            <button
              type="button"
              className="btn btn-outline-danger btn-mobile-flex"
              onClick={() => navigate("/services")}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddService;
