import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, MessageSquare, Send, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { submitFeedback } from '../services/firebaseService';

export function FeedbackPage() {
  const navigate = useNavigate();
  const { user, language } = useStore();
  const [type, setType] = useState('bug');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setToast({
        message: language === 'en' ? 'Feedback message cannot be empty.' : 'Nội dung phản hồi không được để trống.',
        type: 'error'
      });
      return;
    }

    setIsLoading(true);
    try {
      await submitFeedback(
        user?.uid,
        user?.name || 'Anonymous',
        user?.email || 'No email',
        type,
        message
      );
      setToast({
        message: language === 'en' ? 'Thank you for your feedback!' : 'Cảm ơn bạn đã gửi phản hồi!',
        type: 'success'
      });
      setMessage('');
    } catch (error: any) {
      setToast({
        message: language === 'en' ? `Failed to submit feedback: ${error.message}` : `Lỗi gửi phản hồi: ${error.message}`,
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
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <MessageSquare size={20} className="text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold">
              {language === 'en' ? 'Send Feedback' : 'Gửi phản hồi'}
            </h1>
          </div>

          <p className="text-white/50 text-sm mb-8">
            {language === 'en' 
              ? 'We value your feedback! Let us know if you found a bug, have a feature request, or just want to share your thoughts.' 
              : 'Chúng tôi rất trân trọng phản hồi của bạn! Hãy cho chúng tôi biết nếu bạn tìm thấy lỗi, có yêu cầu tính năng, hoặc chỉ muốn chia sẻ suy nghĩ của bạn.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/70 uppercase tracking-wider ml-1">
                {language === 'en' ? 'Feedback Type' : 'Loại phản hồi'}
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all appearance-none"
              >
                <option value="bug">{language === 'en' ? 'Bug Report' : 'Báo cáo lỗi'}</option>
                <option value="feature">{language === 'en' ? 'Feature Request' : 'Yêu cầu tính năng'}</option>
                <option value="general">{language === 'en' ? 'General Feedback' : 'Phản hồi chung'}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/70 uppercase tracking-wider ml-1">
                {language === 'en' ? 'Message' : 'Nội dung'}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                placeholder={language === 'en' ? 'Tell us more...' : 'Hãy cho chúng tôi biết thêm...'}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all resize-none"
              />
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
                    <Send size={18} />
                    {language === 'en' ? 'Submit Feedback' : 'Gửi phản hồi'}
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
