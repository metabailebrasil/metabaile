import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Calendar, Music, ArrowRight, Loader2, Camera } from 'lucide-react';

const Auth: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Login State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Signup State
    const [fullName, setFullName] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    const genres = ["Funk", "Trap", "Rap", "Eletrônica", "Pop", "Sertanejo", "Rock", "Pagode"];

    const toggleGenre = (genre: string) => {
        if (selectedGenres.includes(genre)) {
            setSelectedGenres(selectedGenres.filter(g => g !== genre));
        } else {
            setSelectedGenres([...selectedGenres, genre]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const uploadAvatar = async (userId: string): Promise<string | null> => {
        if (!avatarFile) return null;
        try {
            const fileExt = avatarFile.name.split('.').pop();
            const fileName = `${userId}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, avatarFile);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            return data.publicUrl;
        } catch (error) {
            console.error('Error uploading avatar:', error);
            return null;
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            navigate('/');
        } catch (err: any) {
            let msg = err.message;
            if (msg.includes("Email not confirmed")) msg = "Email não confirmado. Verifique sua caixa de entrada ou desative a confirmação no Supabase.";
            if (msg.includes("Invalid login credentials")) msg = "Email ou senha incorretos.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Generate a temporary ID or use email for initial avatar check (optional, but cleaner to allow system to generate ID)
            // But we can just upload first or after. 
            // Better flow: Signup -> Get User ID -> Upload Avatar -> Update User
            // OR: Upload with random name -> Signup with URL. Let's do Upload with random/email prefix.

            let uploadedAvatarUrl = null;
            if (avatarFile) {
                // Use a temporary name, we can clean up later or just use timestamp
                // Actually, we can't upload without being authenticated usually if RLS is strict,
                // BUT my RLS "Anyone can upload an avatar" allows it.
                // If RLS requires auth, we must signup first.
                // Let's assume the RLS allows public uploads for now or we signup first.
                // If we signup first, we need to update the user immediately after.
            }

            // Strategy: Signup first (to get Auth), then upload, then update profile.
            // This is safer for RLS "authenticated users only".

            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        birth_date: birthDate,
                        music_preferences: selectedGenres,
                        // Default avatar initially
                        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
                    }
                }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error("Erro ao criar usuário.");

            // 2. Upload Avatar if selected
            if (avatarFile && authData.user) {
                const publicUrl = await uploadAvatar(authData.user.id);
                if (publicUrl) {
                    // 3. Update user metadata with real avatar
                    const { error: updateError } = await supabase.auth.updateUser({
                        data: { avatar_url: publicUrl }
                    });
                    if (updateError) {
                        console.error("Error updating avatar:", updateError);
                        setError("Erro ao atualizar foto de perfil. Tente novamente mais tarde.");
                    }
                } else {
                    setError("Erro ao fazer upload da foto. Verifique sua conexão ou tente uma imagem menor.");
                    // Allow login anyway, but warn
                }
            }

            navigate('/');

        } catch (err: any) {
            let msg = err.message;
            if (msg.includes("Email not confirmed")) msg = "Verifique seu email para confirmar o cadastro.";
            else if (msg.includes("User already registered")) msg = "Este email já está cadastrado.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F0F4F8] text-brand-dark flex items-center justify-center p-4 relative overflow-hidden">
            {/* RICH MESH GRADIENT BACKGROUND */}
            <div className="absolute top-[-30%] left-[-20%] w-[70%] h-[70%] bg-purple-300/30 rounded-full blur-[100px] animate-float opacity-70"></div>
            <div className="absolute bottom-[-30%] right-[-20%] w-[70%] h-[70%] bg-blue-300/30 rounded-full blur-[100px] animate-float animation-delay-2000 opacity-70"></div>
            <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-pink-300/20 rounded-full blur-[80px] animate-pulse-slow opacity-60"></div>
            {/* Noise Texture Overlay for Premium Feel */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

            {/* Main Card - Ultra Glassmorphism */}
            <div className="w-full max-w-md bg-white/60 backdrop-blur-2xl border border-white/80 rounded-[2.5rem] p-8 md:p-10 relative z-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] ring-1 ring-white/50 animate-fade-in-up">

                {/* Header - High Impact */}
                <div className="text-center mb-10">
                    <div className="inline-block relative">
                        <h1 className="font-display text-5xl md:text-6xl font-black mb-3 tracking-tighter bg-gradient-to-br from-brand-dark via-brand-dark to-brand-primary/80 bg-clip-text text-transparent drop-shadow-sm">
                            METABAILE
                        </h1>
                        <div className="absolute -top-6 -right-6 text-brand-primary/20 rotate-12 animate-pulse-slow">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>
                        </div>
                    </div>

                    <p className="text-brand-gray/80 font-bold text-xs md:text-sm tracking-[0.2em] uppercase">
                        {isLogin ? "Bem-vindo ao futuro" : "Entre para a história"}
                    </p>
                </div>

                {/* Tabs Removed - Moved to bottom as requested */}

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium text-center flex items-center justify-center gap-2">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-5">

                    {!isLogin && (
                        <>
                            {/* Avatar Upload */}
                            <div className="flex flex-col items-center mb-6">
                                <label htmlFor="avatar-upload" className="relative group cursor-pointer transition-transform active:scale-95">
                                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-xl group-hover:border-brand-primary/30 transition-all bg-brand-light flex items-center justify-center relative z-0">
                                        {avatarPreview ? (
                                            <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={32} className="text-brand-dark/20" />
                                        )}
                                    </div>
                                    <div className="absolute bottom-0 right-0 bg-brand-dark text-white p-2.5 rounded-full hover:bg-brand-primary hover:text-brand-dark transition-all shadow-lg group-hover:scale-110 z-10">
                                        <Camera size={14} />
                                    </div>
                                    <input
                                        id="avatar-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                </label>
                                <label htmlFor="avatar-upload" className="text-xs font-bold text-brand-primary uppercase tracking-widest mt-3 cursor-pointer hover:text-brand-secondary transition-colors">
                                    Adicionar Foto
                                </label>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-brand-dark/60 uppercase tracking-wider ml-1">Nome Completo</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-dark/30" size={18} />
                                    <input
                                        type="text"
                                        required
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full bg-white border border-brand-dark/10 rounded-xl py-3.5 pl-12 pr-4 text-brand-dark placeholder-brand-dark/30 focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all font-medium shadow-sm"
                                        placeholder="Ana Silva"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-brand-dark/60 uppercase tracking-wider ml-1">Data de Nascimento</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-dark/30" size={18} />
                                    <input
                                        type="date"
                                        required
                                        value={birthDate}
                                        onChange={(e) => setBirthDate(e.target.value)}
                                        className="w-full bg-white border border-brand-dark/10 rounded-xl py-3.5 pl-12 pr-4 text-brand-dark placeholder-brand-dark/30 focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all font-medium shadow-sm"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-brand-dark/60 uppercase tracking-wider ml-1">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-dark/30" size={18} />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white border border-brand-dark/10 rounded-xl py-3.5 pl-12 pr-4 text-brand-dark placeholder-brand-dark/30 focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all font-medium shadow-sm"
                                placeholder="exemplo@email.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-brand-dark/60 uppercase tracking-wider ml-1">Senha</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-dark/30" size={18} />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white border border-brand-dark/10 rounded-xl py-3.5 pl-12 pr-4 text-brand-dark placeholder-brand-dark/30 focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all font-medium shadow-sm"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {!isLogin && (
                        <div className="space-y-3 pt-2">
                            <label className="text-xs font-bold text-brand-dark/60 uppercase tracking-wider ml-1 flex items-center gap-2">
                                <Music size={14} className="text-brand-primary" /> Seu estilo musical
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {genres.map(genre => (
                                    <button
                                        key={genre}
                                        type="button"
                                        onClick={() => toggleGenre(genre)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-300 ${selectedGenres.includes(genre)
                                            ? 'bg-brand-dark text-white border-brand-dark shadow-lg transform scale-105'
                                            : 'bg-white border-brand-dark/10 text-brand-gray hover:border-brand-primary/50 hover:text-brand-dark'
                                            }`}
                                    >
                                        {genre}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-brand-dark text-white font-bold py-4 rounded-xl mt-6 hover:bg-slate-800 transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 shadow-xl shadow-brand-dark/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <>
                                {isLogin ? "Entrar na Festa" : "Criar Conta"}
                                <ArrowRight size={20} />
                            </>
                        )}
                    </button>

                    {/* Bottom Options */}
                    <div className="mt-8 space-y-4 text-center">
                        {isLogin && (
                            <button
                                type="button"
                                className="block w-full text-sm font-medium text-brand-gray hover:text-brand-primary transition-colors"
                            >
                                Esqueceu sua senha?
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={() => setIsLogin(!isLogin)}
                            className="block w-full text-sm font-bold text-brand-dark hover:text-brand-primary transition-colors"
                        >
                            {isLogin ? "Ainda não tem conta? Cadastre-se" : "Já tem uma conta? Entrar"}
                        </button>
                    </div>

                </form>

                {/* Footer / Links */}
                <div className="mt-8 text-center">
                    <p className="text-xs text-brand-gray/60">
                        Ao continuar, você concorda com nossos <br />
                        <span className="text-brand-dark font-bold cursor-pointer hover:underline">Termos de Uso</span> e <span className="text-brand-dark font-bold cursor-pointer hover:underline">Privacidade</span>.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Auth;
