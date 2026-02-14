'use client';

import { motion } from 'framer-motion';

interface RefereeProps {
    verdict: string | null;
    isJudging: boolean;
}

export default function Referee({ verdict, isJudging }: RefereeProps) {
    if (!verdict && !isJudging) return null;

    return (
        <div className="w-full max-w-4xl mx-auto mt-6">
            {isJudging && (
                <div className="text-cat-mauve font-bold text-center animate-pulse flex items-center justify-center gap-2">
                    <span className="text-xl">🖩</span>
                    <span>ANALYZING BATTLE METRICS...</span>
                </div>
            )}

            {verdict && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-cat-surface0/50 border border-cat-mauve rounded-lg p-6 shadow-lg relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cat-mauve via-cat-pink to-cat-mauve" />

                    <div className="flex items-center gap-2 mb-4 text-cat-mauve font-bold uppercase text-sm tracking-wider">
                        <span>🏆 OFFICIAL VERDICT</span>
                    </div>

                    <div className="text-cat-text leading-relaxed font-medium">
                        {verdict}
                    </div>

                    <div className="flex justify-between items-center mt-6 pt-4 border-t border-cat-surface1 text-xs text-cat-overlay0">
                        <span>JUDGE: CLAUDE_HAIKU</span>
                        <span>STATUS: FINALIZED</span>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
