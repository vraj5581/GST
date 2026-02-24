import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import './CompanyLogin.css';

const CompanyLogin = ({ onLogin }) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    // Vendor shortcut login
    if (userId === 'hitnish' && password === '123456') {
      navigate('/vendor/dashboard');
      return;
    }

    setLoading(true);

    try {
      const q = query(collection(db, 'companies'), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError("Invalid User ID or Password.");
        setLoading(false);
        return;
      }

      let companyData = null;
      let companyId = null;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.password === password) {
          companyData = data;
          companyId = doc.id;
        }
      });

      if (!companyData) {
        setError("Invalid User ID or Password.");
        setLoading(false);
        return;
      }

      if (companyData.isActive === false) {
        setError("Your account has been deactivated. Please contact the vendor.");
        setLoading(false);
        return;
      }

      // Successful login
      onLogin({
        id: companyId,
        ...companyData
      });
      navigate('/');
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred during login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="company-login-container">
      <div className="company-login-card">
        <div className="company-login-header">
          <h2>Company Login</h2>
          <p>Sign in to access your dashboard</p>
        </div>
        
        <form onSubmit={handleLogin} className="company-login-form">
          {error && <div className="company-error-message">{error}</div>}
          
          <div className="company-input-group">
            <label htmlFor="userId">User ID</label>
            <input 
              id="userId"
              type="text" 
              value={userId} 
              onChange={(e) => setUserId(e.target.value)} 
              placeholder="Enter your User ID"
              required
            />
          </div>
          
          <div className="company-input-group">
            <label htmlFor="password">Password</label>
            <input 
              id="password"
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Enter your Password"
              required
            />
          </div>
          
          <button type="submit" className="company-login-btn" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>
        
        <div className="company-login-footer">
          <p>Protected by GST Billing Software</p>
        </div>
      </div>
    </div>
  );
};

export default CompanyLogin;
