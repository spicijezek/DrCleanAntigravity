import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  ChefHat, Sofa, BedDouble, Bath, Baby, Home, DoorOpen,
  Navigation, Trash2, CheckCircle2, CheckSquare,
  Building2, MapPin, Plus, X, Pencil, HelpCircle, Phone, MessageSquare, Check, HeadphonesIcon
} from 'lucide-react';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { cn } from '@/lib/utils';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { ClientHeroHeader } from '@/components/client/ClientHeroHeader';
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

// --- Constants ---
const ROOM_TYPES = [
  { id: 'Kuchyně', icon: ChefHat, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  { id: 'Obývací pokoj', icon: Sofa, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { id: 'Ložnice', icon: BedDouble, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
  { id: 'Koupelna', icon: Bath, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
  { id: 'Dětský pokoj', icon: Baby, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-900/20' },
  { id: 'Chodba', icon: Navigation, color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-900/20' },
  { id: 'Toaleta', icon: DoorOpen, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-900/20' },
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
  'Jiné': ['Vysát', 'Utřít prach']
};

export default function ClientChecklistManager() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [checklists, setChecklists] = useState<any[]>([]);
  const [activeChecklistId, setActiveChecklistId] = useState<string | null>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [isNewChecklistOpen, setIsNewChecklistOpen] = useState(false);
  const [newChecklistAddress, setNewChecklistAddress] = useState('');
  const [addingTaskRoomId, setAddingTaskRoomId] = useState<string | null>(null);
  const [newTaskText, setNewTaskText] = useState('');
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editingRoomName, setEditingRoomName] = useState('');
  const addressScrollRef = useRef<HTMLDivElement>(null);
  const roomScrollRef = useRef<HTMLDivElement>(null);
  const [hasInteractedWithSlider, setHasInteractedWithSlider] = useState(false);
  const [hasInteractedWithRoomSlider, setHasInteractedWithRoomSlider] = useState(false);
  const interactionRef = useRef(false);
  const roomInteractionRef = useRef(false);
  const animationTimersRef = useRef<any[]>([]);
  const roomAnimationTimersRef = useRef<any[]>([]);

  useEffect(() => {
    animationTimersRef.current.forEach(clearTimeout);
    animationTimersRef.current = [];

    if (checklists.length > 1 && addressScrollRef.current && !hasInteractedWithSlider) {
      const animate = () => {
        if (!addressScrollRef.current || interactionRef.current) return;
        addressScrollRef.current.scrollTo({ left: 100, behavior: 'smooth' });
        const t1 = setTimeout(() => {
          if (!addressScrollRef.current || interactionRef.current) return;
          addressScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
          const t2 = setTimeout(animate, 1000);
          animationTimersRef.current.push(t2);
        }, 800);
        animationTimersRef.current.push(t1);
      };
      const startDelay = setTimeout(animate, 1000);
      animationTimersRef.current.push(startDelay);
      return () => animationTimersRef.current.forEach(clearTimeout);
    }
  }, [checklists.length, hasInteractedWithSlider]);

  useEffect(() => {
    roomAnimationTimersRef.current.forEach(clearTimeout);
    roomAnimationTimersRef.current = [];

    if (roomScrollRef.current && !hasInteractedWithRoomSlider) {
      const animate = () => {
        if (!roomScrollRef.current || roomInteractionRef.current) return;
        roomScrollRef.current.scrollTo({ left: 100, behavior: 'smooth' });
        const t1 = setTimeout(() => {
          if (!roomScrollRef.current || roomInteractionRef.current) return;
          roomScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
          const t2 = setTimeout(animate, 1000);
          roomAnimationTimersRef.current.push(t2);
        }, 800);
        roomAnimationTimersRef.current.push(t1);
      };
      const startDelay = setTimeout(animate, 2500);
      roomAnimationTimersRef.current.push(startDelay);
      return () => roomAnimationTimersRef.current.forEach(clearTimeout);
    }
  }, [hasInteractedWithRoomSlider, rooms.length]);

  const handleSliderInteraction = () => {
    if (interactionRef.current) return;
    setHasInteractedWithSlider(true);
    interactionRef.current = true;
    animationTimersRef.current.forEach(clearTimeout);
  };

  const handleRoomSliderInteraction = () => {
    if (roomInteractionRef.current) return;
    setHasInteractedWithRoomSlider(true);
    roomInteractionRef.current = true;
    roomAnimationTimersRef.current.forEach(clearTimeout);
  };

  useEffect(() => {
    if (!user) return;
    fetchChecklists();
  }, [user]);

  useEffect(() => {
    if (activeChecklistId) {
      fetchRooms(activeChecklistId);
    } else {
      setRooms([]);
    }
  }, [activeChecklistId]);

  const fetchChecklists = async () => {
    try {
      setLoading(true);
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      if (!client) {
        setLoading(false);
        return;
      }

      const { data: fetchedChecklists } = await supabase
        .from('client_checklists')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at');

      if (fetchedChecklists && fetchedChecklists.length > 0) {
        setChecklists(fetchedChecklists);
        setActiveChecklistId(fetchedChecklists[0].id);
      } else {
        // Auto-create a default one
        const { data: newChecklist } = await supabase
          .from('client_checklists')
          .insert({
            client_id: client.id,
            street: 'Domov',
            city: '',
            postal_code: ''
          })
          .select()
          .single();

        if (newChecklist) {
          setChecklists([newChecklist]);
          setActiveChecklistId(newChecklist.id);
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Chyba při načítání.");
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
    if (!newChecklistAddress.trim()) return;

    try {
      const { data: client } = await supabase.from('clients').select('id').eq('user_id', user!.id).single();
      if (!client) return;

      const { data: newChecklist, error } = await supabase
        .from('client_checklists')
        .insert({
          client_id: client.id,
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
      toast.success('Skvělé! Váš úklidový plán byl vytvořen ✨');
    } catch (e) {
      toast.error('Chyba při vytváření plánu');
    }
  };

  const handleRenameRoom = async (roomId: string) => {
    if (!editingRoomName.trim()) {
      setEditingRoomId(null);
      return;
    }

    // Optimistic
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, room_name: editingRoomName } : r));
    setEditingRoomId(null);

    try {
      const { error } = await supabase
        .from('checklist_rooms')
        .update({ room_name: editingRoomName })
        .eq('id', roomId);

      if (error) throw error;
      toast.success('Místnost byla úspěšně přejmenována ✍️');
    } catch (e) {
      toast.error('Chyba při přejmenování');
      if (activeChecklistId) fetchRooms(activeChecklistId);
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
    toast.success('Místnost úspěšně přidána do checklistu ✅');

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
          added_by_role: 'client'
        }));

        await supabase.from('checklist_tasks').insert(tasksToAdd);

        // Refresh to get real IDs
        await fetchRooms(activeChecklistId);

        if (roomType === 'Jiné') {
          setEditingRoomId(savedRoom.id);
          setEditingRoomName('Jiné');
        }

        // Scroll to the new room
        setTimeout(() => {
          const roomElement = document.getElementById(`room-${savedRoom.id}`);
          if (roomElement) {
            roomElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    } catch (error) {
      toast.error("Chyba při ukládání");
      fetchRooms(activeChecklistId); // Revert on error
    }
  };

  const removeRoom = async (roomId: string) => {
    // Optimistic
    setRooms(prev => prev.filter(r => r.id !== roomId));

    try {
      await supabase.from('checklist_rooms').delete().eq('id', roomId);
    } catch (e) {
      console.error(e);
    }
  };

  const deleteChecklist = async () => {
    if (!activeChecklistId) return;

    if (!window.confirm('Opravdu chcete smazat celý tento checklist i se všemi místnostmi?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('client_checklists')
        .delete()
        .eq('id', activeChecklistId);

      if (error) throw error;

      toast.success('Checklist byl úspěšně smazán');
      const remaining = checklists.filter(c => c.id !== activeChecklistId);
      setChecklists(remaining);
      if (remaining.length > 0) {
        setActiveChecklistId(remaining[0].id);
      } else {
        setActiveChecklistId(null);
        // Maybe fetch again to trigger default creation or just leave empty
      }
    } catch (e) {
      toast.error('Chyba při mazání checklistu');
    }
  };

  const handleAddTask = async (roomId: string) => {
    if (!newTaskText.trim()) return;
    try {
      const { error } = await supabase.from('checklist_tasks').insert({
        room_id: roomId,
        task_text: newTaskText,
        added_by: user!.id,
        added_by_role: 'client',
        sort_order: 999
      });
      if (error) throw error;
      setNewTaskText('');
      setAddingTaskRoomId(null);
      if (activeChecklistId) fetchRooms(activeChecklistId);
      toast.success('Úkol přidán');
    } catch (e) {
      toast.error('Chyba při přidávání');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase.from('checklist_tasks').delete().eq('id', taskId);
      if (error) throw error;
      if (activeChecklistId) fetchRooms(activeChecklistId);
      toast.success('Úkol smazán');
    } catch (e) {
      toast.error('Chyba při mazání');
    }
  }

  if (loading) return <LoadingOverlay message="Načítám váš plán..." />;

  const activeChecklist = checklists.find(c => c.id === activeChecklistId);

  return (
    <div className="container mx-auto px-4 pt-6 pb-24 space-y-6 max-w-4xl">
      <div className="flex flex-col gap-4">
        <ClientHeroHeader
          icon={Building2}
          title="Můj Úklidový Plán"
          subtitle="Spravujte místnosti a úkoly pro každou svou nemovitost"
          stats={[
            { icon: Home, label: "Místností", value: rooms.length },
            { icon: CheckCircle2, label: "Úkonů", value: rooms.reduce((acc, r) => acc + (r.tasks?.length || 0), 0) }
          ]}
        />

        {/* Address Switcher */}
        <div
          ref={addressScrollRef}
          onPointerDown={handleSliderInteraction}
          onWheel={handleSliderInteraction}
          onTouchStart={handleSliderInteraction}
          onMouseDown={handleSliderInteraction}
          className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-1 px-1"
        >
          {checklists.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveChecklistId(c.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full border transition-all whitespace-nowrap",
                activeChecklistId === c.id
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background text-muted-foreground hover:bg-muted"
              )}
            >
              <MapPin className="h-4 w-4" />
              {c.street || 'Domov'}
            </button>
          ))}

          <Dialog open={isNewChecklistOpen} onOpenChange={setIsNewChecklistOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-dashed hover:bg-muted/50 transition-all text-muted-foreground whitespace-nowrap">
                <Plus className="h-4 w-4" />
                Přidat checklist
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] p-8">
              <DialogHeader className="gap-2">
                <DialogTitle className="text-2xl">Nový checklist</DialogTitle>
                <DialogDescription className="text-base text-muted-foreground">
                  Pojmenujte tento úklidový plán (např. Doma, Chata, Kancelář...)
                </DialogDescription>
              </DialogHeader>
              <div className="py-6">
                <Label className="text-sm font-semibold mb-3 block">Název místa / Adresa</Label>
                <Input
                  value={newChecklistAddress}
                  onChange={e => setNewChecklistAddress(e.target.value)}
                  placeholder="Např. Můj domov"
                  className="h-12 text-lg px-4"
                  autoFocus
                />
              </div>
              <DialogFooter className="sm:justify-end">
                <Button
                  onClick={createChecklist}
                  disabled={!newChecklistAddress.trim()}
                  className="h-12 px-8 text-base font-semibold"
                >
                  Vytvořit plán
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick Add Bar */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Přidat Místnost</h3>
        <div
          ref={roomScrollRef}
          onPointerDown={handleRoomSliderInteraction}
          onWheel={handleRoomSliderInteraction}
          onTouchStart={handleRoomSliderInteraction}
          onMouseDown={handleRoomSliderInteraction}
          className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-1 px-1"
        >
          {ROOM_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => addRoom(type.id)}
              className={cn(
                "flex flex-col items-center gap-2 min-w-[80px] group transition-all shrink-0",
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
      </div>

      {/* Active Rooms Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {activeChecklist?.street || 'Váš Domov'}
          </h3>
        </div>

        {rooms.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-3xl bg-slate-50/50 dark:bg-slate-900/50 animate-in fade-in zoom-in duration-300">
            <p className="text-muted-foreground">Zatím jste nepřidali žádné místnosti.</p>
            <p className="text-sm text-muted-foreground/80">Klikněte na ikony nahoře pro začátek.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {rooms.map((room) => {
              const roomType = ROOM_TYPES.find(t => t.id === room.room_name) || ROOM_TYPES[7];

              return (
                <div
                  key={room.id}
                  id={`room-${room.id}`}
                  className="group relative bg-card border rounded-2xl p-4 hover:shadow-lg transition-all shadow-sm"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 w-full">
                      <div className={cn("p-2.5 rounded-xl transition-transform group-hover:scale-110", roomType.bg, roomType.color)}>
                        <roomType.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {editingRoomId === room.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editingRoomName}
                              onChange={e => setEditingRoomName(e.target.value)}
                              className="h-8 py-0 px-2 text-base font-semibold"
                              autoFocus
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleRenameRoom(room.id);
                                if (e.key === 'Escape') setEditingRoomId(null);
                              }}
                            />
                            <Button
                              size="icon"
                              className="h-8 w-8 shrink-0 bg-green-500 hover:bg-green-600"
                              onClick={() => handleRenameRoom(room.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 group/title">
                            <h4 className="font-semibold text-lg leading-tight truncate">{room.room_name}</h4>
                            <button
                              onClick={() => {
                                setEditingRoomId(room.id);
                                setEditingRoomName(room.room_name);
                              }}
                              className="p-1 hover:bg-muted rounded transition-colors"
                              title="Přejmenovat"
                            >
                              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">
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

      {/* Delete Checklist Button */}
      {
        checklists.length > 1 && (
          <div className="flex justify-center pt-8">
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors py-6 px-8 rounded-2xl"
              onClick={deleteChecklist}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Smazat tento checklist
            </Button>
          </div>
        )
      }

      {/* Support Section */}
      <div className="pt-12 pb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="max-w-md mx-auto">
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800/50 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800 transition-all hover:shadow-lg group shadow-sm text-center">
            {/* Bubble Animation Background */}
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/5 animate-float-circle-1 pointer-events-none" />
            <div className="absolute -right-2 top-16 h-16 w-16 rounded-full bg-primary/10 animate-float-circle-2 pointer-events-none" />
            <div className="absolute -left-4 -bottom-4 h-24 w-24 rounded-full bg-primary/5 blur-xl animate-pulse pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center space-y-4">
              <div className="h-14 w-14 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center border border-slate-100 dark:border-slate-700 text-primary group-hover:scale-110 transition-transform duration-300">
                <HeadphonesIcon className="h-7 w-7" />
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-lg text-foreground tracking-tight">Potřebujete s něčím pomoci?</h4>
                <p className="text-sm text-muted-foreground">Jsme tu pro vás, abychom vám pomohli s nastavením vašeho checklistu.</p>
              </div>

              <PremiumButton
                className="w-full py-2.5 rounded-2xl text-base"
                onClick={() => window.location.href = 'tel:+420777645610'}
              >
                <Phone className="h-4 w-4" />
                Zavolat podporu
              </PremiumButton>
            </div>
          </div>
        </div>
      </div>
    </div >
  );
}
