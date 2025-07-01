import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { FaEnvelope } from 'react-icons/fa';
import axios from 'axios';
import './VerificationSent.css';

const VerificationSent = () => {
  const location = useLocation();
  const email = location.state?.email;
  const [resendStatus, setResendStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const openGmail = () => {
    window.open('https://mail.google.com', '_blank');
  };

  const handleResend = async () => {
    if (!email) {
      setResendStatus('Email not available. Please try signing up again.');
      return;
    }

    try {
      setLoading(true);
      setResendStatus('Sending...');
      const response = await axios.post('http://localhost:5000/api/auth/resend-verification', { email });
      setResendStatus(response.data.message || 'Verification email sent!');
    } catch (error) {
      console.error('Error resending verification email:', error.response?.data || error.message);
      setResendStatus(error.response?.data?.message || 'Failed to resend email. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column">
      <Navbar loggedIn={false} />
      <div className="container flex-grow-1 d-flex align-items-center justify-content-center">
        <div className="card verification-card shadow-sm">
          <div className="card-body text-center p-4">
            <FaEnvelope className="display-1 text-primary mb-3" />
            <h2 className="card-title mb-3">Email Verification Sent</h2>
            <p className="card-text mb-4">
              We've sent a verification email to <strong>{email || 'your email'}</strong>. 
              Please check your inbox and follow the instructions to verify your account.
            </p>
            <div className="d-flex gap-3 justify-content-center">
              <button 
                onClick={openGmail} 
                className="btn btn-primary px-4"
              >
                Open Gmail
              </button>
              <button 
                onClick={handleResend} 
                className="btn btn-outline-primary px-4" 
                disabled={loading}
              >
                {loading ? 'Resending...' : 'Resend Email'}
              </button>
            </div>
            {resendStatus && (
              <div className="alert alert-info mt-3 mb-0">
                {resendStatus}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationSent;
