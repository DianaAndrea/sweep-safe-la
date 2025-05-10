
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if user has completed onboarding
    // For demo purposes, always show onboarding
    navigate('/onboarding');
  }, [navigate]);
  
  return (
    <div className="min-h-screen bg-sweepsafe-blue flex items-center justify-center">
      <div className="text-white text-center">
        <h1 className="text-4xl font-bold mb-2">SweepSafe</h1>
        <p>Loading...</p>
      </div>
    </div>
  );
};

export default Index;
