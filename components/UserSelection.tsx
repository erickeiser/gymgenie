import React from 'react';
import type { UserSession } from '../types';
import { DumbbellIcon } from './icons';
import { WORKOUT_GOALS } from '../constants';

interface UserSelectionProps {
  users: UserSession[];
  onSelectUser: (user: UserSession) => void;
  onCreateNew: () => void;
}

const UserSelection: React.FC<UserSelectionProps> = ({ users, onSelectUser, onCreateNew }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-white p-4">
      <div className="text-center">
        <DumbbellIcon className="w-16 h-16 text-brand-blue mx-auto mb-4" />
        <h1 className="text-4xl font-bold">Welcome to GymGenie</h1>
        <p className="mt-2 text-gray-400">Your AI-powered workout partner.</p>
      </div>

      <div className="w-full max-w-sm mt-10">
        {users.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg text-center font-semibold mb-3">Select a Profile</h2>
            <div className="space-y-3">
              {users.map((user) => (
                <button
                  key={user.profile.name}
                  onClick={() => onSelectUser(user)}
                  className="w-full text-left p-4 bg-brand-light-dark rounded-lg hover:bg-brand-gray transition-colors flex items-center"
                >
                  <div className="w-10 h-10 bg-brand-blue rounded-full flex items-center justify-center font-bold text-xl mr-4 flex-shrink-0">
                    {user.profile.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-bold text-lg">{user.profile.name}</span>
                    <p className="text-xs text-gray-400">
                      Goal: {WORKOUT_GOALS[user.profile.goal]}
                    </p>
                  </div>
                </button>
              ))}
            </div>
             <p className="text-center text-gray-500 my-4">or</p>
          </div>
        )}
        <button
          onClick={onCreateNew}
          className="w-full bg-brand-blue text-white font-bold py-3 rounded-md hover:bg-blue-600 transition-colors text-lg"
        >
          {users.length > 0 ? 'Create a New Profile' : 'Get Started'}
        </button>
      </div>
    </div>
  );
};

export default UserSelection;
