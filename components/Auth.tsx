import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { DumbbellIcon, LoaderIcon } from './icons';

const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginView, setIsLoginView] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
        if (isLoginView) {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
        } else {
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) throw error;
            setMessage('Check your email for the confirmation link!');
        }
    } catch (error: any) {
        setError(error.error_description || error.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-white p-4">
        <div className="text-center mb-10">
            <DumbbellIcon className="w-16 h-16 text-brand-blue mx-auto mb-4" />
            <h1 className="text-4xl font-bold">Welcome to GymGenie</h1>
            <p className="mt-2 text-gray-400">Your AI-powered workout partner.</p>
        </div>
      <div className="w-full max-w-sm">
        <h2 className="text-2xl text-center font-semibold mb-6">{isLoginView ? 'Log In' : 'Sign Up'}</h2>
        {error && <p className="bg-red-500/20 text-red-400 p-3 rounded-md mb-4 text-center">{error}</p>}
        {message && <p className="bg-green-500/20 text-green-300 p-3 rounded-md mb-4 text-center">{message}</p>}
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
            <input
              id="email"
              className="w-full bg-brand-dark border border-brand-gray text-white rounded-md p-3 focus:ring-brand-blue focus:border-brand-blue"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>
          <div>
            <label htmlFor="password"className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input
              id="password"
              className="w-full bg-brand-dark border border-brand-gray text-white rounded-md p-3 focus:ring-brand-blue focus:border-brand-blue"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <div>
            <button type="submit" disabled={loading} className="w-full mt-2 bg-brand-blue text-white font-bold py-3 rounded-md hover:bg-blue-600 transition-colors text-lg disabled:bg-brand-gray flex items-center justify-center">
              {loading && <LoaderIcon className="w-6 h-6 mr-2" />}
              <span>{loading ? 'Processing...' : (isLoginView ? 'Log In' : 'Sign Up')}</span>
            </button>
          </div>
        </form>
        <p className="text-center text-gray-400 mt-6">
          {isLoginView ? "Don't have an account?" : "Already have an account?"}{' '}
          <button onClick={() => {
              setIsLoginView(!isLoginView);
              setError(null);
              setMessage(null);
          }} className="font-semibold text-brand-blue hover:underline">
            {isLoginView ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
