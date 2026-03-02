import { motion } from 'motion/react';
import { Sparkles, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { PromptEvaluation } from '../../services/agentService';
import { useStore } from '../../store/useStore';

interface PromptEvaluationCardProps {
  evaluation: PromptEvaluation;
  onUseImproved?: (improvedPrompt: string) => void;
}

export function PromptEvaluationCard({ evaluation, onUseImproved }: PromptEvaluationCardProps) {
  const { language } = useStore();
  const isVi = language === 'vi';

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-emerald-400';
    if (score >= 5) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4 backdrop-blur-md"
    >
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2 text-indigo-300 font-medium">
          <Sparkles size={16} />
          <span>{isVi ? 'Phân tích Prompt' : 'Prompt Analysis'}</span>
        </div>
        <div className={`font-mono font-bold text-lg ${getScoreColor(evaluation.score)}`}>
          {evaluation.score}/10
        </div>
      </div>

      <p className="text-sm text-white/80 leading-relaxed">
        {evaluation.feedback}
      </p>

      {evaluation.weaknesses.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-wider text-white/50 font-semibold">
            {isVi ? 'Cần cải thiện' : 'Areas to Improve'}
          </span>
          <ul className="space-y-1">
            {evaluation.weaknesses.map((w, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-red-300/80">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-indigo-900/30 border border-indigo-500/20 rounded-lg p-3 space-y-2">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-indigo-300 font-semibold">
          <CheckCircle size={14} />
          <span>{isVi ? 'Prompt đã cải thiện:' : 'Try this instead:'}</span>
        </div>
        <p className="text-sm text-white/90 font-mono bg-black/30 p-2 rounded border border-white/5">
          {evaluation.improvedPrompt}
        </p>
        <button
          onClick={() => onUseImproved?.(evaluation.improvedPrompt)}
          className="w-full mt-2 flex items-center justify-center gap-2 text-xs bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-200 py-1.5 rounded transition-colors"
        >
          <span>{isVi ? 'Dùng prompt đã cải thiện' : 'Use Improved Prompt'}</span>
          <ArrowRight size={12} />
        </button>
      </div>
    </motion.div>
  );
}
