
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Clock, Bell } from 'lucide-react';

const OnboardingPage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  
  const steps = [
    {
      title: "Welcome to SweepSafe",
      icon: <MapPin size={48} className="text-sweepsafe-blue" />,
      description: "Your parking companion in Los Angeles. Never get a street cleaning ticket again.",
      buttonText: "Get Started"
    },
    {
      title: "Automatic Detection",
      icon: <Clock size={48} className="text-sweepsafe-blue" />,
      description: "SweepSafe detects when you park and checks the street cleaning schedule automatically.",
      buttonText: "Continue"
    },
    {
      title: "Smart Alerts",
      icon: <Bell size={48} className="text-sweepsafe-blue" />,
      description: "Receive timely notifications before street cleaning so you'll never forget to move your car.",
      buttonText: "Start Using SweepSafe"
    }
  ];
  
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Navigate to main app
      navigate("/main");
    }
  };
  
  const currentStepData = steps[currentStep];
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-sweepsafe-blue/10 to-white flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="p-8 flex flex-col items-center text-center">
            <div className="mb-6">
              {currentStepData.icon}
            </div>
            
            <h1 className="text-2xl font-bold mb-4 text-sweepsafe-blue">
              {currentStepData.title}
            </h1>
            
            <p className="mb-8 text-sweepsafe-gray">
              {currentStepData.description}
            </p>
            
            <Button 
              onClick={handleNext}
              className="w-full bg-sweepsafe-blue hover:bg-sweepsafe-blue/90 text-white"
            >
              {currentStepData.buttonText}
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <div className="p-6 flex justify-center">
        <div className="flex space-x-2">
          {steps.map((_, index) => (
            <div 
              key={index}
              className={`h-2 w-2 rounded-full ${
                index === currentStep 
                  ? 'bg-sweepsafe-blue' 
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
