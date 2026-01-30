import { useState } from 'react';
import { Zap, Save, Loader2, ChevronDown, Settings } from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface EndpointBarProps {
    url: string;
    onUrlChange: (url: string) => void;
    onConnect: () => void;
    isLoading: boolean;
}

export const EndpointBar = ({ url, onUrlChange, onConnect, isLoading }: EndpointBarProps) => {
    const [showMenu, setShowMenu] = useState(false);

    return (
        <div className="p-4 flex flex-col md:flex-row gap-3 md:items-center bg-slate-100/50 dark:bg-white/5 border-b border-slate-200 dark:border-white/5">

            {/* Top Row: Method + Input */}
            <div className="flex flex-1 gap-2 relative group w-full">
                {/* Method Badge */}
                <div className="px-3 py-2 rounded-lg bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs tracking-wide flex items-center justify-center shrink-0">
                    POST
                </div>

                {/* URL Input */}
                <div className="flex-1 bg-white dark:bg-background/50 border border-slate-200 dark:border-white/10 rounded-xl focus-within:ring-2 focus-within:ring-primary/50 transition-all focus-within:border-primary/50 relative shadow-sm dark:shadow-none">
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => onUrlChange(e.target.value)}
                        placeholder="Enter Endpoint..."
                        className="w-full h-full bg-transparent border-none rounded-xl px-4 py-2 text-sm focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-800 dark:text-slate-200"
                    />
                </div>
            </div>

            {/* Bottom Row (Mobile): Actions */}
            <div className="flex justify-end gap-2 w-full md:w-auto relative">
                {/* Desktop Actions */}
                <Button variant="ghost" size="sm" className="hidden md:flex">
                    <Save size={16} className="mr-2" />
                    Save
                </Button>

                {/* Connect Button Group - Full width on mobile for better touch targets? Or just right aligned? User said "buttons from bottom". Let's make it fill or right aligned. Right aligned is standard. */}
                <div className="flex rounded-lg overflow-hidden w-full md:w-auto">
                    <Button
                        variant="primary"
                        size="md"
                        className="!py-2 !px-4 !rounded-r-none flex-1 md:flex-none justify-center"
                        onClick={onConnect}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <Loader2 size={16} className="mr-2 animate-spin" />
                        ) : (
                            <Zap size={16} className="mr-2 fill-current" />
                        )}
                        {isLoading ? 'Connecting' : 'Connect'}
                    </Button>

                    {/* Mobile Dropdown Trigger */}
                    <button
                        className="md:hidden bg-primary hover:bg-primary-hover text-white px-3 border-l border-black/10 flex items-center justify-center transition-colors !rounded-r-lg"
                        onClick={() => setShowMenu(!showMenu)}
                    >
                        <ChevronDown size={14} />
                    </button>
                </div>

                {/* Mobile Dropdown Menu */}
                {showMenu && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                        <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-[#1a1a2e] border border-black/5 dark:border-white/10 rounded-xl shadow-lg z-50 overflow-hidden flex flex-col py-1 animate-in fade-in slide-in-from-top-2">
                            <button className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 w-full text-left">
                                <Save size={16} />
                                Save Request
                            </button>
                            <button className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 w-full text-left">
                                <Settings size={16} />
                                Settings
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
