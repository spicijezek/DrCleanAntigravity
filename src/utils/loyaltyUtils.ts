import { supabase } from '@/integrations/supabase/client';

const POINTS_PER_CZK = 0.27;

/**
 * Adds loyalty points for a paid invoice/booking
 */
export async function addLoyaltyPoints(clientId: string, invoiceTotal: number, bookingId?: string) {
    const pointsToAdd = Math.round(invoiceTotal * POINTS_PER_CZK);
    if (pointsToAdd <= 0) return;

    try {
        // 1. Prevent Duplicates using bookingId
        if (bookingId) {
            const { data: existingTx } = await supabase
                .from('loyalty_transactions')
                .select('id')
                .eq('client_id', clientId)
                .eq('related_job_id', bookingId)
                .eq('type', 'earned')
                .maybeSingle();

            if (existingTx) {
                console.log(`Points for booking ${bookingId} already earned. Skipping.`);
                return;
            }
        }

        // 2. Fetch Client for referral logic
        const { data: clientData } = await supabase
            .from('clients')
            .select('total_spent, referred_by_id, name')
            .eq('id', clientId)
            .single();

        const isFirstInvoice = (clientData?.total_spent || 0) === 0;
        let finalPointsToAdd = pointsToAdd;

        // 3. Referral Bonus Logic
        if (isFirstInvoice && clientData?.referred_by_id) {
            finalPointsToAdd = pointsToAdd * 2; // Double for referee

            // Find and reward referrer
            const { data: referrerCredits } = await supabase
                .from('loyalty_credits')
                .select('current_credits, total_earned')
                .eq('client_id', clientData.referred_by_id)
                .maybeSingle();

            if (referrerCredits) {
                await supabase
                    .from('loyalty_credits')
                    .update({
                        current_credits: (referrerCredits.current_credits || 0) + pointsToAdd,
                        total_earned: (referrerCredits.total_earned || 0) + pointsToAdd,
                        updated_at: new Date().toISOString()
                    })
                    .eq('client_id', clientData.referred_by_id);

                await supabase.from('loyalty_transactions').insert({
                    client_id: clientData.referred_by_id,
                    amount: pointsToAdd,
                    type: 'earned',
                    description: `Referral Bonus (1. úklid od ${clientData.name})`,
                    related_job_id: bookingId
                });
            }
        }

        // 4. Update Client Credits
        const { data: existingCredits } = await supabase
            .from('loyalty_credits')
            .select('*')
            .eq('client_id', clientId)
            .maybeSingle();

        if (existingCredits) {
            await supabase.from('loyalty_credits').update({
                current_credits: (existingCredits.current_credits || 0) + finalPointsToAdd,
                total_earned: (existingCredits.total_earned || 0) + finalPointsToAdd,
                updated_at: new Date().toISOString()
            }).eq('client_id', clientId);
        } else {
            await supabase.from('loyalty_credits').insert({
                client_id: clientId,
                current_credits: finalPointsToAdd,
                total_earned: finalPointsToAdd,
                total_spent: 0
            });
        }

        // 5. Update Total Spent
        await supabase.from('clients').update({
            total_spent: (clientData?.total_spent || 0) + invoiceTotal
        }).eq('id', clientId);

        // 6. Record Transaction
        await supabase.from('loyalty_transactions').insert({
            client_id: clientId,
            amount: finalPointsToAdd,
            type: 'earned',
            description: finalPointsToAdd > pointsToAdd
                ? `Bonus za první úklid (Doporučení) - ${invoiceTotal.toLocaleString('cs-CZ')} Kč`
                : `Body za úklid (${invoiceTotal.toLocaleString('cs-CZ')} Kč)`,
            related_job_id: bookingId
        });

    } catch (error) {
        console.error('Error in addLoyaltyPoints:', error);
    }
}

/**
 * Reverses loyalty points for a booking (e.g. status change or deletion)
 */
export async function removeLoyaltyPoints(clientId: string, invoiceTotal: number, bookingId?: string) {
    if (!bookingId) return;

    try {
        // 1. Find the 'earned' transaction(s) for this booking
        const { data: txs } = await supabase
            .from('loyalty_transactions')
            .select('*')
            .eq('client_id', clientId)
            .eq('related_job_id', bookingId)
            .eq('type', 'earned');

        if (!txs || txs.length === 0) return;

        const totalToReverse = txs.reduce((sum, tx) => sum + tx.amount, 0);

        // 2. Adjust Credits
        const { data: credits } = await supabase
            .from('loyalty_credits')
            .select('*')
            .eq('client_id', clientId)
            .maybeSingle();

        if (credits) {
            await supabase.from('loyalty_credits').update({
                current_credits: Math.max(0, (credits.current_credits || 0) - totalToReverse),
                total_earned: Math.max(0, (credits.total_earned || 0) - totalToReverse),
                updated_at: new Date().toISOString()
            }).eq('client_id', clientId);
        }

        // 3. Adjust Total Spent
        const { data: client } = await supabase
            .from('clients')
            .select('total_spent')
            .eq('id', clientId)
            .single();

        if (client) {
            await supabase.from('clients').update({
                total_spent: Math.max(0, (client.total_spent || 0) - invoiceTotal)
            }).eq('id', clientId);
        }

        // 4. Delete the transactions
        const idsToDelete = txs.map(t => t.id);
        await supabase.from('loyalty_transactions').delete().in('id', idsToDelete);

        console.log(`Reversed ${totalToReverse} points for booking ${bookingId}`);
    } catch (error) {
        console.error('Error in removeLoyaltyPoints:', error);
    }
}

/**
 * Recalculates and syncs a client's loyalty credits based on their transaction history.
 * Use this as a "fix" for inconsistencies.
 */
export async function recalculateClientLoyalty(clientId: string) {
    try {
        // 1. Get all transactions
        const { data: txs } = await supabase
            .from('loyalty_transactions')
            .select('amount, type')
            .eq('client_id', clientId);

        if (!txs) return;

        // 2. Calculate totals
        let earned = 0;
        let redeemed = 0;

        txs.forEach(t => {
            if (t.type === 'earned') earned += t.amount;
            else if (t.type === 'redeemed') redeemed += t.amount;
        });

        const current = earned - redeemed;

        // 3. Sync with loyalty_credits
        const { data: existing } = await supabase
            .from('loyalty_credits')
            .select('id')
            .eq('client_id', clientId)
            .maybeSingle();

        if (existing) {
            await supabase.from('loyalty_credits').update({
                current_credits: Math.max(0, current),
                total_earned: earned,
                total_spent: redeemed,
                updated_at: new Date().toISOString()
            }).eq('client_id', clientId);
        } else {
            await supabase.from('loyalty_credits').insert({
                client_id: clientId,
                current_credits: Math.max(0, current),
                total_earned: earned,
                total_spent: redeemed
            });
        }

        return { earned, redeemed, current };
    } catch (error) {
        console.error('Error in recalculateClientLoyalty:', error);
        throw error;
    }
}
