import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ModalOverlay } from '@/components/ui/modal-overlay';
import { X, FileText, Tag, AlignLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Protocol {
  id: string;
  title: string;
  description: string;
  tags: string[];
}

interface EditProtocolFormProps {
  protocol: Protocol;
  onClose: () => void;
  onProtocolUpdated: () => void;
}

export function EditProtocolForm({ protocol, onClose, onProtocolUpdated }: EditProtocolFormProps) {
  const [formData, setFormData] = useState({
    title: protocol.title,
    description: protocol.description || '',
    tags: protocol.tags?.join(', ') || ''
  });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const { error } = await supabase
        .from('protocols')
        .update({
          title: formData.title,
          description: formData.description,
          tags: tagsArray,
          updated_at: new Date().toISOString()
        })
        .eq('id', protocol.id);

      if (error) throw error;

      toast({
        title: 'Úspěch',
        description: 'Protokol byl úspěšně aktualizován',
      });

      onProtocolUpdated();
    } catch (error: any) {
      toast({
        title: 'Chyba',
        description: error.message || 'Nepodařilo se aktualizovat protokol',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <ModalOverlay>
      <div className="w-full max-w-2xl px-4 py-8 pointer-events-none">
        <Card className="pointer-events-auto border-0 shadow-2xl rounded-[2.5rem] overflow-hidden bg-background/95 backdrop-blur-xl relative">
          <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-primary to-primary/60" />

          <CardHeader className="flex flex-row items-center justify-between p-8 pb-4">
            <CardTitle className="text-2xl font-bold tracking-tight">Upravit protokol</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-muted/50 transition-colors">
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent className="p-8 pt-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> Název *
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Název protokolu"
                  required
                  className="rounded-xl border-primary/20 focus:border-primary focus:ring-primary/20 h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold flex items-center gap-2">
                  <AlignLeft className="h-4 w-4 text-primary" /> Popis
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Stručný popis obsahu..."
                  rows={3}
                  className="rounded-xl border-primary/20 focus:border-primary focus:ring-primary/20 min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags" className="text-sm font-semibold flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary" /> Štítky (oddělené čárkou)
                </Label>
                <Input
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="např. úklid, bezpečnost, postupy"
                  className="rounded-xl border-primary/20 focus:border-primary focus:ring-primary/20 h-11"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button type="button" variant="outline" onClick={onClose} className="rounded-xl border-primary/20 px-8">
                  Zrušit
                </Button>
                <Button type="submit" disabled={loading} className="rounded-xl bg-primary px-12 h-11 font-bold">
                  {loading ? 'Ukládám...' : 'Uložit změny'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </ModalOverlay>
  );
}