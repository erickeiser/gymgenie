
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Profile, Workout, WorkoutHistoryEntry } from './types';
import UserProfileModal from './components/UserProfileModal';
import WorkoutPlanView from './components/WorkoutPlanView';
import DailyWorkoutView from './components/DailyWorkoutView';
import GeminiChatModal from './components/GeminiChatModal';
import Auth from './components/Auth';
import WorkoutHistoryModal from './components/WorkoutHistoryModal';
import { generateInitialPlan, modifyWorkoutPlan } from './services/geminiService';
import { supabase } from './supabaseClient';
import type { Session } from '@supabase/supabase-js';
import { BotIcon, LoaderIcon, HistoryIcon } from './components/icons';
import { getWorkoutHistory, addWorkoutToHistory } from './services/historyService';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [plan, setPlan] = useState<Workout[] | null>(null);
  const [loading, setLoading] = useState<string | null>('Authenticating...');
  const [error, setError] = useState<string | null>(null);

  const [currentWeek, setCurrentWeek] = useState(1);
  const [currentDay, setCurrentDay] = useState(new Date().getDay() || 1); 

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isModifying, setIsModifying] = useState(false);
  
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [history, setHistory] = useState<WorkoutHistoryEntry[]>([]);

  const [previousState, setPreviousState] = useState<{ profile: Profile; plan: Workout[] } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        setLoading(null);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
       if (!session) {
        setProfile(null);
        setPlan(null);
        setLoading(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);
  
  const fetchUserData = useCallback(async (userId: string) => {
    setLoading('Loading your space...');
    setError(null);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, height, weight, goalWeight, goal, physique, plan')
        .eq('id', userId)
        .single();
        
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw new Error(`Database error: ${error.message}`);
      }
      
      if (data) {
          const profileData: Omit<Profile, 'plan_start_date'> = {
              id: data.id,
              name: data.name,
              height: data.height,
              weight: data.weight,
              goalWeight: data.goalWeight,
              goal: data.goal,
              physique: data.physique,
          };
          const planData = data.plan as Workout[] | null;
          
          setProfile(profileData);
          if (planData && planData.length > 0) {
            setPlan(planData);
          }
      }
    } catch (err: any) {
      setError(`Failed to load your profile. ${err.message}`);
    } finally {
      setLoading(null);
    }
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchUserData(session.user.id);
    }
  }, [session, fetchUserData]);
  
  useEffect(() => {
    setHistory(getWorkoutHistory());
  }, []);

  const handleCreateProfile = async (profileData: Omit<Profile, 'id' | 'plan_start_date'>) => {
    if (!session?.user) {
      setError("You must be logged in to create a profile.");
      return;
    }
    
    setLoading('Generating your personalized plan...');
    setError(null);

    try {
      const newPlan = await generateInitialPlan({ ...profileData, id: session.user.id });
      
      const newProfile: Profile = {
        ...profileData,
        id: session.user.id,
      };

      const { error: dbError } = await supabase.from('profiles').upsert({
        ...newProfile,
        plan: newPlan,
      });

      if (dbError) throw new Error(`Database error: ${dbError.message}`);

      setProfile(newProfile);
      setPlan(newPlan);
      setPreviousState(null);
    } catch (error: any) {
        if (error.message.includes("API_KEY")) {
            setError("Configuration Error: The AI service is not set up correctly. Please contact the administrator.");
        } else {
            setError("Failed to generate workout plan. The AI might be busy. Please try again later.");
        }
        console.error(error);
    } finally {
      setLoading(null);
    }
  };

  const updatePlanInDb = async (newPlan: Workout[]) => {
      if (!session?.user.id) return;
      await supabase.from('profiles').update({ plan: newPlan }).eq('id', session.user.id);
  };
  
  const handleToggleExercise = (week: number, day: number, exerciseName: string) => {
    setPlan(currentPlan => {
        if (!currentPlan) return null;
        const newPlan = currentPlan.map(workout => {
            if (workout.week === week && workout.day === day) {
                const newExercises = workout.weightExercises.map(ex => {
                    if (ex.name === exerciseName) {
                        return { ...ex, completed: !ex.completed };
                    }
                    return ex;
                });
                return { ...workout, weightExercises: newExercises };
            }
            return workout;
        });
        updatePlanInDb(newPlan);
        return newPlan;
    });
  };
  
  const handleModifyPlan = async (request: string) => {
    if (!plan) return;
    setIsModifying(true);
    try {
        const newPlan = await modifyWorkoutPlan(plan, request);
        setPlan(newPlan);
        updatePlanInDb(newPlan);
    } catch (error) {
        setError("Failed to modify the plan. Please try again.");
    } finally {
        setIsModifying(false);
        setIsChatOpen(false);
    }
  };
  
  const handleLogWorkout = (workout: Workout) => {
    const newHistory = addWorkoutToHistory(workout);
    setHistory(newHistory);
  };
  
  const handleStartOver = () => {
    if (profile && plan) {
      setPreviousState({ profile, plan });
    }
    setProfile(null);
    setPlan(null);
    setError(null);
  };
  
  const handleGoBack = () => {
    if (previousState) {
      setProfile(previousState.profile);
      setPlan(previousState.plan);
      setPreviousState(null);
      setError(null);
    }
  };
  
  const handleLogout = async () => {
    setLoading('Logging out...');
    await supabase.auth.signOut();
  };

   const todayIndex = useMemo(() => new Date().getDay() || 1, []);
   const currentWorkout = useMemo(() => {
    if (!plan) return undefined;
    return plan.find(w => w.week === currentWeek && w.day === currentDay);
   }, [plan, currentWeek, currentDay]);
  
   const isWorkoutLogged = useMemo(() => {
     if (!currentWorkout) return false;
     const today = new Date().toISOString().split('T')[0];
     return history.some(h =>
       h.workout.week === currentWorkout.week &&
       h.workout.day === currentWorkout.day &&
       h.completedDate.startsWith(today)
     );
   }, [history, currentWorkout]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white bg-brand-dark">
        <LoaderIcon className="w-16 h-16 text-brand-blue" />
        <p className="mt-4 text-lg">{loading}</p>
      </div>
    );
  }
  
  if (!session) {
    return <Auth />;
  }
  
  const renderContent = () => {
      if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] text-white p-4 text-center">
                <h2 className="text-2xl font-bold text-red-400">Oops! Something went wrong.</h2>
                <p className="mt-2 text-gray-400 max-w-md">{error}</p>
                {previousState && (
                    <button onClick={handleGoBack} className="mt-6 bg-brand-blue text-white font-bold py-2 px-6 rounded-md hover:bg-blue-600 transition-colors">
                        Go Back
                    </button>
                )}
            </div>
        );
      }
      
      if (profile && plan) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-7xl mx-auto">
                <div className="lg:col-span-1">
                    <WorkoutPlanView
                        plan={plan}
                        currentWeek={currentWeek}
                        onSelectWeek={setCurrentWeek}
                        currentDay={currentDay}
                        onSelectDay={setCurrentDay}
                        todayIndex={todayIndex}
                    />
                </div>
                <div className="lg:col-span-1 bg-brand-dark rounded-lg">
                    <DailyWorkoutView
                        workout={currentWorkout}
                        onToggleExercise={handleToggleExercise}
                        onLogWorkout={handleLogWorkout}
                        isWorkoutLogged={isWorkoutLogged}
                    />
                </div>
            </div>
        )
      }
      
      return <UserProfileModal onSubmit={handleCreateProfile} />;
  }

  return (
    <div className="min-h-screen bg-brand-dark text-white font-sans">
      <header className="bg-brand-light-dark p-4 flex justify-between items-center shadow-md sticky top-0 z-10">
        <h1 className="text-xl sm:text-2xl font-bold text-brand-blue">
            GymGenie
        </h1>
        {profile && (
            <div className="flex items-center space-x-2">
                <button onClick={handleStartOver} className="bg-brand-gray text-white font-semibold py-2 px-4 rounded-md hover:bg-opacity-80 transition-colors text-sm">Start Over</button>
                <button onClick={() => setIsHistoryOpen(true)} aria-label="Workout History" className="p-2 bg-brand-gray rounded-md hover:bg-opacity-80 transition-colors"><HistoryIcon /></button>
                <button onClick={handleLogout} className="bg-red-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-red-700 transition-colors text-sm">Log Out</button>
            </div>
        )}
      </header>
      <main className="p-2 sm:p-4">
        {renderContent()}
      </main>

      {profile && plan && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 bg-brand-blue text-white rounded-full p-4 shadow-lg hover:bg-blue-600 transition-transform hover:scale-110"
          aria-label="Modify workout plan"
        >
          <BotIcon className="w-8 h-8" />
        </button>
      )}
      
      <GeminiChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onModify={handleModifyPlan}
        isLoading={isModifying}
      />
      
      <WorkoutHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
      />
    </div>
  );
}

export default App;
