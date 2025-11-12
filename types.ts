
export type Physique = 'lean' | 'toned' | 'muscular';

export interface Profile {
  id: string; // Corresponds to Supabase auth user ID
  name: string;
  height: {
    feet: number;
    inches: number;
  };
  weight: number;
  goalWeight: number;
  goal: 'build_muscle' | 'lose_weight' | 'maintain_fitness';
  physique: Physique;
  plan_start_date?: string; // Date the 12-week plan was started
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string; // e.g., "8-12" or "15"
  description: string; // Brief instruction or description of the exercise
  completed: boolean;
}

export interface Cardio {
  type: string; // e.g., "Treadmill"
  duration: number; // in minutes
}

export interface Workout {
  week: number; // 1-12
  day: number; // 1-5
  focus: string; // e.g., "Upper Body Push"
  weightExercises: Exercise[];
  cardio: Cardio;
}

// Fix: Added UserSession type for use in UserSelection component.
export interface UserSession {
  profile: Profile;
}

export interface WorkoutHistoryEntry {
  completedDate: string;
  workout: Workout;
}
