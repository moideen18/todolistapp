import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { FaUsers, FaSpinner } from 'react-icons/fa';

const VerifyLink = () => {
  const [message, setMessage] = useState('Verifying invitation...');
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const localToken = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      setMessage('Invalid invitation link');
      setStatus('error');
      return;
    }

    if (!localToken) {
      sessionStorage.setItem('pendingInvitation', token);
      navigate('/login');
      return;
    }

    axios.post(`http://localhost:5000/api/teams/join/${token}`, {}, {
      headers: { Authorization: `Bearer ${localToken}` }
    })
      .then(res => {
        setStatus('success');
        setMessage('Successfully joined team!');
        setTimeout(() => {
          navigate(`/team/${res.data.teamName}`);
        }, 1500);
      })
      .catch(err => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Error joining team');
        setTimeout(() => {
          navigate('/todos');
        }, 2000);
      });
  }, [token, localToken, navigate]);

  return (
    <div className="min-vh-100 d-flex flex-column">
      <Navbar loggedIn={!!localToken} />
      <div className="container flex-grow-1 d-flex align-items-center justify-content-center">
        <div className="card shadow-sm" style={{ maxWidth: '400px' }}>
          <div className="card-body text-center p-4">
            <div className="display-1 mb-3">
              {status === 'loading' && <FaSpinner className="text-primary fa-spin" />}
              {status === 'success' && <FaUsers className="text-success" />}
              {status === 'error' && <FaUsers className="text-danger" />}
            </div>
            <h2>Team Invitation</h2>
            <p>{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyLink;
