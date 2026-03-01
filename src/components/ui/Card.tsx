import { ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { AlertCircle, AlertTriangle, Play, Bug } from 'lucide-react';

export interface CodeIssue {
  line?: number;
  message: string;
}

interface CardProps {
  children: ReactNode;
  className?: string;
  errors?: CodeIssue[];
  warnings?: CodeIssue[];
  onRun?: () => void;
  onDebug?: () => void;
}

export function Card({ children, className, errors, warnings, onRun, onDebug }: CardProps) {
  const hasIssues = (errors && errors.length > 0) || (warnings && warnings.length > 0);
  const hasActions = onRun || onDebug;

  return (
    <div className={cn("rounded-xl border border-white/5 bg-white/5 p-4 backdrop-blur-md shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20 flex flex-col", className)}>
      <div className="flex-1">
        {children}
      </div>
      
      {hasIssues && (
        <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
          {errors?.map((error, idx) => (
            <div key={`error-${idx}`} className="flex items-start gap-2 text-sm text-red-400 bg-red-400/10 p-2 rounded-md border border-red-400/20">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div className="flex flex-col">
                {error.line !== undefined && (
                  <span className="text-xs font-mono font-bold uppercase tracking-wider opacity-80 mb-0.5">Line {error.line}</span>
                )}
                <span>{error.message}</span>
              </div>
            </div>
          ))}
          {warnings?.map((warning, idx) => (
            <div key={`warning-${idx}`} className="flex items-start gap-2 text-sm text-yellow-400 bg-yellow-400/10 p-2 rounded-md border border-yellow-400/20">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <div className="flex flex-col">
                {warning.line !== undefined && (
                  <span className="text-xs font-mono font-bold uppercase tracking-wider opacity-80 mb-0.5">Line {warning.line}</span>
                )}
                <span>{warning.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasActions && (
        <div className="mt-4 flex items-center gap-2 border-t border-white/10 pt-4">
          {onRun && (
            <button
              onClick={onRun}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors text-xs font-medium"
            >
              <Play size={14} />
              <span>Run</span>
            </button>
          )}
          {onDebug && (
            <button
              onClick={onDebug}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors text-xs font-medium"
            >
              <Bug size={14} />
              <span>Debug</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
