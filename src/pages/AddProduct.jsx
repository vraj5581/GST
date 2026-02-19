import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save, ArrowLeft } from "lucide-react";

function AddProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState({
    name: "",
    price: "",
    hsn: "",
    tax: "",
    unit: "Pcs",
    description: "" // Fixed typo from 'descrption'
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
    
    localStorage.setItem("products", JSON.stringify(products));
    navigate("/products");
  };

  return (
    <div>
      <header className="fixed-header" style={{ justifyContent: "flex-start" }}>
        <button className="btn btn-outline btn-icon" onClick={() => navigate("/products")} style={{ flexShrink: 0 }} title="Back">
          <ArrowLeft size={20} />
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
            <select 
              className="form-input" 
              name="tax" 
              value={product.tax} 
              onChange={handleChange}
            >
              <option value="">None (0%)</option>
              <option value="5">5%</option>
              <option value="12">12%</option>
              <option value="18">18%</option>
              <option value="28">28%</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Unit</label>
            <select 
              className="form-input" 
              name="unit" 
              value={product.unit} 
              onChange={handleChange}
            >
              <option value="Pcs">Pcs</option>
              <option value="Box">Box</option>
              <option value="Kg">Kg</option>
              <option value="Ltr">Ltr</option>
              <option value="Mtr">Mtr</option>
              <option value="Set">Set</option>
            </select>
          </div>
        </div>
        
        <div className="form-group">
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
          <button type="submit" className="btn btn-primary btn-mobile-flex">
            <Save size={18} /> {id ? "Update" : "Save"}
          </button>
          <button type="button" className="btn btn-outline btn-mobile-flex" onClick={() => navigate("/products")}>
            Cancel
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}

export default AddProduct;
