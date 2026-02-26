import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Vouchers.css";
import { Plus, QrCode, Edit, Trash2, Search, Hash, Calendar, Package, IndianRupee, X, Filter } from "lucide-react";
import QRCode from "react-qr-code";
import { collection, getDocs, deleteDoc, doc, query, where } from "firebase/firestore";
import { db } from "../firebase";

function Vouchers() {
  const [vouchers, setVouchers] = useState([]);
  const [search, setSearch] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    priceMin: 0,
    priceMax: 200000,
    sortInvoice: "desc", // "desc", "asc"
    sortParty: "", // "", "asc", "desc"
  });
  const [qrVoucher, setQrVoucher] = useState(null);
  const navigate = useNavigate(

  );

  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const q = query(collection(db, "vouchers"), where("companyId", "==", JSON.parse(localStorage.getItem('loggedCompany'))?.id)); const querySnapshot = await getDocs(q);
        let data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        // Sort by creation time (ascending) to maintain consistent index
        data.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        // Reverse so newest is first, but assign originalIndex based on ascending order
        const processed = data
          .map((v, i) => ({ ...v, originalIndex: i }))
          .reverse();
        setVouchers(processed);
      } catch (error) {
        console.error("Error fetching vouchers:", error);
      }
    };
    fetchVouchers();
  }, []);

  const handleDelete = async (index, id) => {
    if (window.confirm("Are you sure you want to delete this voucher?")) {
      try {
        await deleteDoc(doc(db, "vouchers", id));
        const updated = vouchers.filter((v) => v.id !== id);
        setVouchers(updated);
      } catch (error) {
        console.error("Error deleting voucher:", error);
      }
    }
  };

  const calculateTotal = (items) => {
    return items.reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  let filtered = vouchers.filter((v) => {
    // Basic Search
    const searchLower = search.toLowerCase();
    const invNo = String(v.invoiceNumber || `INV/25-26/${String(v.originalIndex + 1).padStart(3, '0')}`).toLowerCase();

    const matchesSearch = (v.partyId && v.partyId.toLowerCase().includes(searchLower)) || invNo.includes(searchLower);

    // Advanced Filters
    let matchesDateRange = true;
    if (filters.dateFrom || filters.dateTo) {
      const vDate = new Date(v.date);
      vDate.setHours(0, 0, 0, 0);

      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        if (vDate < fromDate) matchesDateRange = false;
      }
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (vDate > toDate) matchesDateRange = false;
      }
    }

    let matchesPrice = true;
    const total = calculateTotal(v.items);
    if (filters.priceMin > 0 && total < filters.priceMin) matchesPrice = false;
    if (filters.priceMax < 200000 && total > filters.priceMax) matchesPrice = false;

    return matchesSearch && matchesDateRange && matchesPrice;
  });

  // Sorting
  filtered.sort((a, b) => {
    // 1. Sort by Party Name if selected
    if (filters.sortParty === "asc") {
      const cmp = (a.partyId || "").localeCompare(b.partyId || "");
      if (cmp !== 0) return cmp;
    } else if (filters.sortParty === "desc") {
      const cmp = (b.partyId || "").localeCompare(a.partyId || "");
      if (cmp !== 0) return cmp;
    }

    // 2. Fallback / Default sort by Invoice order
    const isAsc = filters.sortInvoice === "asc";
    const dateA = a.createdAt || new Date(a.date).getTime();
    const dateB = b.createdAt || new Date(b.date).getTime();
    return isAsc ? dateA - dateB : dateB - dateA;
  });

  const activeFiltersArr = [
    filters.dateFrom || filters.dateTo,
    filters.priceMin > 0 || filters.priceMax < 200000,
    filters.sortInvoice !== "desc",
    filters.sortParty !== ""
  ].filter(Boolean);
  const activeFilterCount = activeFiltersArr.length;
  const hasActiveFilters = activeFilterCount > 0;

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
        <div className="vouchers-header-actions">
          <button
            className={`btn btn-icon vouchers-filter-btn filter-btn-wrapper ${hasActiveFilters ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setShowFilterModal(true)}
            title="Filter Options"
          >
            <Filter size={23} />
            {activeFilterCount > 0 && (
              <span className="filter-badge">{activeFilterCount}</span>
            )}
          </button>
          <Link
            to="/add-voucher"
            className="btn btn-outline-primary btn-icon vouchers-add-btn"
            title="Create Voucher"
          >
            <Plus size={23} />
          </Link>
        </div>
      </div>

      <div className="content-below-fixed">
        <div className="grid grid-2">
          {filtered.length > 0 ? (
            filtered.map((v) => (
              <div
                key={v.id}
                className="voucher-card"
                onClick={() => navigate(`/voucher-print/${v.id}`)}
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
                        setQrVoucher(v);
                      }}
                      title="Show QR Code"
                    >
                      <QrCode size={16} />
                    </button>
                    <button
                      className="btn btn-action-edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/add-voucher/${v.id}`);
                      }}
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="btn btn-action-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(v.originalIndex, v.id);
                      }}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="voucher-card-details">
                  <div className="party-detail-row">
                    <div className="party-detail-icon"><Hash size={14} /></div>
                    <p>{v.invoiceNumber || `INV/25-26/${String(v.originalIndex + 1).padStart(3, '0')}`}</p>
                  </div>
                  <div className="party-detail-row">
                    <div className="party-detail-icon"><Calendar size={14} /></div>
                    <p>{new Date(v.date).toLocaleDateString()}</p>
                  </div>
                  <div className="party-detail-row">
                    <div className="party-detail-icon"><Package size={14} /></div>
                    <p>{v.items.length} Items</p>
                  </div>
                  <div className="party-detail-row">
                    <div className="party-detail-icon"><IndianRupee size={14} /></div>
                    <p>
                      <strong className="voucher-total-highlight">₹{calculateTotal(v.items).toFixed(2)}</strong>
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-vouchers-message">No vouchers found.</div>
          )}
        </div>
      </div>

      {qrVoucher && (
        <div className="qr-modal-overlay" onClick={() => setQrVoucher(null)}>
          <div className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="qr-modal-header">
              <h3>Scan to View Invoice</h3>
              <button className="qr-modal-close" onClick={() => setQrVoucher(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="qr-modal-body">
              <QRCode
                value={`${window.location.origin}/voucher-print/${qrVoucher.id}`}
                size={220}
                className="qr-code-img"
              />
              <p className="qr-modal-id">{qrVoucher.invoiceNumber || `INV/25-26/${String(qrVoucher.originalIndex + 1).padStart(3, '0')}`}</p>
              <p className="qr-modal-help">Scan this QR code with any mobile camera to view and download the invoice.</p>
            </div>
          </div>
        </div>
      )}

      {showFilterModal && (
        <div className="qr-modal-overlay" onClick={() => setShowFilterModal(false)}>
          <div className="qr-modal-content filter-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="qr-modal-header">
              <h3>Filter Options</h3>
              <button className="qr-modal-close" onClick={() => setShowFilterModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="qr-modal-body filter-modal-body">
              <div className="form-group filter-form-group">
                <div className="filter-group-header">
                  <label className="form-label filter-label-bold">Date Range</label>
                  {(filters.dateFrom || filters.dateTo) && (
                    <span className="filter-clear-link" onClick={() => setFilters({ ...filters, dateFrom: "", dateTo: "" })}>Clear</span>
                  )}
                </div>
                <div className="filter-date-inputs">
                  <input
                    type={filters.dateFrom ? "date" : "text"}
                    onFocus={(e) => { e.target.type = "date"; }}
                    onClick={(e) => {
                      e.target.type = "date";
                      setTimeout(() => { try { e.target.showPicker(); } catch (err) { } }, 50);
                    }}
                    onTouchStart={(e) => {
                      e.target.type = "date";
                      setTimeout(() => { try { e.target.showPicker(); } catch (err) { } }, 50);
                    }}
                    onBlur={(e) => { if (!e.target.value) e.target.type = "text"; }}
                    placeholder="dd-mm-yyyy"
                    className="form-input"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  />
                  <span className="filter-date-separator">to</span>
                  <input
                    type={filters.dateTo ? "date" : "text"}
                    onFocus={(e) => { e.target.type = "date"; }}
                    onClick={(e) => {
                      e.target.type = "date";
                      setTimeout(() => { try { e.target.showPicker(); } catch (err) { } }, 50);
                    }}
                    onTouchStart={(e) => {
                      e.target.type = "date";
                      setTimeout(() => { try { e.target.showPicker(); } catch (err) { } }, 50);
                    }}
                    onBlur={(e) => { if (!e.target.value) e.target.type = "text"; }}
                    placeholder="dd-mm-yyyy"
                    className="form-input"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group filter-form-group">
                <div className="filter-group-header">
                  <label className="form-label filter-label-bold">Price</label>
                  {(filters.priceMin > 0 || filters.priceMax < 200000) && (
                    <span className="filter-clear-link" onClick={() => setFilters({ ...filters, priceMin: 0, priceMax: 200000 })}>Clear</span>
                  )}
                </div>
                <div className="price-range-display">
                  ₹{filters.priceMin.toLocaleString()} – ₹{filters.priceMax.toLocaleString()}{filters.priceMax >= 200000 ? '+' : ''}
                </div>
                <div className="range-slider-container">
                  <div className="range-slider-track" style={{
                    left: `${(filters.priceMin / 200000) * 100}%`,
                    right: `${100 - (filters.priceMax / 200000) * 100}%`
                  }}></div>
                  <input
                    type="range"
                    min="0"
                    max="200000"
                    step="100"
                    value={filters.priceMin}
                    onChange={(e) => {
                      const val = Math.min(Number(e.target.value), filters.priceMax);
                      setFilters({ ...filters, priceMin: val });
                    }}
                    className="range-slider-thumb thumb-left"
                  />
                  <input
                    type="range"
                    min="0"
                    max="200000"
                    step="100"
                    value={filters.priceMax}
                    onChange={(e) => {
                      const val = Math.max(Number(e.target.value), filters.priceMin);
                      setFilters({ ...filters, priceMax: val });
                    }}
                    className="range-slider-thumb thumb-right"
                  />
                </div>
              </div>

              <div className="form-group filter-form-group">
                <div className="filter-group-header">
                  <label className="form-label filter-label-bold">Sort By Invoice Date</label>
                  {filters.sortInvoice !== "desc" && (
                    <span className="filter-clear-link" onClick={() => setFilters({ ...filters, sortInvoice: "desc" })}>Reset</span>
                  )}
                </div>
                <select
                  className="form-input"
                  value={filters.sortInvoice}
                  onChange={(e) => setFilters({ ...filters, sortInvoice: e.target.value })}
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>

              <div className="form-group filter-form-group-last">
                <div className="filter-group-header">
                  <label className="form-label filter-label-bold">Sort By Party Name</label>
                  {filters.sortParty !== "" && (
                    <span className="filter-clear-link" onClick={() => setFilters({ ...filters, sortParty: "" })}>Reset</span>
                  )}
                </div>
                <select
                  className="form-input"
                  value={filters.sortParty}
                  onChange={(e) => setFilters({ ...filters, sortParty: e.target.value })}
                >
                  <option value="">None</option>
                  <option value="asc">A to Z</option>
                  <option value="desc">Z to A</option>
                </select>
              </div>

              <div className="filter-actions">
                <button
                  className="btn btn-outline-danger filter-btn-clear"
                  onClick={() => {
                    setFilters({
                      dateFrom: "",
                      dateTo: "",
                      priceMin: 0,
                      priceMax: 200000,
                      sortInvoice: "desc",
                      sortParty: "",
                    });
                    setShowFilterModal(false);
                  }}
                >
                  Clear
                </button>
                <button
                  className="btn btn-primary filter-btn-apply"
                  onClick={() => setShowFilterModal(false)}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Vouchers;
