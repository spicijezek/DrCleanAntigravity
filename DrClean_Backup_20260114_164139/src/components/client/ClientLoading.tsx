import drCleanIcon from '@/assets/dr-clean-icon.png';

interface ClientLoadingProps {
  message?: string;
}

export const ClientLoading = ({ message = "Načítání..." }: ClientLoadingProps) => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-background z-50">
      <img 
        src={drCleanIcon} 
        alt="Načítání" 
        className="h-24 w-24 object-contain animate-spin-pulse" 
      />
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
};
