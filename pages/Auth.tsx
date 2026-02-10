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
                    if (updateError) console.error("Error updating avatar:", updateError);
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
        <div className="min-h-screen bg-brand-dark text-white flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-brand-primary/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-brand-secondary/20 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10">

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="font-display text-4xl font-bold mb-2 bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
                        METABAILE
                    </h1>
                    <p className="text-white/60 text-sm">
                        {isLogin ? "Bem-vindo de volta ao futuro." : "Crie sua conta e entre para a história."}
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex bg-black/20 rounded-full p-1 mb-8">
                    <button
                        onClick={() => setIsLogin(true)}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-full transition-all ${isLogin ? 'bg-brand-primary text-brand-dark shadow-lg' : 'text-white/60 hover:text-white'}`}
                    >
                        Entrar
                    </button>
                    <button
                        onClick={() => setIsLogin(false)}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-full transition-all ${!isLogin ? 'bg-brand-primary text-brand-dark shadow-lg' : 'text-white/60 hover:text-white'}`}
                    >
                        Cadastrar
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm text-center">
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-4">

                    {!isLogin && (
                        <>
                            {/* Avatar Upload */}
                            <div className="flex flex-col items-center mb-4">
                                <div className="relative group cursor-pointer">
                                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/10 group-hover:border-brand-primary transition-all bg-black/40 flex items-center justify-center">
                                        {avatarPreview ? (
                                            <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={40} className="text-white/30" />
                                        )}
                                    </div>
                                    <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-brand-primary text-brand-dark p-2 rounded-full cursor-pointer hover:bg-white transition-colors shadow-lg">
                                        <Camera size={16} />
                                    </label>
                                    <input
                                        id="avatar-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                </div>
                                <span className="text-xs text-white/50 mt-2">Adicionar foto de perfil</span>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-white/50 uppercase tracking-wider ml-1">Nome Completo</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                                    <input
                                        type="text"
                                        required
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-white/30 focus:outline-none focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/50 transition-all"
                                        placeholder="Seu nome"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-white/50 uppercase tracking-wider ml-1">Data de Nascimento</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                                    <input
                                        type="date"
                                        required
                                        value={birthDate}
                                        onChange={(e) => setBirthDate(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-white/30 focus:outline-none focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/50 transition-all [color-scheme:dark]"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-white/50 uppercase tracking-wider ml-1">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-white/30 focus:outline-none focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/50 transition-all"
                                placeholder="seu@email.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-white/50 uppercase tracking-wider ml-1">Senha</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-white/30 focus:outline-none focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/50 transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {!isLogin && (
                        <div className="space-y-2 pt-2">
                            <label className="text-xs font-bold text-white/50 uppercase tracking-wider ml-1 flex items-center gap-2">
                                <Music size={14} /> O que você curte?
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {genres.map(genre => (
                                    <button
                                        key={genre}
                                        type="button"
                                        onClick={() => toggleGenre(genre)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${selectedGenres.includes(genre)
                                            ? 'bg-brand-primary border-brand-primary text-brand-dark'
                                            : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
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
                        className="w-full bg-gradient-to-r from-brand-primary to-brand-secondary text-brand-dark font-bold py-4 rounded-xl mt-6 hover:opacity-90 transition-all transform active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
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

                </form>
            </div>
        </div>
    );
};

export default Auth;
