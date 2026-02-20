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
  
  const calculateTotal = (items) => items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const calculateTotalTax = (items) => items.reduce((sum, item) => sum + (Number(item.taxAmount) || 0), 0);
  const calculateSubtotal = (items) => items.reduce((sum, item) => sum + (Number(item.price) * Number(item.qty)), 0);

  return (
    <div className="print-container">
      <div className="fixed-header no-print" style={{ justifyContent: "flex-start" }}>
        <button className="btn btn-outline btn-icon" onClick={() => navigate("/vouchers")} style={{ flexShrink: 0 }} title="Back">
          <ArrowLeft size={18} />
        </button>
        <h3 style={{ margin: 0, border: "none" }}>Print Preview</h3>
        <button className="btn btn-primary" onClick={handlePrint} style={{ marginLeft: 'auto' }}>
          <Printer size={18} /> Print
        </button>
      </div>
      
      <div className="content-below-fixed printable-area">
        <style>{`
          .print-container .content-below-fixed {
            padding-top: 6rem;
            padding-left: 2rem;
            padding-right: 2rem;
            padding-bottom: 2rem;
          }
          
          .invoice-preview-card {
            background: white;
            padding: 2rem;
            max-width: 100%;
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            box-shadow: var(--shadow-md);
            color: #000;
            box-sizing: border-box;
          }
          
          /* Print Only Styles */
          @media print {
            @page {
              margin: 10mm;
            }
            body {
              background: white;
            }
            .print-container .content-below-fixed {
              padding: 0 !important;
            }
            .invoice-preview-card {
              width: 100% !important;
              min-height: auto !important;
              padding: 0 !important;
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
            }
          }

          /* Screen Only Responsive Styles */
          @media screen and (max-width: 768px) {
            .print-container .content-below-fixed {
              padding-top: 4.5rem;
              padding-left: 0.5rem;
              padding-right: 0.5rem;
              padding-bottom: 0.5rem;
            }
            .invoice-header-row {
              flex-direction: column !important;
              gap: 1.5rem;
              display: flex;
            }
            .invoice-header-row > div {
              text-align: left !important;
            }
            .invoice-preview-card {
              padding: 1rem !important;
              width: 100% !important;
              min-height: auto !important;
              box-shadow: none !important;
            }

            /* Convert Table to Flowing Cards on Mobile to remove slide scroll entirely */
            .invoice-table-container {
              overflow-x: hidden;
            }
            .invoice-table, .invoice-table thead, .invoice-table tbody, .invoice-table tfoot, .invoice-table tr, .invoice-table td {
              display: block;
              width: 100%;
            }
            .invoice-table thead {
              display: none;
            }
            .invoice-table tbody tr {
              border: 1px solid #ddd;
              margin-bottom: 1rem;
              padding: 0.5rem 1rem;
              border-radius: var(--radius-md);
            }
            .invoice-table tbody td {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border: none !important;
              padding: 0.5rem 0 !important;
              border-bottom: 1px solid #eee !important;
              text-align: right !important;
            }
            .invoice-table tbody td:last-child {
              border-bottom: none !important;
            }
            .invoice-table tbody td::before {
              content: attr(data-label);
              font-weight: 600;
              color: #666;
              text-align: left;
            }
            
            .invoice-table tfoot tr {
               display: flex;
               justify-content: space-between;
               padding: 0.75rem 0 !important;
               margin-bottom: 0;
               border-top: 1px solid #eee;
            }
            .invoice-table tfoot td {
               display: inline-block;
               width: auto;
               border: none !important;
               padding: 0 !important;
            }
            .invoice-table tfoot tr:last-child {
               background: #f0f0f0 !important;
               padding: 1rem !important;
               border-radius: var(--radius-md);
               margin-top: 0.5rem;
               border-top: none;
            }
          }
        `}</style>

        <div className="invoice-preview-card">
          {/* Header */}
          <div style={{ textAlign: "center", borderBottom: '2px solid #000', paddingBottom: '1rem', marginBottom: '2rem' }}> 
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>INVOICE / VOUCHER</h1>
            <p style={{ margin: 0 }}>Create beautiful invoices with our GST Billing App</p>
          </div>

          <div className="invoice-header-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Bill To:</h3>
              <p style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{party?.name}</p>
              <div style={{lineHeight: '1.4', marginTop: '4px'}}>
                {party?.address && <div>{party.address}</div>}
                {party?.gst && <div><strong>GSTIN:</strong> {party.gst}</div>}
                {party?.mobile && <div><strong>Mobile:</strong> {party.mobile}</div>}
              </div>
            </div>
            <div style={{ textAlign: 'right', flex: 1 }}>
              <p><strong>Date:</strong> {new Date(voucher.date).toLocaleDateString()}</p>
              <p><strong>Invoice No:</strong> #INV-{String(Number(id) + 1).padStart(4, '0')}</p>
            </div>
          </div>

          {/* Table */}
          <div className="invoice-table-container">
          <table className="invoice-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
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
                  <td data-label="#" style={{ padding: '0.75rem', border: '1px solid #ddd' }}>{index + 1}</td>
                  <td data-label="Item" style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
                    <strong>{item.name}</strong>
                    {item.hsn && <div style={{ fontSize: '0.8rem', color: '#666' }}>HSN: {item.hsn}</div>}
                  </td>
                  <td data-label="Price" style={{ padding: '0.75rem', textAlign: 'right', border: '1px solid #ddd' }}>₹{Number(item.price || 0).toFixed(2)}</td>
                  <td data-label="Qty" style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #ddd' }}>{item.qty} {item.unit}</td>
                  <td data-label="Tax" style={{ padding: '0.75rem', textAlign: 'right', border: '1px solid #ddd' }}>{item.tax}%<br/><span style={{ fontSize: '0.8rem' }}>(₹{Number(item.taxAmount || 0).toFixed(2)})</span></td>
                  <td data-label="Total" style={{ padding: '0.75rem', textAlign: 'right', border: '1px solid #ddd', fontWeight: 'bold' }}>₹{Number(item.amount || 0).toFixed(2)}</td>
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
          </div>

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
