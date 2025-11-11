
import React, { useState, useEffect, useCallback } from 'react';

interface TimerProps {
  durationMinutes: number;
}

const Timer: React.FC<TimerProps> = ({ durationMinutes }) => {
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes * 60);
  const [isActive, setIsActive] = useState(false);

  const reset = useCallback(() => {
    setSecondsLeft(durationMinutes * 60);
    setIsActive(false);
  }, [durationMinutes]);

  useEffect(() => {
    reset();
  }, [durationMinutes, reset]);

  useEffect(() => {
    // Fix: Replaced NodeJS.Timeout with ReturnType<typeof setInterval> for browser compatibility.
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((seconds) => seconds - 1);
      }, 1000);
    } else if (secondsLeft === 0) {
      setIsActive(false);
      // Optional: Add a sound or notification
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, secondsLeft]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <div className="text-center p-4 bg-brand-dark rounded-lg">
      <div className="text-6xl font-mono font-bold text-white tracking-widest">
        <span>{String(minutes).padStart(2, '0')}</span>:<span>{String(seconds).padStart(2, '0')}</span>
      </div>
      <div className="flex justify-center space-x-4 mt-4">
        <button
          onClick={() => setIsActive(!isActive)}
          className={`px-6 py-2 rounded-md font-semibold transition-colors ${
            isActive ? 'bg-yellow-500 text-black' : 'bg-green-500 text-white'
          }`}
        >
          {isActive ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={reset}
          className="px-6 py-2 rounded-md font-semibold bg-brand-gray text-white"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default Timer;
