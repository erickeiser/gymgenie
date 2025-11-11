
import React from 'react';
import type { Workout } from '../types';

interface WorkoutPlanViewProps {
  plan: Workout[];
  currentWeek: number;
  onSelectWeek: (week: number) => void;
  currentDay: number;
  onSelectDay: (day: number) => void;
  todayIndex: number;
}

const WorkoutPlanView: React.FC<WorkoutPlanViewProps> = ({ plan, currentWeek, onSelectWeek, currentDay, onSelectDay, todayIndex }) => {
  const weeklyWorkouts = plan.filter(w => w.week === currentWeek);

  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Your 12-Week Plan</h2>
        {/* Week Selector */}
        <div className="flex space-x-2 overflow-x-auto pb-4">
          {[...Array(12).keys()].map(i => i + 1).map(week => (
            <button
              key={week}
              onClick={() => onSelectWeek(week)}
              className={`flex-shrink-0 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                currentWeek === week ? 'bg-brand-blue text-white' : 'bg-brand-light-dark text-gray-300 hover:bg-brand-gray'
              }`}
            >
              Week {week}
            </button>
          ))}
        </div>
      </div>
      
      {/* Day Selector */}
      <div className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-4">
        {weeklyWorkouts.map((workout) => {
            const isSelected = currentDay === workout.day;
            const isToday = workout.day === todayIndex;
            return (
          <button
            key={workout.day}
            onClick={() => onSelectDay(workout.day)}
            className={`relative flex-shrink-0 w-32 h-32 sm:w-40 sm:h-40 p-4 rounded-lg transition-all duration-300 text-left flex flex-col justify-between ${
              isSelected
                ? 'bg-brand-blue text-white scale-105 shadow-lg shadow-blue-500/30'
                : 'bg-brand-light-dark text-gray-300 hover:bg-brand-gray'
            }`}
          >
            {isToday && (
                <span className="absolute top-2 right-2 text-xs font-bold bg-yellow-400 text-black px-2 py-0.5 rounded-full">TODAY</span>
            )}
            <div>
              <p className="text-sm opacity-80">Day {workout.day}</p>
              <h3 className="font-bold text-md sm:text-lg mt-1">{workout.focus}</h3>
            </div>
            <div className="text-xs opacity-70 mt-2">
                <p>{workout.weightExercises.length} Exercises</p>
                <p>{workout.cardio.duration} min Cardio</p>
            </div>
          </button>
        )})}
      </div>
    </div>
  );
};

export default WorkoutPlanView;