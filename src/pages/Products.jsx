import { useState, useEffect } from "react";
import { Search, Edit, Trash2, Plus, DollarSign, FileCode2, FileText } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { collection, getDocs, deleteDoc, doc, query, where } from "firebase/firestore";
import { db } from "../firebase";
import "./Products.css";

function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const q = query(collection(db, "products"), where("companyId", "==", JSON.parse(localStorage.getItem('loggedCompany'))?.id)); const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteDoc(doc(db, "products", id));
        setProducts(products.filter((p) => p.id !== id));
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  };

  const handleEdit = (id) => {
    navigate(`/edit-product/${id}`);
  };

  const filtered = products.filter((p) =>
    Object.values(p).some((val) =>
      String(val).toLowerCase().includes(search.toLowerCase()),
    ),
  );

  return (
    <div className="products-page">
      <div className="fixed-header root-page-header">
        <div className="search-bar w-full-search products-search-wrap">
          <Search className="search-icon" size={18} />
          <input
            className="form-input"
            value={search}
            placeholder="Search by Name, Code..."
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Link
          to="/add-product"
          className="btn btn-outline-primary btn-icon products-add-btn"
          title="Add Product"
        >
          <Plus size={23} />
        </Link>
      </div>

      <div className="content-below-fixed">
        <div className="grid grid-2">
          {filtered.length > 0 ? (
            filtered.map((p) => (
              <div
                key={p.id}
                className="product-card"
                onClick={() => navigate(`/product/${p.id}`)}
              >
                <div className="product-header">
                  <div className="product-title-group">
                    <h4 className="product-title">{p.name}</h4>
                  </div>
                  <div className="product-actions">
                    <button
                      className="btn btn-action-edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(p.id);
                      }}
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="btn btn-action-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(p.id);
                      }}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="product-details">
                  <div className="party-detail-row">
                    <div className="party-detail-icon"><DollarSign size={14} /></div>
                    <p>₹{p.price}/{p.unit}</p>
                  </div>

                  {p.description && (
                    <div className="party-detail-row">
                      <div className="party-detail-icon"><FileText size={14} /></div>
                      <p className="product-description">{p.description}</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="no-products-message">
              No products found, add one to get started!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Products;
