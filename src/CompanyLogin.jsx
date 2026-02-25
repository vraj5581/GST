import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import './CompanyLogin.css';
import hitnishLogo from './contexts/hitnish.png';

const CompanyLogin = ({ onLogin }) => {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();



  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    // Vendor shortcut login
    if (phone === 'hitnish' && pin === '1234') {
      navigate('/vendor/dashboard');
      return;
    }

    setLoading(true);

    try {
      const q = query(collection(db, 'companies'), where("phone", "==", phone));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError("Invalid Mobile Number or PIN.");
        setLoading(false);
        return;
      }

      let companyData = null;
      let companyId = null;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.pin === pin || data.password === pin) {
          companyData = data;
          companyId = doc.id;
        }
      });

      if (!companyData) {
        setError("Invalid Mobile Number or PIN.");
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
          <img src={hitnishLogo} alt="Hitnish Logo" className="company-logo" />
          <h2>Sign In</h2>
          <p>Sign in to access your dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="company-login-form">
          {error && <div className="company-error-message">{error}</div>}

          <div className="company-input-group">
            <label htmlFor="phone">Mobile Number</label>
            <input
              id="phone"
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your Mobile Number"
              maxLength={10}
              required
            />
          </div>

          <div className="company-input-group">
            <label htmlFor="pin">4-Digit PIN</label>
            <input
              id="pin"
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                if (value.length <= 4) {
                  setPin(value);
                }
              }}
              placeholder="Enter 4-Digit PIN"
              required
            />
          </div>

          <button type="submit" className="company-login-btn" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="company-login-footer">
          <p>Protected by HITNISH Technology</p>
        </div>
      </div>
    </div>
  );
};

export default CompanyLogin;
