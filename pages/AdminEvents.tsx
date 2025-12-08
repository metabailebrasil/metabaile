import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, Save, Trash2, Power, Loader2, LogOut } from 'lucide-react';

interface Event {
    id: string;
    title: string;
    status: 'active' | 'completed' | 'draft';
    show_date_start: string;
    access_expires_at: string;
    stream_url?: string;
}

const AdminEvents: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState<Event[]>([]);
    const [newEventTitle, setNewEventTitle] = useState('');
    const [newEventDate, setNewEventDate] = useState(''); // YYYY-MM-DD
    const [newEventStreamUrl, setNewEventStreamUrl] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        checkAuthAndFetch();
    }, []);

    const checkAuthAndFetch = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            navigate('/auth');
            return;
        }
        fetchEvents();
    };

    const fetchEvents = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) console.error(error);
        if (data) setEvents(data);
        setLoading(false);
    };

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);

        // Logic to calculate expiring Sunday
        const selectedDate = new Date(newEventDate);
        const dayOfWeek = selectedDate.getDay();
        const daysUntilSunday = (7 - dayOfWeek) % 7;

        const closingDate = new Date(selectedDate);
        closingDate.setDate(selectedDate.getDate() + daysUntilSunday);
        closingDate.setHours(23, 59, 59, 0);

        const { error } = await supabase.from('events').insert([
            {
                title: newEventTitle,
                status: 'draft',
                show_date_start: selectedDate.toISOString(),
                access_expires_at: closingDate.toISOString(),
                stream_url: newEventStreamUrl.trim() || null
            }
        ]);

        if (error) {
            alert('Error creating event');
            console.error(error);
        } else {
            setNewEventTitle('');
            setNewEventDate('');
            setNewEventStreamUrl('');
            fetchEvents();
        }
        setCreating(false);
    };

    const handleUpdateStreamUrl = async (id: string, url: string) => {
        const { error } = await supabase.from('events').update({ stream_url: url }).eq('id', id);
        if (error) {
            alert('Erro ao atualizar link');
        } else {
            fetchEvents(); // Refresh to ensure sync
        }
    };

    const toggleEventStatus = async (event: Event) => {
        if (event.status !== 'active') {
            // First, find currently active and deactivate
            const activeEvents = events.filter(e => e.status === 'active');
            for (const e of activeEvents) {
                await supabase.from('events').update({ status: 'completed' }).eq('id', e.id);
            }

            // Activate target
            await supabase.from('events').update({ status: 'active' }).eq('id', event.id);
        } else {
            // Deactivating
            await supabase.from('events').update({ status: 'draft' }).eq('id', event.id);
        }
        fetchEvents();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza?')) return;
        await supabase.from('events').delete().eq('id', id);
        fetchEvents();
    }

    // --- PLAYLIST LOGIC ---
    interface PlaylistVideo {
        id: number;
        video_id: string;
        title: string;
        is_active: boolean;
    }
    const [playlist, setPlaylist] = useState<PlaylistVideo[]>([]);
    const [newVideoId, setNewVideoId] = useState('');
    const [newVideoTitle, setNewVideoTitle] = useState('');

    useEffect(() => {
        if (loading) return; // Wait for auth check
        fetchPlaylist();
    }, [loading]);

    const fetchPlaylist = async () => {
        const { data, error } = await supabase
            .from('playlist')
            .select('*')
            .order('created_at', { ascending: false });
        if (data) setPlaylist(data);
    };

    const handleAddVideo = async (e: React.FormEvent) => {
        e.preventDefault();
        const { error } = await supabase.from('playlist').insert([{
            video_id: newVideoId,
            title: newVideoTitle
        }]);
        if (error) {
            alert('Erro ao adicionar vídeo');
        } else {
            setNewVideoId('');
            setNewVideoTitle('');
            fetchPlaylist();
        }
    };

    const handleDeleteVideo = async (id: number) => {
        if (!confirm('Remover vídeo da playlist?')) return;
        await supabase.from('playlist').delete().eq('id', id);
        fetchPlaylist();
    };

    const toggleVideoStatus = async (video: PlaylistVideo) => {
        await supabase.from('playlist').update({ is_active: !video.is_active }).eq('id', video.id);
        fetchPlaylist();
    };

    if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-slate-100 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-800">Gerenciar Eventos</h1>
                    <button onClick={() => supabase.auth.signOut().then(() => navigate('/'))} className="flex items-center gap-2 text-slate-600 hover:text-red-600">
                        <LogOut size={20} /> Sair
                    </button>
                </div>

                {/* Create Form */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
                    <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <Plus size={20} className="text-blue-600" /> Novo Evento
                    </h2>
                    <form onSubmit={handleCreateEvent} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Título do Show</label>
                            <input
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Ex: Baile de Verão"
                                value={newEventTitle}
                                onChange={e => setNewEventTitle(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Data (Sexta/Sábado)</label>
                            <input
                                type="date"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                                value={newEventDate}
                                onChange={e => setNewEventDate(e.target.value)}
                                required
                            />
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Link do Youtube (Opcional)</label>
                            <input
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                placeholder="Deixe em branco se ainda não tiver o link"
                                value={newEventStreamUrl}
                                onChange={e => setNewEventStreamUrl(e.target.value)}
                            />
                        </div>
                        <button
                            disabled={creating}
                            className="bg-brand-primary hover:brightness-110 text-brand-dark px-6 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 h-[46px]"
                        >
                            {creating ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            Salvar
                        </button>
                    </form>

                    {/* List */}
                    <div className="space-y-4 mb-12">
                        {events.map(event => (
                            <div key={event.id} className={`bg-white p-6 rounded-2xl border transition-all ${event.status === 'active' ? 'border-green-500 shadow-md ring-1 ring-green-500/20' : 'border-slate-200'}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-xl font-bold text-slate-800">{event.title}</h3>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${event.status === 'active' ? 'bg-green-100 text-green-700' :
                                                event.status === 'completed' ? 'bg-slate-100 text-slate-500' : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {event.status}
                                            </span>
                                        </div>
                                        <div className="text-sm text-slate-500 flex items-center gap-4">
                                            <span className="flex items-center gap-1"><Calendar size={14} /> Expira: {new Date(event.access_expires_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => toggleEventStatus(event)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${event.status === 'active'
                                                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                                : 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-600/20'
                                                }`}
                                        >
                                            <Power size={18} />
                                            {event.status === 'active' ? 'Desativar' : 'Ativar Vendas'}
                                        </button>

                                        <button onClick={() => handleDelete(event.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Stream URL Editor */}
                                <div className="border-t border-slate-100 pt-4 mt-2">
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Link da Transmissão (ID do Youtube)</label>
                                    <div className="flex gap-2">
                                        <input
                                            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                            placeholder="Cole o ID do vídeo aqui..."
                                            defaultValue={event.stream_url || ''}
                                            onBlur={(e) => {
                                                if (e.target.value !== event.stream_url) {
                                                    handleUpdateStreamUrl(event.id, e.target.value);
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleUpdateStreamUrl(event.id, e.currentTarget.value);
                                                    e.currentTarget.blur();
                                                }
                                            }}
                                        />
                                        <div className="text-xs text-slate-400 flex items-center">
                                            Pressione Enter ou clique fora para salvar
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {events.length === 0 && (
                            <div className="text-center py-12 text-slate-400">
                                Nenhum evento criado.
                            </div>
                        )}
                    </div>

                    {/* --- PLAYLIST SECTION --- */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mt-12 mb-20">
                        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <span className="bg-purple-100 text-purple-600 p-2 rounded-lg"><Plus size={20} /></span>
                            TV Metabaile (Conteúdo de Espera)
                        </h2>

                        {/* Add Video Form */}
                        <form onSubmit={handleAddVideo} className="flex gap-4 items-end mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Título do Vídeo</label>
                                <input
                                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="Ex: Lofi para Estudar"
                                    value={newVideoTitle}
                                    onChange={e => setNewVideoTitle(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="w-[200px]">
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">ID do YouTube</label>
                                <input
                                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                                    placeholder="Ex: jfKp-sQkuxY"
                                    value={newVideoId}
                                    onChange={e => setNewVideoId(e.target.value)}
                                    required
                                />
                            </div>
                            <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-bold transition-all h-[42px]">
                                Adicionar
                            </button>
                        </form>

                        {/* Playlist Items */}
                        <div className="space-y-2">
                            {playlist.map(video => (
                                <div key={video.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-200 rounded-lg overflow-hidden relative">
                                            <img
                                                src={`https://img.youtube.com/vi/${video.video_id}/default.jpg`}
                                                alt={video.title}
                                                className="w-full h-full object-cover opacity-80"
                                            />
                                        </div>
                                        <div>
                                            <h4 className={`font-bold ${video.is_active ? 'text-slate-700' : 'text-slate-400 line-through'}`}>{video.title}</h4>
                                            <p className="text-xs text-slate-400 font-mono">{video.video_id}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => toggleVideoStatus(video)}
                                            className={`text-xs font-bold px-3 py-1 rounded-full ${video.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}
                                        >
                                            {video.is_active ? 'Ativo' : 'Inativo'}
                                        </button>
                                        <button onClick={() => handleDeleteVideo(video.id)} className="p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-50">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {playlist.length === 0 && <p className="text-center text-slate-400 py-4">Nenhum vídeo na lista de espera.</p>}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AdminEvents;
