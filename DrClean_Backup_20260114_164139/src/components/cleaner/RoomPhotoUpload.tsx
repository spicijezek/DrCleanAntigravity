import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Image as ImageIcon, Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RoomPhotoUploadProps {
    bookingId: string;
    roomId: string;
    type: 'before' | 'after';
    photos: string[];
    onPhotoUploaded: (url: string) => void;
    onPhotoRemoved: (url: string) => void;
    readOnly?: boolean;
}

import { compressImage } from '@/lib/imageUtils';

export function RoomPhotoUpload({
    bookingId,
    roomId,
    type,
    photos,
    onPhotoUploaded,
    onPhotoRemoved,
    readOnly = false
}: RoomPhotoUploadProps) {
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            // Compress image
            const compressedFile = await compressImage(file);

            const fileExt = 'jpg'; // Compressed as jpeg
            const fileName = `${bookingId}/${roomId}/${type}/${crypto.randomUUID()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('room_photos')
                .upload(fileName, compressedFile);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('room_photos')
                .getPublicUrl(fileName);

            onPhotoUploaded(publicUrl);
            toast.success('Fotografie nahrána');
        } catch (error) {
            console.error('Error uploading photo:', error);
            toast.error('Nepodařilo se nahrát fotografii');
        } finally {
            setIsUploading(false);
            // Reset input
            event.target.value = '';
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h5 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    {type === 'before' ? 'Před úklidem' : 'Po úklidu'}
                    <span className="text-xs font-normal opacity-70">({photos.length})</span>
                </h5>

                {!readOnly && (
                    <div>
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            id={`upload-${roomId}-${type}`}
                            className="hidden"
                            onChange={handleFileChange}
                            disabled={isUploading}
                        />
                        <label htmlFor={`upload-${roomId}-${type}`}>
                            <Button size="sm" variant="outline" className="h-8 gap-2" asChild disabled={isUploading}>
                                <span className="cursor-pointer">
                                    {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                                    <span className="sr-only sm:not-sr-only sm:inline-block">Přidat foto</span>
                                </span>
                            </Button>
                        </label>
                    </div>
                )}
            </div>

            {photos.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {photos.map((url, index) => (
                        <div key={index} className="relative aspect-square group rounded-md overflow-hidden bg-muted border">
                            <img src={url} alt={`${type} ${index + 1}`} className="w-full h-full object-cover" />
                            {!readOnly && (
                                <button
                                    onClick={() => onPhotoRemoved(url)}
                                    className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-xs text-muted-foreground italic bg-muted/20 p-3 rounded-lg text-center border border-dashed">
                    Žádné fotografie
                </div>
            )}
        </div>
    );
}
