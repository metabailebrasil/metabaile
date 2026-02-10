import React, { useState } from 'react';
import { LiveStreamChat } from '../components/LiveStreamChat';
import { ArrowLeft, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TestChat: React.FC = () => {
    const navigate = useNavigate();
    const [started, setStarted] = useState(false);

    return (
        <div className="min-h-screen bg-neutral-900 h-screen flex flex-col relative overflow-hidden">

            {/* Video Background Simulation */}
            <div className="absolute inset-0 z-0">
                <div className="w-full h-full bg-gradient-to-br from-slate-900 to-black relative">
                    <div className="absolute inset-0 flex items-center justify-center opacity-30">
                        <Play size={100} className="text-white animate-pulse" />
                    </div>
                </div>
            </div>

            {/* Header */}
            <div className="relative z-10 p-4 bg-black/50 backdrop-blur-md flex items-center gap-4 border-b border-white/10">
                <button onClick={() => navigate('/')} className="text-white hover:text-brand-primary">
                    <ArrowLeft />
                </button>
                <div className="text-white">
                    <h1 className="font-bold text-lg">Metabaile Chat V2 - Teste</h1>
                    <p className="text-xs text-slate-400">Modo de Simulação Ativado</p>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden flex relative z-10">
                {/* Left Side (Fake Stream) */}
                <div className="flex-1 hidden md:flex items-center justify-center p-12">
                    {!started ? (
                        <div className="text-center space-y-4">
                            <h2 className="text-3xl font-bold text-white mb-4">Veja o Chat em Ação</h2>
                            <p className="text-slate-400 max-w-md mx-auto">
                                Clique no botão de configurações dentro do chat para ativar o modo "Auto-Demo".
                            </p>
                        </div>
                    ) : (
                        <div className="w-full h-full bg-black/50 rounded-3xl border border-white/10 flex items-center justify-center">
                            <span className="text-white font-mono animate-pulse">LIVE STREAM FEED</span>
                        </div>
                    )}
                </div>

                {/* Right Side (Chat) */}
                <div className="w-full md:w-[400px] h-full p-4">
                    <LiveStreamChat autoSimulate={true} className="h-full shadow-2xl border-none" />
                </div>
            </div>
        </div>
    );
};

export default TestChat;
