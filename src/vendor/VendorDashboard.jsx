import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp, query, where, writeBatch } from 'firebase/firestore';
import { mainDb as db, getTenantDb } from '../firebase';
import { Trash2, Plus, Building, LogOut, Edit2, Search, Phone, Key, Mail, FileText, MapPin, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './VendorDashboard.css';

const VendorDashboard = () => {
  const [companies, setCompanies] = useState([]);
  const [companyName, setCompanyName] = useState('');
  const [pin, setPin] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gst, setGst] = useState('');
  const [address, setAddress] = useState('');
  const [logo, setLogo] = useState('');
  const [signature, setSignature] = useState('');
  const [firebaseConfig, setFirebaseConfig] = useState('');

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      // 1. First run the fetch as normal
      const querySnapshot = await getDocs(collection(db, 'companies'));
      let data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // 2. Data Migration: Check if old localStorage 'companies' exists
      const localCompaniesRaw = localStorage.getItem('companies');
      if (localCompaniesRaw) {
        try {
          const localCompanies = JSON.parse(localCompaniesRaw);
          if (Array.isArray(localCompanies) && localCompanies.length > 0) {
            console.log("Migrating local storage companies to Firebase...");
            let migratedCount = 0;

            for (const lc of localCompanies) {
              // Only migrate if the userId doesn't already exist in Firebase
              const exists = data.find(dc => dc.phone === lc.phone);
              if (!exists && lc.phone && (lc.pin || lc.password)) {
                const docRef = await addDoc(collection(db, 'companies'), {
                  companyName: lc.companyName || lc.phone,
                  pin: lc.pin || lc.password,
                  email: lc.email || '',
                  phone: lc.phone || '',
                  gst: lc.gst || '',
                  address: lc.address || '',
                  logo: lc.logo || '',
                  signature: lc.signature || '',
                  firebaseConfig: lc.firebaseConfig || '',
                  isActive: lc.isActive !== false,
                  createdAt: serverTimestamp()
                });

                // Add the newly migrated company to our local array state
                data.push({
                  id: docRef.id,
                  companyName: lc.companyName || lc.phone,
                  pin: lc.pin || lc.password,
                  email: lc.email || '',
                  phone: lc.phone || '',
                  gst: lc.gst || '',
                  address: lc.address || '',
                  logo: lc.logo || '',
                  signature: lc.signature || '',
                  isActive: lc.isActive !== false
                });
                migratedCount++;
              }
            }
            // Once migration is complete, clear the old localStorage key
            if (migratedCount > 0) {
              alert(`Successfully migrated ${migratedCount} existing companies from local storage to Firebase!`);
            }
            localStorage.removeItem('companies');
          }
        } catch (e) {
          console.error("Error migrating local companies:", e);
        }
      }

      // Update state with fresh list
      setCompanies(data);
    } catch (error) {
      console.error("Error fetching companies: ", error);
      setError("Failed to load companies.");
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setError("Logo image size should be less than 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setError("Signature image size should be less than 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignature(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCompany = async (e) => {
    e.preventDefault();
    setError('');

    if (!companyName.trim() || !pin || !email.trim() || !phone.trim() || !gst.trim() || !address.trim()) {
      setError("All fields are strictly required.");
      return;
    }

    // Email Validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Invalid email format.");
      return;
    }

    // Phone Validation (10 digits)
    if (!/^\d{10}$/.test(phone)) {
      setError("Phone number must be exactly 10 digits.");
      return;
    }

    // PIN Validation (4 digits)
    if (!/^\d{4}$/.test(pin)) {
      setError("PIN must be exactly 4 digits.");
      return;
    }

    // Check if Phone already exists
    const existingUser = companies.find(c => c.phone === phone && c.id !== editingId);
    if (existingUser) {
      setError("Mobile Number already exists.");
      return;
    }

    try {
      if (editingId) {
        const docRef = doc(db, 'companies', editingId);
        await updateDoc(docRef, {
          companyName,
          pin,
          email,
          phone,
          gst,
          address,
          logo,
          signature,
          firebaseConfig
        });

        setCompanies(companies.map(c => c.id === editingId ? {
          ...c, companyName, pin, email, phone, gst, address, logo, signature, firebaseConfig
        } : c));
      } else {
        const docRef = await addDoc(collection(db, 'companies'), {
          companyName,
          pin,
          email,
          phone,
          gst,
          address,
          logo,
          signature,
          firebaseConfig,
          isActive: true,
          createdAt: serverTimestamp()
        });

        setCompanies([...companies, {
          id: docRef.id,
          companyName,
          pin,
          email,
          phone,
          gst,
          address,
          logo,
          signature,
          firebaseConfig,
          isActive: true
        }]);
      }

      resetForm();
    } catch (error) {
      console.error("Error saving company:", error);
      setError("Failed to save company.");
    }
  };

  const resetForm = () => {
    setCompanyName('');
    setPin('');
    setEmail('');
    setPhone('');
    setGst('');
    setAddress('');
    setLogo('');
    setSignature('');
    setFirebaseConfig('');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEditCompany = (company) => {
    setCompanyName(company.companyName);
    setPin(company.pin || company.password || '');
    setEmail(company.email || '');
    setPhone(company.phone || '');
    setGst(company.gst || '');
    setAddress(company.address || '');
    setLogo(company.logo || '');
    setSignature(company.signature || '');
    setFirebaseConfig(company.firebaseConfig || '');
    setEditingId(company.id);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteCompany = async (company) => {
    if (window.confirm(`Are you sure you want to delete ${company.companyName}? This will permanently delete all data (Vouchers, Products, Parties) associated with this company.`)) {
      try {
        const tenantDb = getTenantDb(company.id, company.firebaseConfig);
        
        // Delete all associated data first using a batch on TENANT db
        const batch = writeBatch(tenantDb);
        let batchCount = 0;
        
        // Helper function to commit and reset batch if limit (500) is reached
        const checkBatchLimit = async () => {
          if (batchCount >= 400) {
            await batch.commit();
            batchCount = 0;
          }
        };

        // 1. Delete all vouchers
        const vouchersQ = query(collection(tenantDb, "vouchers"), where("companyId", "==", company.id));
        const vouchersSnap = await getDocs(vouchersQ);
        vouchersSnap.forEach((docSnap) => {
          batch.delete(doc(tenantDb, "vouchers", docSnap.id));
          batchCount++;
        });
        await checkBatchLimit();

        // 2. Delete all products
        const productsQ = query(collection(tenantDb, "products"), where("companyId", "==", company.id));
        const productsSnap = await getDocs(productsQ);
        productsSnap.forEach((docSnap) => {
          batch.delete(doc(tenantDb, "products", docSnap.id));
          batchCount++;
        });
        await checkBatchLimit();

        // 3. Delete all parties
        const partiesQ = query(collection(tenantDb, "parties"), where("companyId", "==", company.id));
        const partiesSnap = await getDocs(partiesQ);
        partiesSnap.forEach((docSnap) => {
          batch.delete(doc(tenantDb, "parties", docSnap.id));
          batchCount++;
        });
        await checkBatchLimit();

        // Commit any remaining deletions in the batch
        if (batchCount > 0) {
          await batch.commit();
        }

        // Finally, delete the company itself from the MAIN db
        await deleteDoc(doc(db, 'companies', company.id));
        
        setCompanies(companies.filter(c => c.id !== company.id));
        alert('Company and all associated data successfully deleted.');
      } catch (error) {
        console.error("Error deleting company and data:", error);
        alert("Failed to delete company and associated data.");
      }
    }
  };

  const handleToggleStatus = async (id, currentStatus, companyName) => {
    const actionText = currentStatus === false ? 'activate' : 'deactivate';
    if (!window.confirm(`Are you sure you want to ${actionText} ${companyName}?`)) {
      return;
    }

    try {
      // If currentStatus is undefined, it means it's an old record without isActive field, so treat as true (active).
      const newStatus = currentStatus === false ? true : false;
      const docRef = doc(db, 'companies', id);
      await updateDoc(docRef, { isActive: newStatus });
      setCompanies(companies.map(c => c.id === id ? { ...c, isActive: newStatus } : c));
    } catch (error) {
      console.error("Error toggling status:", error);
      alert("Failed to change company status.");
    }
  };

  const handleLogout = () => {
    // Basic logout logic for now
    navigate('/vendor');
  };


  const filteredCompanies = companies.filter(company =>
    company.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (company.phone && company.phone.includes(searchQuery))
  );

  return (
    <div className="vd-dashboard-container">
      <header className="vd-header">
        <div className="vd-logo">
          <Building size={22} />
          <h3>Vendor Dashboard</h3>
        </div>
        <button className="btn btn-outline-primary vd-logout-btn" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </header>

      <main className="vd-main">

        {!isAdding && (
          <div className="vd-action-bar">
            <div className="search-bar w-full-search vd-search-wrapper">
              <Search className="search-icon" size={18} />
              <input
                type="text"
                placeholder="Search company by Name or Phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input vd-search-input"
              />
            </div>
            <button
              className="btn btn-outline-primary btn-icon vd-add-btn-wrapper"
              onClick={() => setIsAdding(true)}
              title="Add Company"
            >
              <Plus size={23} />
            </button>
          </div>
        )}

        {error && <div className="vd-error-alert">{error}</div>}

        {isAdding && (
          <div className="vd-add-card">
            <h4>{editingId ? "Edit Company details" : "Create New Company"}</h4>
            <form onSubmit={handleAddCompany} className="vd-form">
              <div className="vd-form-row">
                <div className="vd-input-group">
                  <label>Company Name <span className="vd-required-asterisk">*</span></label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="E.g. Tech Solutions"
                    required
                  />
                </div>
                <div className="vd-input-group">
                  <label>Mobile Number <span className="vd-required-asterisk">*</span></label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit Mobile Number"
                    maxLength={10}
                    required
                  />
                </div>
                <div className="vd-input-group">
                  <label>4-Digit PIN <span className="vd-required-asterisk">*</span></label>
                  <input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="4-digit PIN"
                    maxLength={4}
                    pattern="\d{4}"
                    required
                  />
                </div>
                <div className="vd-input-group">
                  <label>Email <span className="vd-required-asterisk">*</span></label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Company Email"
                    required
                  />
                </div>
                <div className="vd-input-group">
                  <label>GST No. <span className="vd-required-asterisk">*</span></label>
                  <input
                    type="text"
                    value={gst}
                    onChange={(e) => setGst(e.target.value.toUpperCase())}
                    placeholder="GSTIN"
                    maxLength={15}
                    required
                  />
                </div>
                <div className="vd-input-group vd-full-width-col">
                  <label>Address <span className="vd-required-asterisk">*</span></label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Full Business Address"
                    required
                    rows="3"
                  />
                </div>
                <div className="vd-input-group vd-full-width-col">
                  <label>Firebase Web Config JSON (Optional)</label>
                  <textarea
                    value={firebaseConfig}
                    onChange={(e) => setFirebaseConfig(e.target.value)}
                    placeholder="Provide the Firebase JSON Config for this company's DB. Leaving it blank uses the default main DB."
                    rows="4"
                  />
                </div>
                <div className="vd-input-group vd-full-width-col">
                  <label>Logo (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                  {logo && (
                    <div className="vd-logo-preview-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                      <img src={logo} alt="Company Logo" className="vd-logo-preview-img" />
                      <button type="button" className="btn btn-outline-danger btn-icon" onClick={() => setLogo('')} title="Remove Logo">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="vd-input-group vd-full-width-col">
                  <label>Authorized Signatory Image (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSignatureUpload}
                  />
                  {signature && (
                    <div className="vd-logo-preview-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                      <img src={signature} alt="Signatory" className="vd-logo-preview-img" style={{ maxHeight: '60px' }} />
                      <button type="button" className="btn btn-outline-danger btn-icon" onClick={() => setSignature('')} title="Remove Signature">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="vd-form-actions vd-form-actions-wrapper">
                <button type="submit" className="btn btn-outline-primary btn-mobile-flex vd-form-action-btn-sized">{editingId ? "Update" : "Save"}</button>
                <button type="button" className="btn btn-outline-danger btn-mobile-flex vd-form-action-btn-sized" onClick={resetForm}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {!isAdding && (
          <div className="vd-grid">
            {filteredCompanies.length > 0 ? (
              filteredCompanies.map((company) => (
                <div key={company.id} className="vd-card">
                  <div className="vd-card-header">
                    <div className="vd-card-title">
                      <Building className="vd-card-icon" size={20} />
                      <h4>{company.companyName}</h4>
                    </div>
                    <div className="vd-card-actions">
                      <button
                        className="btn btn-action-edit"
                        onClick={() => handleEditCompany(company)}
                        title="Edit Company"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="btn btn-action-delete"
                        onClick={() => handleDeleteCompany(company)}
                        title="Delete Company"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="vd-card-body">
                    <div className="party-detail-row">
                      <div className="party-detail-icon"><Phone size={14} /></div>
                      <p>{company.phone}</p>
                    </div>
                    <div className="party-detail-row">
                      <div className="party-detail-icon"><Key size={14} /></div>
                      <p className="vd-mono">{company.pin || company.password}</p>
                    </div>
                    <div className="party-detail-row">
                      <div className="party-detail-icon"><Mail size={14} /></div>
                      <p>{company.email}</p>
                    </div>
                    <div className="party-detail-row">
                      <div className="party-detail-icon"><FileText size={14} /></div>
                      <p>{company.gst}</p>
                    </div>
                    <div className="party-detail-row">
                      <div className="party-detail-icon"><MapPin size={14} /></div>
                      <p className="tooltip-text" title={company.address}>
                        {company.address?.length > 25 ? company.address.substring(0, 25) + '...' : company.address}
                      </p>
                    </div>
                    {company.logo && (
                      <div className="party-detail-row">
                        <div className="party-detail-icon"><ImageIcon size={14} /></div>
                        <p><img src={company.logo} alt="Logo" className="vd-card-logo-img" /></p>
                      </div>
                    )}
                  </div>
                  <div className="vd-card-footer vd-card-footer-spaced">
                    <span className={`vd-status-badge ${company.isActive === false ? 'inactive' : 'active'}`}>
                      {company.isActive === false ? 'Deactive' : 'Active'}
                    </span>
                    <button
                      className={`btn btn-outline ${company.isActive === false ? 'btn-outline-primary' : 'btn-outline-danger'} vd-status-btn-small`}
                      onClick={() => handleToggleStatus(company.id, company.isActive, company.companyName)}
                    >
                      {company.isActive === false ? 'Make Active  ' : 'Make Deactive'}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="vd-empty-state">
                <Building size={48} className="vd-empty-icon" />
                <p>No companies found. Create one to get started.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default VendorDashboard;
