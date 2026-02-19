import { useRef, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";

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
    <div>
       <header className="fixed-header" style={{ justifyContent: "flex-start" }}>
        <button className="btn btn-outline btn-icon" onClick={() => navigate("/products")} style={{ flexShrink: 0 }} title="Back">
          <ArrowLeft size={20} />
        </button>
        <h3 style={{ margin: 0, border: "none" }}>Product Details</h3>
        
        <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem" }}>
            <button className="btn btn-outline btn-icon" onClick={handleEdit} title="Edit">
                <Edit size={18} />
            </button>
            <button className="btn btn-outline btn-icon" style={{ color: "var(--color-danger)", borderColor: "var(--color-danger)" }} onClick={handleDelete} title="Delete">
                <Trash2 size={18} />
            </button>
        </div>
      </header>
      
      <div className="content-below-fixed">
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Image Section */}
            {product.image && (
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center', background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                    <img 
                        src={product.image} 
                        alt={product.name} 
                        style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '4px' }}
                    />
                </div>
            )}

            {/* Details Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{product.name}</h2>
                {product.hsn && <p style={{ color: 'var(--text-secondary)', margin: 0 }}>HSN Code: {product.hsn}</p>}
                
                <div style={{ marginTop: '1rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Selling Price</p>
                        <p style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-primary)', margin: 0 }}>₹{product.price} <span style={{fontSize: '0.9rem', color: '#666'}}>per {product.unit}</span></p>
                    </div>
                    
                    {product.tax && (
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Tax Rate</p>
                        <p style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>{product.tax}%</p>
                    </div>
                    )}
                </div>

                {product.description && (
                    <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                        <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Description</p>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5' }}>{product.description}</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;
