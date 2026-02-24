import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Trash2, Plus, Building, LogOut, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './VendorDashboard.css';

const VendorDashboard = () => {
  const [companies, setCompanies] = useState([]);
  const [companyName, setCompanyName] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gst, setGst] = useState('');
  const [address, setAddress] = useState('');
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
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
              const exists = data.find(dc => dc.userId === lc.userId);
              if (!exists && lc.userId && lc.password) {
                const docRef = await addDoc(collection(db, 'companies'), {
                  companyName: lc.companyName || lc.userId,
                  userId: lc.userId,
                  password: lc.password,
                  email: lc.email || '',
                  phone: lc.phone || '',
                  gst: lc.gst || '',
                  address: lc.address || '',
                  isActive: lc.isActive !== false,
                  createdAt: serverTimestamp()
                });
                
                // Add the newly migrated company to our local array state
                data.push({
                  id: docRef.id,
                  companyName: lc.companyName || lc.userId,
                  userId: lc.userId,
                  password: lc.password,
                  email: lc.email || '',
                  phone: lc.phone || '',
                  gst: lc.gst || '',
                  address: lc.address || '',
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

  const handleAddCompany = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!companyName.trim() || !userId.trim() || !password || !email.trim() || !phone.trim() || !gst.trim() || !address.trim()) {
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

    // Check if user ID already exists
    const existingUser = companies.find(c => c.userId === userId && c.id !== editingId);
    if (existingUser) {
      setError("User ID already exists.");
      return;
    }

    try {
      if (editingId) {
        const docRef = doc(db, 'companies', editingId);
        await updateDoc(docRef, {
          companyName,
          userId,
          password,
          email,
          phone,
          gst,
          address
        });
        
        setCompanies(companies.map(c => c.id === editingId ? {
          ...c, companyName, userId, password, email, phone, gst, address
        } : c));
      } else {
        const docRef = await addDoc(collection(db, 'companies'), {
          companyName,
          userId,
          password,
          email,
          phone,
          gst,
          address,
          isActive: true,
          createdAt: serverTimestamp()
        });
        
        setCompanies([...companies, {
          id: docRef.id,
          companyName,
          userId,
          password,
          email,
          phone,
          gst,
          address,
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
    setUserId('');
    setPassword('');
    setEmail('');
    setPhone('');
    setGst('');
    setAddress('');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEditCompany = (company) => {
    setCompanyName(company.companyName);
    setUserId(company.userId);
    setPassword(company.password);
    setEmail(company.email || '');
    setPhone(company.phone || '');
    setGst(company.gst || '');
    setAddress(company.address || '');
    setEditingId(company.id);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteCompany = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await deleteDoc(doc(db, 'companies', id));
        setCompanies(companies.filter(c => c.id !== id));
      } catch (error) {
        console.error("Error deleting company:", error);
        alert("Failed to delete company.");
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

  return (
    <div className="vd-dashboard-container">
      <header className="vd-header">
        <div className="vd-logo">
          <Building size={22} />
          <h3>Vendor Dashboard</h3>
        </div>
        <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={handleLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </header>

      <main className="vd-main">
        {!isAdding && (
          <div className="vd-action-bar">
            <h3>Manage Companies</h3>
            <button 
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              onClick={() => setIsAdding(true)}
            >
              <span>Add Company</span>
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
                  <label>Company Name <span style={{color: 'red'}}>*</span></label>
                  <input 
                    type="text" 
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="E.g. Tech Solutions"
                    required
                  />
                </div>
                <div className="vd-input-group">
                  <label>User ID <span style={{color: 'red'}}>*</span></label>
                  <input 
                    type="text" 
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="Login ID"
                    required
                  />
                </div>
                <div className="vd-input-group">
                  <label>Password <span style={{color: 'red'}}>*</span></label>
                  <input 
                    type="text" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Login Password"
                    required
                  />
                </div>
                <div className="vd-input-group">
                  <label>Email <span style={{color: 'red'}}>*</span></label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Company Email"
                    required
                  />
                </div>
                <div className="vd-input-group">
                  <label>Phone No. <span style={{color: 'red'}}>*</span></label>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit Contact Number"
                    maxLength={10}
                    required
                  />
                </div>
                <div className="vd-input-group">
                  <label>GST No. <span style={{color: 'red'}}>*</span></label>
                  <input 
                    type="text" 
                    value={gst}
                    onChange={(e) => setGst(e.target.value.toUpperCase())}
                    placeholder="GSTIN"
                    maxLength={15}
                    required
                  />
                </div>
                <div className="vd-input-group" style={{ gridColumn: "1 / -1" }}>
                  <label>Address <span style={{color: 'red'}}>*</span></label>
                  <textarea 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Full Business Address"
                    required
                    rows="3"
                  />
                </div>
              </div>
              <div className="vd-form-actions" style={{ gap: '1rem' }}>
                <button type="submit" className="btn btn-outline-primary btn-mobile-flex" style={{ width: '130px' }}>{editingId ? "Update" : "Save"}</button>
                <button type="button" className="btn btn-outline-danger btn-mobile-flex" style={{ width: '130px' }} onClick={resetForm}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {!isAdding && (
          <div className="vd-grid">
            {companies.length > 0 ? (
            companies.map((company) => (
              <div key={company.id} className="vd-card">
                <div className="vd-card-header">
                  <div className="vd-card-title">
                    <Building className="vd-card-icon" size={20} />
                    <h4>{company.companyName}</h4>
                  </div>
                  <div className="vd-card-actions">
                    <button 
                      className="btn btn-action-edit"
                      style={{ padding: '0.4rem', border: 'none', boxShadow: 'none' }}
                      onClick={() => handleEditCompany(company)}
                      title="Edit Company"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      className="btn btn-action-delete"
                      style={{ padding: '0.4rem', border: 'none', boxShadow: 'none' }}
                      onClick={() => handleDeleteCompany(company.id, company.companyName)}
                      title="Delete Company"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="vd-card-body">
                  <div className="vd-info-row">
                    <span className="vd-info-label">User ID:</span>
                    <span className="vd-info-value">{company.userId}</span>
                  </div>
                  <div className="vd-info-row">
                    <span className="vd-info-label">Password:</span>
                    <span className="vd-info-value vd-mono">{company.password}</span>
                  </div>
                  <div className="vd-info-row">
                    <span className="vd-info-label">Email:</span>
                    <span className="vd-info-value">{company.email}</span>
                  </div>
                  <div className="vd-info-row">
                    <span className="vd-info-label">Phone:</span>
                    <span className="vd-info-value">{company.phone}</span>
                  </div>
                  <div className="vd-info-row">
                    <span className="vd-info-label">GST:</span>
                    <span className="vd-info-value">{company.gst}</span>
                  </div>
                  <div className="vd-info-row">
                    <span className="vd-info-label">Address:</span>
                    <span className="vd-info-value tooltip-text" title={company.address}>
                      {company.address?.length > 25 ? company.address.substring(0, 25) + '...' : company.address}
                    </span>
                  </div>
                </div>
                <div className="vd-card-footer" style={{ justifyContent: "space-between", alignItems: "center" }}>
                  <span className={`vd-status-badge ${company.isActive === false ? 'inactive' : 'active'}`}>
                    {company.isActive === false ? 'Deactive' : 'Active'}
                  </span>
                  <button 
                    className={`btn btn-outline ${company.isActive === false ? 'btn-outline-primary' : 'btn-outline-danger'}`}
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', width: 'auto' }}
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
