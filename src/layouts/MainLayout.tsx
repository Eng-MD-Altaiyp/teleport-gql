
import { BackgroundDecorations } from '../components/ui/BackgroundDecorations';

interface MainLayoutProps {
    children: React.ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
    return (
        <div className="relative min-h-screen bg-background text-foreground overflow-hidden font-sans selection:bg-primary/30">

            <BackgroundDecorations />

            <div className="relative z-10 flex h-screen p-4 gap-4">
                {/* Sidebar - Glass Panel */}
                <aside className="w-16 lg:w-64 hidden md:flex flex-col glass-panel rounded-3xl p-4 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
                    <div className="flex items-center justify-center lg:justify-start gap-3 mb-8">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center text-white font-bold shadow-lg shadow-primary/30">
                            T
                        </div>
                        <span className="hidden lg:block font-bold text-xl tracking-tight">Teleport</span>
                    </div>

                    <nav className="flex-1 space-y-2">
                        {/* Placeholder Nav Items */}
                        {['History', 'Collections', 'Environments'].map((item) => (
                            <div key={item} className="p-3 rounded-xl hover:bg-primary/10 hover:text-primary cursor-pointer transition-colors group">
                                <span className="hidden lg:block font-medium">{item}</span>
                            </div>
                        ))}
                    </nav>
                </aside>

                {/* Main Content - Flex Column */}
                <main className="flex-1 flex flex-col gap-4 min-w-0">
                    {/* Header - Glass Panel */}
                    <header className="glass-panel h-16 rounded-2xl px-6 flex items-center justify-between">
                        <div className="text-sm font-medium text-foreground/60">Flash GraphQL Client</div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-xs font-mono opacity-50">Online</span>
                        </div>
                    </header>

                    {/* Content Area - Glass Panel */}
                    <div className="flex-1 glass-panel rounded-3xl p-6 relative overflow-hidden">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};
