
import React from 'react';
import type { Workout, Exercise } from '../types';
import { DumbbellIcon, RunIcon, CheckCircleIcon } from './icons';
import Timer from './Timer';

interface DailyWorkoutViewProps {
  workout: Workout | undefined;
  onToggleExercise: (week: number, day: number, exerciseName: string) => void;
  onLogWorkout: (workout: Workout) => void;
  isWorkoutLogged: boolean;
}

const DailyWorkoutView: React.FC<DailyWorkoutViewProps> = ({ workout, onToggleExercise, onLogWorkout, isWorkoutLogged }) => {
  if (!workout) {
    return (
      <div className="p-4 text-center text-gray-400">
        Select a day to see your workout.
      </div>
    );
  }

  const handleToggle = (exercise: Exercise) => {
    onToggleExercise(workout.week, workout.day, exercise.name);
  };
  
  const allCompleted = workout.weightExercises.every(e => e.completed);

  return (
    <div className="p-4 space-y-6">
       {allCompleted && (
        <div className="bg-green-500/20 border border-green-500 text-green-300 p-4 rounded-lg flex items-center space-x-3">
            <CheckCircleIcon className="w-8 h-8"/>
            <div>
                <h3 className="font-bold">Weights Complete!</h3>
                <p className="text-sm">Great job! Time for cardio.</p>
            </div>
        </div>
       )}
      
      {/* Weight Training Section */}
      <div>
        <div className="flex items-center space-x-3 mb-4">
          <DumbbellIcon className="w-8 h-8 text-brand-blue" />
          <h3 className="text-2xl font-bold text-white">Weight Training</h3>
        </div>
        <div className="space-y-3">
          {workout.weightExercises.map((exercise, index) => (
            <div
              key={index}
              onClick={() => handleToggle(exercise)}
              className={`p-4 rounded-lg flex items-center justify-between cursor-pointer transition-all duration-300 ${
                exercise.completed ? 'bg-green-900/50 border-l-4 border-green-500' : 'bg-brand-light-dark'
              }`}
            >
              <div>
                <p className={`font-semibold text-lg ${exercise.completed ? 'text-gray-400 line-through' : 'text-white'}`}>
                  {exercise.name}
                </p>
                <p className="text-gray-400 text-sm">{exercise.sets} sets x {exercise.reps} reps</p>
                <p className="text-gray-500 mt-1 text-xs">{exercise.description}</p>
              </div>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                exercise.completed ? 'bg-green-500 border-green-400' : 'border-brand-gray'
              }`}>
                {exercise.completed && <CheckCircleIcon className="w-5 h-5 text-white"/>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cardio Section */}
      <div>
        <div className="flex items-center space-x-3 mb-4">
          <RunIcon className="w-8 h-8 text-brand-blue" />
          <h3 className="text-2xl font-bold text-white">Cardio</h3>
        </div>
        <div className="bg-brand-light-dark p-4 rounded-lg">
          <p className="text-lg font-semibold text-white mb-2">{workout.cardio.type}</p>
          <Timer durationMinutes={workout.cardio.duration} />
        </div>
      </div>
      
      {/* Log Workout Section */}
      <div className="mt-6 flex flex-col items-center">
        {isWorkoutLogged ? (
            <div className="text-center p-3 rounded-md bg-green-900/50 text-green-400 font-semibold flex items-center space-x-2">
                <CheckCircleIcon className="w-6 h-6" />
                <span>Workout for today already logged!</span>
            </div>
        ) : (
            <button
                onClick={() => onLogWorkout(workout)}
                disabled={!allCompleted}
                className="bg-brand-blue text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-blue-600 transition-all hover:scale-105 flex items-center space-x-2 disabled:bg-brand-gray disabled:cursor-not-allowed disabled:scale-100"
            >
                <CheckCircleIcon className="w-6 h-6" />
                <span>Log Today's Workout</span>
            </button>
        )}
        {!allCompleted && !isWorkoutLogged && (
            <p className="text-center text-gray-500 text-sm mt-2">
                Complete all weight exercises to log your session.
            </p>
        )}
      </div>
    </div>
  );
};

export default DailyWorkoutView;
