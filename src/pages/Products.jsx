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
                style={{
                  border: "1px solid var(--border-color)",
                  padding: "0.5rem",
                  borderRadius: "var(--radius-md)",
                  background: "#ffffff",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  cursor: "pointer",

                  transition: "transform 0.2s, box-shadow 0.2s"
                }}
                onClick={() => navigate(`/product/${p.originalIndex}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "var(--shadow-md)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    {p.image && (
                      <img
                        src={p.image}
                        alt={p.name}
                        style={{ width: "50px", height: "50px", borderRadius: "var(--radius-md)", objectFit: "cover", border: "1px solid var(--border-color)" }}
                      />
                    )}
                    <h4 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{p.name}</h4>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
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

                <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                  <p style={{ margin: "4px 0" }}><strong>Price:</strong> ₹{p.price}/{p.unit}</p>
                  <p style={{ margin: "4px 0" }}><strong>HSN:</strong> {p.hsn || "N/A"}</p>
                  <p style={{ margin: "4px 0" }}><strong>Tax:</strong> {p.tax ? `${p.tax}%` : "None"}</p>
                  {p.description && <p style={{ margin: "4px 0", fontStyle: "italic" }}>{p.description}</p>}
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
