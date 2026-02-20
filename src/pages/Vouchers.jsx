import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Vouchers.css";
import { Plus, Printer, Eye, Trash2 } from "lucide-react";

function Vouchers() {
  const [vouchers, setVouchers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("vouchers")) || [];
    // Sort by date desc
    setVouchers(data.map((v, i) => ({ ...v, originalIndex: i })).reverse());
  }, []);

  const handleDelete = (index) => {
    if (window.confirm("Are you sure you want to delete this voucher?")) {
      const allVouchers = JSON.parse(localStorage.getItem("vouchers")) || [];
      const updated = allVouchers.filter((_, i) => i !== index);
      localStorage.setItem("vouchers", JSON.stringify(updated));
      
      // Update local state
      setVouchers(updated.map((v, i) => ({ ...v, originalIndex: i })).reverse());
    }
  };

  const calculateTotal = (items) => {
    return items.reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  return (
    <div className="vouchers-page">
      <div className="fixed-header root-page-header">
        <h3 style={{ margin: 0, border: "none" }}>Vouchers</h3>
        <Link to="/add-voucher" className="btn btn-primary btn-icon" style={{ flexShrink: 0 }} title="Create Voucher">
          <Plus size={18} />
        </Link>
      </div>

      <div className="content-below-fixed">
        <div className="grid grid-2">
          {vouchers.length > 0 ? (
            vouchers.map((v) => (
              <div 
                key={v.originalIndex}
                className="card"
                style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                   <div>
                     <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>#INV-{String(v.id || (Number(v.originalIndex) + 1)).padStart(4, '0')}</p>
                     <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>{v.partyId}</h4>
                     <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>{new Date(v.date).toLocaleDateString()}</p>
                     <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                       {v.items.length} Items
                     </p>
                   </div>
                   <div style={{ textAlign: 'right' }}>
                     <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                       ₹{calculateTotal(v.items).toFixed(2)}
                     </span>
                     <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Total</p>
                   </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.75rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                   <button 
                     className="btn btn-outline" 
                     onClick={() => navigate(`/voucher-print/${v.originalIndex}`)} 
                     title="Print / View"
                     style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}
                   >
                     <Printer size={16} /> Print
                   </button>
                   <button 
                     className="btn btn-outline" 
                     onClick={() => navigate(`/add-voucher/${v.originalIndex}`)} // Actually just edit
                     title="Edit"
                     style={{ padding: '0.4rem', color: 'var(--text-secondary)' }}
                   >
                     <Eye size={16} />
                   </button>
                   <button 
                     className="btn btn-action-delete"
                     onClick={() => handleDelete(v.originalIndex)}
                   >
                     <Trash2 size={16} />
                   </button>
                </div>
              </div>
            ))
          ) : (
             <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
               No vouchers created yet.
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Vouchers;
