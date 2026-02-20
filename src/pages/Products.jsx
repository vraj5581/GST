import { useState, useEffect } from "react";
import { Search, Edit, Trash2, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import "./Products.css";

function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("products")) || [];
    setProducts(data);
  }, []);

  const handleDelete = (index) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      const updated = products.filter((_, i) => i !== index);
      localStorage.setItem("products", JSON.stringify(updated));
      setProducts(updated);
    }
  };

  const handleEdit = (index) => {
    navigate(`/edit-product/${index}`);
  };

  const filtered = products.map((product, index) => ({ ...product, originalIndex: index }))
    .filter(p =>
      Object.values(p).some(val =>
        String(val).toLowerCase().includes(search.toLowerCase())
      )
    );

  return (
    <div className="products-page">
      <div className="fixed-header root-page-header">
        <div className="search-bar w-full-search" style={{ flex: 1, marginBottom: 0 }}>
          <Search className="search-icon" size={18} />
          <input
            className="form-input"
            value={search}
            placeholder="Search by Name, Code..."
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Link to="/add-product" className="btn btn-primary btn-icon" style={{ flexShrink: 0 }} title="Add Product">
          <Plus size={18} />
        </Link>
      </div>

      <div className="content-below-fixed">
        <div className="grid grid-2">
          {filtered.length > 0 ? (
            filtered.map((p) => (
              <div
                key={p.originalIndex}
                className="product-card"
                onClick={() => navigate(`/product/${p.originalIndex}`)}
              >
                <div className="product-header">
                  <div className="product-title-group">
                    {p.image && (
                      <img
                        src={p.image}
                        alt={p.name}
                        className="product-image"
                      />
                    )}
                    <h4 className="product-title">{p.name}</h4>
                  </div>
                  <div className="product-actions">
                    <button
                      className="btn btn-action-edit"
                      onClick={(e) => { e.stopPropagation(); handleEdit(p.originalIndex); }}
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="btn btn-action-delete"
                      onClick={(e) => { e.stopPropagation(); handleDelete(p.originalIndex); }}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="product-details">
                  <p><strong>Price:</strong> ₹{p.price}/{p.unit}</p>
                  <p><strong>HSN:</strong> {p.hsn || "N/A"}</p>
                  <p><strong>Tax:</strong> {p.tax ? `${p.tax}%` : "None"}</p>
                  {p.description && <p style={{ fontStyle: "italic" }}>{p.description}</p>}
                </div>
              </div>
            ))
          ) : (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
              No products found, add one to get started!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Products;
