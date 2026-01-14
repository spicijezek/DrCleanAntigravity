import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface RoomPhotos {
    before?: string[];
    after?: string[];
}

interface PhotoGalleryProps {
    roomPhotos?: Record<string, RoomPhotos>;
    checklist?: any; // To get room names if possible, but map uses roomId.
    // Actually, booking details might not have room names mapped to IDs if they come from checklist.
    // But wait, room_photos keys are room IDs.
    // If we don't have checklist data joined, we might only show "Room 1", "Room 2".
    // Note: CleanerDashboard had checklist data joined. ClientBilling might not.
}

// Helper to find room name if checklist data exists
const getRoomName = (roomId: string, checklist: any) => {
    if (!checklist?.rooms) return "Místnost";
    const room = checklist.rooms.find((r: any) => r.id === roomId);
    return room ? room.room_name : "Místnost";
};

export function PhotoGallery({ roomPhotos, checklist }: PhotoGalleryProps) {
    if (!roomPhotos || Object.keys(roomPhotos).length === 0) return null;

    return (
        <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium text-sm">Fotogalerie</h4>
            <div className="grid gap-4">
                {Object.entries(roomPhotos).map(([roomId, photos]) => {
                    const hasBefore = photos.before && photos.before.length > 0;
                    const hasAfter = photos.after && photos.after.length > 0;

                    if (!hasBefore && !hasAfter) return null;

                    const roomName = getRoomName(roomId, checklist);

                    return (
                        <div key={roomId} className="space-y-2">
                            <h5 className="text-sm font-medium text-muted-foreground">{roomName}</h5>

                            {hasBefore && (
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground block">Před úklidem</span>
                                    <div className="flex flex-wrap gap-2">
                                        {photos.before?.map((url, i) => (
                                            <Dialog key={`before-${i}`}>
                                                <DialogTrigger>
                                                    <div className="relative h-20 w-20 rounded-md overflow-hidden hover:opacity-90 transition-opacity border">
                                                        <img src={url} alt={`Before ${i}`} className="h-full w-full object-cover" />
                                                    </div>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black/90 border-none">
                                                    <img src={url} alt={`Before ${i}`} className="w-full h-auto max-h-[80vh] object-contain" />
                                                </DialogContent>
                                            </Dialog>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {hasAfter && (
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground block">Po úklidu</span>
                                    <div className="flex flex-wrap gap-2">
                                        {photos.after?.map((url, i) => (
                                            <Dialog key={`after-${i}`}>
                                                <DialogTrigger>
                                                    <div className="relative h-20 w-20 rounded-md overflow-hidden hover:opacity-90 transition-opacity border">
                                                        <img src={url} alt={`After ${i}`} className="h-full w-full object-cover" />
                                                    </div>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black/90 border-none">
                                                    <img src={url} alt={`After ${i}`} className="w-full h-auto max-h-[80vh] object-contain" />
                                                </DialogContent>
                                            </Dialog>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
