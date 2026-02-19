import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save, ArrowLeft } from "lucide-react";

function AddParty() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [party, setParty] = useState({
    name: "",
    mobile: "",
    email: "",
    gst: "",
    address: ""
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (id) {
      const parties = JSON.parse(localStorage.getItem("parties")) || JSON.parse(localStorage.getItem("clients")) || [];
      if (parties[id]) {
        setParty(parties[id]);
      }
    }
  }, [id]);

  const validate = () => {
    const newErrors = {};

    if (!party.name.trim()) {
      newErrors.name = "Party Name is required";
    }

    // Mobile Validation (10 digits)
    if (party.mobile && !/^\d{10}$/.test(party.mobile)) {
      newErrors.mobile = "Mobile number must be 10 digits";
    }

    // Email Validation
    if (party.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(party.email)) {
      newErrors.email = "Invalid email format";
    }

    // GST Validation (15 alphanumeric characters standard check)
    // Regex: 2 digits, 5 letters, 4 digits, 1 letter, 1 alphanumeric, Z, 1 alphanumeric
    if (party.gst && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(party.gst)) {
      newErrors.gst = "Invalid GST Number format (Ex: 22AAAAA0000A1Z5)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-uppercase GST input
    const finalValue = name === 'gst' ? value.toUpperCase() : value;

    setParty({ ...party, [name]: finalValue });
    
    // Clear error when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    // Prefer 'parties', fallback to creating new if needed
    let parties = JSON.parse(localStorage.getItem("parties"));
    
    // If no 'parties' yet, try to migrate 'clients'
    if (!parties) {
       parties = JSON.parse(localStorage.getItem("clients")) || [];
    }
    
    if (id) {
      parties[id] = party;
    } else {
      parties.push(party);
    }
    
    localStorage.setItem("parties", JSON.stringify(parties));
    navigate("/");
  };

  return (
    <div>
      <header className="fixed-header" style={{ justifyContent: "flex-start" }}>
        <button className="btn btn-outline btn-icon" onClick={() => navigate("/")} style={{ flexShrink: 0 }} title="Back">
          <ArrowLeft size={20} />
        </button>
        <h3 style={{ margin: 0, border: "none" }}>{id ? "Edit Party" : "Add New Party"}</h3>
      </header>
      
      <div className="content-below-fixed">
      <form onSubmit={handleSubmit} noValidate>
        {/* Form Content */}
        <div className="grid grid-2">
          <div className="form-group">
            <label className="form-label">Party Name <span style={{color: 'red'}}>*</span></label>
            <input 
              className="form-input" 
              name="name" 
              value={party.name}
              placeholder="Ex: John Doe Enterprises" 
              onChange={handleChange}
              style={errors.name ? { borderColor: 'var(--color-danger)' } : {}}
            />
            {errors.name && <span style={{ color: 'var(--color-danger)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errors.name}</span>}
          </div>
          
          <div className="form-group">
            <label className="form-label">Mobile Number</label>
            <input 
              className="form-input" 
              name="mobile" 
              value={party.mobile}
              placeholder="Ex: 9876543210" 
              onChange={handleChange}
              type="tel"
              maxLength={10}
              style={errors.mobile ? { borderColor: 'var(--color-danger)' } : {}}
            />
            {errors.mobile && <span style={{ color: 'var(--color-danger)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errors.mobile}</span>}
          </div>
          
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
              className="form-input" 
              name="email" 
              type="email"
              value={party.email}
              placeholder="Ex: john@example.com" 
              onChange={handleChange}
              style={errors.email ? { borderColor: 'var(--color-danger)' } : {}}
            />
            {errors.email && <span style={{ color: 'var(--color-danger)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errors.email}</span>}
          </div>
          
          <div className="form-group">
            <label className="form-label">GST No.</label>
            <input 
              className="form-input" 
              name="gst" 
              value={party.gst}
              placeholder="Ex: 22AAAAA0000A1Z5" 
              onChange={handleChange}
              maxLength={15}
              style={errors.gst ? { borderColor: 'var(--color-danger)' } : {}}
            />
            {errors.gst && <span style={{ color: 'var(--color-danger)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errors.gst}</span>}
          </div>
        </div>
        
        <div className="form-group">
          <label className="form-label">Address</label>
          <textarea 
            className="form-textarea" 
            name="address" 
            value={party.address}
            rows="4"
            placeholder="Ex: 123, Gandhi Road, Mumbai, Maharashtra - 400001" 
            onChange={handleChange} 
          />
        </div>
        
        <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
          <button type="submit" className="btn btn-primary btn-mobile-flex">
            <Save size={18} /> {id ? "Update" : "Save"}
          </button>
          <button type="button" className="btn btn-outline btn-mobile-flex" onClick={() => navigate("/")}>
            Cancel
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}

export default AddParty;
