
interface BookingForCalculation {
    service_type: string;
    booking_details?: {
        service_id?: string;
        service_title?: string;
        priceEstimate?: {
            price?: number;
            priceMin?: number;
        }
    };
    team_member_ids?: string[];
}

export function calculateTimeEstimate(booking: BookingForCalculation, manualPrice?: number, manualTeamSize?: number) {
    const price = manualPrice ?? (booking.booking_details?.priceEstimate?.price || booking.booking_details?.priceEstimate?.priceMin || 0);

    if (!price) return null;

    let rate = 500;
    if (booking.service_type === 'upholstery_cleaning' ||
        booking.booking_details?.service_id?.includes('upholstery') ||
        booking.booking_details?.service_title?.toLowerCase().includes('čalounění')) {
        rate = 1500;
    }

    const totalHours = price / rate;

    // Use manualTeamSize if provided, otherwise fallback to booking team length, defaulting to 1
    const teamSize = manualTeamSize ?? (booking.team_member_ids?.length || 1);
    const numCleaners = Math.max(teamSize, 1);

    const hoursPerPerson = totalHours / numCleaners;

    const minHours = hoursPerPerson * 0.85;
    const maxHours = hoursPerPerson * 1.15;

    return {
        rate,
        totalHours,
        hoursPerPerson,
        minHours,
        maxHours,
        formattedRange: formatTimeRange(minHours, maxHours)
    };
}

function formatTimeRange(min: number, max: number): string {
    const format = (h: number) => {
        const hrs = Math.floor(h);
        const mins = Math.round((h - hrs) * 60);
        if (hrs === 0) return `${mins} min`;
        if (mins === 0) return `${hrs} h`;
        return `${hrs} h ${mins} min`;
    };
    return `${format(min)} - ${format(max)}`;
}
