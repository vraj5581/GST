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
  const [services, setServices] = useState([]);

  const [popupData, setPopupData] = useState(null);

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

        const servicesQ = query(
          collection(db, "services"),
          where("companyId", "==", loggedCompanyId),
        );
        const servicesSnap = await getDocs(servicesQ);
        setServices(
          servicesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
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

  const updateVoucherItems = (selectedOptions) => {
    const newSelectedProducts = selectedOptions || [];

    const updatedItems = newSelectedProducts.map((option) => {
      if (option.isService) {
        const existingItem = voucher.items.find(
          (item) => item.serviceId === option.serviceId,
        );
        if (existingItem) return existingItem;

        const serviceDef = services.find((s) => s.id === option.serviceId);
        const relatedProduct = serviceDef
          ? products.find((p) => p.id === serviceDef.productId)
          : null;
        const price = serviceDef ? parseFloat(serviceDef.servicePrice) || 0 : 0;
        return {
          isService: true,
          serviceId: option.serviceId,
          productId: serviceDef ? serviceDef.productId : null,
          name: serviceDef
            ? `${relatedProduct ? relatedProduct.name : ""} (${serviceDef.serviceType})`.trim()
            : option.label,
          price: price,
          qty: 1,
          amount: price * 1,
          unit: "Service",
        };
      } else {
        const existingItem = voucher.items.find(
          (item) => item.productId === option.value && !item.isService,
        );
        if (existingItem) return existingItem;

        const productDef = products.find((p) => p.name === option.value);
        const price = productDef ? parseFloat(productDef.price) || 0 : 0;
        return {
          isService: false,
          productId: option.value,
          name: productDef ? productDef.name : option.value,
          price: price,
          qty: 1,
          amount: price * 1,
          unit: productDef ? productDef.unit : "Pcs",
        };
      }
    });

    setVoucher({ ...voucher, items: updatedItems });
  };

  const handleProductSelect = (newValue, actionMeta) => {
    if (
      actionMeta &&
      (actionMeta.action === "select-option" ||
        actionMeta.action === "deselect-option")
    ) {
      const option = actionMeta.option;
      if (!option.isService) {
        const productDef = products.find((p) => p.name === option.value);
        if (productDef) {
          const prodServices = services.filter(
            (s) => s.productId === productDef.id,
          );
          if (prodServices.length > 0) {
            setPopupData({
              product: productDef,
              services: prodServices,
            });
            return;
          }
        }
      }

      if (actionMeta.action === "deselect-option") {
        return; // Prevent accidental deselection from dropdown menu click; users must use "x" on tag
      }
    }

    updateVoucherItems(newValue);
  };

  const handlePopupSelection = (type, itemData) => {
    const currentOptions = voucher.items.map((item) => ({
      value: item.isService ? `service_${item.serviceId}` : item.productId,
      label: item.name,
      isService: item.isService,
      serviceId: item.serviceId,
    }));

    if (type === "product") {
      const exists = currentOptions.some(
        (o) => o.value === popupData.product.name && !o.isService,
      );
      if (!exists) {
        currentOptions.push({
          value: popupData.product.name,
          label: popupData.product.name,
        });
      }
    }
    if (type === "service") {
      const val = `service_${itemData.id}`;
      const exists = currentOptions.some((o) => o.value === val);
      if (!exists) {
        currentOptions.push({
          value: val,
          label: `${itemData.serviceType}`,
          isService: true,
          serviceId: itemData.id,
        });
      }
    }

    updateVoucherItems(currentOptions);
  };

  const handlePopupClose = () => {
    setPopupData(null);
  };

  const removeItem = (index) => {
    const newItems = voucher.items.filter((_, i) => i !== index);
    setVoucher({ ...voucher, items: newItems });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...voucher.items];
    const item = { ...newItems[index] };

    const parsedValue = value === "" ? "" : Math.max(0, parseFloat(value) || 0);
    item[field] = parsedValue;

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
    const safeVal = val === "" ? "" : Math.max(0, parseFloat(val) || 0);
    const newPaidAmount = parseFloat(safeVal) || 0;
    let newStatus = voucher.status;

    // Only flip to 'Paid' if the amount meets or exceeds the total
    if (newPaidAmount >= totals.total && totals.total > 0) {
      newStatus = "Paid";
    }

    setVoucher({
      ...voucher,
      paidAmount: safeVal,
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
              hideSelectedOptions={false}
              isDisabled={!voucher.partyId}
              options={products
                .filter((p) => {
                  const isProductAdded = voucher.items.some(
                    (item) => !item.isService && item.productId === p.name,
                  );
                  const prodServices = services.filter(
                    (s) => s.productId === p.id,
                  );

                  if (!isProductAdded) return true;
                  if (prodServices.length === 0) return false;

                  const allServicesAdded = prodServices.every((s) =>
                    voucher.items.some(
                      (item) => item.isService && item.serviceId === s.id,
                    ),
                  );

                  return !allServicesAdded;
                })
                .map((p) => ({ value: p.name, label: p.name }))}
              value={voucher.items.map((item) => ({
                value: item.isService
                  ? `service_${item.serviceId}`
                  : item.productId,
                label: item.name,
                isService: item.isService,
                serviceId: item.serviceId,
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
                      {(() => {
                        const lastOpen = item.name.lastIndexOf("(");
                        const lastClose = item.name.lastIndexOf(")");
                        if (
                          item.isService &&
                          lastOpen !== -1 &&
                          lastClose > lastOpen
                        ) {
                          const pName = item.name.substring(0, lastOpen).trim();
                          const sName = item.name.substring(
                            lastOpen,
                            lastClose + 1,
                          );
                          return (
                            <>
                              <strong>{pName}</strong>
                              <span className="av-service-subtext">
                                {sName}
                              </span>
                            </>
                          );
                        }
                        return <strong>{item.name}</strong>;
                      })()}
                    </div>
                    <div
                      className="voucher-cell voucher-col-qty av-qty-cell-content"
                      data-label="QTY"
                    >
                      <input
                        type="number"
                        min="0"
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
                        min="0"
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
                    min="0"
                    value={voucher.paidAmount}
                    onChange={(e) => handlePaidAmountChange(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Balance Remaining (₹)</label>
                  <input
                    type="text"
                    className={`form-input av-balance-input ${remainingAmount > 0 ? "av-balance-due" : "av-balance-clear"}`}
                    value={remainingAmount.toFixed(2)}
                    readOnly
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

      {popupData && (
        <div className="av-popup-overlay">
          <div className="av-popup-content">
            <h4>{popupData.product.name} Options</h4>
            <p className="av-popup-sub">This product has services available.</p>

            <div className="av-popup-options">
              {(() => {
                const isProductAdded = voucher.items.some(
                  (item) =>
                    !item.isService &&
                    item.productId === popupData.product.name,
                );
                return (
                  <button
                    type="button"
                    className="btn btn-outline-primary av-popup-btn"
                    onClick={() => handlePopupSelection("product")}
                    disabled={isProductAdded}
                  >
                    {isProductAdded ? "Added" : "Add Product Only"}
                  </button>
                );
              })()}

              <div className="av-popup-divider">SERVICES</div>

              {popupData.services.map((s) => {
                const isServiceAdded = voucher.items.some(
                  (item) => item.isService && item.serviceId === s.id,
                );
                return (
                  <div key={s.id} className="av-popup-service-row">
                    <span className="av-popup-service-name">
                      {s.serviceType} (₹{s.servicePrice})
                    </span>
                    <div className="av-popup-service-actions">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => handlePopupSelection("service", s)}
                        disabled={isServiceAdded}
                      >
                        {isServiceAdded ? "Added" : "Service Only"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              className="btn btn-primary av-popup-cancel"
              onClick={handlePopupClose}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddVoucher;
