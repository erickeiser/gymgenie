

import React, { useState } from 'react';
import type { WorkoutHistoryEntry } from '../types';
import { DumbbellIcon, RunIcon, CheckCircleIcon } from './icons';

interface WorkoutHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: WorkoutHistoryEntry[];
}

const HistoryItem: React.FC<{ item: WorkoutHistoryEntry }> = ({ item }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { workout, completedDate } = item;
    const date = new Date(completedDate);

    return (
        <div className="bg-brand-light-dark rounded-lg">
            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-4 text-left flex justify-between items-center"
            >
                <div>
                    <p className="font-bold text-white">{workout.focus}</p>
                    <p className="text-sm text-gray-400">
                        {date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} - Week {workout.week}, Day {workout.day}
                    </p>
                </div>
                <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {isExpanded && (
                <div className="p-4 border-t border-brand-gray/50">
                    <div className="space-y-4">
                         <div>
                            <div className="flex items-center space-x-2 mb-2">
                                <DumbbellIcon className="w-5 h-5 text-brand-blue" />
                                <h4 className="font-semibold text-white">Weight Training</h4>
                            </div>
                            <ul className="space-y-2 pl-4">
                                {workout.weightExercises.map((ex, i) => (
                                    <li key={i} className="flex items-start space-x-2 text-sm">
                                        <CheckCircleIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                        <div className="text-gray-300">
                                            <span className="font-semibold">{ex.name}</span>: {ex.sets} sets x {ex.reps} reps
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <div className="flex items-center space-x-2 mb-2">
                                <RunIcon className="w-5 h-5 text-brand-blue" />
                                <h4 className="font-semibold text-white">Cardio</h4>
                            </div>
                            <p className="text-sm text-gray-300 pl-4">{workout.cardio.type} - {workout.cardio.duration} minutes</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const WorkoutHistoryModal: React.FC<WorkoutHistoryModalProps> = ({ isOpen, onClose, history }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-brand-dark rounded-lg shadow-xl p-6 w-full max-w-2xl flex flex-col h-[80vh]">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-white">Workout History</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl">&times;</button>
                </div>
                <div className="flex-grow overflow-y-auto space-y-3 pr-2">
                    {history.length === 0 ? (
                        <div className="text-center text-gray-400 pt-10">
                            <p>You haven't logged any workouts yet.</p>
                            <p className="text-sm">Complete all exercises for a day and press "Log Workout" to start building your history.</p>
                        </div>
                    ) : (
                        history.map((item, index) => <HistoryItem key={index} item={item} />)
                    )}
                </div>
            </div>
        </div>
    );
};

export default WorkoutHistoryModal;