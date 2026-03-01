import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, ChevronDown, ChevronRight, FilePlus, FileEdit, Trash2, Eye } from 'lucide-react';
import { cn } from '../../utils/cn';
import { computeDiff, diffStats } from '../../utils/diff';
import type { FileChange } from '../../services/agentService';

interface FileChangesCardProps {
    fileChanges: FileChange[];
    currentFiles: Record<string, string>;
    onAccept: () => void;
    onReject: () => void;
}

const actionConfig = {
    create: { icon: FilePlus, label: 'New', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    modify: { icon: FileEdit, label: 'Modified', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    delete: { icon: Trash2, label: 'Deleted', color: 'text-red-400', bg: 'bg-red-500/10' },
};

function DiffViewer({ oldContent, newContent }: { oldContent: string; newContent: string }) {
    const lines = computeDiff(oldContent, newContent);

    return (
        <div className="font-mono text-[11px] leading-5 overflow-x-auto custom-scrollbar max-h-[300px] overflow-y-auto">
            {lines.map((line, i) => (
                <div
                    key={i}
                    className={cn(
                        "flex gap-0 border-b border-white/[0.03] min-w-max",
                        line.type === 'added' && "bg-emerald-500/10",
                        line.type === 'removed' && "bg-red-500/10",
                    )}
                >
                    {/* Old line number */}
                    <span className="w-9 shrink-0 text-right pr-2 select-none text-white/20 border-r border-white/[0.06]">
                        {line.oldLineNumber || ''}
                    </span>
                    {/* New line number */}
                    <span className="w-9 shrink-0 text-right pr-2 select-none text-white/20 border-r border-white/[0.06]">
                        {line.newLineNumber || ''}
                    </span>
                    {/* Prefix */}
                    <span className={cn(
                        "w-5 shrink-0 text-center select-none",
                        line.type === 'added' && "text-emerald-400",
                        line.type === 'removed' && "text-red-400",
                    )}>
                        {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                    </span>
                    {/* Content */}
                    <span className={cn(
                        "flex-1 whitespace-pre px-1",
                        line.type === 'added' && "text-emerald-200",
                        line.type === 'removed' && "text-red-200",
                        line.type === 'unchanged' && "text-white/60",
                    )}>
                        {line.content || '\u00A0'}
                    </span>
                </div>
            ))}
        </div>
    );
}

export function FileChangesCard({ fileChanges, currentFiles, onAccept, onReject }: FileChangesCardProps) {
    const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

    const toggleFile = (path: string) => {
        setExpandedFiles(prev => {
            const next = new Set(prev);
            if (next.has(path)) {
                next.delete(path);
            } else {
                next.add(path);
            }
            return next;
        });
    };

    const totalStats = fileChanges.reduce(
        (acc, fc) => {
            if (fc.action === 'create') {
                const lines = (fc.content || '').split('\n').length;
                acc.additions += lines;
            } else if (fc.action === 'modify') {
                const old = currentFiles[fc.path] || '';
                const stats = diffStats(computeDiff(old, fc.content || ''));
                acc.additions += stats.additions;
                acc.deletions += stats.deletions;
            } else if (fc.action === 'delete') {
                const lines = (currentFiles[fc.path] || '').split('\n').length;
                acc.deletions += lines;
            }
            return acc;
        },
        { additions: 0, deletions: 0 }
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="rounded-xl border border-indigo-500/20 bg-indigo-500/[0.04] overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-indigo-500/[0.06]">
                <div className="flex items-center gap-2">
                    <Eye size={14} className="text-indigo-400" />
                    <span className="text-xs font-semibold text-indigo-300">Review Changes</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/50">
                        {fileChanges.length} file{fileChanges.length > 1 ? 's' : ''}
                    </span>
                </div>
                <div className="flex items-center gap-1 text-[10px]">
                    {totalStats.additions > 0 && (
                        <span className="text-emerald-400">+{totalStats.additions}</span>
                    )}
                    {totalStats.deletions > 0 && (
                        <span className="text-red-400 ml-1">-{totalStats.deletions}</span>
                    )}
                </div>
            </div>

            {/* File list */}
            <div className="divide-y divide-white/[0.04]">
                {fileChanges.map((fc) => {
                    const config = actionConfig[fc.action];
                    const Icon = config.icon;
                    const isExpanded = expandedFiles.has(fc.path);
                    const oldContent = currentFiles[fc.path] || '';
                    const newContent = fc.content || '';

                    return (
                        <div key={fc.path}>
                            {/* File row */}
                            <button
                                onClick={() => toggleFile(fc.path)}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/[0.03] transition-colors text-left"
                            >
                                {/* Expand/collapse chevron */}
                                <span className="text-white/30 shrink-0">
                                    {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                </span>

                                {/* Action icon */}
                                <span className={cn("shrink-0 p-1 rounded", config.bg)}>
                                    <Icon size={12} className={config.color} />
                                </span>

                                {/* Filename */}
                                <span className="text-xs text-white/80 font-mono flex-1 truncate">
                                    {fc.path}
                                </span>

                                {/* Action badge */}
                                <span className={cn("text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-semibold", config.bg, config.color)}>
                                    {config.label}
                                </span>

                                {/* Line stats */}
                                {fc.action === 'modify' && (() => {
                                    const stats = diffStats(computeDiff(oldContent, newContent));
                                    return (
                                        <span className="text-[10px] text-white/40 ml-1 shrink-0">
                                            {stats.additions > 0 && <span className="text-emerald-400">+{stats.additions}</span>}
                                            {stats.deletions > 0 && <span className="text-red-400 ml-1">-{stats.deletions}</span>}
                                        </span>
                                    );
                                })()}
                            </button>

                            {/* Diff view */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden border-t border-white/[0.04] bg-[#0d0d0d]"
                                    >
                                        {fc.action === 'delete' ? (
                                            <div className="p-3 text-xs text-red-300/70 italic">
                                                This file will be deleted
                                            </div>
                                        ) : fc.action === 'create' ? (
                                            <DiffViewer oldContent="" newContent={newContent} />
                                        ) : (
                                            <DiffViewer oldContent={oldContent} newContent={newContent} />
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>

            {/* Accept / Reject buttons */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-t border-white/5 bg-black/20">
                <button
                    onClick={onAccept}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors text-xs font-semibold"
                >
                    <Check size={14} />
                    Accept All
                </button>
                <button
                    onClick={onReject}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-red-500/10 text-red-300 hover:bg-red-500/20 transition-colors text-xs font-semibold"
                >
                    <X size={14} />
                    Reject All
                </button>
            </div>
        </motion.div>
    );
}
