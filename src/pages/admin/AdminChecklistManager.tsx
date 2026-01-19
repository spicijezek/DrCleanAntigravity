import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
    ChefHat, Sofa, BedDouble, Bath, Baby, Home, DoorOpen,
    Navigation, Trash2, CheckCircle2,
    Building2, MapPin, Plus, User, Search, X, TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card";
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Layout } from '@/components/layout/Layout';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

// --- Constants (Same as Client Side) ---
const ROOM_TYPES = [
    { id: 'Kuchyně', icon: ChefHat, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
    { id: 'Obývací pokoj', icon: Sofa, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { id: 'Ložnice', icon: BedDouble, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
    { id: 'Koupelna', icon: Bath, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
    { id: 'Dětský pokoj', icon: Baby, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-900/20' },
    { id: 'Chodba', icon: Navigation, color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-900/20' },
    { id: 'Toaleta', icon: DoorOpen, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-900/20' },
    { id: 'Zahrada', icon: Home, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
    { id: 'Okna', icon: MapPin, color: 'text-sky-500', bg: 'bg-sky-50 dark:bg-sky-900/20' },
    { id: 'Čalounění', icon: Sofa, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { id: 'Jiné', icon: Home, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
];

const DEFAULT_TASKS: Record<string, string[]> = {
    'Kuchyně': ['Umýt podlahu', 'Vytřít pracovní desku', 'Vyčistit spotřebiče', 'Umýt dřez', 'Vynést koš'],
    'Obývací pokoj': ['Vysát/Vytřít podlahu', 'Utřít prach', 'Srovnat polštáře', 'Vyčistit stůl'],
    'Ložnice': ['Vysát/Vytřít podlahu', 'Ustlat postel', 'Utřít prach', 'Vyvětrat'],
    'Koupelna': ['Umýt vanu/sprchu', 'Vyčistit WC', 'Vytřít podlahu', 'Leštit zrcadla'],
    'Dětský pokoj': ['Úklid hraček', 'Vysát podlahu', 'Utřít prach'],
    'Chodba': ['Vytřít podlahu', 'Utřít botník', 'Vyčistit zrcadlo'],
    'Toaleta': ['Vyčistit WC', 'Doplnit papír', 'Vytřít podlahu'],
    'Okna': ['Umýt skla', 'Vyčistit rámy', 'Otřít parapety'],
    'Čalounění': ['Vysát', 'Vytepovat', 'Odstranit skvrny'],
    'Zahrada': ['Posekat trávu', 'Zalít květiny'],
    'Jiné': ['Vysát', 'Utřít prach']
};

export default function AdminChecklistManager() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState<any[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const [checklists, setChecklists] = useState<any[]>([]);
    const [activeChecklistId, setActiveChecklistId] = useState<string | null>(null);
    const [rooms, setRooms] = useState<any[]>([]);
    const [isNewChecklistOpen, setIsNewChecklistOpen] = useState(false);
    const [newChecklistAddress, setNewChecklistAddress] = useState('');
    const [addingTaskRoomId, setAddingTaskRoomId] = useState<string | null>(null);
    const [newTaskText, setNewTaskText] = useState('');
    const [clientSearch, setClientSearch] = useState('');

    useEffect(() => {
        fetchClients();
    }, []);

    useEffect(() => {
        if (selectedClientId) {
            fetchChecklists(selectedClientId);
        } else {
            setChecklists([]);
            setActiveChecklistId(null);
            setRooms([]);
        }
    }, [selectedClientId]);

    useEffect(() => {
        if (activeChecklistId) {
            fetchRooms(activeChecklistId);
        } else {
            setRooms([]);
        }
    }, [activeChecklistId]);

    const fetchClients = async () => {
        const { data } = await supabase.from('clients').select('id, name, email').order('name');
        setClients(data || []);
    };

    const fetchChecklists = async (clientId: string) => {
        try {
            setLoading(true);
            const { data: fetchedChecklists } = await supabase
                .from('client_checklists')
                .select('*')
                .eq('client_id', clientId)
                .order('created_at');

            if (fetchedChecklists && fetchedChecklists.length > 0) {
                setChecklists(fetchedChecklists);
                setActiveChecklistId(fetchedChecklists[0].id);
            } else {
                setChecklists([]);
                setActiveChecklistId(null);
            }
        } catch (e) {
            console.error(e);
            toast.error("Chyba při načítání checklistů.");
        } finally {
            setLoading(false);
        }
    };

    const fetchRooms = async (checklistId: string) => {
        const { data: fetchedRooms } = await supabase
            .from('checklist_rooms')
            .select(`
          *,
          tasks:checklist_tasks(*)
      `)
            .eq('checklist_id', checklistId)
            .order('sort_order');

        setRooms(fetchedRooms || []);
    };

    const createChecklist = async () => {
        if (!newChecklistAddress.trim() || !selectedClientId) return;

        try {
            const { data: newChecklist, error } = await supabase
                .from('client_checklists')
                .insert({
                    client_id: selectedClientId,
                    street: newChecklistAddress,
                    city: '',
                    postal_code: ''
                })
                .select()
                .single();

            if (error) throw error;

            setChecklists(prev => [...prev, newChecklist]);
            setActiveChecklistId(newChecklist.id);
            setIsNewChecklistOpen(false);
            setNewChecklistAddress('');
            toast.success('Nový plán vytvořen');
        } catch (e) {
            toast.error('Chyba při vytváření plánu');
        }
    };

    const addRoom = async (roomType: string) => {
        if (!activeChecklistId) return;

        // Optimistic UI
        const tempId = Math.random().toString();
        const newRoom = {
            id: tempId,
            room_name: roomType,
            checklist_id: activeChecklistId,
            tasks: DEFAULT_TASKS[roomType].map((t, i) => ({ id: `t-${i}`, task_text: t }))
        };

        setRooms(prev => [...prev, newRoom]);
        toast.success(`${roomType} přidána`);

        try {
            const { data: savedRoom } = await supabase
                .from('checklist_rooms')
                .insert({
                    checklist_id: activeChecklistId,
                    room_name: roomType,
                    sort_order: rooms.length
                })
                .select()
                .single();

            if (savedRoom) {
                // Add Default Tasks
                const tasksToAdd = DEFAULT_TASKS[roomType].map((t, i) => ({
                    room_id: savedRoom.id,
                    task_text: t,
                    sort_order: i,
                    added_by: user!.id,
                    added_by_role: 'admin'
                }));

                await supabase.from('checklist_tasks').insert(tasksToAdd);
                fetchRooms(activeChecklistId);
            }
        } catch (error) {
            toast.error("Chyba při ukládání");
            fetchRooms(activeChecklistId); // Revert on error
        }
    };

    const handleAddTask = async (roomId: string) => {
        if (!newTaskText.trim()) return;
        try {
            const { error } = await supabase.from('checklist_tasks').insert({
                room_id: roomId,
                task_text: newTaskText,
                added_by: user!.id,
                added_by_role: 'admin',
                sort_order: 999
            });
            if (error) throw error;
            setNewTaskText('');
            setAddingTaskRoomId(null);
            fetchRooms(activeChecklistId!);
            toast.success('Úkol přidán');
        } catch (e) {
            toast.error('Chyba při přidávání');
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        try {
            const { error } = await supabase.from('checklist_tasks').delete().eq('id', taskId);
            if (error) throw error;
            fetchRooms(activeChecklistId!);
            toast.success('Úkol smazán');
        } catch (e) {
            toast.error('Chyba při mazání');
        }
    }

    const removeRoom = async (roomId: string) => {
        setRooms(prev => prev.filter(r => r.id !== roomId));
        try {
            await supabase.from('checklist_rooms').delete().eq('id', roomId);
        } catch (e) {
            console.error(e);
        }
    };

    const activeChecklist = checklists.find(c => c.id === activeChecklistId);

    const filteredClients = clients.filter(client => {
        const searchLower = clientSearch.toLowerCase();
        return (
            client.name?.toLowerCase().includes(searchLower) ||
            client.email?.toLowerCase().includes(searchLower)
        );
    });

    if (loading && clients.length === 0) return <LoadingOverlay message="Načítám..." />;

    return (
        <Layout>
            <div className="container mx-auto p-4 sm:p-6 pb-24 space-y-6 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                <AdminPageHeader
                    title="Správa Checklistů"
                    description="Vytvářejte a upravujte čistící plány pro klienty"
                    action={
                        <Button variant="outline" size="sm" className="gap-2">
                            <Building2 className="h-4 w-4" />
                            Přehled nemovitostí
                        </Button>
                    }
                />

                <div className="flex flex-col gap-6">


                    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-1000">
                        {/* Glassmorphic Filter Bar */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-2 sm:p-3 rounded-[2.5rem] border border-white/20 shadow-2xl">
                            <div className="flex-1 px-2">
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 transition-colors group-focus-within:text-blue-500" />
                                    <Input
                                        placeholder="Hledat klienta po jméně nebo emailu..."
                                        className="pl-12 h-12 bg-white/50 dark:bg-slate-800/50 border-0 shadow-sm rounded-full focus-visible:ring-2 focus-visible:ring-blue-500/20 transition-all w-full text-base"
                                        value={clientSearch}
                                        onChange={(e) => setClientSearch(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 px-2 lg:px-0">
                                <div className="flex items-center gap-3 bg-white/80 dark:bg-slate-800/80 pl-4 pr-2 h-12 rounded-full border border-white/40 shadow-sm min-w-[240px] transition-all hover:shadow-md">
                                    <User className="h-5 w-5 text-blue-500 shrink-0" />
                                    <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                                        <SelectTrigger className="border-0 bg-transparent shadow-none focus:ring-0 p-0 h-auto font-bold text-slate-700 dark:text-slate-200 text-sm">
                                            <SelectValue placeholder="Vyberte klienta" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-3xl border-white/20 shadow-2xl backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 max-h-[300px]">
                                            {filteredClients.map(client => (
                                                <SelectItem key={client.id} value={client.id} className="rounded-2xl py-2.5">
                                                    {client.name} {client.email ? `(${client.email})` : ''}
                                                </SelectItem>
                                            ))}
                                            {filteredClients.length === 0 && (
                                                <div className="p-4 text-center text-muted-foreground text-sm italic">
                                                    Žádní klienti nenalezeni
                                                </div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Address Switcher Pills (Only if client selected) */}
                        {selectedClientId && (
                            <div className="flex overflow-x-auto pb-1 scrollbar-hide px-2 gap-2">
                                <ToggleGroup
                                    type="single"
                                    value={activeChecklistId || ""}
                                    onValueChange={(val) => val && setActiveChecklistId(val)}
                                    className="justify-start gap-1"
                                >
                                    {checklists.map(c => (
                                        <ToggleGroupItem
                                            key={c.id}
                                            value={c.id}
                                            className="rounded-full px-5 h-10 data-[state=on]:bg-blue-600 data-[state=on]:text-white data-[state=on]:shadow-lg whitespace-nowrap border-0 bg-white/40 dark:bg-slate-800/40 text-[10px] font-black uppercase tracking-widest transition-all gap-2"
                                        >
                                            <MapPin className="h-3.5 w-3.5" />
                                            {c.street || 'Domov'}
                                        </ToggleGroupItem>
                                    ))}

                                    <Dialog open={isNewChecklistOpen} onOpenChange={setIsNewChecklistOpen}>
                                        <DialogTrigger asChild>
                                            <button className="flex items-center gap-2 px-5 h-10 rounded-full border border-white/40 border-dashed hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all text-[10px] font-black uppercase tracking-widest whitespace-nowrap bg-white/20 dark:bg-slate-800/20">
                                                <Plus className="h-3.5 w-3.5" />
                                                Přidat adresu
                                            </button>
                                        </DialogTrigger>
                                        <DialogContent className="rounded-[2.5rem] border-white/20 shadow-2xl backdrop-blur-xl">
                                            <DialogHeader>
                                                <DialogTitle>Nová adresa úklidu</DialogTitle>
                                                <DialogDescription>Pojmenujte tento plán (např. Doma, Kancelář...)</DialogDescription>
                                            </DialogHeader>
                                            <div className="py-4 space-y-3">
                                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Název místa / Adresa</Label>
                                                <Input
                                                    value={newChecklistAddress}
                                                    onChange={e => setNewChecklistAddress(e.target.value)}
                                                    placeholder="Např. Byt v centru"
                                                    className="h-12 bg-white/50 dark:bg-slate-800/50 border-0 shadow-sm rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500/20"
                                                />
                                            </div>
                                            <DialogFooter>
                                                <Button
                                                    onClick={createChecklist}
                                                    disabled={!newChecklistAddress.trim()}
                                                    variant="gradient"
                                                    className="rounded-2xl h-11 px-6 font-bold"
                                                >
                                                    Vytvořit
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </ToggleGroup>
                            </div>
                        )}
                    </div>
                </div>


                {selectedClientId && activeChecklist && (
                    <>
                        {/* Quick Add Bar */}
                        <ScrollArea className="w-full whitespace-nowrap pb-4">
                            <div className="flex gap-4">
                                {ROOM_TYPES.map((type) => (
                                    <button
                                        key={type.id}
                                        onClick={() => addRoom(type.id)}
                                        className={cn(
                                            "flex flex-col items-center gap-2 min-w-[80px] group transition-all",
                                            "hover:scale-105 active:scale-95"
                                        )}
                                    >
                                        <div className={cn(
                                            "h-14 w-14 rounded-2xl flex items-center justify-center shadow-sm transition-shadow group-hover:shadow-md",
                                            type.bg, type.color
                                        )}>
                                            <type.icon className="h-7 w-7" />
                                        </div>
                                        <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">
                                            {type.id}
                                        </span>
                                    </button>
                                ))}
                            </div>
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>


                        {/* Active Rooms Grid */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    {activeChecklist?.street || 'Domov'}
                                </h3>
                            </div>

                            {rooms.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed rounded-3xl bg-slate-50/50 dark:bg-slate-900/50 animate-in fade-in zoom-in duration-300">
                                    <p className="text-muted-foreground">Zatím žádné místnosti.</p>
                                    <p className="text-sm text-muted-foreground/80">Klikněte na ikony nahoře.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {rooms.map((room) => {
                                        const roomType = ROOM_TYPES.find(t => t.id === room.room_name) || ROOM_TYPES[7];

                                        return (
                                            <div key={room.id} className="group relative bg-card border rounded-2xl p-4 hover:shadow-lg transition-all shadow-sm">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn("p-2.5 rounded-xl", roomType.bg, roomType.color)}>
                                                            <roomType.icon className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-lg leading-none">{room.room_name}</h4>
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                {room.tasks?.length || 0} úkonů
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                        onClick={() => removeRoom(room.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>

                                                <div className="space-y-2">
                                                    {(room.tasks || []).map((task: any) => (
                                                        <div key={task.id} className="group/task flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                                            <CheckCircle2 className="h-3.5 w-3.5 text-primary/40 shrink-0" />
                                                            <span className="flex-1 break-words">{task.task_text}</span>
                                                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover/task:opacity-100 transition-opacity text-destructive hover:bg-destructive/10 shrink-0" onClick={() => handleDeleteTask(task.id)}>
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    ))}

                                                    {addingTaskRoomId === room.id ? (
                                                        <div className="flex items-center gap-2 pt-2 animate-in fade-in slide-in-from-top-1">
                                                            <Input
                                                                value={newTaskText}
                                                                onChange={e => setNewTaskText(e.target.value)}
                                                                placeholder="Nový úkol..."
                                                                className="h-8 text-sm"
                                                                autoFocus
                                                                onKeyDown={e => e.key === 'Enter' && handleAddTask(room.id)}
                                                            />
                                                            <Button size="icon" className="h-8 w-8 shrink-0" onClick={() => handleAddTask(room.id)}>
                                                                <Plus className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setAddingTaskRoomId(null)}>
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground hover:text-primary mt-2 border border-dashed border-border/50" onClick={() => {
                                                            setAddingTaskRoomId(room.id);
                                                            setNewTaskText('');
                                                        }}>
                                                            <Plus className="h-3 w-3 mr-1" />
                                                            Přidat úkol
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </Layout>
    );
}
