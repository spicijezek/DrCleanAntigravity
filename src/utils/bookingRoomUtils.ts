import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Creates booking-specific room snapshots from a checklist template
 * This ensures each booking starts with fresh, unmarked rooms (0% progress)
 */
export async function createBookingRoomSnapshots(bookingId: string, checklistId: string) {
    try {
        // 1. Fetch template rooms from the checklist
        const { data: templateRooms, error: fetchError } = await supabase
            .from('checklist_rooms')
            .select('room_name, sort_order')
            .eq('checklist_id', checklistId)
            .order('sort_order');

        if (fetchError) throw fetchError;

        if (!templateRooms || templateRooms.length === 0) {
            console.warn(`No rooms found for checklist ${checklistId}`);
            return;
        }

        // 2. Delete any existing booking_rooms for this booking (in case of reassignment)
        const { error: deleteError } = await supabase
            .from('booking_rooms')
            .delete()
            .eq('booking_id', bookingId);

        if (deleteError) throw deleteError;

        // 3. Create fresh booking-specific room snapshots (all start as incomplete)
        const bookingRooms = templateRooms.map(room => ({
            booking_id: bookingId,
            room_name: room.room_name,
            sort_order: room.sort_order,
            is_completed: false,  // Always start fresh!
            completed_by: null,
            completed_at: null
        }));

        const { error: insertError } = await supabase
            .from('booking_rooms')
            .insert(bookingRooms);

        if (insertError) throw insertError;

        console.log(`Created ${bookingRooms.length} room snapshots for booking ${bookingId}`);
    } catch (error: any) {
        console.error('Error creating booking room snapshots:', error);
        toast.error('Nepodařilo se vytvořit checklist pro tuto rezervaci');
        throw error;
    }
}

/**
 * Deletes booking-specific room snapshots when checklist is removed
 */
export async function deleteBookingRoomSnapshots(bookingId: string) {
    try {
        const { error } = await supabase
            .from('booking_rooms')
            .delete()
            .eq('booking_id', bookingId);

        if (error) throw error;

        console.log(`Deleted room snapshots for booking ${bookingId}`);
    } catch (error: any) {
        console.error('Error deleting booking room snapshots:', error);
        // Don't throw - this is cleanup, shouldn't block the main operation
    }
}
