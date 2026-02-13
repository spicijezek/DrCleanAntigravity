import klinrLogoFavicon from '@/assets/Klinr Logo Favicon.png';

interface LoadingOverlayProps {
    message?: string;
}

export const LoadingOverlay = ({ message = "Načítání..." }: LoadingOverlayProps) => {
    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-md z-[10200] animate-in fade-in duration-300">
            <div className="relative">
                <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full scale-150 animate-pulse" />
                <img
                    src={klinrLogoFavicon}
                    alt="Klinr"
                    className="h-20 w-20 object-contain animate-spin-pulse relative z-10 brightness-[0.6]"
                />
            </div>
            <p className="text-muted-foreground text-sm font-medium tracking-wide animate-pulse">{message}</p>
        </div>
    );
};
