
import type { Workout, WorkoutHistoryEntry } from '../types';

const HISTORY_STORAGE_KEY = 'gymgenie_workout_history';

export const getWorkoutHistory = (): WorkoutHistoryEntry[] => {
  try {
    const historyJson = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (historyJson) {
      return JSON.parse(historyJson) as WorkoutHistoryEntry[];
    }
  } catch (error) {
    console.error("Failed to parse workout history from localStorage", error);
    // If parsing fails, clear the corrupted data
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  }
  return [];
};

export const saveWorkoutHistory = (history: WorkoutHistoryEntry[]): void => {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error("Failed to save workout history to localStorage", error);
  }
};

export const addWorkoutToHistory = (workout: Workout): WorkoutHistoryEntry[] => {
  const currentHistory = getWorkoutHistory();
  const newEntry: WorkoutHistoryEntry = {
    completedDate: new Date().toISOString(),
    workout: workout,
  };
  
  // Prepend to show the newest first
  const newHistory = [newEntry, ...currentHistory];
  saveWorkoutHistory(newHistory);
  return newHistory;
};
