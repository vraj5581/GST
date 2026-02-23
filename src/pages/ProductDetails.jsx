import { useRef, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import "./ProductDetails.css";

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProduct(docSnap.data());
        } else {
          console.log("No such product!");
          navigate("/products");
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      }
    };
    if (id) {
      fetchProduct();
    }
  }, [id, navigate]);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteDoc(doc(db, "products", id));
        navigate("/products");
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  };

  const handleEdit = () => {
    navigate(`/edit-product/${id}`);
  };

  if (!product) return <div>Loading...</div>;

  return (
    <div className="product-details-page">
      <header className="fixed-header product-details-header">
        <button
          className="btn btn-outline btn-icon product-details-back-btn"
          onClick={() => navigate("/products")}
          title="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <h3 className="product-details-title">Product Details</h3>
      </header>

      <div className="content-below-fixed">
        <div className="product-card-container">
          {/* Details Section */}
          <div className="product-info-section">
            <h2 className="product-name-heading">{product.name}</h2>
            {product.hsn && (
              <p className="product-hsn-text">HSN Code: {product.hsn}</p>
            )}

            <div className="product-metrics-grid">
              <div>
                <p className="metric-label">Selling Price</p>
                <p className="metric-value price">
                  ₹{product.price}{" "}
                  <span className="metric-unit">per {product.unit}</span>
                </p>
              </div>
            </div>

            {product.description && (
              <div className="product-description-section">
                <p className="description-heading">Description</p>
                <p className="description-text">{product.description}</p>
              </div>
            )}

            <div className="product-details-action-buttons">
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
