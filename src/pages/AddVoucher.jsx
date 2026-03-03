import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Plus, Trash2, Printer, Calendar } from "lucide-react";
import Select from "react-select";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  query,
  where,
} from "firebase/firestore";
import { getDB } from "../firebase";
import "./AddVoucher.css";

function AddVoucher() {
  const db = getDB();
  const { id } = useParams();
  const navigate = useNavigate();

  const [parties, setParties] = useState([]);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(false);
  const productSelectRef = useRef(null);

  const [voucher, setVoucher] = useState({
    date: new Date().toISOString().split("T")[0],
    partyId: "",
    items: [],
    note: "",
    paymentMethod: "Cash",
    status: "Paid",
    paidAmount: 0,
  });

  // Load parties and products for dropdowns
  useEffect(() => {
    const fetchData = async () => {
      try {
        const loggedCompanyId = JSON.parse(
          localStorage.getItem("loggedCompany"),
        )?.id;

        const partiesQ = query(
          collection(db, "parties"),
          where("companyId", "==", loggedCompanyId),
        );
        const partiesSnap = await getDocs(partiesQ);
        setParties(
          partiesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );

        const productsQ = query(
          collection(db, "products"),
          where("companyId", "==", loggedCompanyId),
        );
        const productsSnap = await getDocs(productsQ);
        setProducts(
          productsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );

        if (id) {
          const voucherSnap = await getDoc(doc(db, "vouchers", id));
          if (voucherSnap.exists()) {
            const data = voucherSnap.data();
            setVoucher({
              paymentMethod: "Cash",
              status: "Paid",
              paidAmount: 0,
              ...data,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [id, db]);

  const handleProductSelect = (selectedOptions) => {
    // Handle the multi-select options
    const newSelectedProducts = selectedOptions || [];

    // Map selected products to items, preserving existing row data (qty, price)
    const updatedItems = newSelectedProducts.map((option) => {
      const existingItem = voucher.items.find(
        (item) => item.productId === option.value,
      );
      if (existingItem) {
        return existingItem;
      }

      const productDef = products.find((p) => p.name === option.value);
      const price = productDef ? parseFloat(productDef.price) || 0 : 0;
      return {
        productId: option.value,
        name: productDef ? productDef.name : option.value,
        price: price,
        qty: 1,
        amount: price * 1,
        unit: productDef ? productDef.unit : "Pcs",
      };
    });

    setVoucher({ ...voucher, items: updatedItems });
  };

  const removeItem = (index) => {
    const newItems = voucher.items.filter((_, i) => i !== index);
    setVoucher({ ...voucher, items: newItems });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...voucher.items];
    const item = { ...newItems[index] };

    item[field] = value;

    const qty = parseFloat(item.qty) || 0;
    const price = parseFloat(item.price) || 0;

    item.amount = price * qty;

    newItems[index] = item;
    setVoucher({ ...voucher, items: newItems });
  };

  const calculateTotals = () => {
    return voucher.items.reduce(
      (acc, item) => {
        acc.total += item.amount;
        return acc;
      },
      { total: 0 },
    );
  };

  const totals = calculateTotals();
  const remainingAmount = totals.total - (parseFloat(voucher.paidAmount) || 0);

  // Auto-sync paidAmount when status is 'Paid'
  useEffect(() => {
    if (voucher.status === "Paid" && voucher.paidAmount !== totals.total) {
      setVoucher((prev) => ({
        ...prev,
        paidAmount: totals.total,
      }));
    }
  }, [totals.total, voucher.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clean up any stray empty items before saving
    const cleanedItems = voucher.items.filter((item) => item.productId);

    if (!voucher.partyId || cleanedItems.length === 0) {
      alert("Please select a party and add at least one valid item.");
      return;
    }

    setLoading(true);
    const finalVoucher = {
      ...voucher,
      items: cleanedItems,
      totalAmount: totals.total,
      remainingAmount: remainingAmount,
      companyId: JSON.parse(localStorage.getItem("loggedCompany"))?.id,
    };

    try {
      if (id) {
        await updateDoc(doc(db, "vouchers", id), finalVoucher);
      } else {
        // Assign creation timestamp if purely new
        finalVoucher.createdAt = Date.now();

        // Generate Invoice Number
        const loggedCompanyId = JSON.parse(
          localStorage.getItem("loggedCompany"),
        )?.id;
        const vouchersQ = query(
          collection(db, "vouchers"),
          where("companyId", "==", loggedCompanyId),
        );
        const vouchersSnap = await getDocs(vouchersQ);
        const nextInvoiceNum = `INV/25-26/${String(vouchersSnap.size + 1).padStart(3, "0")}`;
        finalVoucher.invoiceNumber = nextInvoiceNum;

        await addDoc(collection(db, "vouchers"), finalVoucher);
      }
      navigate("/vouchers");
    } catch (error) {
      console.error("Error saving voucher:", error);
      alert("Failed to save voucher. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (newStatus) => {
    let newPaidAmount = voucher.paidAmount;

    if (newStatus === "Paid") {
      newPaidAmount = totals.total;
    } else if (newStatus === "Unpaid") {
      newPaidAmount = 0;
    }
    // For "Partial", we keep the current paid amount or let user edit

    setVoucher({
      ...voucher,
      status: newStatus,
      paidAmount: newPaidAmount,
    });
  };

  const handlePaidAmountChange = (val) => {
    const newPaidAmount = parseFloat(val) || 0;
    let newStatus = "Partial";

    // Only flip to 'Paid' if the amount meets or exceeds the total
    if (newPaidAmount >= totals.total && totals.total > 0) {
      newStatus = "Paid";
    }
    // We avoid flipping to 'Unpaid' here so the input field doesn't disappear 
    // while the user is typing/clearing the value.

    setVoucher({
      ...voucher,
      paidAmount: val,
      status: newStatus,
    });
  };

  return (
    <div className="add-voucher-page">
      <header className="fixed-header no-print add-voucher-header">
        <button
          className="btn btn-outline btn-icon add-voucher-back-btn"
          onClick={() => navigate("/vouchers")}
          title="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <h3 className="add-voucher-title">
          {id ? "Edit Voucher" : "New Voucher"}
        </h3>
      </header>

      <div className="content-below-fixed">
        <form onSubmit={handleSubmit}>
          {/* Voucher Header Info */}
          <div className="grid grid-2 voucher-header-info">
            <div className="form-group">
              <label className="form-label">Date</label>
              <div className="input-with-icon">
                <Calendar className="input-icon" size={18} />
                <input
                  type="date"
                  className="form-input"
                  value={voucher.date}
                  onChange={(e) =>
                    setVoucher({ ...voucher, date: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Party</label>
              <Select
                menuPortalTarget={document.body}
                options={parties.map((p) => ({ value: p.name, label: p.name }))}
                value={
                  voucher.partyId
                    ? { value: voucher.partyId, label: voucher.partyId }
                    : null
                }
                onChange={(selected) =>
                  setVoucher({
                    ...voucher,
                    partyId: selected ? selected.value : "",
                  })
                }
                placeholder="Select Party"
                isClearable
                className="react-select-container"
                classNamePrefix="react-select"
              />
            </div>
          </div>

          {/* Multi-Select Products Section */}
          <div className="form-group av-products-group" ref={productSelectRef}>
            <label className="form-label">Products</label>
            <Select
              menuPortalTarget={document.body}
              isMulti
              isDisabled={!voucher.partyId}
              options={products.map((p) => ({ value: p.name, label: p.name }))}
              value={voucher.items.map((item) => ({
                value: item.productId,
                label: item.name,
              }))}
              onChange={handleProductSelect}
              placeholder={
                !voucher.partyId
                  ? "Please select a party first..."
                  : "Search and add multiple products..."
              }
              onFocus={() => {
                if (productSelectRef.current) {
                  setTimeout(() => {
                    productSelectRef.current.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }, 150);
                }
              }}
              className="react-select-container"
              classNamePrefix="react-select"
            />
          </div>

          {/* Items Section */}
          <div className="voucher-items-wrapper">
            <div className="voucher-items-header-row">
              <div className="voucher-col voucher-col-product">Product</div>
              <div className="voucher-col voucher-col-qty">QTY</div>
              <div className="voucher-col voucher-col-unit">UNIT</div>
              <div className="voucher-col voucher-col-price">Price</div>
              <div className="voucher-col voucher-col-total">Total</div>
            </div>

            <div className="voucher-items-list">
              {voucher.items.length > 0 ? (
                voucher.items.map((item, index) => (
                  <div key={index} className="voucher-item-row">
                    <div
                      className="voucher-cell voucher-col-product"
                      data-label="Product"
                    >
                      <strong>{item.name}</strong>
                    </div>
                    <div
                      className="voucher-cell voucher-col-qty av-qty-cell-content"
                      data-label="QTY"
                    >
                      <input
                        type="number"
                        className="form-input av-qty-input"
                        value={item.qty}
                        onChange={(e) =>
                          handleItemChange(index, "qty", e.target.value)
                        }
                      />
                    </div>
                    <div
                      className="voucher-cell voucher-col-unit"
                      data-label="UNIT"
                    >
                      <span className="av-qty-unit">{item.unit || "Pcs"}</span>
                    </div>
                    <div
                      className="voucher-cell voucher-col-price"
                      data-label="Price"
                    >
                      <input
                        type="number"
                        className="form-input"
                        value={item.price}
                        onChange={(e) =>
                          handleItemChange(index, "price", e.target.value)
                        }
                      />
                    </div>
                    <div
                      className="voucher-cell voucher-col-total"
                      data-label="Amount"
                    >
                      <span>{Number(item.amount || 0).toFixed(2)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="av-empty-state">No products selected.</div>
              )}
            </div>
          </div>

          <div className="grid grid-2 voucher-header-info">
            <div className="form-group">
              <label className="form-label">Voucher Status</label>
              <Select
                menuPortalTarget={document.body}
                options={[
                  { value: "Unpaid", label: "Unpaid" },
                  { value: "Partial", label: "Partial" },
                  { value: "Paid", label: "Paid" },
                ]}
                value={{ value: voucher.status, label: voucher.status }}
                onChange={(selected) => handleStatusChange(selected.value)}
                className="react-select-container"
                classNamePrefix="react-select"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <Select
                menuPortalTarget={document.body}
                isDisabled={voucher.status === "Unpaid"}
                options={[
                  { value: "Cash", label: "Cash" },
                  { value: "Online", label: "Online" },
                ]}
                value={{
                  value: voucher.paymentMethod,
                  label: voucher.paymentMethod,
                }}
                onChange={(selected) =>
                  setVoucher({ ...voucher, paymentMethod: selected.value })
                }
                className="react-select-container"
                classNamePrefix="react-select"
              />
            </div>
          </div>

          <div className="voucher-totals-container">
            {voucher.status === "Partial" && (
              <div className="voucher-payment-calcs">
                <div className="form-group">
                  <label className="form-label">Amount Paid (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={voucher.paidAmount}
                    onChange={(e) => handlePaidAmountChange(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Balance Remaining (₹)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={remainingAmount.toFixed(2)}
                    readOnly
                    style={{
                      backgroundColor: "#f0f2f2",
                      fontWeight: "bold",
                      color: remainingAmount > 0 ? "#b12704" : "#007600",
                    }}
                  />
                </div>
              </div>
            )}

            <div className="voucher-total-block">
              <h3 className="voucher-total-label">Total</h3>
              <h3 className="voucher-grand-total-value">
                ₹{totals.total.toFixed(2)}
              </h3>
            </div>
          </div>

          <div className="form-group voucher-notes-group">
            <label className="form-label">Notes</label>
            <textarea
              className="form-textarea"
              rows="2"
              value={voucher.note}
              onChange={(e) => setVoucher({ ...voucher, note: e.target.value })}
              placeholder="Payment terms, delivery notes, etc."
            />
          </div>

          <div className="voucher-actions">
            <button
              type="submit"
              className="btn btn-outline-primary btn-mobile-flex"
              disabled={loading}
            >
              {loading ? "Processing..." : "Save Voucher"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddVoucher;
