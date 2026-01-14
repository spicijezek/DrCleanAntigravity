import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { useSidebarState } from "@/hooks/useSidebarState";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { shouldBeExpanded } = useSidebarState();

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className={`flex-1 transition-all duration-300 ml-0 ${shouldBeExpanded ? 'md:ml-64' : 'md:ml-16'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}