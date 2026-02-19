import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Printer, ArrowLeft } from "lucide-react";

function VoucherPrint() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [voucher, setVoucher] = useState(null);
  const [party, setParty] = useState(null);

  useEffect(() => {
    const vouchers = JSON.parse(localStorage.getItem("vouchers")) || [];
    if (vouchers[id]) {
      setVoucher(vouchers[id]);
      
      const parties = JSON.parse(localStorage.getItem("parties")) || [];
      const partyData = parties.find(p => p.name === vouchers[id].partyId);
      setParty(partyData || { name: vouchers[id].partyId }); 
    }
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (!voucher) return <div>Loading...</div>;
  
  const calculateTotal = (items) => items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const calculateTotalTax = (items) => items.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
  const calculateSubtotal = (items) => items.reduce((sum, item) => sum + (item.price * item.qty), 0);

  return (
    <div className="print-container">
      <div className="fixed-header no-print" style={{ justifyContent: "flex-start" }}>
        <button className="btn btn-outline btn-icon" onClick={() => navigate("/vouchers")} style={{ flexShrink: 0 }} title="Back">
          <ArrowLeft size={20} />
        </button>
        <h3 style={{ margin: 0, border: "none" }}>Print Preview</h3>
        <button className="btn btn-primary" onClick={handlePrint} style={{ marginLeft: 'auto' }}>
          <Printer size={18} /> Print
        </button>
      </div>
      
      <div className="content-below-fixed printable-area">
        <div 
          style={{ 
            background: 'white', 
            padding: '2rem', 
            maxWidth: '210mm', 
            minHeight: '297mm', 
            margin: '0 auto',
            boxShadow: 'var(--shadow-md)',
            color: '#000'
          }}
        >
          {/* Header */}
          <div style={{ textAlign: "center", borderBottom: '2px solid #000', paddingBottom: '1rem', marginBottom: '2rem' }}> 
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>INVOICE / VOUCHER</h1>
            <p style={{ margin: 0 }}>Create beautiful invoices with our GST Billing App</p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Bill To:</h3>
              <p style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{party?.name}</p>
              <div style={{lineHeight: '1.4', marginTop: '4px'}}>
                {party?.address && <div>{party.address}</div>}
                {party?.gst && <div><strong>GSTIN:</strong> {party.gst}</div>}
                {party?.mobile && <div><strong>Mobile:</strong> {party.mobile}</div>}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p><strong>Date:</strong> {new Date(voucher.date).toLocaleDateString()}</p>
              <p><strong>Invoice No:</strong> #INV-{String(Number(id) + 1).padStart(4, '0')}</p>
            </div>
          </div>

          {/* Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
            <thead>
              <tr style={{ background: '#f0f0f0', borderBottom: '2px solid #000' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #ddd' }}>#</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #ddd' }}>Item Description</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', border: '1px solid #ddd' }}>Price</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #ddd' }}>Qty</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', border: '1px solid #ddd' }}>Tax</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', border: '1px solid #ddd' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {voucher.items.map((item, index) => (
                <tr key={index}>
                  <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>{index + 1}</td>
                  <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
                    <strong>{item.name}</strong>
                    {item.hsn && <div style={{ fontSize: '0.8rem', color: '#666' }}>HSN: {item.hsn}</div>}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', border: '1px solid #ddd' }}>₹{item.price.toFixed(2)}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #ddd' }}>{item.qty} {item.unit}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', border: '1px solid #ddd' }}>{item.tax}%<br/><span style={{ fontSize: '0.8rem' }}>(₹{item.taxAmount.toFixed(2)})</span></td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', border: '1px solid #ddd', fontWeight: 'bold' }}>₹{item.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
               <tr>
                 <td colSpan="5" style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold', borderTop: '2px solid #000' }}>Subtotal</td>
                 <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold', borderTop: '2px solid #000' }}>₹{calculateSubtotal(voucher.items).toFixed(2)}</td>
               </tr>
               <tr>
                 <td colSpan="5" style={{ padding: '0.75rem', textAlign: 'right' }}>Total Tax (GST)</td>
                 <td style={{ padding: '0.75rem', textAlign: 'right' }}>₹{calculateTotalTax(voucher.items).toFixed(2)}</td>
               </tr>
               <tr style={{ background: '#f0f0f0' }}>
                 <td colSpan="5" style={{ padding: '1rem', textAlign: 'right', fontSize: '1.2rem', fontWeight: 'bold' }}>Grand Total</td>
                 <td style={{ padding: '1rem', textAlign: 'right', fontSize: '1.2rem', fontWeight: 'bold' }}>₹{calculateTotal(voucher.items).toFixed(2)}</td>
               </tr>
            </tfoot>
          </table>

          {/* Footer Notes */}
          {voucher.note && (
             <div style={{ marginTop: '2rem', padding: '1rem', background: '#f9f9f9', borderLeft: '4px solid #333' }}>
               <h4 style={{ margin: '0 0 0.5rem 0' }}>Notes:</h4>
               <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{voucher.note}</p>
             </div>
          )}

          <div style={{ marginTop: '4rem', textAlign: 'right' }}>
            <p style={{ borderTop: '1px solid #000', display: 'inline-block', padding: '0.5rem 2rem 0 2rem' }}>Authorized Signatory</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VoucherPrint;
