import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Plus, Trash2, Printer } from "lucide-react";
import Select from "react-select";
import "./AddVoucher.css";

function AddVoucher() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [parties, setParties] = useState([]);
  const [products, setProducts] = useState([]);
  
  const [voucher, setVoucher] = useState({
    date: new Date().toISOString().split('T')[0],
    partyId: "",
    items: [],
    note: ""
  });

  // Load parties and products for dropdowns
  useEffect(() => {
    setParties(JSON.parse(localStorage.getItem("parties")) || []);
    setProducts(JSON.parse(localStorage.getItem("products")) || []);
    
    if (id) {
       const savedVouchers = JSON.parse(localStorage.getItem("vouchers")) || [];
       if (savedVouchers[id]) {
         setVoucher(savedVouchers[id]);
       }
    }
  }, [id]);

  const addItem = () => {
    setVoucher({
      ...voucher,
      items: [...voucher.items, { productId: "", name: "", price: 0, qty: 1, tax: 0, taxAmount: 0, amount: 0 }]
    });
  };

  const removeItem = (index) => {
    const newItems = voucher.items.filter((_, i) => i !== index);
    setVoucher({ ...voucher, items: newItems });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...voucher.items];
    const item = { ...newItems[index] };

    if (field === "productId") {
      const product = products.find(p => p.email === value || p.name === value || JSON.stringify(p) === value); 
      // Actually value should be unique ID, but we only have index or implicit IDs. 
      // Let's assume using array index as ID is risky if products deleted. 
      // Ideally products should have IDs.
      // For now, let's match by NAME string since that's what we have stable-ish.
      const selectedProduct = products.find(p => p.name === value);
      if (selectedProduct) {
        item.productId = value;
        item.name = selectedProduct.name;
        item.price = parseFloat(selectedProduct.price) || 0;
        item.tax = parseFloat(selectedProduct.tax) || 0;
        item.unit = selectedProduct.unit;
      } else {
        item.productId = "";
        item.name = "";
        item.price = 0;
        item.tax = 0;
        item.unit = "";
      }
    } else {
      item[field] = value;
    }

    // Recalculate line totals
    const qty = parseFloat(item.qty) || 0;
    const price = parseFloat(item.price) || 0;
    const taxRate = parseFloat(item.tax) || 0;

    const baseAmount = price * qty;
    const taxAmount = (baseAmount * taxRate) / 100;
    
    item.taxAmount = taxAmount;
    item.amount = baseAmount + taxAmount;

    newItems[index] = item;
    setVoucher({ ...voucher, items: newItems });
  };

  const calculateTotals = () => {
    return voucher.items.reduce((acc, item) => {
      acc.subtotal += (item.price * item.qty);
      acc.tax += item.taxAmount;
      acc.total += item.amount;
      return acc;
    }, { subtotal: 0, tax: 0, total: 0 });
  };

  const totals = calculateTotals();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!voucher.partyId || voucher.items.length === 0) {
      alert("Please select a party and add at least one item.");
      return;
    }

    let vouchers = JSON.parse(localStorage.getItem("vouchers")) || [];
    if (id) {
      vouchers[id] = voucher;
    } else {
      vouchers.push(voucher);
    }
    localStorage.setItem("vouchers", JSON.stringify(vouchers));
    navigate("/vouchers");
  };

  return (
    <div className="add-voucher-page">
      <header className="fixed-header no-print add-voucher-header">
        <button className="btn btn-outline btn-icon add-voucher-back-btn" onClick={() => navigate("/vouchers")} title="Back">
          <ArrowLeft size={18} />
        </button>
        <h3 className="add-voucher-title">{id ? "Edit Voucher" : "New Voucher"}</h3>
      </header>
      
      <div className="content-below-fixed">
        <form onSubmit={handleSubmit}>
          
          {/* Voucher Header Info */}
          <div className="grid grid-2 voucher-header-info">
            <div className="form-group">
              <label className="form-label">Date</label>
              <input 
                type="date" 
                className="form-input" 
                value={voucher.date}
                onChange={(e) => setVoucher({ ...voucher, date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Party</label>
              <Select 
                options={parties.map(p => ({ value: p.name, label: p.name }))}
                value={voucher.partyId ? { value: voucher.partyId, label: voucher.partyId } : null}
                onChange={(selected) => setVoucher({ ...voucher, partyId: selected ? selected.value : "" })}
                placeholder="Select Party"
                isClearable
                className="react-select-container"
                classNamePrefix="react-select"
              />
            </div>
          </div>

          {/* Items Section */}
          <div className="voucher-items-wrapper">
            <div className="voucher-items-header-row">
              <div className="voucher-col voucher-col-product">Product</div>
              <div className="voucher-col voucher-col-price">Price</div>
              <div className="voucher-col voucher-col-qty">Quantity</div>
              <div className="voucher-col voucher-col-tax">Tax%</div>
              <div className="voucher-col voucher-col-total">Total</div>
              <div className="voucher-col voucher-col-action"></div>
            </div>
            
            <div className="voucher-items-list">
              {voucher.items.map((item, index) => (
                <div key={index} className="voucher-item-row">
                  <div className="voucher-cell voucher-col-product" data-label="Product">
                    <Select 
                      options={products.map(p => ({ value: p.name, label: p.name }))}
                      value={item.productId ? { value: item.productId, label: item.productId } : null}
                      onChange={(selected) => handleItemChange(index, "productId", selected ? selected.value : "")}
                      placeholder="Select Product..."
                      isClearable
                      className="react-select-container voucher-product-select"
                      classNamePrefix="react-select"
                    />
                  </div>
                  <div className="voucher-cell voucher-col-price" data-label="Price">
                    <input 
                      type="number" 
                      className="form-input"
                      value={item.price}
                      onChange={(e) => handleItemChange(index, "price", e.target.value)}
                    />
                  </div>
                  <div className="voucher-cell voucher-col-qty" data-label="Quantity">
                    <input 
                      type="number" 
                      className="form-input"
                      value={item.qty}
                      onChange={(e) => handleItemChange(index, "qty", e.target.value)}
                    />
                  </div>
                  <div className="voucher-cell voucher-col-tax" data-label="Tax%">
                    <span>{item.tax}%</span>
                  </div>
                  <div className="voucher-cell voucher-col-total" data-label="Amount">
                    <span>{Number(item.amount || 0).toFixed(2)}</span>
                  </div>
                  <div className="voucher-cell voucher-col-action">
                    <button type="button" onClick={() => removeItem(index)} className="voucher-remove-btn" title="Remove Item">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="voucher-add-item-container">
              <button 
                type="button" 
                className="btn btn-outline-primary voucher-add-item-btn" 
                onClick={addItem}
              >
                Add Item
              </button>
            </div>
          </div>

          <div className="voucher-totals-container">
            <div className="voucher-total-block">
              <p className="voucher-total-label">Subtotal</p>
              <p className="voucher-subtotal-value">₹{totals.subtotal.toFixed(2)}</p>
            </div>
            <div className="voucher-total-block">
               <p className="voucher-total-label">Tax (GST)</p>
               <p className="voucher-tax-value">₹{totals.tax.toFixed(2)}</p>
            </div>
            <div className="voucher-total-block">
               <p className="voucher-total-label">Total</p>
               <p className="voucher-grand-total-value">₹{totals.total.toFixed(2)}</p>
            </div>
          </div>

          <div className="form-group voucher-notes-group">
            <label className="form-label">Notes</label>
            <textarea 
              className="form-textarea"
              rows="2"
              value={voucher.note}
              onChange={(e) => setVoucher({...voucher, note: e.target.value})}
              placeholder="Payment terms, delivery notes, etc."
            />
          </div>

          <div className="voucher-actions">
            <button type="submit" className="btn btn-outline-primary btn-mobile-flex">
              Save Voucher
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default AddVoucher;
