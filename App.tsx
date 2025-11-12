

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Profile, Workout, WorkoutHistoryEntry } from './types';
import UserProfileModal from './components/UserProfileModal';
import WorkoutPlanView from './components/WorkoutPlanView';
import DailyWorkoutView from './components/DailyWorkoutView';
import GeminiChatModal from './components/GeminiChatModal';
import WorkoutHistoryModal from './components/WorkoutHistoryModal';
import { generateInitialPlan, modifyWorkoutPlan } from './services/geminiService';
import { getWorkoutHistory, addWorkoutToHistory } from './services/historyService';
import { BotIcon, LoaderIcon, HistoryIcon } from './components/icons';
import Auth from './components/Auth';
import { supabase } from './supabaseClient';
import type { Session } from '@supabase/supabase-js';

const getTodayIndex = (): number => {
    const day = new Date().getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6
    if (day >= 1 && day <= 5) {
        return day; // Monday is 1, Tuesday is 2, etc.
    }
    return 1; // Default to Monday (Day 1) on weekends
};

const calculateCurrentWeek = (startDateString?: string): number => {
    if (!startDateString) return 1;
    const startDate = new Date(startDateString);
    const today = new Date();
    // Set hours to 0 to compare days only
    startDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (startDate > today) return 1;

    const msInWeek = 1000 * 60 * 60 * 24 * 7;
    const weeksPassed = Math.floor((today.getTime() - startDate.getTime()) / msInWeek);
    
    const currentWeek = weeksPassed + 1;
    return Math.min(Math.max(currentWeek, 1), 12); // Clamp between 1 and 12
};

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [plan, setPlan] = useState<Workout[] | null>(null);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModifying, setIsModifying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [history, setHistory] = useState<WorkoutHistoryEntry[]>([]);

  const todayIndex = useMemo(() => getTodayIndex(), []);
  
  const [currentWeek, setCurrentWeek] = useState<number>(1);
  const [currentDay, setCurrentDay] = useState<number>(todayIndex);
  
  const fetchUserData = useCallback(async (currentSession: Session) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`*`)
        .eq('id', currentSession.user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }
      
      if (data) { // Profile exists
        const { plan, ...profileData } = data;
        const userProfile = profileData as Profile;
        setProfile(userProfile);

        if (plan) { // Plan also exists
          setPlan(plan as Workout[]);
          const calculatedWeek = calculateCurrentWeek(userProfile.plan_start_date);
          setCurrentWeek(calculatedWeek);
          setCurrentDay(todayIndex);
        } else { // Profile exists, but no plan
          setPlan(null);
        }
      } else { // No profile exists for this user
        setProfile(null);
        setPlan(null);
      }
    } catch (e: any) {
      setError(e.message || "Failed to fetch profile.");
    } finally {
      setIsLoading(false);
    }
  }, [todayIndex]);

  // Effect for handling authentication state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      if (!initialSession) {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
      }
    );
    return () => subscription.unsubscribe();
  }, []);
  
  // Effect for fetching user data when the session is available
  useEffect(() => {
      if (session) {
          fetchUserData(session);
      } else {
          // Clear user data on logout
          setProfile(null);
          setPlan(null);
          setIsLoading(false);
      }
  }, [session, fetchUserData]);

  // Effect for loading workout history from local storage
  useEffect(() => {
    setHistory(getWorkoutHistory());
  }, []);

  const handleProfileSubmit = async (profileData: Omit<Profile, 'id'>) => {
    if (!session) return;
    setIsLoading(true);
    setError(null);
    try {
      const startDate = new Date().toISOString();
      const newProfile: Profile = { 
        ...profileData, 
        id: session.user.id,
        plan_start_date: startDate 
      };
      const newPlan = await generateInitialPlan(newProfile);
      
      const { error } = await supabase.from('profiles').upsert({
          ...newProfile,
          plan: newPlan,
          updated_at: new Date(),
      });
      if (error) throw error;
      
      setProfile(newProfile);
      setPlan(newPlan);
      setCurrentWeek(1);
      setCurrentDay(todayIndex);
    } catch (e: any) {
      if (e.message?.includes("API_KEY environment variable is not set")) {
        setError("Configuration Error: The AI service is not set up correctly. Please contact the administrator.");
      } else {
        setError(e.message || "An unknown error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleModifyWorkout = async (request: string) => {
    if (!plan || !profile) return;
    setIsModifying(true);
    setError(null);
    try {
      const modifiedPlan = await modifyWorkoutPlan(plan, request);
      
      const { error } = await supabase
        .from('profiles')
        .update({ plan: modifiedPlan })
        .eq('id', profile.id);

      if (error) throw error;

      setPlan(modifiedPlan);
      setIsChatOpen(false);
    } catch (e: any) {
      if (e.message?.includes("API_KEY environment variable is not set")) {
        setError("Configuration Error: The AI service is not set up correctly. Please contact the administrator.");
      } else {
        setError(e.message || "An unknown error occurred.");
      }
    } finally {
      setIsModifying(false);
    }
  };
  
  const handleToggleExercise = useCallback(async (week: number, day: number, exerciseName: string) => {
    if (!plan || !profile) return;

    const newPlan = plan.map(workout => {
        if (workout.week === week && workout.day === day) {
            return {
                ...workout,
                weightExercises: workout.weightExercises.map(ex => 
                    ex.name === exerciseName ? { ...ex, completed: !ex.completed } : ex
                )
            };
        }
        return workout;
    });
    
    setPlan(newPlan); // Optimistic update

    const { error } = await supabase
        .from('profiles')
        .update({ plan: newPlan })
        .eq('id', profile.id);

    if (error) {
        setError("Failed to save progress. Please try again.");
        setPlan(plan); // Revert on error
    }
  }, [plan, profile]);
  
  const handleLogWorkout = (workout: Workout) => {
    const newHistory = addWorkoutToHistory(workout);
    setHistory(newHistory);
  };

  const isDateToday = (someDate: Date) => {
    const today = new Date();
    return someDate.getDate() === today.getDate() &&
        someDate.getMonth() === today.getMonth() &&
        someDate.getFullYear() === today.getFullYear();
  };

  const currentWorkout = plan?.find(w => w.week === currentWeek && w.day === currentDay);
  
  const isCurrentWorkoutLogged = useMemo(() => {
    if (!currentWorkout) return false;
    return history.some(entry => 
        entry.workout.week === currentWorkout.week &&
        entry.workout.day === currentWorkout.day &&
        isDateToday(new Date(entry.completedDate))
    );
  }, [history, currentWorkout]);

  const handleLogout = async () => {
    setError(null);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setError("Failed to log out. Please try again.");
    }
    // State will be cleared by the onAuthStateChange listener
  };

  const handleStartOver = () => {
    setProfile(null);
    setPlan(null);
    setCurrentWeek(1);
    setCurrentDay(todayIndex);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-screen text-white">
          <LoaderIcon className="w-16 h-16 text-brand-blue" />
          <p className="mt-4 text-xl">Loading your space...</p>
        </div>
      );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen text-center text-white p-4">
                <h2 className="text-2xl text-red-400 font-bold">Oops! Something went wrong.</h2>
                <p className="mt-2 text-gray-300">{error}</p>
                <button 
                    onClick={handleLogout}
                    className="mt-6 bg-brand-blue text-white font-bold py-2 px-6 rounded-md hover:bg-blue-600 transition-colors">
                    Log Out
                </button>
            </div>
        );
    }
    
    if (!session) {
      return <Auth />;
    }

    if (!profile) {
      return <UserProfileModal onSubmit={handleProfileSubmit} />;
    }
    
    if (plan) {
      return (
        <div className="max-w-7xl mx-auto">
          <WorkoutPlanView 
            plan={plan} 
            currentWeek={currentWeek}
            onSelectWeek={setCurrentWeek}
            currentDay={currentDay} 
            onSelectDay={setCurrentDay} 
            todayIndex={todayIndex}
           />
          <div className="border-t border-brand-gray/20 my-2"></div>
          <DailyWorkoutView 
            workout={currentWorkout} 
            onToggleExercise={handleToggleExercise}
            onLogWorkout={handleLogWorkout}
            isWorkoutLogged={isCurrentWorkoutLogged}
          />
        </div>
      );
    }
    
    // Fallback case, should be handled by isLoading
    return null;
  };

  return (
    <div className="min-h-screen bg-brand-dark text-white font-sans">
      <header className="bg-brand-light-dark p-4 shadow-md flex justify-between items-center">
        <div className="flex-1 text-left">
            {session && plan && (
                 <button onClick={handleStartOver} className="text-sm bg-brand-gray px-3 py-1 rounded-md hover:bg-gray-600 transition-colors">
                    Start Over
                </button>
            )}
        </div>
        <div className="flex-1 text-center">
            <h1 className="text-2xl font-bold text-brand-blue">GymGenie</h1>
        </div>
        <div className="flex-1 text-right flex justify-end items-center gap-2">
            {session && plan && (
                <button onClick={() => setIsHistoryOpen(true)} title="Workout History" className="text-sm bg-brand-gray p-2 rounded-md hover:bg-gray-600 transition-colors">
                    <HistoryIcon className="w-5 h-5" />
                </button>
            )}
            {session && (
                <button onClick={handleLogout} className="text-sm bg-brand-gray px-3 py-1 rounded-md hover:bg-gray-600 transition-colors">
                    Log Out
                </button>
            )}
        </div>
      </header>
      <main className="pb-24">{renderContent()}</main>
      
      {session && plan && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-brand-dark border-t border-brand-gray/20 flex justify-center">
            <button
                onClick={() => setIsChatOpen(true)} 
                className="bg-brand-blue text-white font-bold py-3 px-6 rounded-full shadow-lg hover:bg-blue-600 transition-transform hover:scale-105 flex items-center space-x-2">
                <BotIcon className="w-6 h-6"/>
                <span>Modify My Plan</span>
            </button>
        </div>
      )}
      <WorkoutHistoryModal 
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
      />
      <GeminiChatModal 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onModify={handleModifyWorkout}
        isLoading={isModifying}
      />
    </div>
  );
};

export default App;