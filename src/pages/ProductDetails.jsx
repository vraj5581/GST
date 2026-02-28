import { useRef, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Trash2, IndianRupee, Hash, FileText } from "lucide-react";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { getDB } from "../firebase";
import "./ProductDetails.css";

function ProductDetails() {
  const db = getDB();
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
    <div className="products-page">
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
        <div className="product-details-wrapper">
          <h2 className="product-details-name">{product.name}</h2>

          <div className="grid grid-2 product-details-grid">
            <div className="detail-item">
              <label className="form-label product-details-label">Selling Price</label>
              <div className="party-detail-row">
                <div className="party-detail-icon">
                  <IndianRupee size={14} />
                </div>
                <p className="product-details-value">
                  ₹{product.price}{" "}
                  <span className="product-metric-unit">per {product.unit}</span>
                </p>
              </div>
            </div>

            <div className="detail-item">
              <label className="form-label product-details-label">HSN/SAC Code</label>
              <div className="party-detail-row">
                <div className="party-detail-icon">
                  <Hash size={14} />
                </div>
                <p className="product-details-value">{product.hsn || "N/A"}</p>
              </div>
            </div>

            <div className="detail-item product-details-description-col">
              <label className="form-label product-details-label">Description</label>
              <div className="party-detail-row">
                <div className="party-detail-icon">
                  <FileText size={14} />
                </div>
                <p className="product-details-value">
                  {product.description || "No description provided."}
                </p>
              </div>
            </div>
          </div>

          <div className="product-details-actions">
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

export default ProductDetails;
