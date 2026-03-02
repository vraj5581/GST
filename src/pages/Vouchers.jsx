import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Vouchers.css";
import {
  Plus,
  QrCode,
  Edit,
  Trash2,
  Search,
  Hash,
  Calendar,
  Package,
  IndianRupee,
  X,
  Filter,
  CreditCard,
} from "lucide-react";
import QRCode from "react-qr-code";
import Select from "react-select";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import { getDB } from "../firebase";

function Vouchers() {
  const db = getDB();
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
    status: "", // "", "Paid", "Unpaid", "Partial"
    paymentMethod: "", // "", "Cash", "Online"
  });
  const [qrVoucher, setQrVoucher] = useState(null);
  const [statusModalVoucher, setStatusModalVoucher] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [tempStatusData, setTempStatusData] = useState({
    status: "",
    paidAmount: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const q = query(
          collection(db, "vouchers"),
          where(
            "companyId",
            "==",
            JSON.parse(localStorage.getItem("loggedCompany"))?.id,
          ),
        );
        const querySnapshot = await getDocs(q);
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

  const handleStatusUpdate = async () => {
    if (!statusModalVoucher) return;
    setUpdatingStatus(true);
    try {
      const total = calculateTotal(statusModalVoucher.items);
      let updates = {
        status: tempStatusData.status,
        paidAmount: parseFloat(tempStatusData.paidAmount) || 0,
      };

      if (updates.status === "Paid") {
        updates.paidAmount = total;
        updates.remainingAmount = 0;
      } else if (updates.status === "Unpaid") {
        updates.paidAmount = 0;
        updates.remainingAmount = total;
      } else if (updates.status === "Partial") {
        updates.remainingAmount = total - updates.paidAmount;
      }

      await updateDoc(doc(db, "vouchers", statusModalVoucher.id), updates);
      setVouchers(
        vouchers.map((v) =>
          v.id === statusModalVoucher.id ? { ...v, ...updates } : v,
        ),
      );
      setStatusModalVoucher(null);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

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
    const invNo = String(
      v.invoiceNumber ||
        `INV/25-26/${String(v.originalIndex + 1).padStart(3, "0")}`,
    ).toLowerCase();

    const matchesSearch =
      (v.partyId && v.partyId.toLowerCase().includes(searchLower)) ||
      invNo.includes(searchLower);

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
    if (filters.priceMax < 200000 && total > filters.priceMax)
      matchesPrice = false;

    let matchesStatus = true;
    if (filters.status && v.status !== filters.status) matchesStatus = false;

    let matchesMethod = true;
    if (filters.paymentMethod && v.paymentMethod !== filters.paymentMethod)
      matchesMethod = false;

    return (
      matchesSearch &&
      matchesDateRange &&
      matchesPrice &&
      matchesStatus &&
      matchesMethod
    );
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
    filters.sortParty !== "",
    filters.status !== "",
    filters.paymentMethod !== "",
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
                  <div className="voucher-card-title-group">
                    <h4 className="voucher-card-title voucher-card-title-cutoff">
                      {v.partyId}
                    </h4>
                    <span
                      className={`status-badge ${v.status?.toLowerCase() || "unpaid"}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setStatusModalVoucher(v);
                        setTempStatusData({
                          status: v.status || "Unpaid",
                          paidAmount: v.paidAmount || 0,
                        });
                      }}
                      title="Click to update status"
                      style={{ cursor: "pointer" }}
                    >
                      {v.status || "Unpaid"}
                    </span>
                  </div>
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
                  <div className="voucher-meta-grid">
                    <div className="party-detail-row">
                      <div className="party-detail-icon">
                        <Hash size={14} />
                      </div>
                      <p>
                        {v.invoiceNumber ||
                          `INV/25-26/${String(v.originalIndex + 1).padStart(3, "0")}`}
                      </p>
                    </div>
                    <div className="party-detail-row">
                      <div className="party-detail-icon">
                        <Calendar size={14} />
                      </div>
                      <p>{new Date(v.date).toLocaleDateString()}</p>
                    </div>
                    <div className="party-detail-row">
                      <div className="party-detail-icon">
                        <CreditCard size={14} />
                      </div>
                      <p>{v.paymentMethod || "Cash"}</p>
                    </div>
                    <div className="party-detail-row">
                      <div className="party-detail-icon">
                        <Package size={14} />
                      </div>
                      <p>{v.items.length} Items</p>
                    </div>
                  </div>

                  <div className="voucher-card-footer">
                    <div className="voucher-price-info">
                      <span className="price-label">Total Amount</span>
                      <strong className="voucher-total-highlight">
                        ₹{calculateTotal(v.items).toFixed(2)}
                      </strong>
                    </div>
                    {v.status === "Partial" && (
                      <div className="voucher-remaining-info">
                        <span className="price-label">Remaining</span>
                        <span className="remaining-value">
                          ₹
                          {(v.remainingAmount !== undefined
                            ? v.remainingAmount
                            : calculateTotal(v.items)
                          ).toFixed(2)}
                        </span>
                      </div>
                    )}
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
          <div
            className="qr-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="qr-modal-header">
              <h3>Scan to View Invoice</h3>
              <button
                className="qr-modal-close"
                onClick={() => setQrVoucher(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="qr-modal-body">
              <QRCode
                value={`${window.location.origin}/voucher-print/${qrVoucher.id}`}
                size={220}
                className="qr-code-img"
              />
              <p className="qr-modal-id">
                {qrVoucher.invoiceNumber ||
                  `INV/25-26/${String(qrVoucher.originalIndex + 1).padStart(3, "0")}`}
              </p>
              <p className="qr-modal-help">
                Scan this QR code with any mobile camera to view and download
                the invoice.
              </p>
            </div>
          </div>
        </div>
      )}

      {showFilterModal && (
        <div
          className="qr-modal-overlay"
          onClick={() => setShowFilterModal(false)}
        >
          <div
            className="qr-modal-content filter-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="qr-modal-header">
              <h3>Filter Options</h3>
              <button
                className="qr-modal-close"
                onClick={() => setShowFilterModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="qr-modal-body filter-modal-body">
              <div className="form-group filter-form-group">
                <div className="filter-group-header">
                  <label className="form-label filter-label-bold">
                    Date Range
                  </label>
                  {(filters.dateFrom || filters.dateTo) && (
                    <span
                      className="filter-clear-link"
                      onClick={() =>
                        setFilters({ ...filters, dateFrom: "", dateTo: "" })
                      }
                    >
                      Clear
                    </span>
                  )}
                </div>
                <div className="filter-date-inputs">
                  <input
                    type={filters.dateFrom ? "date" : "text"}
                    onFocus={(e) => {
                      e.target.type = "date";
                    }}
                    onClick={(e) => {
                      e.target.type = "date";
                      setTimeout(() => {
                        try {
                          e.target.showPicker();
                        } catch (err) {}
                      }, 50);
                    }}
                    onTouchStart={(e) => {
                      e.target.type = "date";
                      setTimeout(() => {
                        try {
                          e.target.showPicker();
                        } catch (err) {}
                      }, 50);
                    }}
                    onBlur={(e) => {
                      if (!e.target.value) e.target.type = "text";
                    }}
                    placeholder="dd-mm-yyyy"
                    className="form-input"
                    value={filters.dateFrom}
                    onChange={(e) =>
                      setFilters({ ...filters, dateFrom: e.target.value })
                    }
                  />
                  <span className="filter-date-separator">to</span>
                  <input
                    type={filters.dateTo ? "date" : "text"}
                    onFocus={(e) => {
                      e.target.type = "date";
                    }}
                    onClick={(e) => {
                      e.target.type = "date";
                      setTimeout(() => {
                        try {
                          e.target.showPicker();
                        } catch (err) {}
                      }, 50);
                    }}
                    onTouchStart={(e) => {
                      e.target.type = "date";
                      setTimeout(() => {
                        try {
                          e.target.showPicker();
                        } catch (err) {}
                      }, 50);
                    }}
                    onBlur={(e) => {
                      if (!e.target.value) e.target.type = "text";
                    }}
                    placeholder="dd-mm-yyyy"
                    className="form-input"
                    value={filters.dateTo}
                    onChange={(e) =>
                      setFilters({ ...filters, dateTo: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-group filter-form-group">
                <div className="filter-group-header">
                  <label className="form-label filter-label-bold">Price</label>
                  {(filters.priceMin > 0 || filters.priceMax < 200000) && (
                    <span
                      className="filter-clear-link"
                      onClick={() =>
                        setFilters({
                          ...filters,
                          priceMin: 0,
                          priceMax: 200000,
                        })
                      }
                    >
                      Clear
                    </span>
                  )}
                </div>
                <div className="price-range-display">
                  ₹{filters.priceMin.toLocaleString()} – ₹
                  {filters.priceMax.toLocaleString()}
                  {filters.priceMax >= 200000 ? "+" : ""}
                </div>
                <div className="range-slider-container">
                  <div
                    className="range-slider-track"
                    style={{
                      left: `${(filters.priceMin / 200000) * 100}%`,
                      right: `${100 - (filters.priceMax / 200000) * 100}%`,
                    }}
                  ></div>
                  <input
                    type="range"
                    min="0"
                    max="200000"
                    step="100"
                    value={filters.priceMin}
                    onChange={(e) => {
                      const val = Math.min(
                        Number(e.target.value),
                        filters.priceMax,
                      );
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
                      const val = Math.max(
                        Number(e.target.value),
                        filters.priceMin,
                      );
                      setFilters({ ...filters, priceMax: val });
                    }}
                    className="range-slider-thumb thumb-right"
                  />
                </div>
              </div>

              <div className="form-group filter-form-group">
                <div className="filter-group-header">
                  <label className="form-label filter-label-bold">
                    Voucher Status
                  </label>
                  {filters.status !== "" && (
                    <span
                      className="filter-clear-link"
                      onClick={() => setFilters({ ...filters, status: "" })}
                    >
                      Reset
                    </span>
                  )}
                </div>
                <Select 
                  menuPortalTarget={document.body}
                  options={[
                    { value: "", label: "All Statuses" },
                    { value: "Paid", label: "Paid" },
                    { value: "Unpaid", label: "Unpaid" },
                    { value: "Partial", label: "Partial" },
                  ]}
                  value={
                    filters.status
                      ? { value: filters.status, label: filters.status }
                      : { value: "", label: "All Statuses" }
                  }
                  onChange={(selected) =>
                    setFilters({ ...filters, status: selected.value })
                  }
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
              </div>

              <div className="form-group filter-form-group">
                <div className="filter-group-header">
                  <label className="form-label filter-label-bold">
                    Payment Method
                  </label>
                  {filters.paymentMethod !== "" && (
                    <span
                      className="filter-clear-link"
                      onClick={() =>
                        setFilters({ ...filters, paymentMethod: "" })
                      }
                    >
                      Reset
                    </span>
                  )}
                </div>
                <Select
                  menuPortalTarget={document.body}
                  options={[
                    { value: "", label: "All Methods" },
                    { value: "Cash", label: "Cash" },
                    { value: "Online", label: "Online" },
                  ]}
                  value={
                    filters.paymentMethod
                      ? {
                          value: filters.paymentMethod,
                          label: filters.paymentMethod,
                        }
                      : { value: "", label: "All Methods" }
                  }
                  onChange={(selected) =>
                    setFilters({ ...filters, paymentMethod: selected.value })
                  }
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
              </div>

              <div className="form-group filter-form-group">
                <div className="filter-group-header">
                  <label className="form-label filter-label-bold">
                    Sort By Invoice Date
                  </label>
                  {filters.sortInvoice !== "desc" && (
                    <span
                      className="filter-clear-link"
                      onClick={() =>
                        setFilters({ ...filters, sortInvoice: "desc" })
                      }
                    >
                      Reset
                    </span>
                  )}
                </div>
                <Select
                  menuPortalTarget={document.body}
                  options={[
                    { value: "desc", label: "Newest First" },
                    { value: "asc", label: "Oldest First" },
                  ]}
                  value={
                    filters.sortInvoice === "desc"
                      ? { value: "desc", label: "Newest First" }
                      : { value: "asc", label: "Oldest First" }
                  }
                  onChange={(selected) =>
                    setFilters({ ...filters, sortInvoice: selected.value })
                  }
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
              </div>

              <div className="form-group filter-form-group-last">
                <div className="filter-group-header">
                  <label className="form-label filter-label-bold">
                    Sort By Party Name
                  </label>
                  {filters.sortParty !== "" && (
                    <span
                      className="filter-clear-link"
                      onClick={() => setFilters({ ...filters, sortParty: "" })}
                    >
                      Reset
                    </span>
                  )}
                </div>
                <Select
                  menuPortalTarget={document.body}
                  options={[
                    { value: "", label: "None" },
                    { value: "asc", label: "A to Z" },
                    { value: "desc", label: "Z to A" },
                  ]}
                  value={
                    filters.sortParty === "asc"
                      ? { value: "asc", label: "A to Z" }
                      : filters.sortParty === "desc"
                        ? { value: "desc", label: "Z to A" }
                        : { value: "", label: "None" }
                  }
                  onChange={(selected) =>
                    setFilters({ ...filters, sortParty: selected.value })
                  }
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
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
                      status: "",
                      paymentMethod: "",
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
      {statusModalVoucher && (
        <div
          className="qr-modal-overlay"
          onClick={() => setStatusModalVoucher(null)}
        >
          <div
            className="qr-modal-content filter-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "400px" }}
          >
            <div className="qr-modal-header">
              <h3>Update Status</h3>
              <button
                className="qr-modal-close"
                onClick={() => setStatusModalVoucher(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="qr-modal-body filter-modal-body">
              <div className="form-group filter-form-group">
                <label className="form-label filter-label-bold">Status</label>
                <Select
                  menuPortalTarget={document.body}
                  options={[
                    { value: "Paid", label: "Paid" },
                    { value: "Partial", label: "Partial" },
                    { value: "Unpaid", label: "Unpaid" },
                  ]}
                  value={{
                    value: tempStatusData.status,
                    label: tempStatusData.status,
                  }}
                  onChange={(selected) =>
                    setTempStatusData({
                      ...tempStatusData,
                      status: selected.value,
                      paidAmount:
                        selected.value === "Paid"
                          ? calculateTotal(statusModalVoucher.items)
                          : selected.value === "Unpaid"
                            ? 0
                            : tempStatusData.paidAmount,
                    })
                  }
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
              </div>

              {tempStatusData.status === "Partial" && (
                <div className="form-group filter-form-group">
                  <label className="form-label filter-label-bold">
                    Amount Paid (₹)
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={tempStatusData.paidAmount}
                    onChange={(e) =>
                      setTempStatusData({
                        ...tempStatusData,
                        paidAmount: e.target.value,
                      })
                    }
                  />
                  <div
                    style={{
                      marginTop: "0.5rem",
                      fontSize: "0.85rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Balance: ₹
                    {(
                      calculateTotal(statusModalVoucher.items) -
                      (parseFloat(tempStatusData.paidAmount) || 0)
                    ).toFixed(2)}
                  </div>
                </div>
              )}

              <div className="filter-actions" style={{ marginTop: "1rem" }}>
                <button
                  className="btn btn-outline-danger filter-btn-clear"
                  onClick={() => setStatusModalVoucher(null)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary filter-btn-apply"
                  onClick={handleStatusUpdate}
                  disabled={updatingStatus}
                >
                  {updatingStatus ? "Updating..." : "Update Status"}
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
