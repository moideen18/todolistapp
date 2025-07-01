import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./Landing.css";

const Landing = () => {
  const handleGetStarted = () => {
    navigate("/signup");
  };

  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <Navbar loggedIn={false} />
      <div className="hero-section">
        <div className="hero-text">
          <h1>WELCOME TO TODOPILOT</h1>
          <p>Stay organized and manage your tasks effortlessly!</p>
          <button 
            className="btn btn-primary btn-lg px-4" 
            onClick={handleGetStarted}
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
};

export default Landing;
