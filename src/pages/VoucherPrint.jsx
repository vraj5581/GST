import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Printer, ArrowLeft } from "lucide-react";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
} from "firebase/firestore";
import { getDB, mainDb, getTenantDb } from "../firebase";
import "./VoucherPrint.css";

function VoucherPrint() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [voucher, setVoucher] = useState(null);
  const [party, setParty] = useState(null);
  const [clientCompany, setClientCompany] = useState(null);

  useEffect(() => {
    const fetchVoucherData = async () => {
      try {
        let currentDb = getDB();
        const companyIdFromUrl = searchParams.get("companyId");
        let fetchedCompany =
          JSON.parse(localStorage.getItem("loggedCompany")) || {};

        if (companyIdFromUrl && !fetchedCompany.id) {
          const compSnap = await getDoc(
            doc(mainDb, "companies", companyIdFromUrl),
          );
          if (compSnap.exists()) {
            const cData = compSnap.data();
            fetchedCompany = { id: compSnap.id, ...cData };
            currentDb = getTenantDb(companyIdFromUrl, cData.firebaseConfig);
          } else {
            console.error("Company not found for QR print!");
            navigate("/");
            return;
          }
        } else if (fetchedCompany.id) {
          const compSnap = await getDoc(
            doc(mainDb, "companies", fetchedCompany.id),
          );
          if (compSnap.exists()) {
            fetchedCompany = { id: compSnap.id, ...compSnap.data() };
          }
        }

        setClientCompany(fetchedCompany);

        const voucherRef = doc(currentDb, "vouchers", id);
        const voucherSnap = await getDoc(voucherRef);

        if (voucherSnap.exists()) {
          const vData = voucherSnap.data();
          const targetCompanyId = fetchedCompany.id;

          let fallbackInvoiceNumber = "";
          if (!vData.invoiceNumber && targetCompanyId) {
            const vouchersQ = query(
              collection(currentDb, "vouchers"),
              where("companyId", "==", targetCompanyId),
            );
            const allVouchersSnap = await getDocs(vouchersQ);
            let data = allVouchersSnap.docs.map((d) => ({
              id: d.id,
              ...d.data(),
            }));
            data.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
            const myIndex = data.findIndex((d) => d.id === voucherSnap.id);
            fallbackInvoiceNumber = `INV/25-26/${String((myIndex !== -1 ? myIndex : 0) + 1).padStart(3, "0")}`;
          }

          setVoucher({ id: voucherSnap.id, fallbackInvoiceNumber, ...vData });

          // Fetch the associated party using query
          const q = query(
            collection(currentDb, "parties"),
            where("name", "==", vData.partyId),
          );
          const partySnap = await getDocs(q);

          if (!partySnap.empty) {
            setParty(partySnap.docs[0].data());
          } else {
            setParty({ name: vData.partyId }); // Fallback if party deleted
          }
        } else {
          console.error("No such voucher!");
          if (localStorage.getItem("loggedCompany")) {
            navigate("/vouchers");
          } else {
            navigate(-1);
          }
        }
      } catch (error) {
        console.error("Error fetching voucher for print:", error);
      }
    };

    if (id) {
      fetchVoucherData();
    }
  }, [id, navigate, searchParams]);

  const handlePrint = () => {
    window.print();
  };

  if (!voucher) return <div>Loading...</div>;

  const calculateTotal = (items) =>
    items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  return (
    <div className="print-container">
      <div className="fixed-header no-print print-page-header">
        <button
          className="btn btn-outline btn-icon print-back-btn"
          onClick={() => {
            if (localStorage.getItem("loggedCompany")) {
              navigate("/vouchers");
            } else {
              navigate(-1);
            }
          }}
          title="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <h3 className="print-title-text">Print Preview</h3>
        <button
          className="btn btn-primary print-btn-right"
          onClick={handlePrint}
        >
          <Printer size={18} /> Print
        </button>
      </div>

      <div className="content-below-fixed printable-area">
        <div className="invoice-preview-card">
          {/* Header */}
          <div className="print-doc-header">
            <div className="print-header-content">
              <div className="print-logo-section">
                {clientCompany?.logo && (
                  <img
                    src={clientCompany.logo}
                    alt="Logo"
                    className="print-main-logo"
                  />
                )}
              </div>
              <div className="print-company-info-section">
                <h1 className="print-company-name">
                  {clientCompany?.companyName || "COMPANY NAME"}
                </h1>
                <div className="print-company-details">
                  <p>
                    <strong>Mobile:</strong>{" "}
                    {clientCompany?.phone || "+91 00000 00000"}
                  </p>
                  <p>
                    <strong>Email:</strong>{" "}
                    {clientCompany?.email || "contact@company.com"}
                  </p>
                  {clientCompany?.gst && (
                    <p>
                      <strong>GSTIN:</strong> {clientCompany.gst}
                    </p>
                  )}
                  <p className="print-address">
                    {clientCompany?.address || "Company Address"}
                  </p>
                </div>
              </div>
            </div>
            <div className="print-invoice-title-wrapper">
              <h2 className="print-invoice-title">INVOICE</h2>
            </div>
          </div>

          <div className="invoice-header-row print-bill-row">
            <div className="print-bill-to-col">
              <div className="print-bill-to-header">
                <span className="print-bill-to-label">Bill To:</span>
                <span className="print-party-name">{party?.name}</span>
              </div>
              <div className="print-party-details">
                {party?.address && <div>{party.address}</div>}
                {party?.gst && (
                  <div>
                    <strong>GSTIN:</strong> {party.gst}
                  </div>
                )}
                {party?.mobile && (
                  <div>
                    <strong>Mobile:</strong> {party.mobile}
                  </div>
                )}
              </div>
            </div>
            <div className="print-meta-col">
              <p>
                <strong>Date:</strong>{" "}
                {new Date(voucher.date).toLocaleDateString()}
              </p>
              <p>
                <strong>Invoice No:</strong>{" "}
                {voucher.invoiceNumber || voucher.fallbackInvoiceNumber}
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="invoice-table-container">
            <table className="invoice-table print-table-wrapper">
              <thead>
                <tr className="print-thead-row">
                  <th className="print-th-left">Sr No.</th>
                  <th className="print-th-left">Item </th>
                  <th className="print-th-right">Price</th>
                  <th className="print-th-center">Qty</th>
                  <th className="print-th-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {voucher.items.map((item, index) => (
                  <tr key={index}>
                    <td data-label="Sr No." className="print-td-default">
                      {index + 1}
                    </td>
                    <td data-label="Item" className="print-td-default">
                      {item.name}
                      {item.hsn && (
                        <div className="print-hsn-helper">HSN: {item.hsn}</div>
                      )}
                    </td>
                    <td data-label="Price" className="print-td-right">
                      ₹{Number(item.price || 0).toFixed(2)}
                    </td>
                    <td data-label="Qty" className="print-td-center">
                      {item.qty} {item.unit}
                    </td>
                    <td data-label="Total" className="print-td-right">
                      ₹{Number(item.amount || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="print-tfoot-row">
                  <td colSpan="4" className="print-tfoot-label">
                    Total
                  </td>
                  <td className="print-tfoot-value">
                    ₹{calculateTotal(voucher.items).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="print-footer-layout">
            <div className="print-footer-left">
              <div className="print-bottom-payment-details">
                <div className="print-payment-line">
                  <strong>Status:</strong>{" "}
                  <span
                    className={`print-status-text ${voucher.status?.toLowerCase() || "unpaid"}`}
                  >
                    {voucher.status || "Unpaid"}
                  </span>
                  {voucher.status !== "Unpaid" && (
                    <span className="print-payment-method-text">
                      / {voucher.paymentMethod || "Cash"}
                    </span>
                  )}
                </div>

                {voucher.status === "Partial" && (
                  <div className="print-detailed-summary">
                    <div className="print-detailed-row">
                      <span>Total Amount:</span>
                      <strong>
                        ₹{calculateTotal(voucher.items).toFixed(2)}
                      </strong>
                    </div>
                    <div className="print-detailed-row">
                      <span>Amount Paid:</span>
                      <strong>
                        ₹{Number(voucher.paidAmount || 0).toFixed(2)}
                      </strong>
                    </div>
                    <div className="print-detailed-row">
                      <span>Balance Due:</span>
                      <strong className="print-balance-due-text">
                        ₹{Number(voucher.remainingAmount || 0).toFixed(2)}
                      </strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Notes */}
              {voucher.note && (
                <div className="print-notes-container">
                  <h4 className="print-notes-heading">Notes:</h4>
                  <p className="print-notes-body">{voucher.note}</p>
                </div>
              )}
            </div>

            <div className="print-signatory-wrapper">
              {clientCompany?.signature && (
                <div className="print-signatory-img-wrapper print-img-spacing">
                  <img
                    src={clientCompany.signature}
                    alt="Authorized Signature"
                    className="print-signatory-img"
                  />
                </div>
              )}
              <p className="print-signatory-line">Authorized Signatory</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VoucherPrint;
