import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ClientData, Booking, LoyaltyCredits, Notification } from '@/types/client-dashboard';
import { toast } from 'sonner';

export const useClientDashboardData = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // 1. Fetch Client Profile
    const { data: clientData, isLoading: isClientLoading } = useQuery({
        queryKey: ['clientProfile', user?.id],
        queryFn: async () => {
            if (!user) return null;
            let { data: client, error } = await supabase
                .from('clients')
                .select('id, name, address, city, has_allergies, allergies_notes, has_pets, has_children, special_instructions')
                .eq('user_id', user.id)
                .maybeSingle();

            if (!client) {
                // Create client if not exists (migrated logic)
                const name = user.user_metadata?.full_name as string || user.email || 'Klient';
                const phone = user.user_metadata?.phone as string || null;
                const { data: newClient, error: createError } = await supabase
                    .from('clients')
                    .insert([{
                        user_id: user.id,
                        name,
                        email: user.email,
                        phone,
                        client_source: 'App'
                    }])
                    .select('id, name, address, city, has_allergies, allergies_notes, has_pets, has_children, special_instructions')
                    .single();

                if (createError) throw createError;
                client = newClient;
            }
            return client as ClientData;
        },
        enabled: !!user,
    });

    // 2. Fetch Bookings (Dependent on ClientData)
    const { data: bookings, isLoading: isBookingsLoading } = useQuery({
        queryKey: ['clientBookings', clientData?.id],
        queryFn: async () => {
            if (!clientData) return [];

            const { data: bookingsData } = await supabase
                .from('bookings')
                .select('*')
                .eq('client_id', clientData.id)
                .order('created_at', { ascending: false });

            if (!bookingsData) return [];

            // Enrich bookings with details (team, checklist, invoice)
            const enrichedBookings = await Promise.all(bookingsData.map(async (booking) => {
                let teamMembers = [];
                let checklist = null;
                let invoice = null;
                let companyInfo = null;
                let feedback = null;

                // Team Members
                if (booking.team_member_ids?.length > 0) {
                    const { data: teamData } = await supabase
                        .from('team_members')
                        .select('name, user_id, bio')
                        .in('id', booking.team_member_ids);

                    if (teamData) {
                        const teamWithProfiles = await Promise.all(teamData.map(async (member) => {
                            const { data: profile } = await supabase
                                .from('profiles')
                                .select('avatar_url, full_name')
                                .eq('user_id', member.user_id)
                                .maybeSingle();
                            return { ...member, profile };
                        }));
                        teamMembers = teamWithProfiles;
                    }
                }

                // Checklist
                if ((booking.status === 'approved' || booking.status === 'completed') && booking.checklist_id) {
                    const { data: linkedChecklist } = await supabase
                        .from('client_checklists')
                        .select('id, street, city, postal_code')
                        .eq('id', booking.checklist_id)
                        .single();

                    if (linkedChecklist) {
                        const { data: rooms } = await supabase
                            .from('checklist_rooms')
                            .select('id, room_name, is_completed, completed_at, sort_order')
                            .eq('checklist_id', linkedChecklist.id)
                            .order('sort_order', { ascending: true });

                        if (rooms) {
                            checklist = { ...linkedChecklist, rooms };
                        }
                    }
                }

                // Invoice
                if (booking.status === 'completed' && booking.invoice_id) {
                    const { data: invoiceData } = await supabase
                        .from('invoices')
                        .select('id, invoice_number, total, status, pdf_path, variable_symbol, date_due, user_id')
                        .eq('id', booking.invoice_id)
                        .single();

                    invoice = invoiceData;

                    if (invoiceData?.user_id) {
                        const { data: companyData } = await supabase
                            .from('company_info')
                            .select('bank_account, bank_code, bank_name, iban')
                            .eq('user_id', invoiceData.user_id)
                            .maybeSingle();
                        companyInfo = companyData;
                    }
                }

                // Feedback
                const { data: feedbackData } = await supabase
                    .from('booking_feedback')
                    .select('id, rating, comment, declined')
                    .eq('booking_id', booking.id)
                    .maybeSingle();
                feedback = feedbackData;

                return {
                    ...booking,
                    team_members: teamMembers,
                    checklist,
                    invoice,
                    company_info: companyInfo,
                    client: clientData,
                    feedback,
                } as Booking;
            }));

            return enrichedBookings;
        },
        enabled: !!clientData,
    });

    // 3. Loyalty Credits
    const { data: loyaltyCredits } = useQuery({
        queryKey: ['loyaltyCredits', clientData?.id],
        queryFn: async () => {
            if (!clientData) return null;
            const { data } = await supabase
                .from('loyalty_credits')
                .select('current_credits')
                .eq('client_id', clientData.id)
                .single();
            return data as LoyaltyCredits;
        },
        enabled: !!clientData,
    });

    // 4. Notifications
    const { data: notifications } = useQuery({
        queryKey: ['notifications', clientData?.id],
        queryFn: async () => {
            if (!clientData) return [];
            const { data } = await supabase
                .from('client_notifications')
                .select('*')
                .eq('client_id', clientData.id)
                .order('created_at', { ascending: false })
                .limit(5);
            return data as Notification[];
        },
        enabled: !!clientData,
    });

    // Mutations
    const markAsViewed = useMutation({
        mutationFn: async (bookingId: string) => {
            const { error } = await supabase
                .from('bookings')
                .update({ client_viewed_at: new Date().toISOString() })
                .eq('id', bookingId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clientBookings'] });
        }
    });

    const submitRating = useMutation({
        mutationFn: async ({ bookingId, rating, comment }: { bookingId: string, rating: number, comment: string }) => {
            if (!clientData) throw new Error("No client data");
            const { error } = await supabase
                .from('booking_feedback')
                .insert({
                    booking_id: bookingId,
                    client_id: clientData.id,
                    rating,
                    comment: comment.trim() || null,
                    declined: false
                });
            if (error) throw error;

            // Auto-mark as viewed
            await supabase
                .from('bookings')
                .update({ client_viewed_at: new Date().toISOString() })
                .eq('id', bookingId);
        },
        onSuccess: () => {
            toast.success('Děkujeme za zpětnou vazbu!');
            queryClient.invalidateQueries({ queryKey: ['clientBookings'] });
        },
        onError: () => {
            toast.error('Nepodařilo se odeslat hodnocení');
        }
    });

    // Real-time Subscriptions
    useEffect(() => {
        if (!clientData) return;

        const channel = supabase
            .channel('dashboard-changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'bookings',
                filter: `client_id=eq.${clientData.id}`
            }, () => {
                queryClient.invalidateQueries({ queryKey: ['clientBookings'] });
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'checklist_rooms'
            }, () => {
                queryClient.invalidateQueries({ queryKey: ['clientBookings'] });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [clientData, queryClient]);

    return {
        clientData,
        bookings,
        loyaltyCredits,
        notifications,
        isLoading: isClientLoading || isBookingsLoading,
        submitRating,
        markAsViewed,
    };
};
