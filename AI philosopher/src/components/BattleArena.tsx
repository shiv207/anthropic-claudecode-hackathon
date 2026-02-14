'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Message } from '@/lib/api';

interface BattleArenaProps {
    messages: Message[];
    isTyping: boolean;
}

export default function BattleArena({ messages, isTyping }: BattleArenaProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    return (
        <div className="w-full max-w-6xl mx-auto h-[60vh] flex flex-col font-mono text-cat-text bg-cat-mantle border-2 border-cat-surface0 rounded-lg relative overflow-hidden shadow-xl mt-4">
            {/* Terminal Header */}
            <div className="bg-cat-surface0 text-cat-subtext1 px-4 py-2 flex justify-between items-center text-xs font-bold uppercase tracking-wider select-none border-b border-cat-surface1">
                <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-cat-red" />
                    <div className="w-3 h-3 rounded-full bg-cat-yellow" />
                    <div className="w-3 h-3 rounded-full bg-cat-green" />
                </div>
                <span>user@roast-battle: ~</span>
            </div>

            {/* Battle Log */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 font-mono text-base md:text-lg scrollbar-hide" ref={scrollRef}>
                {messages.length === 0 && !isTyping && (
                    <div className="text-cat-overlay2 opacity-50 space-y-2">
                        <div>$ ./init_roast_sequence.sh</div>
                        <div>&gt; Loading models... OK</div>
                        <div>&gt; Establishing connection... OK</div>
                        <div>&gt; Waiting for execution command... <span className="animate-pulse">_</span></div>
                    </div>
                )}

                {messages.map((msg, idx) => {
                    const isLeft = msg.role === 'assistant';
                    const promptColor = isLeft ? 'text-cat-blue' : 'text-cat-peach';
                    const bgColor = isLeft ? 'bg-cat-surface0/50' : 'bg-cat-surface0/30';
                    const user = msg.model || (isLeft ? 'SYSTEM' : 'USER');

                    return (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col gap-1"
                        >
                            <div className="flex items-center gap-2 text-xs opacity-70 mb-1">
                                <span className={cn("font-bold", promptColor)}>
                                    ➜  {user}
                                </span>
                                <span className="text-cat-overlay0">
                                    {new Date().toLocaleTimeString()}
                                </span>
                            </div>
                            <div className={cn("p-4 rounded-lg border-l-2", isLeft ? "border-cat-blue bg-cat-blue/5" : "border-cat-peach bg-cat-peach/5")}>
                                <span className="text-cat-text leading-relaxed whitespace-pre-wrap">
                                    {msg.content}
                                </span>
                            </div>
                        </motion.div>
                    );
                })}

                {isTyping && (
                    <div className="flex items-center gap-2 text-cat-overlay2">
                        <span className="animate-spin text-cat-mauve">⟳</span>
                        <span>Processing response...</span>
                    </div>
                )}
            </div>
        </div>
    );
}
