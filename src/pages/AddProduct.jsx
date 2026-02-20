import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save, ArrowLeft } from "lucide-react";
import Select from "react-select";
import "./AddProduct.css";

function AddProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState({
    name: "",
    price: "",
    hsn: "",
    tax: "",
    unit: "Pcs",
    description: ""
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (id) {
      const products = JSON.parse(localStorage.getItem("products")) || [];
      if (products[id]) {
        setProduct(products[id]);
      }
    }
  }, [id]);

  const validate = () => {
    const newErrors = {};

    if (!product.name.trim()) {
      newErrors.name = "Product Name is required";
    }

    if (!product.price) {
      newErrors.price = "Selling Price is required";
    } else if (isNaN(product.price) || Number(product.price) < 0) {
      newErrors.price = "Price must be a valid positive number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct({ ...product, [name]: value });
    
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    let products = JSON.parse(localStorage.getItem("products")) || [];
    
    if (id) {
      products[id] = product;
    } else {
      products.push(product);
    }
    
    try {
      localStorage.setItem("products", JSON.stringify(products));
      navigate("/products");
    } catch (error) {
      if (error.name === "QuotaExceededError" || error.code === 22) {
        alert("Storage Full! The image is too large for local storage. Please try a smaller image.");
      } else {
        alert("Failed to save product: " + error.message);
      }
    }
  };

  return (
    <div className="add-product-page">
      <header className="fixed-header" style={{ justifyContent: "flex-start" }}>
        <button className="btn btn-outline btn-icon" onClick={() => navigate("/products")} style={{ flexShrink: 0 }} title="Back">
          <ArrowLeft size={18} />
        </button>
        <h3 style={{ margin: 0, border: "none" }}>{id ? "Edit Product" : "Add New Product"}</h3>
      </header>
      
      <div className="content-below-fixed">
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-2">
          <div className="form-group">
            <label className="form-label">Product Name <span style={{color: 'red'}}>*</span></label>
            <input 
              className="form-input" 
              name="name" 
              value={product.name}
              placeholder="Ex: Wireless Mouse" 
              onChange={handleChange}
              style={errors.name ? { borderColor: 'var(--color-danger)' } : {}}
            />
            {errors.name && <span style={{ color: 'var(--color-danger)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errors.name}</span>}
          </div>
          
          <div className="form-group">
            <label className="form-label">Selling Price (₹) <span style={{color: 'red'}}>*</span></label>
            <input 
              className="form-input" 
              name="price" 
              type="number"
              value={product.price}
              placeholder="Ex: 500" 
              onChange={handleChange}
              style={errors.price ? { borderColor: 'var(--color-danger)' } : {}}
            />
            {errors.price && <span style={{ color: 'var(--color-danger)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errors.price}</span>}
          </div>
          
          <div className="form-group">
            <label className="form-label">HSN/SAC Code</label>
            <input 
              className="form-input" 
              name="hsn" 
              value={product.hsn}
              placeholder="Ex: 8544" 
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Tax Rate (%)</label>
            <Select 
              options={[
                { value: "", label: "None (0%)" },
                { value: "5", label: "5%" },
                { value: "12", label: "12%" },
                { value: "18", label: "18%" },
                { value: "28", label: "28%" }
              ]}
              value={{ 
                value: product.tax, 
                label: product.tax ? `${product.tax}%` : "None (0%)"
              }}
              onChange={(selected) => setProduct({ ...product, tax: selected ? selected.value : "" })}
              placeholder="Select Tax"
              className="react-select-container"
              classNamePrefix="react-select"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Unit</label>
            <Select 
              options={[
                { value: "Pcs", label: "Pcs" },
                { value: "Box", label: "Box" },
                { value: "Kg", label: "Kg" },
                { value: "Ltr", label: "Ltr" },
                { value: "Mtr", label: "Mtr" },
                { value: "Set", label: "Set" }
              ]}
              value={product.unit ? { value: product.unit, label: product.unit } : null}
              onChange={(selected) => setProduct({ ...product, unit: selected ? selected.value : "Pcs" })}
              className="react-select-container"
              classNamePrefix="react-select"
            />
          </div>
        </div>

        <div className="form-group add-product-spacing">
          <label className="form-label">Description</label>
          <textarea 
            className="form-textarea" 
            name="description" 
            value={product.description}
            rows="3"
            placeholder="Ex: High quality wireless optical mouse..." 
            onChange={handleChange} 
          />
        </div>
        
        <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
          <button type="submit" className="btn btn-outline-primary btn-mobile-flex">
            {id ? "Update" : "Save"}
          </button>
          <button type="button" className="btn btn-outline-danger btn-mobile-flex" onClick={() => navigate("/products")}>
            Cancel
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}

export default AddProduct;
