import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft } from 'lucide-react';

interface AuthPageProps {
  onBack: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onBack }) => {
  const { login, register, useDemoAccount } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isRegister) {
        if (!name.trim()) throw new Error('Please enter your name.');
        await register(email, password, name);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication error.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoClick = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await useDemoAccount();
    } catch (err: any) {
      setError(err?.message || 'Could not sign in with demo account.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6F3] flex flex-col justify-center py-12 px-4 sm:px-6 font-sans text-sm">
      <div className="max-w-md w-full mx-auto space-y-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs text-[#78716C] hover:text-[#1C1C1E] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to overview</span>
        </button>

        <div className="border border-[#E2E0D9] bg-white p-8 rounded-[6px] space-y-6">
          <div className="border-b border-[#E2E0D9] pb-4 space-y-1">
            <div className="font-serif text-2xl font-medium text-[#1C1C1E]">
              Duely
            </div>
            <h1 className="text-sm text-[#78716C]">
              {isRegister ? 'Create your personal notebook' : 'Sign in to your notebook'}
            </h1>
          </div>

          {error && (
            <div className="border border-[#E2E0D9] bg-[#FAF5F5] p-3 rounded-[5px] text-[#A8382B] text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {isRegister && (
              <div>
                <label className="block text-[#57534E] mb-1 font-medium">
                  Your name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Aryan Ahire"
                  className="w-full p-2.5 border border-[#D6D3CC] rounded-[5px] text-sm bg-white text-[#2C2C2C] focus:outline-none focus:border-[#2C2C2C]"
                />
              </div>
            )}

            <div>
              <label className="block text-[#57534E] mb-1 font-medium">
                Email address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full p-2.5 border border-[#D6D3CC] rounded-[5px] text-sm bg-white text-[#2C2C2C] focus:outline-none focus:border-[#2C2C2C]"
              />
            </div>

            <div>
              <label className="block text-[#57534E] mb-1 font-medium">
                Password *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full p-2.5 border border-[#D6D3CC] rounded-[5px] text-sm bg-white text-[#2C2C2C] focus:outline-none focus:border-[#2C2C2C]"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 font-medium text-sm rounded-[5px] bg-[#2C2C2C] text-[#F7F6F3] hover:bg-[#1C1C1E] disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isLoading
                ? 'Signing in...'
                : isRegister
                ? 'Create notebook account'
                : 'Sign in'}
            </button>
          </form>

          {/* 1-Click Demo Shortcut */}
          <div className="pt-2 border-t border-[#E2E0D9] space-y-2">
            <button
              type="button"
              onClick={handleDemoClick}
              disabled={isLoading}
              className="w-full py-2 px-3 text-xs font-medium text-[#2C2C2C] border border-[#D6D3CC] bg-[#F7F6F3] hover:bg-[#EFECE6] rounded-[5px] transition-colors cursor-pointer"
            >
              Use demo account (demo@duely.local)
            </button>
          </div>

          <div className="text-center pt-2 text-xs text-[#78716C] border-t border-[#E2E0D9]">
            {isRegister ? (
              <span>
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setIsRegister(false);
                    setError(null);
                  }}
                  className="font-medium text-[#1C1C1E] underline cursor-pointer"
                >
                  Sign in
                </button>
              </span>
            ) : (
              <span>
                Don&apos;t have an account?{' '}
                <button
                  onClick={() => {
                    setIsRegister(true);
                    setError(null);
                  }}
                  className="font-medium text-[#1C1C1E] underline cursor-pointer"
                >
                  Create one
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
