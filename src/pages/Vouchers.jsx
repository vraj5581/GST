import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Vouchers.css";
import { Plus, Printer, Edit, Trash2, Search } from "lucide-react";

function Vouchers() {
  const [vouchers, setVouchers] = useState([]);
  const [search, setSearch] = useState("");
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
      setVouchers(
        updated.map((v, i) => ({ ...v, originalIndex: i })).reverse(),
      );
    }
  };

  const calculateTotal = (items) => {
    return items.reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  const filtered = vouchers.filter((v) => {
    const searchLower = search.toLowerCase();
    const invNo = String(v.id || Number(v.originalIndex) + 1).padStart(4, "0");
    return (
      (v.partyId && v.partyId.toLowerCase().includes(searchLower)) ||
      invNo.includes(searchLower)
    );
  });

  return (
    <div className="vouchers-page">
      <div className="fixed-header root-page-header">
        <div className="search-bar w-full-search vouchers-search-wrap">
          <Search className="search-icon" size={18} />
          <input
            className="form-input"
            value={search}
            placeholder="Search by Party Name, Invoice No..."
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Link
          to="/add-voucher"
          className="btn btn-outline-primary btn-icon vouchers-add-btn"
          title="Create Voucher"
        >
          <Plus size={18} />
        </Link>
      </div>

      <div className="content-below-fixed">
        <div className="grid grid-2">
          {filtered.length > 0 ? (
            filtered.map((v) => (
              <div
                key={v.originalIndex}
                className="voucher-card"
                onClick={() => navigate(`/voucher-print/${v.originalIndex}`)}
              >
                <div className="voucher-card-header">
                  <h4 className="voucher-card-title voucher-card-title-cutoff">
                    {v.partyId}
                  </h4>
                  <div className="voucher-card-actions">
                    <button
                      className="btn btn-action-print"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/voucher-print/${v.originalIndex}`);
                      }}
                      title="Print / View"
                    >
                      <Printer size={16} />
                    </button>
                    <button
                      className="btn btn-action-edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/add-voucher/${v.originalIndex}`);
                      }}
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="btn btn-action-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(v.originalIndex);
                      }}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="voucher-card-details">
                  <p>
                    <strong>Invoice No:</strong> #INV-
                    {String(v.id || Number(v.originalIndex) + 1).padStart(
                      4,
                      "0",
                    )}
                  </p>
                  <p>
                    <strong>Date:</strong>{" "}
                    {new Date(v.date).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Items:</strong> {v.items.length}
                  </p>
                  <p>
                    <strong>Total:</strong>{" "}
                    <span className="voucher-total-highlight">
                      ₹{calculateTotal(v.items).toFixed(2)}
                    </span>
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="no-vouchers-message">No vouchers found.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Vouchers;
