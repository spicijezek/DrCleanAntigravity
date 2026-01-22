import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ClientData, Booking, LoyaltyCredits, Notification } from '@/types/client-dashboard';
import { toast } from 'sonner';

export const useClientDashboardData = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // 1. Fetch Client Profiles (Support multiple if duplicates exist)
    const { data: clientResponse, isLoading: isClientLoading } = useQuery({
        queryKey: ['clientProfiles', user?.id, user?.email],
        queryFn: async () => {
            if (!user) return null;

            // Fetch all client records that match the user_id OR the email
            const { data: clients, error } = await supabase
                .from('clients')
                .select('*')
                .or(`user_id.eq.${user.id},email.eq.${user.email}`);

            if (error) {
                console.error("Error fetching client profiles:", error);
                throw error;
            }

            // If no client found, create one
            if (!clients || clients.length === 0) {
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
                    .select('*')
                    .single();

                if (createError) throw createError;
                return {
                    primary: newClient as ClientData,
                    allIds: [newClient.id]
                };
            }

            // Link any unlinked profiles with this email to this user_id
            const unlinked = clients.filter(c => !c.user_id && c.email === user.email);
            if (unlinked.length > 0) {
                await Promise.all(unlinked.map(c =>
                    supabase.from('clients').update({ user_id: user.id }).eq('id', c.id)
                ));
            }

            // Return the "best" profile as primary, but keep all IDs for bookings search
            const primary = clients.find(c => c.user_id === user.id) || clients[0];
            return {
                primary: primary as ClientData,
                allIds: clients.map(c => c.id)
            };
        },
        enabled: !!user,
    });

    const clientData = clientResponse?.primary;
    const allClientIds = clientResponse?.allIds || [];

    // 2. Fetch Bookings (Search by all associated Client IDs)
    const { data: bookings, isLoading: isBookingsLoading } = useQuery({
        queryKey: ['clientBookings', allClientIds],
        queryFn: async () => {
            if (allClientIds.length === 0) return [];

            // Fetch bookings for ALL client IDs associated with this user
            const { data: bookingsData, error: bookingsError } = await supabase
                .from('bookings')
                .select('*')
                .in('client_id', allClientIds)
                .order('created_at', { ascending: false });

            if (bookingsError) {
                console.error("Error fetching bookings:", bookingsError);
                return [];
            }
            if (!bookingsData) return [];

            // Enrich bookings with details
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
                if (booking.checklist_id) {
                    const { data: linkedChecklist } = await supabase
                        .from('client_checklists')
                        .select('id, street, city, postal_code')
                        .eq('id', booking.checklist_id)
                        .maybeSingle();

                    if (linkedChecklist) {
                        // Fetch booking-specific rooms (not template rooms!)
                        const { data: rooms } = await supabase
                            .from('booking_rooms')
                            .select('id, room_name, is_completed, completed_at, sort_order')
                            .eq('booking_id', booking.id)
                            .order('sort_order', { ascending: true });

                        if (rooms) {
                            checklist = { ...linkedChecklist, rooms };
                        }
                    }
                }

                // Invoice
                if (booking.invoice_id) {
                    const { data: invoiceData } = await supabase
                        .from('invoices')
                        .select('*')
                        .eq('id', booking.invoice_id)
                        .maybeSingle();

                    if (invoiceData) {
                        invoice = invoiceData;

                        if (invoiceData.user_id) {
                            const { data: companyData } = await supabase
                                .from('company_info')
                                .select('company_name, address, city, postal_code, ic, dic, logo_url, bank_account, bank_code, bank_name, iban, email, phone, website')
                                .eq('user_id', invoiceData.user_id)
                                .maybeSingle();
                            companyInfo = companyData;
                        }
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
        enabled: allClientIds.length > 0,
    });

    // 3. Loyalty Credits
    const { data: loyaltyCredits } = useQuery({
        queryKey: ['loyaltyCredits', allClientIds],
        queryFn: async () => {
            if (allClientIds.length === 0) return null;

            // Sum credits from all associated accounts (rare but handles splitting)
            const { data } = await supabase
                .from('loyalty_credits')
                .select('current_credits')
                .in('client_id', allClientIds);

            const total = data?.reduce((acc, curr) => acc + (curr.current_credits || 0), 0) || 0;
            return { current_credits: total } as LoyaltyCredits;
        },
        enabled: allClientIds.length > 0,
    });

    // 4. Notifications
    const { data: notifications } = useQuery({
        queryKey: ['notifications', allClientIds],
        queryFn: async () => {
            if (allClientIds.length === 0) return [];
            const { data } = await supabase
                .from('client_notifications')
                .select('*')
                .in('client_id', allClientIds)
                .order('created_at', { ascending: false })
                .limit(10);
            return data as Notification[];
        },
        enabled: allClientIds.length > 0,
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

    const declineRating = useMutation({
        mutationFn: async (bookingId: string) => {
            if (!clientData) throw new Error("No client data");
            const { error } = await supabase
                .from('booking_feedback')
                .insert({
                    booking_id: bookingId,
                    client_id: clientData.id,
                    rating: 0,
                    declined: true
                });
            if (error) throw error;
        },
        onSuccess: () => {
            toast.info('Hodnocení bylo přeskočeno');
            queryClient.invalidateQueries({ queryKey: ['clientBookings'] });
        },
        onError: () => {
            toast.error('Nepodařilo se přeskočit hodnocení');
        }
    });

    // Real-time Subscriptions
    useEffect(() => {
        if (allClientIds.length === 0) return;

        const channel = supabase
            .channel('dashboard-changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'bookings'
                // Filter by all IDs isn't directly supported in this complex way via filter param, 
                // so we just listen to table changes and invalidate.
            }, () => {
                queryClient.invalidateQueries({ queryKey: ['clientBookings'] });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [allClientIds, queryClient]);

    return {
        clientData,
        bookings,
        loyaltyCredits,
        notifications,
        isLoading: isClientLoading || isBookingsLoading,
        submitRating,
        declineRating,
        markAsViewed,
    };
};
