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
                className="voucher-card"
                onClick={() => navigate(`/voucher-print/${v.originalIndex}`)}
              >
                <div className="voucher-card-header">
                  <h4 className="voucher-card-title" style={{ maxWidth: '65%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.partyId}</h4>
                  <div className="voucher-card-actions">
                    <button 
                      className="btn voucher-card-action-btn print-btn" 
                      onClick={(e) => { e.stopPropagation(); navigate(`/voucher-print/${v.originalIndex}`); }} 
                      title="Print / View"
                    >
                      <Printer size={16} />
                    </button>
                    <button 
                      className="btn voucher-card-action-btn edit-btn" 
                      onClick={(e) => { e.stopPropagation(); navigate(`/add-voucher/${v.originalIndex}`); }}
                      title="Edit"
                    >
                      <Eye size={16} />
                    </button>
                    <button 
                      className="btn voucher-card-action-btn delete-btn"
                      onClick={(e) => { e.stopPropagation(); handleDelete(v.originalIndex); }}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="voucher-card-details">
                  <p><strong>Invoice No:</strong> #INV-{String(v.id || (Number(v.originalIndex) + 1)).padStart(4, '0')}</p>
                  <p><strong>Date:</strong> {new Date(v.date).toLocaleDateString()}</p>
                  <p><strong>Items:</strong> {v.items.length}</p>
                  <p><strong>Total:</strong> <span style={{ color: "var(--color-primary)", fontWeight: "600" }}>₹{calculateTotal(v.items).toFixed(2)}</span></p>
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
