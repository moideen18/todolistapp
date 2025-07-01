import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

const VerifyEmail = () => {
  const [message, setMessage] = useState('Verifying your email...');
  const [isSuccess, setIsSuccess] = useState(null);
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/auth/verify/${token}`);
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setIsSuccess(true);
        setMessage('Email verified successfully! Redirecting...');
        setTimeout(() => navigate('/todos'), 2000);
      } catch (error) {
        setIsSuccess(false);
        setMessage(error.response?.data?.message || 'Verification failed');
      }
    };

    if (token) {
      verifyEmail();
    }
  }, [token, navigate]);

  return (
    <div className="min-vh-100 d-flex flex-column">
      <Navbar loggedIn={false} />
      <div className="container flex-grow-1 d-flex align-items-center justify-content-center">
        <div className="card shadow-sm" style={{ maxWidth: '400px' }}>
          <div className="card-body text-center p-4">
            {isSuccess !== null && (
              <div className="display-1 mb-3">
                {isSuccess ? (
                  <FaCheckCircle className="text-success" />
                ) : (
                  <FaExclamationCircle className="text-danger" />
                )}
              </div>
            )}
            <h2 className="card-title mb-3">Email Verification</h2>
            <p className="card-text">{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;