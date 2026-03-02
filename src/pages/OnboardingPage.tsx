import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
    Rocket, Sparkles, Code2, Palette, Zap, ArrowRight, ArrowLeft,
    Check, FolderOpen, Tag, Wand2, Monitor, Brain
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../utils/cn';

const PROJECT_TEMPLATES = [
    { id: 'blank', icon: '📄', title: 'Blank Project', titleVi: 'Dự án trống', desc: 'Start from scratch with an empty canvas', descVi: 'Bắt đầu từ đầu với canvas trống', files: { 'index.html': '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>My Project</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  \n  <script src="script.js"></script>\n</body>\n</html>', 'style.css': '/* Your styles here */\n* {\n  margin: 0;\n  padding: 0;\n  box-sizing: border-box;\n}\n\nbody {\n  font-family: system-ui, sans-serif;\n  min-height: 100vh;\n}\n', 'script.js': '// Your JavaScript here\nconsole.log("Hello World! 🚀");\n' } },
    { id: 'landing', icon: '🌐', title: 'Landing Page', titleVi: 'Trang Landing', desc: 'A modern hero section with CTA button', descVi: 'Hero section hiện đại với nút CTA', files: { 'index.html': '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>My Landing Page</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <header>\n    <nav>\n      <div class="logo">MyBrand</div>\n      <ul>\n        <li><a href="#features">Features</a></li>\n        <li><a href="#about">About</a></li>\n        <li><a href="#contact">Contact</a></li>\n      </ul>\n    </nav>\n  </header>\n  <main>\n    <section class="hero">\n      <h1>Welcome to MyBrand</h1>\n      <p>Build something amazing today.</p>\n      <button class="cta-btn">Get Started</button>\n    </section>\n  </main>\n  <script src="script.js"></script>\n</body>\n</html>', 'style.css': '* { margin: 0; padding: 0; box-sizing: border-box; }\nbody { font-family: system-ui, sans-serif; background: #0a0a0a; color: white; }\nnav { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem 3rem; }\n.logo { font-size: 1.5rem; font-weight: 700; background: linear-gradient(135deg, #6366f1, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }\nnav ul { display: flex; list-style: none; gap: 2rem; }\nnav a { color: rgba(255,255,255,0.7); text-decoration: none; transition: color 0.2s; }\nnav a:hover { color: white; }\n.hero { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 80vh; text-align: center; gap: 1.5rem; }\n.hero h1 { font-size: 3.5rem; font-weight: 800; background: linear-gradient(135deg, #fff, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }\n.hero p { font-size: 1.2rem; color: rgba(255,255,255,0.6); max-width: 500px; }\n.cta-btn { padding: 0.8rem 2.5rem; background: linear-gradient(135deg, #6366f1, #a855f7); color: white; border: none; border-radius: 12px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }\n.cta-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(99,102,241,0.4); }\n', 'script.js': 'document.querySelector(".cta-btn").addEventListener("click", () => {\n  alert("Welcome aboard! 🚀");\n});\n' } },
    { id: 'portfolio', icon: '💼', title: 'Portfolio', titleVi: 'Portfolio cá nhân', desc: 'Showcase your work with a clean design', descVi: 'Giới thiệu bản thân với thiết kế sạch sẽ', files: { 'index.html': '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>My Portfolio</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <div class="container">\n    <div class="profile">\n      <div class="avatar">👤</div>\n      <h1>Your Name</h1>\n      <p class="bio">Student Developer | Creative Coder</p>\n    </div>\n    <div class="projects">\n      <h2>My Projects</h2>\n      <div class="grid">\n        <div class="card">Project 1</div>\n        <div class="card">Project 2</div>\n        <div class="card">Project 3</div>\n      </div>\n    </div>\n  </div>\n  <script src="script.js"></script>\n</body>\n</html>', 'style.css': '* { margin: 0; padding: 0; box-sizing: border-box; }\nbody { font-family: system-ui, sans-serif; background: #0f0f0f; color: white; min-height: 100vh; display: flex; justify-content: center; padding: 3rem 1rem; }\n.container { max-width: 700px; width: 100%; }\n.profile { text-align: center; margin-bottom: 3rem; }\n.avatar { font-size: 4rem; margin-bottom: 1rem; }\nh1 { font-size: 2rem; margin-bottom: 0.5rem; }\n.bio { color: rgba(255,255,255,0.5); }\nh2 { margin-bottom: 1.5rem; font-size: 1.3rem; color: rgba(255,255,255,0.8); }\n.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }\n.card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 2rem; text-align: center; transition: transform 0.2s, border-color 0.2s; cursor: pointer; }\n.card:hover { transform: translateY(-4px); border-color: rgba(99,102,241,0.5); }\n', 'script.js': 'document.querySelectorAll(".card").forEach(card => {\n  card.addEventListener("click", () => {\n    card.style.background = "rgba(99,102,241,0.15)";\n  });\n});\n' } },
    { id: 'game', icon: '🎮', title: 'Mini Game', titleVi: 'Game đơn giản', desc: 'A simple interactive canvas game', descVi: 'Game canvas đơn giản và tương tác', files: { 'index.html': '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Mini Game</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <h1>🎮 Click the Circle!</h1>\n  <p>Score: <span id="score">0</span></p>\n  <canvas id="gameCanvas" width="400" height="400"></canvas>\n  <script src="script.js"></script>\n</body>\n</html>', 'style.css': '* { margin: 0; padding: 0; box-sizing: border-box; }\nbody { font-family: system-ui, sans-serif; background: #0a0a0a; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; gap: 1rem; }\nh1 { font-size: 1.5rem; }\ncanvas { background: #1a1a2e; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); cursor: crosshair; }\n', 'script.js': 'const canvas = document.getElementById("gameCanvas");\nconst ctx = canvas.getContext("2d");\nlet score = 0;\nlet circle = { x: 200, y: 200, r: 25 };\n\nfunction draw() {\n  ctx.clearRect(0, 0, 400, 400);\n  ctx.beginPath();\n  ctx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2);\n  ctx.fillStyle = "#6366f1";\n  ctx.fill();\n  ctx.shadowBlur = 20;\n  ctx.shadowColor = "#6366f1";\n}\n\nfunction moveCircle() {\n  circle.x = Math.random() * 350 + 25;\n  circle.y = Math.random() * 350 + 25;\n}\n\ncanvas.addEventListener("click", (e) => {\n  const rect = canvas.getBoundingClientRect();\n  const x = e.clientX - rect.left;\n  const y = e.clientY - rect.top;\n  const dist = Math.sqrt((x - circle.x)**2 + (y - circle.y)**2);\n  if (dist < circle.r) {\n    score++;\n    document.getElementById("score").textContent = score;\n    moveCircle();\n  }\n  draw();\n});\n\ndraw();\n' } }
];

const TAG_OPTIONS = [
    { id: 'web', label: 'Web', labelVi: 'Web', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    { id: 'game', label: 'Game', labelVi: 'Game', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    { id: 'art', label: 'Creative', labelVi: 'Sáng tạo', color: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
    { id: 'school', label: 'School', labelVi: 'Bài tập', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    { id: 'portfolio', label: 'Portfolio', labelVi: 'Portfolio', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    { id: 'experiment', label: 'Experiment', labelVi: 'Thí nghiệm', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
];

const AI_MODELS = [
    { id: 'Gemini 3 Flash', icon: '⚡', label: 'Gemini 3 Flash', desc: 'Fast & free — great for quick coding', descVi: 'Nhanh & miễn phí — phù hợp code nhanh', provider: 'Google' },
    { id: 'GPT-OSS 120B', icon: '🧠', label: 'GPT-OSS 120B', desc: 'Powerful for complex tasks', descVi: 'Mạnh mẽ cho tác vụ phức tạp', provider: 'Ollama' },
    { id: 'Qwen 3 Coder', icon: '🔧', label: 'Qwen 3 Coder', desc: 'Optimized for code generation', descVi: 'Tối ưu cho sinh code', provider: 'Ollama' },
];

export function OnboardingPage() {
    const navigate = useNavigate();
    const { language, user, updateFile, setOpenFiles, setActiveFile, setPendingModel, setProjectName } = useStore();
    const isVi = language === 'vi';

    const [step, setStep] = useState(0);
    const [localProjectName, setLocalProjectName] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState('blank');
    const [selectedModel, setSelectedModel] = useState('Gemini 3 Flash');

    const totalSteps = 5;

    const toggleTag = (id: string) => {
        setSelectedTags(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
    };

    const handleFinish = () => {
        // Apply template files
        const template = PROJECT_TEMPLATES.find(t => t.id === selectedTemplate);
        if (template) {
            const fileNames = Object.keys(template.files);
            Object.entries(template.files).forEach(([name, content]) => {
                updateFile(name, content);
            });
            setOpenFiles(fileNames);
            setActiveFile(fileNames[0]);
        }

        // Set project name in global store
        if (localProjectName.trim()) {
            setProjectName(localProjectName.trim());
        }

        // Set preferred model
        setPendingModel(selectedModel);

        // Save onboarding data
        const onboardingData = { projectName: localProjectName, tags: selectedTags, template: selectedTemplate, model: selectedModel, completedAt: new Date().toISOString() };
        localStorage.setItem('vibecraft_onboarding', JSON.stringify(onboardingData));
        if (user?.uid) {
            localStorage.setItem(`vibecraft_onboarding_${user.uid}`, JSON.stringify(onboardingData));
        }

        navigate('/editor');
    };

    const canProceed = () => {
        if (step === 1) return localProjectName.trim().length > 0;
        return true;
    };

    const steps = [
        // Step 0: Welcome
        () => (
            <div className="flex flex-col items-center text-center space-y-8 max-w-lg">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }} className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
                    <Rocket size={36} className="text-white" />
                </motion.div>
                <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-4xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                    {isVi ? 'Chào mừng đến VibeCraft!' : 'Welcome to VibeCraft!'}
                </motion.h1>
                <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-white/50 text-lg leading-relaxed">
                    {isVi
                        ? 'Hãy thiết lập dự án đầu tiên của bạn. Chỉ mất vài bước đơn giản! 🚀'
                        : 'Let\'s set up your first project. It only takes a few simple steps! 🚀'}
                </motion.p>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex items-center gap-3 text-sm text-white/30">
                    <Sparkles size={14} /> {isVi ? 'Được hỗ trợ bởi AI' : 'Powered by AI'}
                </motion.div>
            </div>
        ),

        // Step 1: Project Setup
        () => (
            <div className="space-y-8 max-w-lg w-full">
                <div className="text-center space-y-2">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4">
                        <FolderOpen size={24} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">{isVi ? 'Đặt tên dự án' : 'Name Your Project'}</h2>
                    <p className="text-white/50 text-sm">{isVi ? 'Chọn một cái tên thật cool cho project của bạn' : 'Choose a cool name for your project'}</p>
                </div>
                <input
                    autoFocus
                    type="text"
                    value={localProjectName}
                    onChange={e => setLocalProjectName(e.target.value)}
                    placeholder={isVi ? 'Ví dụ: My Awesome Website...' : 'e.g. My Awesome Website...'}
                    className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white text-base placeholder:text-white/25 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
                <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm text-white/50">
                        <Tag size={14} /> {isVi ? 'Gắn tag cho project (tùy chọn)' : 'Tag your project (optional)'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {TAG_OPTIONS.map(tag => (
                            <button
                                key={tag.id}
                                onClick={() => toggleTag(tag.id)}
                                className={cn(
                                    "px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all",
                                    selectedTags.includes(tag.id)
                                        ? `${tag.color} ring-1 ring-white/20`
                                        : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10"
                                )}
                            >
                                {isVi ? tag.labelVi : tag.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        ),

        // Step 2: Choose Template
        () => (
            <div className="space-y-6 max-w-2xl w-full">
                <div className="text-center space-y-2">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
                        <Code2 size={24} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">{isVi ? 'Chọn template' : 'Choose a Template'}</h2>
                    <p className="text-white/50 text-sm">{isVi ? 'Bắt đầu với một template có sẵn hoặc dự án trống' : 'Start with a pre-built template or blank project'}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {PROJECT_TEMPLATES.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setSelectedTemplate(t.id)}
                            className={cn(
                                "flex flex-col items-start gap-2 p-4 rounded-xl border transition-all text-left",
                                selectedTemplate === t.id
                                    ? "bg-indigo-500/15 border-indigo-500/40 ring-1 ring-indigo-500/30"
                                    : "bg-white/5 border-white/10 hover:bg-white/10"
                            )}
                        >
                            <div className="flex items-center gap-3 w-full">
                                <span className="text-2xl">{t.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-white text-sm">{isVi ? t.titleVi : t.title}</div>
                                    <div className="text-xs text-white/40 truncate">{isVi ? t.descVi : t.desc}</div>
                                </div>
                                {selectedTemplate === t.id && <Check size={16} className="text-indigo-400 shrink-0" />}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        ),

        // Step 3: Choose AI Model
        () => (
            <div className="space-y-6 max-w-lg w-full">
                <div className="text-center space-y-2">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-4">
                        <Brain size={24} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">{isVi ? 'Chọn AI Model' : 'Choose Your AI'}</h2>
                    <p className="text-white/50 text-sm">{isVi ? 'Bạn có thể thay đổi sau trong Settings' : 'You can always change this later in Settings'}</p>
                </div>
                <div className="space-y-3">
                    {AI_MODELS.map(m => (
                        <button
                            key={m.id}
                            onClick={() => setSelectedModel(m.id)}
                            className={cn(
                                "w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left",
                                selectedModel === m.id
                                    ? "bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/30"
                                    : "bg-white/5 border-white/10 hover:bg-white/10"
                            )}
                        >
                            <span className="text-2xl">{m.icon}</span>
                            <div className="flex-1">
                                <div className="font-medium text-white text-sm">{m.label}</div>
                                <div className="text-xs text-white/40">{isVi ? m.descVi : m.desc}</div>
                            </div>
                            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-white/40 border border-white/10">{m.provider}</span>
                            {selectedModel === m.id && <Check size={16} className="text-emerald-400 shrink-0" />}
                        </button>
                    ))}
                </div>
            </div>
        ),

        // Step 4: Ready!
        () => (
            <div className="flex flex-col items-center text-center space-y-6 max-w-lg">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }} className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-400 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                    <Zap size={36} className="text-white" />
                </motion.div>
                <h2 className="text-3xl font-bold text-white">{isVi ? 'Tất cả đã sẵn sàng!' : 'All Set!'}</h2>
                <p className="text-white/50 text-base">{isVi ? 'Dự án của bạn đã được thiết lập. Bắt đầu coding nào!' : 'Your project is configured. Let\'s start coding!'}</p>

                <div className="w-full bg-white/5 border border-white/10 rounded-xl p-4 space-y-3 text-left">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-white/50">{isVi ? 'Tên dự án' : 'Project'}</span>
                        <span className="text-white font-medium">{localProjectName || 'Untitled'}</span>
                    </div>
                    <div className="h-px bg-white/5" />
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-white/50">Template</span>
                        <span className="text-white font-medium">{PROJECT_TEMPLATES.find(t => t.id === selectedTemplate)?.icon} {isVi ? PROJECT_TEMPLATES.find(t => t.id === selectedTemplate)?.titleVi : PROJECT_TEMPLATES.find(t => t.id === selectedTemplate)?.title}</span>
                    </div>
                    <div className="h-px bg-white/5" />
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-white/50">AI Model</span>
                        <span className="text-white font-medium">{AI_MODELS.find(m => m.id === selectedModel)?.icon} {selectedModel}</span>
                    </div>
                    {selectedTags.length > 0 && (
                        <>
                            <div className="h-px bg-white/5" />
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-white/50">Tags</span>
                                <div className="flex gap-1">
                                    {selectedTags.map(t => {
                                        const tag = TAG_OPTIONS.find(o => o.id === t);
                                        return <span key={t} className={cn("text-[10px] px-2 py-0.5 rounded-full border", tag?.color)}>{isVi ? tag?.labelVi : tag?.label}</span>;
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        ),
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px]" />
            </div>

            {/* Progress bar */}
            <div className="fixed top-0 left-0 right-0 h-1 bg-white/5 z-50">
                <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                    animate={{ width: `${((step + 1) / totalSteps) * 100}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                />
            </div>

            {/* Step indicator */}
            <div className="fixed top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-50">
                {Array.from({ length: totalSteps }).map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            "w-2 h-2 rounded-full transition-all duration-300",
                            i === step ? "w-8 bg-indigo-500" : i < step ? "bg-indigo-500/60" : "bg-white/15"
                        )}
                    />
                ))}
            </div>

            {/* Skip button */}
            <button
                onClick={() => { localStorage.setItem('vibecraft_onboarding', 'skipped'); navigate('/editor'); }}
                className="fixed top-6 right-6 text-xs text-white/30 hover:text-white/60 transition-colors z-50"
            >
                {isVi ? 'Bỏ qua →' : 'Skip →'}
            </button>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center min-h-[400px] justify-center w-full max-w-2xl">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40 }}
                        transition={{ duration: 0.25 }}
                        className="flex justify-center w-full"
                    >
                        {steps[step]()}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="relative z-10 flex items-center gap-4 mt-12">
                {step > 0 && (
                    <button
                        onClick={() => setStep(s => s - 1)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors border border-white/10"
                    >
                        <ArrowLeft size={16} />
                        {isVi ? 'Quay lại' : 'Back'}
                    </button>
                )}
                {step < totalSteps - 1 ? (
                    <button
                        onClick={() => setStep(s => s + 1)}
                        disabled={!canProceed()}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all",
                            canProceed()
                                ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-0.5"
                                : "bg-white/5 text-white/30 cursor-not-allowed"
                        )}
                    >
                        {step === 0 ? (isVi ? 'Bắt đầu' : 'Get Started') : (isVi ? 'Tiếp tục' : 'Continue')}
                        <ArrowRight size={16} />
                    </button>
                ) : (
                    <button
                        onClick={handleFinish}
                        className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-green-400 text-white hover:shadow-lg hover:shadow-emerald-500/20 hover:-translate-y-0.5 transition-all"
                    >
                        <Wand2 size={16} />
                        {isVi ? 'Bắt đầu coding!' : 'Start Coding!'}
                    </button>
                )}
            </div>

            {/* Step counter */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 text-xs text-white/20 font-mono z-50">
                {step + 1} / {totalSteps}
            </div>
        </div>
    );
}
