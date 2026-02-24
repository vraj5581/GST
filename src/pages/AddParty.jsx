import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save, ArrowLeft } from "lucide-react";
import { collection, addDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import "./AddParty.css";
function AddParty() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [party, setParty] = useState({
    name: "",
    mobile: "",
    email: "",
    gst: "",
    address: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (id) {
      const fetchParty = async () => {
        try {
          const docRef = doc(db, "parties", id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setParty(docSnap.data());
          }
        } catch (error) {
          console.error("Error fetching party:", error);
        }
      };
      fetchParty();
    }
  }, [id]);

  const validate = () => {
    const newErrors = {};

    if (!party.name.trim()) {
      newErrors.name = "Party Name is required";
    }

    // Mobile Validation (required, 10 digits)
    if (!party.mobile) {
      newErrors.mobile = "Mobile number is required";
    } else if (!/^\d{10}$/.test(party.mobile)) {
      newErrors.mobile = "Mobile number must be 10 digits";
    }

    // Email Validation (required)
    if (!party.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(party.email)) {
      newErrors.email = "Invalid email format";
    }

    // Address Validation (required)
    if (!party.address.trim()) {
      newErrors.address = "Address is required";
    }

    // GST Validation (15 alphanumeric characters standard check)
    // Regex: 2 digits, 5 letters, 4 digits, 1 letter, 1 alphanumeric, Z, 1 alphanumeric
    if (
      party.gst &&
      !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
        party.gst,
      )
    ) {
      newErrors.gst = "Invalid GST Number format (Ex: 22AAAAA0000A1Z5)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Auto-uppercase GST input
    const finalValue = name === "gst" ? value.toUpperCase() : value;

    setParty({ ...party, [name]: finalValue });

    // Clear error when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      if (id) {
        // Update existing
        const docRef = doc(db, "parties", id);
        await updateDoc(docRef, party);
      } else {
        // Create new
        await addDoc(collection(db, "parties"), { ...party, companyId: JSON.parse(localStorage.getItem('loggedCompany'))?.id });
      }
      navigate("/");
    } catch (error) {
      console.error("Error saving party:", error);
      alert("Failed to save party. Check console for details.");
    }
  };

  return (
    <div className="add-party-page">
      <header className="fixed-header add-party-header">
        <button
          className="btn btn-outline btn-icon add-party-back-btn"
          onClick={() => navigate("/")}
          title="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <h3 className="add-party-title">
          {id ? "Edit Party" : "Add New Party"}
        </h3>
      </header>

      <div className="content-below-fixed">
        <form onSubmit={handleSubmit} noValidate>
          {/* Form Content */}
          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">
                Party Name <span className="required-asterisk">*</span>
              </label>
              <input
                className={`form-input ${errors.name ? "input-error" : ""}`}
                name="name"
                value={party.name}
                placeholder="Ex: John Doe Enterprises"
                onChange={handleChange}
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">
                Mobile Number <span className="required-asterisk">*</span>
              </label>
              <input
                className={`form-input ${errors.mobile ? "input-error" : ""}`}
                name="mobile"
                value={party.mobile}
                placeholder="Ex: 9876543210"
                onChange={handleChange}
                type="tel"
                maxLength={10}
              />
              {errors.mobile && (
                <span className="error-text">{errors.mobile}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                Email <span className="required-asterisk">*</span>
              </label>
              <input
                className={`form-input ${errors.email ? "input-error" : ""}`}
                name="email"
                type="email"
                value={party.email}
                placeholder="Ex: john@example.com"
                onChange={handleChange}
              />
              {errors.email && (
                <span className="error-text">{errors.email}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">GST No.</label>
              <input
                className={`form-input ${errors.gst ? "input-error" : ""}`}
                name="gst"
                value={party.gst}
                placeholder="Ex: 22AAAAA0000A1Z5"
                onChange={handleChange}
                maxLength={15}
              />
              {errors.gst && <span className="error-text">{errors.gst}</span>}
            </div>
          </div>

          <div className="form-group add-party-address-group">
            <label className="form-label">
              Address <span className="required-asterisk">*</span>
            </label>
            <textarea
              className={`form-textarea ${errors.address ? "input-error" : ""}`}
              name="address"
              value={party.address}
              rows="4"
              placeholder="Ex: 123, Gandhi Road, Mumbai, Maharashtra - 400001"
              onChange={handleChange}
            />
            {errors.address && (
              <span className="error-text">{errors.address}</span>
            )}
          </div>

          <div className="add-party-form-actions">
            <button
              type="submit"
              className="btn btn-outline-primary btn-mobile-flex"
            >
              {id ? "Update" : "Save"}
            </button>
            <button
              type="button"
              className="btn btn-outline-danger btn-mobile-flex"
              onClick={() => navigate("/")}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddParty;
