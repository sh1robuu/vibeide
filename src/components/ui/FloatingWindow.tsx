import { ReactNode, useState } from 'react';
import { motion, useDragControls } from 'motion/react';
import { X, GripHorizontal } from 'lucide-react';
import { cn } from '../../utils/cn';

interface FloatingWindowProps {
  title: string;
  children: ReactNode;
  onClose?: () => void;
  defaultPosition?: { x: number; y: number };
  className?: string;
}

export function FloatingWindow({ title, children, onClose, defaultPosition = { x: 0, y: 0 }, className }: FloatingWindowProps) {
  const dragControls = useDragControls();
  const [isDragging, setIsDragging] = useState(false);

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      initial={defaultPosition}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
      className={cn(
        "absolute z-50 flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl transition-shadow resize",
        isDragging ? "shadow-indigo-500/20" : "shadow-black/50",
        className
      )}
      style={{ minWidth: 300, minHeight: 200 }}
    >
      {/* Header / Drag Handle */}
      <div 
        className="flex items-center justify-between bg-white/5 px-4 py-2 cursor-grab active:cursor-grabbing border-b border-white/10 shrink-0"
        onPointerDown={(e) => dragControls.start(e)}
      >
        <div className="flex items-center gap-2 text-white/80">
          <GripHorizontal size={16} className="opacity-50" />
          <span className="text-sm font-medium tracking-wide">{title}</span>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="rounded-full p-1 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto p-4 custom-scrollbar">
        {children}
      </div>
    </motion.div>
  );
}

