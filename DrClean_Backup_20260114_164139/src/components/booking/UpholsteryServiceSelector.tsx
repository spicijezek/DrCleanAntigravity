import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, Sofa, Armchair, BedDouble, LayoutGrid, Layers } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useIsMobile } from '@/hooks/use-mobile';

type UpholsteryItem = 'koberce' | 'sedacka' | 'matrace' | 'kresla' | 'zidle';

interface UpholsteryData {
  koberce: boolean;
  typ_koberec: string;
  plocha_koberec: number;
  znecisteni_koberec: string;
  sedacka: boolean;
  velikost_sedacka: string;
  znecisteni_sedacka: string;
  matrace: boolean;
  velikost_matrace: string;
  strany_matrace: string;
  znecisteni_matrace: string;
  kresla: boolean;
  pocet_kresla: number;
  znecisteni_kresla: string;
  zidle: boolean;
  pocet_zidle: number;
  znecisteni_zidle: string;
}

interface UpholsteryServiceSelectorProps {
  data: UpholsteryData;
  onChange: (data: Partial<UpholsteryData>) => void;
}

const upholsteryItems: { id: UpholsteryItem; label: string; icon: React.ElementType }[] = [
  { id: 'koberce', label: 'Koberce', icon: LayoutGrid },
  { id: 'sedacka', label: 'Sedačka', icon: Sofa },
  { id: 'matrace', label: 'Matrace', icon: BedDouble },
  { id: 'kresla', label: 'Křeslo', icon: Armchair },
  { id: 'zidle', label: 'Židle', icon: Layers },
];

export function UpholsteryServiceSelector({ data, onChange }: UpholsteryServiceSelectorProps) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  const selectedItems = upholsteryItems.filter(item => data[item.id]);
  const selectedCount = selectedItems.length;

  const toggleItem = (id: UpholsteryItem) => {
    onChange({ [id]: !data[id] });
  };

  const renderItemDetails = (itemId: UpholsteryItem) => {
    switch (itemId) {
      case 'koberce':
        return (
          <div className="space-y-3 p-3 bg-muted/30 rounded-lg mt-2">
            <div className="space-y-2">
              <Label className="text-sm">Typ koberce</Label>
              {isMobile ? (
                <select
                  className="h-11 w-full rounded-lg border border-input bg-background px-3 pr-8 text-base appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat"
                  value={data.typ_koberec}
                  onChange={e => onChange({ typ_koberec: e.target.value })}
                >
                  <option value="Kusový">Kusový</option>
                  <option value="Pokládkový – krátký vlas">Pokládkový – krátký vlas</option>
                  <option value="Pokládkový – dlouhý vlas">Pokládkový – dlouhý vlas</option>
                </select>
              ) : (
                <Select value={data.typ_koberec} onValueChange={v => onChange({ typ_koberec: v })}>
                  <SelectTrigger className="bg-background h-11 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="Kusový">Kusový</SelectItem>
                    <SelectItem value="Pokládkový – krátký vlas">Pokládkový – krátký vlas</SelectItem>
                    <SelectItem value="Pokládkový – dlouhý vlas">Pokládkový – dlouhý vlas</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">Plocha (m²)</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  className="h-11 rounded-lg bg-background"
                  value={data.plocha_koberec || ''}
                  onChange={e => onChange({ plocha_koberec: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Znečištění</Label>
                {isMobile ? (
                <select
                  className="h-11 w-full rounded-lg border border-input bg-background px-3 pr-8 text-base appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat"
                  value={data.znecisteni_koberec}
                  onChange={e => onChange({ znecisteni_koberec: e.target.value })}
                >
                    <option value="Nízké">Nízké</option>
                    <option value="Střední">Střední</option>
                    <option value="Vysoké">Vysoké</option>
                  </select>
                ) : (
                  <Select value={data.znecisteni_koberec} onValueChange={v => onChange({ znecisteni_koberec: v })}>
                    <SelectTrigger className="bg-background h-11 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="Nízké">Nízké</SelectItem>
                      <SelectItem value="Střední">Střední</SelectItem>
                      <SelectItem value="Vysoké">Vysoké</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>
        );

      case 'sedacka':
        return (
          <div className="space-y-3 p-3 bg-muted/30 rounded-lg mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">Velikost</Label>
                {isMobile ? (
                <select
                  className="h-11 w-full rounded-lg border border-input bg-background px-3 pr-8 text-base appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat"
                  value={data.velikost_sedacka}
                  onChange={e => onChange({ velikost_sedacka: e.target.value })}
                >
                    <option value="2-místná">2-místná</option>
                    <option value="3-místná">3-místná</option>
                    <option value="4-místná">4-místná</option>
                    <option value="5-místná">5-místná</option>
                    <option value="6-místná">6-místná</option>
                  </select>
                ) : (
                  <Select value={data.velikost_sedacka} onValueChange={v => onChange({ velikost_sedacka: v })}>
                    <SelectTrigger className="bg-background h-11 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="2-místná">2-místná</SelectItem>
                      <SelectItem value="3-místná">3-místná</SelectItem>
                      <SelectItem value="4-místná">4-místná</SelectItem>
                      <SelectItem value="5-místná">5-místná</SelectItem>
                      <SelectItem value="6-místná">6-místná</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Znečištění</Label>
                {isMobile ? (
                <select
                  className="h-11 w-full rounded-lg border border-input bg-background px-3 pr-8 text-base appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat"
                  value={data.znecisteni_sedacka}
                  onChange={e => onChange({ znecisteni_sedacka: e.target.value })}
                >
                    <option value="Nízké">Nízké</option>
                    <option value="Střední">Střední</option>
                    <option value="Vysoké">Vysoké</option>
                  </select>
                ) : (
                  <Select value={data.znecisteni_sedacka} onValueChange={v => onChange({ znecisteni_sedacka: v })}>
                    <SelectTrigger className="bg-background h-11 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="Nízké">Nízké</SelectItem>
                      <SelectItem value="Střední">Střední</SelectItem>
                      <SelectItem value="Vysoké">Vysoké</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>
        );

      case 'matrace':
        return (
          <div className="space-y-3 p-3 bg-muted/30 rounded-lg mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">Velikost</Label>
                {isMobile ? (
                <select
                  className="h-11 w-full rounded-lg border border-input bg-background px-3 pr-8 text-base appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat"
                  value={data.velikost_matrace}
                  onChange={e => onChange({ velikost_matrace: e.target.value })}
                >
                    <option value="90">90 cm</option>
                    <option value="140">140 cm</option>
                    <option value="160">160 cm</option>
                    <option value="180">180 cm</option>
                    <option value="200">200 cm</option>
                  </select>
                ) : (
                  <Select value={data.velikost_matrace} onValueChange={v => onChange({ velikost_matrace: v })}>
                    <SelectTrigger className="bg-background h-11 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="90">90 cm</SelectItem>
                      <SelectItem value="140">140 cm</SelectItem>
                      <SelectItem value="160">160 cm</SelectItem>
                      <SelectItem value="180">180 cm</SelectItem>
                      <SelectItem value="200">200 cm</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Strany</Label>
                {isMobile ? (
                <select
                  className="h-11 w-full rounded-lg border border-input bg-background px-3 pr-8 text-base appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat"
                  value={data.strany_matrace}
                  onChange={e => onChange({ strany_matrace: e.target.value })}
                >
                    <option value="1 strana">1 strana</option>
                    <option value="obě strany">obě strany</option>
                  </select>
                ) : (
                  <Select value={data.strany_matrace} onValueChange={v => onChange({ strany_matrace: v })}>
                    <SelectTrigger className="bg-background h-11 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="1 strana">1 strana</SelectItem>
                      <SelectItem value="obě strany">obě strany</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Znečištění</Label>
              {isMobile ? (
                <select
                  className="h-11 w-full rounded-lg border border-input bg-background px-3 pr-8 text-base appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat"
                  value={data.znecisteni_matrace}
                  onChange={e => onChange({ znecisteni_matrace: e.target.value })}
                >
                  <option value="Nízké">Nízké</option>
                  <option value="Střední">Střední</option>
                  <option value="Vysoké">Vysoké</option>
                </select>
              ) : (
                <Select value={data.znecisteni_matrace} onValueChange={v => onChange({ znecisteni_matrace: v })}>
                  <SelectTrigger className="bg-background h-11 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="Nízké">Nízké</SelectItem>
                    <SelectItem value="Střední">Střední</SelectItem>
                    <SelectItem value="Vysoké">Vysoké</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        );

      case 'kresla':
        return (
          <div className="space-y-3 p-3 bg-muted/30 rounded-lg mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">Počet</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  className="h-11 rounded-lg bg-background"
                  value={data.pocet_kresla || ''}
                  onChange={e => onChange({ pocet_kresla: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Znečištění</Label>
                {isMobile ? (
                <select
                  className="h-11 w-full rounded-lg border border-input bg-background px-3 pr-8 text-base appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat"
                  value={data.znecisteni_kresla}
                  onChange={e => onChange({ znecisteni_kresla: e.target.value })}
                >
                    <option value="Nízké">Nízké</option>
                    <option value="Střední">Střední</option>
                    <option value="Vysoké">Vysoké</option>
                  </select>
                ) : (
                  <Select value={data.znecisteni_kresla} onValueChange={v => onChange({ znecisteni_kresla: v })}>
                    <SelectTrigger className="bg-background h-11 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="Nízké">Nízké</SelectItem>
                      <SelectItem value="Střední">Střední</SelectItem>
                      <SelectItem value="Vysoké">Vysoké</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>
        );

      case 'zidle':
        return (
          <div className="space-y-3 p-3 bg-muted/30 rounded-lg mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">Počet</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  className="h-11 rounded-lg bg-background"
                  value={data.pocet_zidle || ''}
                  onChange={e => onChange({ pocet_zidle: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Znečištění</Label>
                {isMobile ? (
                <select
                  className="h-11 w-full rounded-lg border border-input bg-background px-3 pr-8 text-base appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat"
                  value={data.znecisteni_zidle}
                  onChange={e => onChange({ znecisteni_zidle: e.target.value })}
                >
                    <option value="Nízké">Nízké</option>
                    <option value="Střední">Střední</option>
                    <option value="Vysoké">Vysoké</option>
                  </select>
                ) : (
                  <Select value={data.znecisteni_zidle} onValueChange={v => onChange({ znecisteni_zidle: v })}>
                    <SelectTrigger className="bg-background h-11 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="Nízké">Nízké</SelectItem>
                      <SelectItem value="Střední">Střední</SelectItem>
                      <SelectItem value="Vysoké">Vysoké</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <section className="space-y-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button 
            type="button"
            className="grid grid-cols-[1fr_auto] items-center w-full h-11 px-3 pr-4 rounded-lg border border-input bg-background hover:bg-muted/50 transition-colors"
          >
            <span className="text-sm font-medium truncate text-left">
              {selectedCount === 0 
                ? 'Vyberte čalounění' 
                : `Vybráno: ${selectedItems.map(i => i.label).join(', ')}`
              }
            </span>
            <ChevronDown className={`h-4 w-4 ml-3 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="pt-3">
          <div className="space-y-2 p-3 rounded-lg border bg-card">
            {upholsteryItems.map(item => {
              const Icon = item.icon;
              const isSelected = data[item.id];
              return (
                <div key={item.id}>
                  {/* Selection row with oval checkbox */}
                  <div
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-primary/10 border-primary ring-2 ring-primary/20' 
                        : 'bg-card border-border hover:border-primary/50'
                    }`}
                    onClick={() => toggleItem(item.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                      }`}>
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-background" />}
                      </div>
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                  </div>
                  
                  {/* Details appear directly under selected item */}
                  {isSelected && renderItemDetails(item.id)}
                </div>
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </section>
  );
}
