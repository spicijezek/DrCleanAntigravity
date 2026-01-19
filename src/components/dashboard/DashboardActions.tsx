import { useNavigate } from "react-router-dom";
import {
    Briefcase,
    Users,
    CreditCard,
    PieChart,
    Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionButtonProps {
    icon: any; // Type 'any' used to compatible with Lucide icons where imports might vary
    label: string;
    path: string;
    colorClass: string;
    bgClass: string;
}

const ActionButton = ({ icon: Icon, label, path, colorClass, bgClass }: ActionButtonProps) => {
    const navigate = useNavigate();

    return (
        <button
            onClick={() => navigate(path)}
            className="flex flex-col items-center justify-center gap-3 p-6 rounded-3xl bg-card/50 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group w-full"
        >
            <div className={cn("p-4 rounded-2xl transition-colors", bgClass)}>
                <Icon className={cn("h-8 w-8", colorClass)} />
            </div>
            <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                {label}
            </span>
        </button>
    );
};

export function DashboardActions() {
    const actions = [
        {
            icon: Briefcase,
            label: "Manage Team",
            path: "/team",
            colorClass: "text-blue-500",
            bgClass: "bg-blue-500/10 group-hover:bg-blue-500/20"
        },
        {
            icon: Users,
            label: "Client Base",
            path: "/clients",
            colorClass: "text-purple-500",
            bgClass: "bg-purple-500/10 group-hover:bg-purple-500/20"
        },
        {
            icon: CreditCard,
            label: "Invoices",
            path: "/invoices/storage", // Corrected path based on App.tsx
            colorClass: "text-amber-500",
            bgClass: "bg-amber-500/10 group-hover:bg-amber-500/20"
        },
        {
            icon: PieChart,
            label: "Finances",
            path: "/finances",
            colorClass: "text-emerald-500",
            bgClass: "bg-emerald-500/10 group-hover:bg-emerald-500/20"
        },
        {
            icon: Calendar,
            label: "Manage Jobs",
            path: "/jobs",
            colorClass: "text-indigo-500",
            bgClass: "bg-indigo-500/10 group-hover:bg-indigo-500/20"
        }
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6 mt-8">
            {actions.map((action, index) => (
                <ActionButton key={index} {...action} />
            ))}
        </div>
    );
}
