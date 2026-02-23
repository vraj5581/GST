import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save, ArrowLeft } from "lucide-react";
import Select from "react-select";
import { collection, addDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import "./AddProduct.css";

function AddProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState({
    name: "",
    price: "",
    hsn: "",
    unit: "Pcs",
    description: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (id) {
      const fetchProduct = async () => {
        try {
          const docRef = doc(db, "products", id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProduct({ unit: "Pcs", ...docSnap.data() });
          }
        } catch (error) {
          console.error("Error fetching product:", error);
        }
      };
      fetchProduct();
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      if (id) {
        // Update existing
        const docRef = doc(db, "products", id);
        await updateDoc(docRef, product);
      } else {
        // Create new
        await addDoc(collection(db, "products"), product);
      }
      navigate("/products");
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Failed to save product. Check console for details.");
    }
  };

  return (
    <div className="add-product-page">
      <header className="fixed-header add-product-header">
        <button
          className="btn btn-outline btn-icon add-product-back-btn"
          onClick={() => navigate("/products")}
          title="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <h3 className="add-product-title">
          {id ? "Edit Product" : "Add New Product"}
        </h3>
      </header>

      <div className="content-below-fixed">
        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">
                Product Name <span className="required-asterisk">*</span>
              </label>
              <input
                className={`form-input ${errors.name ? "input-error" : ""}`}
                name="name"
                value={product.name}
                placeholder="Ex: Tiles"
                onChange={handleChange}
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">
                Price (₹) <span className="required-asterisk">*</span>
              </label>
              <input
                className={`form-input ${errors.price ? "input-error" : ""}`}
                name="price"
                type="number"
                value={product.price}
                placeholder="Ex: 500"
                onChange={handleChange}
              />
              {errors.price && (
                <span className="error-text">{errors.price}</span>
              )}
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
              <label className="form-label">Unit</label>
              <Select
                options={[
                  { value: "Pcs", label: "Pcs" },
                  { value: "Box", label: "Box" },
                  { value: "Kg", label: "Kg" },
                  { value: "Ltr", label: "Ltr" },
                  { value: "Mtr", label: "Mtr" },
                  { value: "Set", label: "Set" },
                ]}
                value={
                  product.unit
                    ? { value: product.unit, label: product.unit }
                    : { value: "Pcs", label: "Pcs" }
                }
                onChange={(selected) =>
                  setProduct({
                    ...product,
                    unit: selected ? selected.value : "Pcs",
                  })
                }
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

          <div className="add-product-form-actions">
            <button
              type="submit"
              className="btn btn-outline-primary btn-mobile-flex"
            >
              {id ? "Update" : "Save"}
            </button>
            <button
              type="button"
              className="btn btn-outline-danger btn-mobile-flex"
              onClick={() => navigate("/products")}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddProduct;
