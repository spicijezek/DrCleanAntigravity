import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Download, FileText, Calendar, Tag, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AddProtocolForm } from '@/components/forms/AddProtocolForm';
import { EditProtocolForm } from '@/components/forms/EditProtocolForm';
import { Layout } from '@/components/layout/Layout';
import { useMobileResponsive } from '@/components/ui/mobile-responsive';

interface Protocol {
  id: string;
  title: string;
  description: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export default function Protocols() {
  useMobileResponsive();
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProtocol, setEditingProtocol] = useState<Protocol | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProtocols();
    }
  }, [user]);

  const fetchProtocols = async () => {
    try {
      const { data, error } = await supabase
        .from('protocols')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setProtocols(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch protocols',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProtocols = protocols.filter(protocol =>
    protocol.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    protocol.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    protocol.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const downloadProtocol = async (protocol: Protocol) => {
    try {
      const { data, error } = await supabase.storage
        .from('protocols')
        .download(protocol.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = protocol.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to download protocol',
        variant: 'destructive',
      });
    }
  };

  const deleteProtocol = async (protocol: Protocol) => {
    if (!confirm('Are you sure you want to delete this protocol?')) return;
    
    try {
      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('protocols')
        .remove([protocol.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('protocols')
        .delete()
        .eq('id', protocol.id);

      if (dbError) throw dbError;

      toast({
        title: 'Success',
        description: 'Protocol deleted successfully',
      });

      fetchProtocols();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to delete protocol',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="p-6 transition-all duration-300">
        <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Protocols</h1>
          <p className="text-muted-foreground mt-2">Manage your cleaning protocols and documentation</p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Add Protocol
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search protocols..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Protocols Grid */}
      {filteredProtocols.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <div className="mx-auto h-24 w-24 text-muted-foreground mb-4">
              <FileText className="h-full w-full" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No protocols found</h3>
            <p className="text-muted-foreground mb-6">Start by uploading your first protocol document.</p>
            <Button onClick={() => setShowAddForm(true)} className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Protocol
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProtocols.map((protocol) => (
            <Card key={protocol.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{protocol.title}</CardTitle>
                    {protocol.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{protocol.description}</p>
                    )}
                  </div>
                  <FileText className="h-8 w-8 text-muted-foreground ml-2" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {new Date(protocol.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">File Size:</span>
                    <span className="font-medium">{formatFileSize(protocol.file_size)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium">{protocol.mime_type}</span>
                  </div>
                </div>

                {protocol.tags && protocol.tags.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Tags:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {protocol.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button 
                    onClick={() => downloadProtocol(protocol)}
                    className="flex-1"
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button 
                    onClick={() => setEditingProtocol(protocol)}
                    variant="outline"
                    size="icon"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    onClick={() => deleteProtocol(protocol)}
                    variant="destructive"
                    size="icon"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Protocol Form */}
      {showAddForm && (
        <AddProtocolForm
          onClose={() => setShowAddForm(false)}
          onProtocolAdded={() => {
            fetchProtocols();
            setShowAddForm(false);
          }}
        />
      )}

      {/* Edit Protocol Form */}
      {editingProtocol && (
        <EditProtocolForm
          protocol={editingProtocol}
          onClose={() => setEditingProtocol(null)}
          onProtocolUpdated={() => {
            fetchProtocols();
            setEditingProtocol(null);
          }}
        />
      )}
      </div>
      </div>
    </Layout>
  );
}