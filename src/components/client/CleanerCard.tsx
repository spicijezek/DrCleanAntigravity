import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CleanerCardProps {
  name: string;
  userId: string;
  avatarPath?: string | null;
  fullName?: string | null;
  bio?: string | null;
}

export function CleanerCard({ name, userId, avatarPath, fullName, bio }: CleanerCardProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (avatarPath) {
      if (avatarPath.startsWith('http')) {
        setAvatarUrl(avatarPath);
      } else {
        // Try public URL first since bucket is public
        const publicUrl = supabase.storage
          .from('avatars')
          .getPublicUrl(avatarPath);

        if (publicUrl.data) {
          setAvatarUrl(publicUrl.data.publicUrl);
        } else {
          // Fallback to signed URL
          supabase.storage
            .from('avatars')
            .createSignedUrl(avatarPath, 3600)
            .then(({ data }) => {
              if (data) setAvatarUrl(data.signedUrl);
            });
        }
      }
    }
  }, [avatarPath]);

  return (
    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
      <div className="flex-shrink-0">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="w-16 h-16 rounded-full object-cover border-2 border-primary animate-sweep"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-lg animate-sweep">
            {name.charAt(0)}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-base">{name.split(' ')[0]}</div>
        {bio ? (
          <div className="space-y-2">
            <div className={`text-sm text-muted-foreground mt-1 ${!isExpanded ? 'line-clamp-2' : ''}`}>
              {bio}
            </div>
            {bio.length > 100 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-auto p-0 text-xs text-primary hover:bg-transparent hover:text-primary"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Zobrazit méně
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Zobrazit více
                  </>
                )}
              </Button>
            )}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground mt-1">
            Profesionální člen Dr.Clean týmu
          </div>
        )}
      </div>
    </div>
  );
}
