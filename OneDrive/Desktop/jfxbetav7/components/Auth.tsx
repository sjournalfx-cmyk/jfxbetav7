import React, { useState } from 'react';
import { 
  Mail, Lock, ArrowRight,
  User, CheckCircle2, AlertCircle, Eye, EyeOff 
} from 'lucide-react';
import { authService } from '../services/authService';

interface AuthProps {
  isDarkMode: boolean;
  onLogin: () => void;
  onRegister: () => void;
}

const Auth: React.FC<AuthProps> = ({ isDarkMode, onLogin, onRegister }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLoginView) {
        const { error } = await authService.signIn(email, password);
        if (error) throw error;
        onLogin();
      } else {
        if (!email || !password) {
          setError("Please fill in all fields.");
          setIsLoading(false);
          return;
        }
        // Name is collected during onboarding, so we pass an empty string here.
        const { error } = await authService.signUp(email, password, '');
        if (error) throw error;
        onRegister();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during authentication.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleView = () => {
    setIsLoginView(!isLoginView);
    setError(null);
    setEmail('');
    setPassword('');
  };

  const bgColor = isDarkMode ? 'bg-[#050505]' : 'bg-slate-50';
  const cardBg = isDarkMode ? 'bg-[#0A0A0A]' : 'bg-white';
  const textColor = isDarkMode ? 'text-white' : 'text-slate-900';
  const borderColor = isDarkMode ? 'border-zinc-800' : 'border-slate-200';
  const inputBg = isDarkMode ? 'bg-[#111]' : 'bg-slate-50';

  return (
    <div className={`flex min-h-dvh w-full ${bgColor} ${textColor} transition-colors duration-500`}>
      
      {/* Left Panel - Visuals */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-black items-center justify-center">
        {/* Abstract Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-black z-0" />
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#FF4F01]/10 rounded-full blur-[100px]" />

        {/* Content */}
        <div className="relative z-10 p-12 max-w-lg">
          <h1 className="text-5xl font-black tracking-tight text-white mb-6 leading-tight">
            Master your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">trading psychology.</span>
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed mb-8">
            JournalFX is the professional tool for traders who treat the markets like a business. Track, analyze, and optimize your edge with AI-driven insights.
          </p>

          <div className="grid grid-cols-2 gap-6">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <h3 className="font-bold text-white mb-1">AI Analysis</h3>
              <p className="text-xs text-zinc-500">Automated pattern recognition</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <h3 className="font-bold text-white mb-1">Pro Metrics</h3>
              <p className="text-xs text-zinc-500">Institutional grade analytics</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-12 relative overflow-y-auto">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700 py-8">
          
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-3">{isLoginView ? 'Welcome Back' : 'Create Account'}</h2>
            <p className="text-sm text-zinc-500 px-4">
              {isLoginView ? 'Access your institutional-grade trading workspace.' : 'Join the elite traders mastering their psychology.'}
            </p>
          </div>

          <div className="space-y-4 mb-8">
             <button className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl border-2 font-black text-sm transition-all hover:scale-[1.01] active:scale-[0.99] ${isDarkMode ? 'bg-white/5 border-white/5 hover:bg-white/10 text-white' : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-900 shadow-sm'}`}>
                <User size={18} className="text-indigo-500" /> Continue with Google
             </button>
          </div>

          <div className="relative mb-8">
            <div className={`absolute inset-0 flex items-center`}>
              <div className={`w-full border-t ${borderColor}`}></div>
            </div>
            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
              <span className={`px-4 ${bgColor} text-zinc-500`}>Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 px-1">
            {error && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-500 text-sm font-bold animate-in fade-in zoom-in-95">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <div className="group">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2.5 block ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className={`w-full ${inputBg} border-2 ${borderColor} rounded-2xl py-4 pl-12 pr-4 font-bold text-sm outline-none focus:border-indigo-500 transition-all placeholder:opacity-30`}
                />
              </div>
            </div>

            <div className="group">
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Password</label>
                {isLoginView && <button type="button" className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-400">Forgot?</button>}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className={`w-full ${inputBg} border-2 ${borderColor} rounded-2xl py-4 pl-12 pr-12 font-bold text-sm outline-none focus:border-indigo-500 transition-all placeholder:opacity-30`}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-1 pt-1">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only" 
                  />
                  <div className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center ${rememberMe ? 'bg-indigo-500 border-indigo-500' : borderColor + ' bg-transparent'}`}>
                    {rememberMe && <CheckCircle2 size={14} className="text-white" />}
                  </div>
                </div>
                <span className="text-[11px] font-black uppercase tracking-wider text-zinc-500 group-hover:text-zinc-400 transition-colors">Remember device</span>
              </label>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-5 bg-[#FF4F01] hover:bg-[#E64601] text-white rounded-2xl font-black text-sm shadow-xl shadow-[#FF4F01]/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isLoginView ? 'SIGN IN' : 'CREATE ACCOUNT'} <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="mt-10 text-center text-xs font-bold text-zinc-500">
            {isLoginView ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={toggleView}
              className="font-black text-[#FF4F01] hover:underline uppercase tracking-widest ml-1"
            >
              {isLoginView ? 'Register' : 'Sign in'}
            </button>
          </p>

          <div className="mt-12 flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 opacity-40">
            <CheckCircle2 size={14} />
            <span>Encrypted & Secure</span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Auth;