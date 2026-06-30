import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState('');

  const handleNext = () => {
    if (step === 1) setStep(2);
    else {
      // Complete onboarding and redirect to Paywall
      navigate('/paywall');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass-panel w-full max-w-lg animate-fade-in text-center">
        {step === 1 ? (
          <>
            <h2 className="mb-4">What's your primary goal?</h2>
            <p className="mb-8">Select one to help us personalize your experience.</p>
            <div className="flex flex-col gap-sm mb-8">
              {['Build better habits', 'Break bad habits', 'Increase productivity', 'Just exploring'].map((opt) => (
                <button
                  key={opt}
                  className={`btn btn-secondary ${goal === opt ? 'btn-primary' : ''}`}
                  onClick={() => setGoal(opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
            <button onClick={handleNext} disabled={!goal} className="btn btn-primary btn-block">
              Continue
            </button>
          </>
        ) : (
          <>
            <h2 className="mb-4">You're all set!</h2>
            <p className="mb-8">We've customized your experience based on your goal to <strong>{goal.toLowerCase()}</strong>.</p>
            <button onClick={handleNext} className="btn btn-primary btn-block">
              Let's Go
            </button>
          </>
        )}
      </div>
    </div>
  );
}
