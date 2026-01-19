import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Upload, FileText, Tag, AlignLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ModalOverlay } from '@/components/ui/modal-overlay';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { cn } from '@/lib/utils';

interface AddProtocolFormProps {
  onClose: () => void;
  onProtocolAdded: () => void;
}

export function AddProtocolForm({ onClose, onProtocolAdded }: AddProtocolFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!file) {
      toast({
        title: 'Vyberte soubor',
        description: 'Prosím vyberte PDF nebo Word dokument',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const cloudinaryUrl = await uploadToCloudinary(file);

      const protocolData = {
        title: formData.title,
        description: formData.description || null,
        file_name: file.name,
        file_path: cloudinaryUrl,
        file_size: file.size,
        mime_type: file.type,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : null,
        user_id: user.id,
      };

      const { error: dbError } = await supabase
        .from('protocols')
        .insert(protocolData);

      if (dbError) throw dbError;

      toast({
        title: 'Úspěch',
        description: 'Protokol byl úspěšně nahrán',
      });

      onProtocolAdded();
    } catch (error: any) {
      toast({
        title: 'Chyba',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast({
          title: 'Neplatný typ souboru',
          description: 'Prosím vyberte PDF nebo Word dokument',
          variant: 'destructive',
        });
        return;
      }

      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: 'Soubor je příliš velký',
          description: 'Prosím vyberte soubor menší než 10MB',
          variant: 'destructive',
        });
        return;
      }

      setFile(selectedFile);
    }
  };

  return (
    <ModalOverlay>
      <div className="w-full max-w-2xl px-4 py-8 pointer-events-none">
        <Card className="pointer-events-auto border-0 shadow-2xl rounded-[2.5rem] overflow-hidden bg-background/95 backdrop-blur-xl relative">
          <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-primary to-primary/60" />

          <CardHeader className="flex flex-row items-center justify-between p-8 pb-4">
            <CardTitle className="text-2xl font-bold tracking-tight">Přidat protokol</CardTitle>
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

              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Upload className="h-4 w-4 text-primary" /> Dokument *
                </Label>
                <div
                  className={cn(
                    "border-2 border-dashed rounded-[2rem] p-8 transition-all cursor-pointer",
                    file ? "border-primary bg-primary/5" : "border-primary/20 hover:border-primary/40 hover:bg-muted/50"
                  )}
                  onClick={() => document.getElementById('file')?.click()}
                >
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Upload className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-sm font-medium mb-1">
                      {file ? file.name : 'Vyberte soubor nebo jej přetáhněte sem'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      PDF, DOC, DOCX do 10MB
                    </div>
                    <Input
                      id="file"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button type="button" variant="outline" onClick={onClose} className="rounded-xl border-primary/20 px-8">
                  Zrušit
                </Button>
                <Button type="submit" disabled={loading} className="rounded-xl bg-primary px-12 h-11 font-bold">
                  {loading ? 'Nahrávám...' : 'Přidat protokol'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </ModalOverlay>
  );
}