import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Sparkles, Mail, Lock, User, ArrowRight, Github, Globe, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import { translations } from '../i18n/translations';
import { loginWithEmail, registerWithEmail, loginWithGoogle } from '../services/firebaseService';

export function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage } = useStore();
  const t = translations[language].auth;
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('mode') === 'signup') {
      setIsLogin(false);
    }
  }, [location]);

  // Auto-dismiss error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Custom validation
    if (!isLogin && !name.trim()) {
      setError(language === 'en' ? 'Please enter your name.' : 'Vui lòng nhập tên của bạn.');
      return;
    }
    if (!email.trim()) {
      setError(language === 'en' ? 'Please enter your email.' : 'Vui lòng nhập email của bạn.');
      return;
    }
    if (!password.trim()) {
      setError(language === 'en' ? 'Please enter your password.' : 'Vui lòng nhập mật khẩu của bạn.');
      return;
    }

    setIsLoading(true);
    
    try {
      if (isLogin) {
        await loginWithEmail(email, password, rememberMe);
      } else {
        await registerWithEmail(email, password, name, rememberMe);
      }
      
      const searchParams = new URLSearchParams(location.search);
      const redirect = searchParams.get('redirect') || 'editor';
      navigate(`/${redirect}`);
    } catch (err: any) {
      console.error(err);
      
      let errorMessage = language === 'en' ? 'Authentication failed.' : 'Xác thực thất bại.';
      
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
         errorMessage = language === 'en' 
           ? 'This email is not linked to any account. Please sign up.' 
           : 'Email này chưa liên kết với tài khoản nào, vui lòng đăng ký.';
      } else if (err.code === 'auth/wrong-password') {
         errorMessage = language === 'en' 
           ? 'Incorrect password.' 
           : 'Sai mật khẩu.';
      } else if (err.code === 'auth/email-already-in-use') {
         errorMessage = language === 'en'
           ? 'This email is already registered. Please log in.'
           : 'Email này đã được đăng ký. Vui lòng đăng nhập.';
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await loginWithGoogle(rememberMe);
      const searchParams = new URLSearchParams(location.search);
      const redirect = searchParams.get('redirect') || 'editor';
      navigate(`/${redirect}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || (language === 'en' ? 'Google login failed.' : 'Đăng nhập Google thất bại.'));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'vi' : 'en');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white font-sans selection:bg-indigo-500/30 p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-900/20 blur-[120px] mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-20 mix-blend-overlay" />
      </div>

      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.4)]">
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">VibeCraft</span>
        </Link>

        <button 
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium border border-white/10"
        >
          <Globe size={14} />
          {language === 'en' ? 'EN' : 'VI'}
        </button>
      </div>

      {/* Toast Notification */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100]">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#1e1e1e] border border-red-500/30 shadow-[0_10px_40px_rgba(239,68,68,0.2)] text-red-400 text-sm font-medium min-w-[300px]"
            >
              <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                <AlertCircle size={16} />
              </div>
              <p className="flex-1">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="p-1.5 hover:bg-white/5 rounded-md transition-colors shrink-0"
              >
                <X size={14} className="text-white/50 hover:text-white" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-[#181818] border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10 backdrop-blur-xl mt-12"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold tracking-tight mb-2">
            {isLogin ? t.welcomeBack : t.createAccount}
          </h2>
          <p className="text-white/50 text-sm">
            {isLogin ? t.loginDesc : t.signupDesc}
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/70 uppercase tracking-wider ml-1">{t.name}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(null); }}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                  placeholder={t.namePlaceholder}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/70 uppercase tracking-wider ml-1">{t.email}</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40">
                <Mail size={18} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                placeholder={t.emailPlaceholder}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between ml-1">
              <label className="text-xs font-medium text-white/70 uppercase tracking-wider">{t.password}</label>
              {isLogin && (
                <a href="#" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                  {t.forgotPassword}
                </a>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40">
                <Lock size={18} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 ml-1 mt-4">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-black/40 text-indigo-500 focus:ring-indigo-500/50 focus:ring-offset-0 transition-colors cursor-pointer"
            />
            <label htmlFor="rememberMe" className="text-sm text-white/70 cursor-pointer select-none">
              {language === 'en' ? 'Keep me signed in' : 'Duy trì đăng nhập'}
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] flex items-center justify-center gap-2 mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {isLogin ? t.signIn : t.createAccountBtn}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#181818] px-2 text-white/40 uppercase tracking-wider">{t.orContinueWith}</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 py-2.5 border border-white/10 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium text-white/80">
              <Github size={18} />
              GitHub
            </button>
            <button 
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 py-2.5 border border-white/10 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium text-white/80 disabled:opacity-50"
            >
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-white/50">
          {isLogin ? t.noAccount : t.hasAccount}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            {isLogin ? t.signUpLink : t.logInLink}
          </button>
        </p>
      </motion.div>
    </div>
  );
}


