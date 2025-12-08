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
}

const AdminEvents: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState<Event[]>([]);
    const [newEventTitle, setNewEventTitle] = useState('');
    const [newEventDate, setNewEventDate] = useState(''); // YYYY-MM-DD
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
                access_expires_at: closingDate.toISOString()
            }
        ]);

        if (error) {
            alert('Error creating event');
            console.error(error);
        } else {
            setNewEventTitle('');
            setNewEventDate('');
            fetchEvents();
        }
        setCreating(false);
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
                    <form onSubmit={handleCreateEvent} className="flex gap-4 items-end">
                        <div className="flex-1">
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
                                className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                                value={newEventDate}
                                onChange={e => setNewEventDate(e.target.value)}
                                required
                            />
                        </div>
                        <button
                            disabled={creating}
                            className="bg-brand-primary hover:brightness-110 text-brand-dark px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                        >
                            {creating ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            Salvar
                        </button>
                    </form>
                </div>

                {/* List */}
                <div className="space-y-4">
                    {events.map(event => (
                        <div key={event.id} className={`bg-white p-6 rounded-2xl border transition-all flex items-center justify-between ${event.status === 'active' ? 'border-green-500 shadow-md ring-1 ring-green-500/20' : 'border-slate-200'}`}>
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
                    ))}

                    {events.length === 0 && (
                        <div className="text-center py-12 text-slate-400">
                            Nenhum evento criado.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminEvents;
