import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, User, Image as ImageIcon, Save, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { updateUserProfile } from '../services/firebaseService';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, setUser, language } = useStore();
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setAvatarUrl(user.avatar || '');
    } else {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setToast({
        message: language === 'en' ? 'Name cannot be empty.' : 'Tên không được để trống.',
        type: 'error'
      });
      return;
    }

    setIsLoading(true);
    try {
      await updateUserProfile(name, avatarUrl);
      if (user) {
        setUser({ ...user, name, avatar: avatarUrl });
      }
      setToast({
        message: language === 'en' ? 'Profile updated successfully!' : 'Cập nhật hồ sơ thành công!',
        type: 'success'
      });
    } catch (error: any) {
      setToast({
        message: language === 'en' ? `Failed to update profile: ${error.message}` : `Lỗi cập nhật hồ sơ: ${error.message}`,
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans p-4 md:p-8">
      {/* Toast Notification */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100]">
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl text-sm font-medium min-w-[300px] ${
                toast.type === 'success' 
                  ? "bg-[#1e1e1e] border-emerald-500/30 text-emerald-400 shadow-[0_10px_40px_rgba(16,185,129,0.2)]"
                  : "bg-[#1e1e1e] border-red-500/30 text-red-400 shadow-[0_10px_40px_rgba(239,68,68,0.2)]"
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                toast.type === 'success' ? "bg-emerald-500/10" : "bg-red-500/10"
              }`}>
                {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              </div>
              <p className="flex-1">{toast.message}</p>
              <button 
                onClick={() => setToast(null)}
                className="p-1.5 hover:bg-white/5 rounded-md transition-colors shrink-0"
              >
                <X size={14} className="text-white/50 hover:text-white" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="max-w-2xl mx-auto">
        <button 
          onClick={() => navigate('/editor')}
          className="flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          {language === 'en' ? 'Back to Editor' : 'Quay lại Editor'}
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#181818] border border-white/10 rounded-3xl p-8 shadow-2xl"
        >
          <h1 className="text-2xl font-bold mb-6">
            {language === 'en' ? 'Edit Profile' : 'Chỉnh sửa hồ sơ'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={40} className="text-white/20" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-white/50 mb-2">
                  {language === 'en' ? 'Profile Picture' : 'Ảnh đại diện'}
                </p>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40">
                    <ImageIcon size={16} />
                  </div>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder={language === 'en' ? 'Enter image URL...' : 'Nhập URL hình ảnh...'}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/70 uppercase tracking-wider ml-1">
                {language === 'en' ? 'Display Name' : 'Tên hiển thị'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/70 uppercase tracking-wider ml-1">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-sm text-white/50 cursor-not-allowed"
              />
              <p className="text-xs text-white/40 ml-1 mt-1">
                {language === 'en' ? 'Email cannot be changed.' : 'Không thể thay đổi email.'}
              </p>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={18} />
                    {language === 'en' ? 'Save Changes' : 'Lưu thay đổi'}
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
