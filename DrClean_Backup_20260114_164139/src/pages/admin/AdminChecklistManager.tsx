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
            <div className="container mx-auto p-4 sm:p-6 pb-24 space-y-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black tracking-tight text-foreground/90">Správa Checklistů</h1>
                        <p className="text-muted-foreground font-medium flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-primary/60" />
                            Vytvářejte a upravujte čistící plány pro klienty
                        </p>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-[1.25rem] h-11 px-6 font-black shadow-sm transition-all hover:scale-105 active:scale-95 border-primary/20 text-primary hover:bg-primary/5 gap-2">
                        <Building2 className="h-4 w-4" />
                        Přehled nemovitostí
                    </Button>
                </div>

                <div className="flex flex-col gap-8">
                    {/* Glassmorphic Filter Bar */}
                    <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-4 sm:p-4 rounded-[2.5rem] border border-white/20 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-1000 space-y-4">
                        <div className="flex flex-col lg:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 transition-colors group-focus-within:text-primary" />
                                    <Input
                                        placeholder="Hledat klienta po jméně nebo emailu..."
                                        className="pl-12 h-14 bg-white/50 dark:bg-slate-800/50 border-0 shadow-sm rounded-2xl focus-visible:ring-2 focus-visible:ring-primary/20 transition-all w-full text-base font-medium"
                                        value={clientSearch}
                                        onChange={(e) => setClientSearch(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 bg-white/80 dark:bg-slate-800/80 pl-4 pr-2 h-14 rounded-2xl border border-white/40 shadow-sm min-w-[300px] transition-all hover:shadow-md">
                                <User className="h-5 w-5 text-primary shrink-0" />
                                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                                    <SelectTrigger className="border-0 bg-transparent shadow-none focus:ring-0 p-0 h-auto font-black text-slate-700 dark:text-slate-200 text-base">
                                        <SelectValue placeholder="Vyberte klienta" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-[2rem] border-white/20 shadow-2xl backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 max-h-[400px]">
                                        {filteredClients.map(client => (
                                            <SelectItem key={client.id} value={client.id} className="rounded-xl py-3 px-4 font-bold">
                                                {client.name} {client.email ? `(${client.email})` : ''}
                                            </SelectItem>
                                        ))}
                                        {filteredClients.length === 0 && (
                                            <div className="p-6 text-center text-muted-foreground text-sm font-medium italic">
                                                Žádní klienti nenalezeni
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Address Switcher Pills */}
                        {selectedClientId && (
                            <div className="flex overflow-x-auto pb-1 scrollbar-hide gap-3 pt-2">
                                <ToggleGroup
                                    type="single"
                                    value={activeChecklistId || ""}
                                    onValueChange={(val) => val && setActiveChecklistId(val)}
                                    className="justify-start gap-2"
                                >
                                    {checklists.map(c => (
                                        <ToggleGroupItem
                                            key={c.id}
                                            value={c.id}
                                            className="rounded-full px-6 h-11 data-[state=on]:bg-primary data-[state=on]:text-white data-[state=on]:shadow-lg whitespace-nowrap border border-slate-200/50 bg-white/60 dark:bg-slate-800/60 text-[10px] font-black uppercase tracking-widest transition-all gap-2"
                                        >
                                            <MapPin className="h-3.5 w-3.5" />
                                            {c.street || 'Domov'}
                                        </ToggleGroupItem>
                                    ))}

                                    <Dialog open={isNewChecklistOpen} onOpenChange={setIsNewChecklistOpen}>
                                        <DialogTrigger asChild>
                                            <button className="flex items-center gap-2 px-6 h-11 rounded-full border border-primary/40 border-dashed hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all text-[10px] font-black uppercase tracking-widest whitespace-nowrap bg-primary/5 text-primary">
                                                <Plus className="h-3.5 w-3.5" />
                                                Přidat adresu
                                            </button>
                                        </DialogTrigger>
                                        <DialogContent className="rounded-[2.5rem] border-white/20 shadow-2xl backdrop-blur-xl bg-white/95 dark:bg-slate-900/95">
                                            <DialogHeader className="space-y-3">
                                                <DialogTitle className="text-2xl font-black tracking-tight">Nová adresa úklidu</DialogTitle>
                                                <DialogDescription className="text-base font-medium">Pojmenujte tento plán (např. Doma, Kancelář...)</DialogDescription>
                                            </DialogHeader>
                                            <div className="py-6 space-y-3">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-1">Název místa / Adresa</Label>
                                                <Input
                                                    value={newChecklistAddress}
                                                    onChange={e => setNewChecklistAddress(e.target.value)}
                                                    placeholder="Např. Byt v centru"
                                                    className="h-14 bg-slate-50 dark:bg-slate-800/50 border-0 shadow-sm rounded-2xl focus-visible:ring-2 focus-visible:ring-primary/20 text-lg font-bold"
                                                />
                                            </div>
                                            <DialogFooter>
                                                <Button
                                                    onClick={createChecklist}
                                                    disabled={!newChecklistAddress.trim()}
                                                    className="rounded-2xl h-14 px-10 font-black text-lg shadow-xl shadow-primary/20 transition-all hover:scale-105"
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
                    <div className="space-y-8 animate-in fade-in zoom-in duration-1000">
                        {/* Quick Add Bar */}
                        <div className="bg-white/30 dark:bg-slate-800/30 backdrop-blur-lg p-6 rounded-[2.5rem] border border-white/20">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-6 px-4">Rychle přidat místnost</p>
                            <ScrollArea className="w-full whitespace-nowrap">
                                <div className="flex gap-6 px-2">
                                    {ROOM_TYPES.map((type) => (
                                        <button
                                            key={type.id}
                                            onClick={() => addRoom(type.id)}
                                            className={cn(
                                                "flex flex-col items-center gap-3 min-w-[100px] group transition-all",
                                                "hover:scale-110 active:scale-95"
                                            )}
                                        >
                                            <div className={cn(
                                                "h-16 w-16 rounded-[1.5rem] flex items-center justify-center shadow-lg transition-all group-hover:shadow-2xl",
                                                type.bg, type.color
                                            )}>
                                                <type.icon className="h-8 w-8" />
                                            </div>
                                            <span className="text-xs font-black uppercase tracking-tighter text-muted-foreground/60 group-hover:text-foreground">
                                                {type.id}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                                <ScrollBar orientation="horizontal" className="hidden" />
                            </ScrollArea>
                        </div>

                        {/* Active Rooms Grid */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-base font-black text-foreground/80 uppercase tracking-widest flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <MapPin className="h-4 w-4" />
                                    </div>
                                    {activeChecklist?.street || 'Domov'}
                                </h3>
                            </div>

                            {rooms.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-24 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[3rem] border border-white/20 shadow-xl animate-in fade-in zoom-in duration-700">
                                    <div className="h-20 w-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 mb-6 shadow-inner">
                                        <Home className="h-10 w-10" />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Zatím žádné místnosti</h3>
                                    <p className="text-muted-foreground font-medium text-center max-w-xs">
                                        Klikněte na ikony nahoře a začněte sestavovat čistící plán.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-24 duration-500">
                                    {rooms.map((room) => {
                                        const roomType = ROOM_TYPES.find(t => t.id === room.room_name) || ROOM_TYPES[7];

                                        return (
                                            <Card key={room.id} className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] bg-white dark:bg-slate-900/80 backdrop-blur-sm">
                                                <div className={cn(
                                                    "absolute left-0 top-0 bottom-0 w-2 z-10 transition-all duration-500 bg-current opacity-100",
                                                    roomType.color.replace('text-', 'bg-')
                                                )} />

                                                <CardContent className="p-7 space-y-6">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shadow-sm", roomType.bg, roomType.color)}>
                                                                <roomType.icon className="h-6 w-6" />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-xl font-black tracking-tight text-foreground/90 leading-none">{room.room_name}</h4>
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mt-1.5 leading-none">
                                                                    {room.tasks?.length || 0} PRACOVNÍCH ÚKONŮ
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-10 w-10 rounded-2xl bg-red-50 hover:bg-red-100/50 text-red-500 transition-all hover:scale-110 shadow-sm shrink-0"
                                                            onClick={() => removeRoom(room.id)}
                                                        >
                                                            <Trash2 className="h-5 w-5" />
                                                        </Button>
                                                    </div>

                                                    <div className="space-y-3">
                                                        {(room.tasks || []).map((task: any) => (
                                                            <div key={task.id} className="group/task flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/30 p-3.5 rounded-2xl hover:bg-white hover:shadow-md transition-all duration-300 border border-transparent hover:border-slate-100">
                                                                <CheckCircle2 className="h-4 w-4 text-emerald-500/40 group-hover/task:text-emerald-500 shrink-0 transition-colors" />
                                                                <span className="flex-1 break-words">{task.task_text}</span>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 rounded-full opacity-0 group-hover/task:opacity-100 transition-all text-red-400 hover:text-red-500 hover:bg-red-50 shrink-0"
                                                                    onClick={() => handleDeleteTask(task.id)}
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>
                                                        ))}

                                                        {addingTaskRoomId === room.id ? (
                                                            <div className="flex items-center gap-3 pt-3 animate-in fade-in slide-in-from-top-2">
                                                                <Input
                                                                    value={newTaskText}
                                                                    onChange={e => setNewTaskText(e.target.value)}
                                                                    placeholder="Např. Vyčistit spáry..."
                                                                    className="h-11 bg-slate-50 dark:bg-slate-800/50 border-0 shadow-sm rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold"
                                                                    autoFocus
                                                                    onKeyDown={e => e.key === 'Enter' && handleAddTask(room.id)}
                                                                />
                                                                <Button
                                                                    size="icon"
                                                                    className="h-11 w-11 rounded-xl shrink-0 shadow-lg shadow-primary/20"
                                                                    onClick={() => handleAddTask(room.id)}
                                                                >
                                                                    <Plus className="h-5 w-5" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-11 w-11 rounded-xl shrink-0 bg-slate-100 hover:bg-slate-200"
                                                                    onClick={() => setAddingTaskRoomId(null)}
                                                                >
                                                                    <X className="h-5 w-5 text-slate-500" />
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <Button
                                                                variant="ghost"
                                                                className="w-full h-11 rounded-2xl text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 hover:text-primary hover:bg-primary/5 mt-2 border-2 border-dashed border-slate-100 transition-all hover:scale-[1.02]"
                                                                onClick={() => {
                                                                    setAddingTaskRoomId(room.id);
                                                                    setNewTaskText('');
                                                                }}
                                                            >
                                                                <Plus className="h-3.5 w-3.5 mr-2" />
                                                                Přidat úkol
                                                            </Button>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
