import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerificationSent from './pages/VerificationSent';
import VerifyLink from './pages/VerifyLink';
import VerifyEmail from './pages/VerifyEmail';
import TodoPage from './pages/TodoPage';
import MultiUserTodoPage from './pages/MultiUserTodoPage'; // Multi-user component

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-sent" element={<VerificationSent />} />
        <Route path="/verify" element={<VerifyLink />} />
        <Route path="/verify/:token" element={<VerifyEmail />} />
        <Route path="/todos" element={<TodoPage />} />
        <Route path="/invite/:token" element={<MultiUserTodoPage />} /> {/* New Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
