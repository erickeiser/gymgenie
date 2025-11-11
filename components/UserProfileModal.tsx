import React, { useState } from 'react';
import type { Profile, Physique } from '../types';
import { WORKOUT_GOALS, PHYSIQUE_GOALS } from '../constants';
import { LeanIcon, TonedIcon, MuscularIcon } from './icons';

interface UserProfileModalProps {
  onSubmit: (profileData: Omit<Profile, 'id'>) => void;
}

const physiqueIcons: Record<Physique, React.FC<{ className?: string }>> = {
    lean: LeanIcon,
    toned: TonedIcon,
    muscular: MuscularIcon,
};

const UserProfileModal: React.FC<UserProfileModalProps> = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [feet, setFeet] = useState('');
  const [inches, setInches] = useState('');
  const [weight, setWeight] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [goal, setGoal] = useState<'build_muscle' | 'lose_weight' | 'maintain_fitness'>('build_muscle');
  const [physique, setPhysique] = useState<Physique>('toned');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && feet && inches && weight && goalWeight) {
      onSubmit({
        name: name.trim(),
        height: {
          feet: parseInt(feet),
          inches: parseInt(inches),
        },
        weight: parseInt(weight),
        goalWeight: parseInt(goalWeight),
        goal,
        physique,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-light-dark rounded-lg shadow-xl p-6 md:p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-white mb-2">Create Your Profile</h2>
        <p className="text-gray-400 mb-6">Let's generate your personalized 12-week plan.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Your Name</label>
            <input
              type="text" id="name" value={name} 
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Alex"
              className="w-full bg-brand-dark border border-brand-gray text-white rounded-md p-3 focus:ring-brand-blue focus:border-brand-blue" required />
          </div>
          <div>
            <label htmlFor="height" className="block text-sm font-medium text-gray-300 mb-1">Height</label>
            <div className="flex space-x-2">
                <input
                  type="number" id="feet" value={feet} onChange={(e) => setFeet(e.target.value)} placeholder="ft"
                  className="w-full bg-brand-dark border border-brand-gray text-white rounded-md p-3 focus:ring-brand-blue focus:border-brand-blue" required />
                <input
                  type="number" id="inches" value={inches} onChange={(e) => setInches(e.target.value)} placeholder="in"
                  className="w-full bg-brand-dark border border-brand-gray text-white rounded-md p-3 focus:ring-brand-blue focus:border-brand-blue" required min="0" max="11" />
            </div>
          </div>
          <div className="flex space-x-2">
            <div className="flex-1">
                <label htmlFor="weight" className="block text-sm font-medium text-gray-300 mb-1">Current Weight (lbs)</label>
                <input
                  type="number" id="weight" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g., 165"
                  className="w-full bg-brand-dark border border-brand-gray text-white rounded-md p-3 focus:ring-brand-blue focus:border-brand-blue" required />
            </div>
            <div className="flex-1">
                <label htmlFor="goalWeight" className="block text-sm font-medium text-gray-300 mb-1">Goal Weight (lbs)</label>
                <input
                  type="number" id="goalWeight" value={goalWeight} onChange={(e) => setGoalWeight(e.target.value)} placeholder="e.g., 155"
                  className="w-full bg-brand-dark border border-brand-gray text-white rounded-md p-3 focus:ring-brand-blue focus:border-brand-blue" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Desired Physique</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(PHYSIQUE_GOALS) as Physique[]).map((key) => {
                const Icon = physiqueIcons[key];
                return (
                    <button
                        key={key} type="button" onClick={() => setPhysique(key)}
                        className={`p-3 rounded-md transition-colors flex flex-col items-center justify-center space-y-2 h-24 ${
                            physique === key ? 'bg-brand-blue text-white' : 'bg-brand-dark hover:bg-brand-gray text-gray-300'
                        }`}
                    >
                        <Icon className="w-8 h-8" />
                        <span className="text-sm font-semibold">{PHYSIQUE_GOALS[key]}</span>
                    </button>
                )
              })}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Primary Goal</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {Object.entries(WORKOUT_GOALS).map(([key, value]) => (
                <button
                  key={key} type="button" onClick={() => setGoal(key as keyof typeof WORKOUT_GOALS)}
                  className={`p-3 text-sm font-semibold rounded-md transition-colors ${
                    goal === key ? 'bg-brand-blue text-white' : 'bg-brand-dark hover:bg-brand-gray text-gray-300'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
          <div className="flex pt-2">
            <button type="submit" className="w-full bg-brand-blue text-white font-bold py-3 rounded-md hover:bg-blue-600 transition-colors text-lg">
              Create My Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserProfileModal;
