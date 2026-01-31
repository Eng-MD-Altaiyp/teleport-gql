
import { useState } from 'react';
import { BackgroundDecorations } from '../components/ui/BackgroundDecorations';
import { Sidebar } from '../components/layout/Sidebar';
import { Tabs } from '../components/layout/Tabs';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface MainLayoutProps {
    children: React.ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
    const { theme, toggleTheme } = useTheme();
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    return (
        <div className="relative min-h-screen bg-background text-foreground overflow-hidden font-sans selection:bg-primary/30">

            <BackgroundDecorations />

            {/* Mobile Top Bar - Floating Pill Design */}
            <div className="md:hidden fixed top-4 left-4 right-4 z-30 h-12 px-2 flex items-center justify-between bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 shadow-lg shadow-slate-200/50 dark:shadow-black/30">
                <div className="flex items-center gap-2 pl-2">
                    <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/30">
                        <span className="text-white font-black text-sm leading-none select-none">T</span>
                    </div>
                    <span className="font-bold text-sm bg-clip-text text-transparent bg-linear-to-r from-slate-800 to-slate-600 dark:from-white dark:to-white/60">Teleport</span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={toggleTheme}
                        className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 transition-colors"
                        aria-label="Toggle theme"
                    >
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    <button
                        onClick={() => setMobileNavOpen(true)}
                        className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shadow-md shadow-primary/30 hover:shadow-lg hover:shadow-primary/40 transition-all"
                        aria-label="Open menu"
                    >
                        <Menu size={18} />
                    </button>
                </div>
            </div>

            <div className="relative z-10 flex h-screen p-4 gap-4 pt-20 md:pt-4">
                {/* Sidebar Component */}
                <div className="hidden md:flex md:items-start md:pt-1 md:h-[98%]">
                    <Sidebar />
                </div>

                {/* Main Content - Flex Column */}
                <main className="flex-1 flex flex-col min-w-0 glass-panel rounded-3xl overflow-hidden transition-all duration-300">
                    {/* Header / Tabs */}
                    <div className="flex flex-col bg-slate-50/50 dark:bg-white/5 border-b border-slate-200/50 dark:border-white/5">
                        <header className="h-12 px-4 flex items-center justify-between">
                            {/* Breadcrumbs or Context Info */}
                            <div className="flex items-center gap-2 text-sm opacity-60">
                                <span>My Collection</span>
                                <span>/</span>
                                <span className="text-foreground">Get User</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                <span className="text-xs font-mono opacity-50">Online</span>
                            </div>
                        </header>
                        <Tabs />
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 relative overflow-hidden bg-slate-100/50 dark:bg-slate-950/20 backdrop-blur-sm">
                        {children}
                    </div>
                </main>
            </div>

            {/* Mobile Drawer - Floating Card Design */}
            {mobileNavOpen && (
                <div
                    className="fixed inset-0 z-40 md:hidden bg-black/40 backdrop-blur-sm flex items-center pl-3 py-4"
                    onClick={() => setMobileNavOpen(false)}
                >
                    <div
                        className="relative w-80 max-w-[85vw] h-[95%] bg-white dark:bg-slate-900 shadow-2xl shadow-black/30 border border-slate-200 dark:border-white/10 overflow-hidden rounded-3xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header with Logo and Close Button */}
                        <div className="h-14 px-4 flex items-center justify-between border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/30">
                                    <span className="text-white font-black text-sm leading-none select-none">T</span>
                                </div>
                                <span className="font-bold text-sm text-slate-800 dark:text-white">Teleport</span>
                            </div>
                            <button
                                onClick={() => setMobileNavOpen(false)}
                                className="w-8 h-8 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-500 dark:text-slate-400 transition-colors"
                                aria-label="Close menu"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className="h-[calc(100%-56px)] overflow-y-auto custom-scrollbar">
                            <Sidebar hideHeader />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
