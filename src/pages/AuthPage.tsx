import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Sparkles, Mail, Lock, User, ArrowRight, Globe, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import { translations } from '../i18n/translations';
import { loginWithEmail, registerWithEmail } from '../services/firebaseService';

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
      const redirect = searchParams.get('redirect');

      if (redirect) {
        // Explicit redirect from LandingPage "Try Now"
        navigate(`/${redirect}`);
      } else if (!isLogin && !localStorage.getItem('vibecraft_onboarding')) {
        // New signup without onboarding — send to walkthrough
        navigate('/onboarding');
      } else {
        navigate('/editor');
      }
    } catch (err: any) {
      console.error(err);

      const code = err.code || '';
      let errorMessage: string;

      switch (code) {
        case 'auth/weak-password':
          errorMessage = language === 'en'
            ? 'Password is too weak. It must be at least 6 characters.'
            : 'Mật khẩu quá yếu. Mật khẩu phải có ít nhất 6 ký tự.';
          break;
        case 'auth/invalid-email':
          errorMessage = language === 'en'
            ? 'Invalid email address format.'
            : 'Định dạng email không hợp lệ.';
          break;
        case 'auth/email-already-in-use':
          errorMessage = language === 'en'
            ? 'This email is already registered. Please log in instead.'
            : 'Email này đã được đăng ký. Vui lòng đăng nhập.';
          break;
        case 'auth/user-not-found':
        case 'auth/invalid-credential':
          errorMessage = language === 'en'
            ? 'Email or password is incorrect. Please try again or sign up.'
            : 'Email hoặc mật khẩu không đúng. Vui lòng thử lại hoặc đăng ký.';
          break;
        case 'auth/wrong-password':
          errorMessage = language === 'en'
            ? 'Incorrect password. Please try again.'
            : 'Sai mật khẩu. Vui lòng thử lại.';
          break;
        case 'auth/too-many-requests':
          errorMessage = language === 'en'
            ? 'Too many failed attempts. Please try again later.'
            : 'Quá nhiều lần thử. Vui lòng thử lại sau.';
          break;
        case 'auth/network-request-failed':
          errorMessage = language === 'en'
            ? 'Network error. Please check your internet connection.'
            : 'Lỗi mạng. Vui lòng kiểm tra kết nối internet.';
          break;
        case 'auth/user-disabled':
          errorMessage = language === 'en'
            ? 'This account has been disabled. Contact support for help.'
            : 'Tài khoản này đã bị vô hiệu hóa. Liên hệ hỗ trợ để được giúp đỡ.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = language === 'en'
            ? 'This sign-in method is not enabled. Contact support.'
            : 'Phương thức đăng nhập này chưa được kích hoạt.';
          break;
        default:
          errorMessage = language === 'en'
            ? `Authentication failed: ${err.message || 'Unknown error'}`
            : `Xác thực thất bại: ${err.message || 'Lỗi không xác định'}`;
      }

      setError(errorMessage);
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


