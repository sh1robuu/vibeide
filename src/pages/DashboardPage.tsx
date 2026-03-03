import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
    Plus, FolderOpen, Clock, Code2, Sparkles, ArrowRight, Settings,
    LogOut, Globe, Zap, Rocket, LayoutDashboard, Trash2, Star,
    BookOpen, Terminal, Palette, Gamepad2
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { translations } from '../i18n/translations';
import { logout } from '../services/firebaseService';
import { cn } from '../utils/cn';

interface SavedProject {
    name: string;
    tags: string[];
    template: string;
    model: string;
    completedAt: string;
    lastOpened?: string;
}

export function DashboardPage() {
    const navigate = useNavigate();
    const {
        language, setLanguage, user, isAuthenticated,
        setIsAuthenticated, setUser, projectName
    } = useStore();
    const isVi = language === 'vi';

    const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
    const [greeting, setGreeting] = useState('');

    // Redirect if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    // Load saved projects from localStorage
    useEffect(() => {
        const projects: SavedProject[] = [];

        // Current onboarding project
        const onboarding = localStorage.getItem('vibecraft_onboarding');
        if (onboarding && onboarding !== 'skipped') {
            try {
                const data = JSON.parse(onboarding);
                projects.push({
                    ...data,
                    name: data.projectName || projectName || 'Untitled',
                    lastOpened: data.completedAt,
                });
            } catch { }
        }

        // Check for user-specific projects
        if (user?.uid) {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key?.startsWith(`vibecraft_project_${user.uid}_`)) {
                    try {
                        const data = JSON.parse(localStorage.getItem(key) || '');
                        projects.push(data);
                    } catch { }
                }
            }
        }

        setSavedProjects(projects);
    }, [user?.uid, projectName]);

    // Dynamic greeting
    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting(isVi ? 'Chào buổi sáng' : 'Good morning');
        else if (hour < 18) setGreeting(isVi ? 'Chào buổi chiều' : 'Good afternoon');
        else setGreeting(isVi ? 'Chào buổi tối' : 'Good evening');
    }, [isVi]);

    const handleLogout = async () => {
        await logout();
        setIsAuthenticated(false);
        setUser(null);
        navigate('/');
    };

    const handleNewProject = () => {
        navigate('/onboarding');
    };

    const handleOpenEditor = () => {
        navigate('/editor');
    };

    const handleDeleteProject = (idx: number) => {
        const updated = [...savedProjects];
        updated.splice(idx, 1);
        setSavedProjects(updated);
        // Clear from localStorage
        localStorage.removeItem('vibecraft_onboarding');
    };

    const displayName = user?.name || user?.email?.split('@')[0] || 'User';

    const quickTemplates = [
        { icon: <Code2 size={20} />, title: isVi ? 'Blank Project' : 'Blank Project', color: 'from-slate-500 to-slate-600', id: 'blank' },
        { icon: <Globe size={20} />, title: 'Landing Page', color: 'from-blue-500 to-cyan-500', id: 'landing' },
        { icon: <Palette size={20} />, title: 'Portfolio', color: 'from-pink-500 to-rose-500', id: 'portfolio' },
        { icon: <Gamepad2 size={20} />, title: isVi ? 'Mini Game' : 'Mini Game', color: 'from-purple-500 to-indigo-500', id: 'game' },
    ];

    const stats = [
        { label: isVi ? 'Dự án' : 'Projects', value: savedProjects.length, icon: <FolderOpen size={16} />, color: 'text-blue-400' },
        { label: isVi ? 'Giờ coding' : 'Coding Hours', value: Math.floor(Math.random() * 20 + 1), icon: <Clock size={16} />, color: 'text-emerald-400' },
        { label: isVi ? 'File đã tạo' : 'Files Created', value: Math.floor(Math.random() * 50 + 5), icon: <Code2 size={16} />, color: 'text-purple-400' },
        { label: isVi ? 'AI Prompts' : 'AI Prompts', value: Math.floor(Math.random() * 30 + 3), icon: <Sparkles size={16} />, color: 'text-amber-400' },
    ];

    const tips = isVi ? [
        '💡 Dùng Ctrl+S để lưu workspace nhanh',
        '🎯 Tab Mentor giúp bạn cải thiện prompt',
        '⚡ Chuyển model AI trong Settings',
        '🖥️ Mở Terminal để chạy npm commands',
    ] : [
        '💡 Use Ctrl+S to quickly save your workspace',
        '🎯 The Mentor tab helps improve your prompts',
        '⚡ Switch AI models in Settings',
        '🖥️ Open Terminal to run npm commands',
    ];

    const [tipIndex, setTipIndex] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => setTipIndex(i => (i + 1) % tips.length), 4000);
        return () => clearInterval(interval);
    }, [tips.length]);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[150px]" />
                <div className="absolute bottom-0 right-1/3 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[150px]" />
            </div>

            {/* Top bar */}
            <header className="relative z-10 border-b border-white/5 bg-white/[0.02] backdrop-blur-xl">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Sparkles size={16} className="text-white" />
                        </div>
                        <span className="text-lg font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">VibeCraft</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/5 text-xs text-white/50 hover:text-white transition-colors"
                        >
                            <Globe size={14} />
                            {language === 'en' ? 'EN' : 'VI'}
                        </button>
                        <button
                            onClick={() => navigate('/profile')}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 text-sm text-white/70 hover:text-white transition-colors"
                        >
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold">
                                {displayName.charAt(0).toUpperCase()}
                            </div>
                            <span className="hidden sm:inline">{displayName}</span>
                        </button>
                        <button
                            onClick={handleLogout}
                            className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                            title={isVi ? 'Đăng xuất' : 'Log out'}
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="relative z-10 max-w-6xl mx-auto px-6 py-10">
                {/* Greeting */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10"
                >
                    <h1 className="text-3xl font-bold mb-2">
                        {greeting}, <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">{displayName}</span>! 👋
                    </h1>
                    <p className="text-white/40 text-base">
                        {isVi ? 'Sẵn sàng tạo điều gì đó tuyệt vời hôm nay?' : 'Ready to build something awesome today?'}
                    </p>
                </motion.div>

                {/* Stats cards */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10"
                >
                    {stats.map((s, i) => (
                        <div key={i} className="bg-white/[0.03] border border-white/5 rounded-xl p-4 hover:bg-white/[0.05] transition-colors">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={s.color}>{s.icon}</span>
                                <span className="text-xs text-white/40 uppercase tracking-wider">{s.label}</span>
                            </div>
                            <div className="text-2xl font-bold text-white">{s.value}</div>
                        </div>
                    ))}
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Projects */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-2 space-y-4"
                    >
                        {/* Quick Actions */}
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <LayoutDashboard size={18} className="text-indigo-400" />
                                {isVi ? 'Bắt đầu nhanh' : 'Quick Start'}
                            </h2>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                            {quickTemplates.map((t, i) => (
                                <button
                                    key={i}
                                    onClick={handleNewProject}
                                    className="group flex flex-col items-center gap-3 p-5 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all hover:-translate-y-0.5"
                                >
                                    <div className={cn("w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-white shadow-lg", t.color)}>
                                        {t.icon}
                                    </div>
                                    <span className="text-xs text-white/60 group-hover:text-white transition-colors">{t.title}</span>
                                </button>
                            ))}
                        </div>

                        {/* Recent Projects */}
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Clock size={18} className="text-emerald-400" />
                                {isVi ? 'Dự án gần đây' : 'Recent Projects'}
                            </h2>
                            <button
                                onClick={handleNewProject}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-medium hover:bg-indigo-500/20 transition-colors"
                            >
                                <Plus size={12} />
                                {isVi ? 'Tạo mới' : 'New'}
                            </button>
                        </div>

                        {savedProjects.length === 0 ? (
                            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-8 text-center">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center">
                                    <Rocket size={28} className="text-indigo-400/50" />
                                </div>
                                <p className="text-white/40 mb-4 text-sm">
                                    {isVi ? 'Bạn chưa có dự án nào. Tạo dự án đầu tiên!' : 'No projects yet. Create your first one!'}
                                </p>
                                <button
                                    onClick={handleNewProject}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium hover:shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-0.5 transition-all"
                                >
                                    <Plus size={16} />
                                    {isVi ? 'Tạo dự án mới' : 'Create New Project'}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {savedProjects.map((p, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all cursor-pointer group"
                                        onClick={handleOpenEditor}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/20">
                                                <FolderOpen size={18} className="text-indigo-400" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-white/90 text-sm group-hover:text-white flex items-center gap-2">
                                                    {p.name}
                                                    {i === 0 && <Star size={12} className="text-amber-400" />}
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    {p.tags?.slice(0, 3).map((tag) => (
                                                        <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/30 border border-white/5">{tag}</span>
                                                    ))}
                                                    <span className="text-[10px] text-white/20">
                                                        {p.template} • {p.model}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-white/20 hidden md:block">
                                                {p.completedAt ? new Date(p.completedAt).toLocaleDateString() : ''}
                                            </span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteProject(i); }}
                                                className="p-1.5 rounded-md text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                            <ArrowRight size={14} className="text-white/20 group-hover:text-indigo-400 transition-colors" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    {/* Right: Sidebar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="space-y-4"
                    >
                        {/* Continue editing */}
                        <button
                            onClick={handleOpenEditor}
                            className="w-full flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 hover:border-indigo-500/40 transition-all group"
                        >
                            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/30 transition-colors">
                                <Code2 size={18} className="text-indigo-400" />
                            </div>
                            <div className="text-left flex-1">
                                <div className="text-sm font-medium text-white">{isVi ? 'Tiếp tục coding' : 'Continue Coding'}</div>
                                <div className="text-[11px] text-white/40">{projectName || 'Current project'}</div>
                            </div>
                            <ArrowRight size={16} className="text-indigo-400/50 group-hover:text-indigo-400 transition-colors" />
                        </button>

                        {/* Tips */}
                        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <BookOpen size={14} className="text-amber-400" />
                                <span className="text-xs font-medium text-white/60 uppercase tracking-wider">
                                    {isVi ? 'Mẹo hữu ích' : 'Pro Tips'}
                                </span>
                            </div>
                            <motion.p
                                key={tipIndex}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-sm text-white/50 leading-relaxed"
                            >
                                {tips[tipIndex]}
                            </motion.p>
                        </div>

                        {/* Quick links */}
                        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 space-y-1">
                            <div className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
                                {isVi ? 'Liên kết nhanh' : 'Quick Links'}
                            </div>
                            {[
                                { icon: <Terminal size={14} />, label: isVi ? 'Mở Terminal' : 'Open Terminal', action: handleOpenEditor },
                                { icon: <Settings size={14} />, label: isVi ? 'Cài đặt' : 'Settings', action: () => navigate('/profile') },
                                { icon: <Sparkles size={14} />, label: isVi ? 'AI Mentor' : 'AI Mentor', action: handleOpenEditor },
                                { icon: <Zap size={14} />, label: isVi ? 'Phản hồi' : 'Feedback', action: () => navigate('/feedback') },
                            ].map((link, i) => (
                                <button
                                    key={i}
                                    onClick={link.action}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                                >
                                    {link.icon}
                                    {link.label}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
