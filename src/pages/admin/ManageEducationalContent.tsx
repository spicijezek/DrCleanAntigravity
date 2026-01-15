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
import { BookOpen, Plus, Edit, Trash, Upload, FileText, Video } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { uploadToCloudinary } from '@/lib/cloudinary';
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BookOpen className="h-8 w-8" />
              Správa Vzdělávacího Obsahu
            </h1>
            <p className="text-muted-foreground mt-2">
              Spravujte vzdělávací materiály pro klienty
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Přidat Obsah
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? 'Upravit Obsah' : 'Přidat Nový Obsah'}
                </DialogTitle>
                <DialogDescription>
                  Vyplňte informace o vzdělávacím obsahu
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Název *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Popis</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="content_type">Typ obsahu *</Label>
                    <Select
                      value={formData.content_type}
                      onValueChange={(value: 'pdf' | 'video' | 'article') =>
                        setFormData({ ...formData, content_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="article">Článek</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Kategorie *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
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
                    <Label htmlFor="video_url">URL videa (YouTube, Vimeo) *</Label>
                    <Input
                      id="video_url"
                      type="url"
                      value={formData.video_url}
                      onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                      placeholder="https://..."
                      required
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="file">Soubor (PDF) {!editingId && '*'}</Label>
                    <Input
                      id="file"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      required={!editingId}
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_published"
                    checked={formData.is_published}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_published: checked })
                    }
                  />
                  <Label htmlFor="is_published">Publikovat ihned</Label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Zrušit
                  </Button>
                  <Button type="submit" disabled={uploading}>
                    {uploading ? 'Ukládám...' : editingId ? 'Aktualizovat' : 'Vytvořit'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {content.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Zatím nebyl přidán žádný obsah</p>
              </CardContent>
            </Card>
          ) : (
            content.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {item.content_type === 'video' ? (
                          <Video className="h-5 w-5" />
                        ) : (
                          <FileText className="h-5 w-5" />
                        )}
                        {item.title}
                      </CardTitle>
                      {item.description && (
                        <CardDescription className="mt-1">{item.description}</CardDescription>
                      )}
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs bg-secondary px-2 py-1 rounded">
                          {categories.find(c => c.value === item.category)?.label}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${item.is_published
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                          }`}>
                          {item.is_published ? 'Publikováno' : 'Koncept'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
