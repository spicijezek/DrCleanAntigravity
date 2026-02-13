import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ClientServices from './client/ClientServices';

/**
 * Public booking page - anonymous booking without login
 * Renders the EXACT SAME multi-step forms from ClientServices in public mode
 */
export default function PublicBooking({ soloService }: { soloService?: string }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const service = soloService || searchParams.get('service');

    useEffect(() => {
        // Store UTM parameters if present
        const utmSource = searchParams.get('utm_source');
        const utmMedium = searchParams.get('utm_medium');
        const utmCampaign = searchParams.get('utm_campaign');

        if (utmSource) sessionStorage.setItem('landing_utm_source', utmSource);
        if (utmMedium) sessionStorage.setItem('landing_utm_medium', utmMedium);
        if (utmCampaign) sessionStorage.setItem('landing_utm_campaign', utmCampaign);

        // Removed automatic redirect for authenticated users to allow "guest" booking flow
    }, [searchParams]);

    // If user is authenticated, they'll be redirected above
    // Otherwise, render ClientServices in public booking mode
    return (
        <div className="min-h-screen bg-background">
            <ClientServices
                isPublicBooking={true}
                preSelectedService={service}
                isSolo={!!service}
            />
        </div>
    );
}
