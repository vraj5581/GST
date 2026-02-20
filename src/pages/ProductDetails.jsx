import { useRef, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import "./ProductDetails.css";

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    const products = JSON.parse(localStorage.getItem("products")) || [];
    if (products[id]) {
        setProduct(products[id]);
    }
  }, [id]);

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this product?")) {
        const products = JSON.parse(localStorage.getItem("products")) || [];
        const updated = products.filter((_, i) => i !== Number(id));
        localStorage.setItem("products", JSON.stringify(updated));
        navigate("/products");
    }
  };

  const handleEdit = () => {
    navigate(`/edit-product/${id}`);
  };

  if (!product) return <div>Loading...</div>;

  return (
    <div className="product-details-page">
       <header className="fixed-header product-details-header">
        <button className="btn btn-outline btn-icon product-details-back-btn" onClick={() => navigate("/products")} title="Back">
          <ArrowLeft size={18} />
        </button>
        <h3 className="product-details-title">Product Details</h3>

      </header>
      
      <div className="content-below-fixed">
        <div className="product-card-container">
            {/* Details Section */}
            <div className="product-info-section">
                <h2 className="product-name-heading">{product.name}</h2>
                {product.hsn && <p className="product-hsn-text">HSN Code: {product.hsn}</p>}
                
                <div className="product-metrics-grid">
                    <div>
                        <p className="metric-label">Selling Price</p>
                        <p className="metric-value price">₹{product.price} <span className="metric-unit">per {product.unit}</span></p>
                    </div>
                    
                    {product.tax && (
                    <div>
                        <p className="metric-label">Tax Rate</p>
                        <p className="metric-value">{product.tax}%</p>
                    </div>
                    )}
                </div>

                {product.description && (
                    <div className="product-description-section">
                        <p className="description-heading">Description</p>
                        <p className="description-text">{product.description}</p>
                    </div>
                )}
                
                <div style={{ display: "flex", gap: "1rem", marginTop: "3rem", borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem" }}>
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
    </div>
  );
}

export default ProductDetails;
