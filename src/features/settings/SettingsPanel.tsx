import { X, Monitor, Type, Keyboard, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore, EditorTheme, Keybinding } from '../../store/useStore';
import { cn } from '../../utils/cn';
import { translations } from '../../i18n/translations';

export function SettingsPanel() {
  const { isSettingsOpen, setSettingsOpen, settings, updateSettings, language } = useStore();
  const t = translations[language].ide.settings;

  if (!isSettingsOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSettingsOpen(false)}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-[#1e1e1e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
            <h2 className="text-lg font-semibold text-white">{t.title}</h2>
            <button
              onClick={() => setSettingsOpen(false)}
              className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            
            {/* Theme */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-white/80 font-medium">
                <Monitor size={18} className="text-indigo-400" />
                <h3>{t.theme}</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(['vs-dark', 'hc-black', 'vs'] as EditorTheme[]).map((theme) => (
                  <button
                    key={theme}
                    onClick={() => updateSettings({ theme })}
                    className={cn(
                      "px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left",
                      settings.theme === theme
                        ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300"
                        : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {theme === 'vs-dark' ? t.themes.dark : theme === 'hc-black' ? t.themes.highContrast : t.themes.light}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-white/80 font-medium">
                <Type size={18} className="text-emerald-400" />
                <h3>{t.fontSize}</h3>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="10"
                  max="24"
                  step="1"
                  value={settings.fontSize}
                  onChange={(e) => updateSettings({ fontSize: parseInt(e.target.value) })}
                  className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="w-12 text-center bg-white/5 border border-white/10 rounded-lg py-1 text-sm text-white/80">
                  {settings.fontSize}px
                </div>
              </div>
            </div>

            {/* Keybindings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-white/80 font-medium">
                <Keyboard size={18} className="text-amber-400" />
                <h3>{t.keybindings}</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(['standard', 'vim', 'emacs'] as Keybinding[]).map((kb) => (
                  <button
                    key={kb}
                    onClick={() => updateSettings({ keybinding: kb })}
                    className={cn(
                      "px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left capitalize",
                      settings.keybinding === kb
                        ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                        : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {kb}
                  </button>
                ))}
              </div>
            </div>

            {/* Prettier Integration */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-white/80 font-medium">
                <Wand2 size={18} className="text-pink-400" />
                <h3>{t.formatting}</h3>
              </div>
              <label className="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.formatOnSave}
                    onChange={(e) => updateSettings({ formatOnSave: e.target.checked })}
                    className="peer sr-only"
                  />
                  <div className="w-10 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white/90">{t.formatOnSave}</span>
                  <span className="text-xs text-white/50">{t.formatOnSaveDesc}</span>
                </div>
              </label>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
