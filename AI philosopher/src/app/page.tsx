'use client';

import { useState } from 'react';
import BattleArena from '@/components/BattleArena';
import Referee from '@/components/Referee';
import { generateRoast, judgeBattle } from './actions';
import { Message, GROQ_MODELS } from '@/lib/api';
import { cn } from '@/lib/utils';

const ROUNDS = 5;

export default function Home() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isBattleActive, setIsBattleActive] = useState(false);
    const [turn, setTurn] = useState(0);
    const [isTyping, setIsTyping] = useState(false);
    const [verdict, setVerdict] = useState<string | null>(null);
    const [isJudging, setIsJudging] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [selectedModelA, setSelectedModelA] = useState(GROQ_MODELS[0].id);
    const [selectedModelB, setSelectedModelB] = useState(GROQ_MODELS[1].id);

    const startBattle = async () => {
        console.log('Battle Protocol Initiated'); // Debug log
        if (isBattleActive) return;

        setIsBattleActive(true);
        setMessages([]);
        setVerdict(null);
        setTurn(0);
        setError(null);

        const modelAName = GROQ_MODELS.find(m => m.id === selectedModelA)?.name || 'Model A';
        await runTurn([], selectedModelA, modelAName);
    };

    const runTurn = async (history: Message[], currentModel: string, modelName: string) => {
        setIsTyping(true);
        setError(null);
        try {
            const content = await generateRoast(currentModel, history);

            const newMessage: Message = {
                role: history.length % 2 === 0 ? 'assistant' : 'user',
                content: content,
                model: modelName
            };

            const newHistory = [...history, newMessage];
            setMessages(newHistory);
            setIsTyping(false);

            const nextTurn = history.length + 1;
            setTurn(nextTurn);

            if (nextTurn < ROUNDS * 2) {
                const nextModel = nextTurn % 2 === 0 ? selectedModelA : selectedModelB;
                const nextModelName = nextTurn % 2 === 0
                    ? (GROQ_MODELS.find(m => m.id === selectedModelA)?.name || 'Model A')
                    : (GROQ_MODELS.find(m => m.id === selectedModelB)?.name || 'Model B');

                const delay = Math.floor(Math.random() * 2000) + 3000;
                setTimeout(() => runTurn(newHistory, nextModel, nextModelName), delay);
            } else {
                judge(newHistory);
            }
        } catch (error) {
            console.error('Turn failed', error);
            setIsTyping(false);
            setError('System Error: Roast generation failure. Check API Uplink.');
        }
    };

    const judge = async (history: Message[]) => {
        setIsJudging(true);
        try {
            const result = await judgeBattle(history);
            setVerdict(result);
        } catch (error) {
            console.error('Judging failed', error);
        } finally {
            setIsJudging(false);
            setIsBattleActive(false);
        }
    };

    return (
        <main className="min-h-screen bg-cat-base text-cat-text font-mono p-4 flex flex-col items-center selection:bg-cat-mauve selection:text-cat-base overflow-x-hidden">
            <header className="mb-8 w-full max-w-4xl text-center relative z-10">
                <pre className="text-[10px] md:text-sm leading-[1em] opacity-80 select-none text-center hidden md:block text-cat-mauve font-bold mb-6">
                    {`
    _    ___   ____  ___    _    ___ _____  ____    _  _____ _____ _     _____ 
   / \\  |_ _| |  _ \\/ _ \\  / \\  / __|_   _| | __ )  / \\|_   _|_   _| |   | ____|
  / _ \\  | |  | |_) | | | |/ _ \\ \\__ \\ | |   |  _ \\ / _ \\ | |   | | | |   |  _|  
 / ___ \\ | |  |  _ <| |_| / ___ \\ ___) || |   | |_) / ___ \\| |   | | | |___| |___ 
/_/   \\_\\___| |_| \\_\\\\___/_/   \\_\\____/ |_|   |____/_/   \\_\\_|   |_| |_____|_____|
`}
                </pre>
                <h1 className="md:hidden text-3xl font-bold tracking-tighter border-b-2 border-cat-mauve pb-2 mb-4 text-cat-mauve">
                    &gt; AI_ROAST_BATTLE
                </h1>

                <div className="bg-cat-mantle border-2 border-cat-mauve p-6 rounded-lg shadow-[4px_4px_0px_0px_rgba(203,166,247,1)] mt-4 flex flex-col md:flex-row justify-center items-center gap-6 w-full max-w-4xl relative">
                    <div className="absolute -top-3 left-4 bg-cat-base border border-cat-mauve px-3 py-1 text-xs font-bold text-cat-mauve uppercase">
                        Configuration
                    </div>

                    {/* Model A Selector */}
                    <div className="w-full md:w-auto flex-1">
                        <label className="block text-xs uppercase mb-2 text-cat-blue font-bold tracking-widest">Player 01</label>
                        <div className="relative">
                            <select
                                value={selectedModelA}
                                onChange={(e) => setSelectedModelA(e.target.value)}
                                className="w-full bg-cat-surface0 border border-cat-blue text-cat-text px-4 py-3 rounded-md font-mono focus:outline-none focus:ring-2 focus:ring-cat-blue focus:border-transparent hover:bg-cat-surface1 transition-colors cursor-pointer appearance-none"
                                disabled={isBattleActive}
                            >
                                {GROQ_MODELS.map(model => (
                                    <option key={model.id} value={model.id}>{model.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-cat-blue">▼</div>
                        </div>
                    </div>

                    <div className="text-2xl font-black text-cat-red pt-6">VS</div>

                    {/* Model B Selector */}
                    <div className="w-full md:w-auto flex-1">
                        <label className="block text-xs uppercase mb-2 text-cat-peach font-bold tracking-widest">Player 02</label>
                        <div className="relative">
                            <select
                                value={selectedModelB}
                                onChange={(e) => setSelectedModelB(e.target.value)}
                                className="w-full bg-cat-surface0 border border-cat-peach text-cat-text px-4 py-3 rounded-md font-mono focus:outline-none focus:ring-2 focus:ring-cat-peach focus:border-transparent hover:bg-cat-surface1 transition-colors cursor-pointer appearance-none"
                                disabled={isBattleActive}
                            >
                                {GROQ_MODELS.map(model => (
                                    <option key={model.id} value={model.id}>{model.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-cat-peach">▼</div>
                        </div>
                    </div>
                </div>
            </header>

            {!isBattleActive && !verdict && (
                <button
                    onClick={startBattle}
                    className="group relative inline-flex items-center justify-center bg-cat-mauve text-cat-base font-bold text-xl px-12 py-4 rounded-lg overflow-hidden transition-transform active:scale-95 shadow-[4px_4px_0px_0px_#1e1e2e]"
                >
                    <span className="relative z-10 flex items-center gap-2">
                        <span>Execute_Battle.sh</span>
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </span>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </button>
            )}

            {(isBattleActive || verdict) && (
                <div className="w-full flex-1 flex flex-col items-center w-full max-w-6xl">
                    <BattleArena messages={messages} isTyping={isTyping} />

                    {error && (
                        <div className="mt-4 p-4 rounded-lg bg-cat-red/10 border border-cat-red text-cat-red font-bold w-full max-w-4xl text-center shadow-lg">
                            ⚠ SYSTEM ERROR: {error}
                        </div>
                    )}

                    <Referee verdict={verdict} isJudging={isJudging} />

                    {verdict && (
                        <button
                            onClick={startBattle}
                            className="mt-8 bg-cat-surface0 text-cat-text border border-cat-surface2 hover:bg-cat-surface1 px-8 py-3 rounded-md font-mono text-sm uppercase transition-all shadow-md font-bold"
                        >
                            Run New Simulation
                        </button>
                    )}
                </div>
            )}
        </main>
    );
}
