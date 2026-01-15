import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Plus, Edit, Trash, Upload, FileText, Video, Sparkles } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface EducationalContent {
  id: string;
  title: string;
  description: string | null;
  content_type: 'pdf' | 'video' | 'article';
  category: string;
  file_url: string | null;
  video_url: string | null;
  is_published: boolean;
  created_at: string;
}

const categories = [
  { value: 'basic', label: 'Základní úklid' },
  { value: 'furniture', label: 'Údržba nábytku' },
  { value: 'eco', label: 'Ekologické prostředky' },
  { value: 'chemistry', label: 'Chemie a bezpečnost' },
  { value: 'tips', label: 'Tipy od profesionálů' }
];

export default function ManageEducationalContent() {
  const { user, profile } = useAuth();
  const [content, setContent] = useState<EducationalContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content_type: 'pdf' as 'pdf' | 'video' | 'article',
    category: 'basic',
    video_url: '',
    is_published: false
  });

  const [file, setFile] = useState<File | null>(null);

  if (!user || !profile?.is_admin) {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const { data } = await supabase
        .from('educational_content')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        setContent(data as EducationalContent[]);
      }
    } catch (error) {
      console.error('Error loading content:', error);
      toast({
        title: 'Chyba',
        description: 'Nepodařilo se načíst obsah',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let fileUrl = null;

      // Upload file if provided
      if (file && formData.content_type !== 'video') {
        // Upload directly to Cloudinary
        fileUrl = await uploadToCloudinary(file);
      }

      const contentData = {
        title: formData.title,
        description: formData.description || null,
        content_type: formData.content_type,
        category: formData.category,
        file_url: fileUrl,
        video_url: formData.content_type === 'video' ? formData.video_url : null,
        is_published: formData.is_published
      };

      if (editingId) {
        const { error } = await supabase
          .from('educational_content')
          .update(contentData)
          .eq('id', editingId);

        if (error) throw error;

        toast({
          title: 'Úspěch',
          description: 'Obsah byl aktualizován'
        });
      } else {
        const { error } = await supabase
          .from('educational_content')
          .insert([contentData]);

        if (error) throw error;

        toast({
          title: 'Úspěch',
          description: 'Obsah byl vytvořen'
        });
      }

      resetForm();
      loadContent();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving content:', error);
      toast({
        title: 'Chyba',
        description: 'Nepodařilo se uložit obsah',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (item: EducationalContent) => {
    setEditingId(item.id);
    setFormData({
      title: item.title,
      description: item.description || '',
      content_type: item.content_type,
      category: item.category,
      video_url: item.video_url || '',
      is_published: item.is_published
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Opravdu chcete smazat tento obsah?')) return;

    try {
      const { error } = await supabase
        .from('educational_content')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Úspěch',
        description: 'Obsah byl smazán'
      });

      loadContent();
    } catch (error) {
      console.error('Error deleting content:', error);
      toast({
        title: 'Chyba',
        description: 'Nepodařilo se smazat obsah',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      content_type: 'pdf',
      category: 'basic',
      video_url: '',
      is_published: false
    });
    setFile(null);
    setEditingId(null);
  };

  if (loading) {
    return <LoadingOverlay message="Načítám vzdělávací obsah..." />;
  }

  return (
    <Layout>
      <div className="container mx-auto p-4 sm:p-6 pb-24 space-y-6 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
        <AdminPageHeader
          title="Správa Vzdělávání"
          description="Spravujte vzdělávací materiály a příručky pro klienty"
          action={
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="h-11 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all rounded-xl gap-2"
            >
              <Plus className="h-4 w-4" />
              Přidat Obsah
            </Button>
          }
        />

        <div className="grid gap-6">
          {content.length === 0 ? (
            <Card className="bg-card/50 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden p-12">
              <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="bg-primary/5 p-4 rounded-full">
                  <BookOpen className="h-12 w-12 text-primary opacity-20" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold">Zatím žádný obsah</h3>
                  <p className="text-muted-foreground">Přidejte první vzdělávací materiál pro své klienty.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {content.map((item) => (
                <Card key={item.id} className="bg-card/50 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="bg-primary/10 p-2.5 rounded-2xl">
                        {item.content_type === 'video' ? (
                          <Video className="h-6 w-6 text-primary" />
                        ) : (
                          <FileText className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div className="flex gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(item)}
                          className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item.id)}
                          className="h-8 w-8 rounded-full hover:bg-red-50 hover:text-red-600 text-muted-foreground"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="pt-3 space-y-1">
                      <CardTitle className="text-lg font-bold line-clamp-1">{item.title}</CardTitle>
                      <div className="flex gap-1.5 flex-wrap">
                        <Badge variant="secondary" className="bg-secondary/50 border-0 text-[10px] uppercase font-bold tracking-wider">
                          {categories.find(c => c.value === item.category)?.label}
                        </Badge>
                        <Badge className={cn(
                          "border-0 text-[10px] uppercase font-bold tracking-wider",
                          item.is_published ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                        )}>
                          {item.is_published ? 'Publikováno' : 'Koncept'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {item.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 italic mb-4">
                        "{item.description}"
                      </p>
                    )}
                    <div className="pt-2 border-t border-primary/5 flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground font-medium">
                        Vytvořeno: {new Date(item.created_at).toLocaleDateString('cs-CZ')}
                      </span>
                      {item.file_url ? (
                        <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="text-primary text-xs font-bold hover:underline">
                          Zobrazit PDF
                        </a>
                      ) : item.video_url && (
                        <a href={item.video_url} target="_blank" rel="noopener noreferrer" className="text-primary text-xs font-bold hover:underline">
                          Přehrát video
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogContent className="bg-card/95 backdrop-blur-xl border-white/10 shadow-2xl rounded-[2rem] max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                {editingId ? 'Upravit Obsah' : 'Přidat Nový Obsah'}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Vyplňte informace o vzdělávacím obsahu
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-bold ml-1">Název *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Zadejte název materiálu..."
                  className="h-11 bg-background/50 border-0 shadow-sm rounded-xl focus:ring-2 ring-primary/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-bold ml-1">Popis</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Stručný popis obsahu..."
                  className="bg-background/50 border-0 shadow-inner rounded-2xl min-h-[100px] focus-visible:ring-primary/20"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="content_type" className="text-sm font-bold ml-1">Typ obsahu *</Label>
                  <Select
                    value={formData.content_type}
                    onValueChange={(value: 'pdf' | 'video' | 'article') =>
                      setFormData({ ...formData, content_type: value })
                    }
                  >
                    <SelectTrigger className="h-11 bg-background/50 border-0 shadow-sm rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF dokument</SelectItem>
                      <SelectItem value="video">Video (URL)</SelectItem>
                      <SelectItem value="article">Článek / Text</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-bold ml-1">Kategorie *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className="h-11 bg-background/50 border-0 shadow-sm rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.content_type === 'video' ? (
                <div className="space-y-2">
                  <Label htmlFor="video_url" className="text-sm font-bold ml-1">URL videa (YouTube, Vimeo) *</Label>
                  <Input
                    id="video_url"
                    type="url"
                    value={formData.video_url}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="h-11 bg-background/50 border-0 shadow-sm rounded-xl focus:ring-2 ring-primary/20"
                    required
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="file" className="text-sm font-bold ml-1">Soubor (PDF) {!editingId && '*'}</Label>
                  <div className="relative">
                    <Input
                      id="file"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="h-11 bg-background/50 border-0 shadow-sm rounded-xl focus:ring-2 ring-primary/20 file:bg-primary file:text-white file:border-0 file:rounded-lg file:mr-4 file:px-3 file:py-1 file:text-xs file:font-bold file:cursor-pointer"
                      required={!editingId}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-3 p-4 bg-primary/5 rounded-2xl border border-primary/10 transition-all hover:bg-primary/10">
                <Switch
                  id="is_published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_published: checked })
                  }
                  className="data-[state=checked]:bg-emerald-500"
                />
                <div className="space-y-0.5">
                  <Label htmlFor="is_published" className="text-sm font-bold cursor-pointer">Publikovat ihned</Label>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Obsah bude okamžitě viditelný pro klienty</p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={uploading} className="flex-1 h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-lg border-0 transition-all">
                  {uploading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white animate-spin rounded-full mr-2" />
                      Ukládám...
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5 mr-2" />
                      {editingId ? 'Aktualizovat Obsah' : 'Vytvořit Obsah'}
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1 h-12 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Zrušit
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
