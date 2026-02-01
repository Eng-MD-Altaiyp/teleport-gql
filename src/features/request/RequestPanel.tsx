import { useState, useEffect } from 'react';
import { EndpointBar } from './EndpointBar';
import { SchemaTree, type SelectionMap } from '../introspection/SchemaTree';
import { fetchIntrospection, executeQuery } from '../../services/graphqlService';
import { GraphQLSchema } from 'graphql';
import { Play, AlertCircle, Copy, Code, Activity, Database, Braces as BracesIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useData } from '../../context/DataContext';
import { SaveAsDialog } from '../../components/ui/SaveAsDialog';
import { getActiveEnvironment, processVariables } from '../../utils/environment';
import { resolveFinalUrl } from '../../utils/url';

const generateQueryFromSelections = (selections: SelectionMap) => {
    // 1. Parse keys into object structure {user: {id: true, posts: {title: true } } }
    const tree: any = {};
    Object.keys(selections).forEach(path => {
        const parts = path.split('.');
        let current = tree;
        parts.forEach((part, index) => {
            // Initialize node if it doesn't exist
            if (current[part] === undefined) {
                if (index === parts.length - 1) {
                    // Leaf node (explicit selection)
                    current[part] = true;
                } else {
                    // Intermediate node
                    current[part] = {};
                }
            } else {
                // Node exists
                if (index === parts.length - 1) {
                    // We simply mark it as selected, but don't overwrite if it's already an object (has children)
                    if (current[part] !== true && typeof current[part] === 'object') {
                        // It's already an object with children, so we don't need to do anything.
                        // The existence of children implies the parent is selected.
                    } else {
                        current[part] = true;
                    }
                } else {
                    // We are traversing down. If it was previously a leaf (true), we must convert it to an object
                    if (current[part] === true) {
                        current[part] = {};
                    }
                }
            }
            current = current[part];
        });
    });

    // 2. Recursive string builder
    const buildString = (node: any, indent = 2): string => {
        if (node === true) return ''; // Leaf

        const fields = Object.keys(node).map(key => {
            const children = buildString(node[key], indent + 2);
            if (children) {
                return `${' '.repeat(indent)}${key} {\n${children}${' '.repeat(indent)}}`;
            } else {
                return `${' '.repeat(indent)}${key}`;
            }
        });

        return fields.join('\n');
    };

    const body = buildString(tree);
    if (!body) return '';
    return `query GeneratedQuery {\n${body}\n}`;
};


export const RequestPanel = () => {
    const {
        tabs,
        activeTabId,
        updateTabContent,
        updateEndpoint,
        markTabDirty,
        collections,
        addEndpointToCollection,
        environments,
        activeEnvironmentId,
        globalVariables,
        globalParams,
        globalSecrets,
    } = useData();

    const activeTab = tabs.find(t => t.id === activeTabId);
    const activeEnvironment = getActiveEnvironment(environments, activeEnvironmentId);
    const globals = { globalVariables, globalParams, globalSecrets };

    // https://spacex-production.up.railway.app/
    const [url, setUrl] = useState("https://graphqlzero.almansi.me/api");
    const [schema, setSchema] = useState<GraphQLSchema | null>(null);
    const [query, setQuery] = useState("");
    const [variables, setVariables] = useState("");
    const [response, setResponse] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [urlError, setUrlError] = useState<string | null>(null);
    const [urlWarning, setUrlWarning] = useState<string | null>(null);
    const [finalUrl, setFinalUrl] = useState<string>("");
    const [meta, setMeta] = useState<{ status: number, time: number, size: number } | null>(null);
    const [activeTabView, setActiveTabView] = useState<'explorer' | 'request' | 'response' | 'variables'>('request'); // Mobile Tab State
    const [showSaveAsDialog, setShowSaveAsDialog] = useState(false);

    // Sync with active tab
    useEffect(() => {
        if (activeTab) {
            setUrl(activeTab.endpoint.url || "https://graphqlzero.almansi.me/api");
            setQuery(activeTab.endpoint.body || "");
        }
    }, [activeTab]);

    // Recompute final URL when inputs or environment change
    useEffect(() => {
        const substituted = processVariables(url, activeEnvironment, globals);
        const result = resolveFinalUrl(activeEnvironment?.baseUrl || '', substituted);
        setFinalUrl(result.finalUrl);
        setUrlError(result.error ?? null);
        setUrlWarning(result.warning ?? null);
    }, [url, activeEnvironment, globalVariables, globalParams, globalSecrets]);

    // -- Actions --

    const handleConnect = async () => {
        setIsLoading(true);
        setError(null);
        if (urlError) {
            setIsLoading(false);
            return;
        }

        const substituted = processVariables(url, activeEnvironment, globals);
        const resolved = resolveFinalUrl(activeEnvironment?.baseUrl || '', substituted);
        if (resolved.error) {
            setUrlError(resolved.error);
            setIsLoading(false);
            return;
        }

        try {
            const schema = await fetchIntrospection(resolved.finalUrl);
            setSchema(schema);
        } catch (e: any) {
            setError("Failed to fetch schema: " + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectionChange = (selections: SelectionMap) => {
        const q = generateQueryFromSelections(selections);
        setQuery(q);
    };

    const handleExecute = async () => {
        if (!query) return;
        if (urlError) return;
        setIsLoading(true);
        setError(null);
        setResponse(null);
        setMeta(null);

        const substitutedUrl = processVariables(url, activeEnvironment, globals);
        const resolvedUrlResult = resolveFinalUrl(activeEnvironment?.baseUrl || '', substitutedUrl);
        if (resolvedUrlResult.error) {
            setUrlError(resolvedUrlResult.error);
            setIsLoading(false);
            return;
        }

        const resolvedQuery = processVariables(query, activeEnvironment, globals);
        const resolvedVariables = processVariables(variables, activeEnvironment, globals);

        try {
            const res = await executeQuery(resolvedUrlResult.finalUrl, resolvedQuery, resolvedVariables);
            if (res.error) {
                setError(res.error);
                setMeta({ status: 0, time: 0, size: 0 });
            } else {
                setResponse(res.data);
                setMeta({ status: res.status, time: res.time, size: res.size });
            }
        } catch (e: any) {
            setError("Request execution failed: " + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Save handlers
    const handleSave = () => {
        if (!activeTab) return;

        // Update endpoint in collection or standalone
        const updatedEndpoint = {
            name: activeTab.title,
            url,
            body: query,
            method: activeTab.endpoint.method,
        };

        updateEndpoint(activeTab.endpoint.id, activeTab.collectionId, updatedEndpoint);
        markTabDirty(activeTab.id, false);
    };

    const handleSaveAs = (name: string, collectionId: string) => {
        if (!activeTab) return;

        const endpoint = {
            name,
            url,
            body: query,
            method: activeTab.endpoint.method,
        };

        addEndpointToCollection(collectionId, endpoint);
        markTabDirty(activeTab.id, false);
    };

    const handleQueryChange = (newQuery: string) => {
        setQuery(newQuery);
        if (activeTab) {
            updateTabContent(activeTab.id, { body: newQuery });
        }
    };

    const handleUrlChange = (newUrl: string) => {
        setUrl(newUrl);
        if (activeTab) {
            updateTabContent(activeTab.id, { url: newUrl });
        }
    };

    // Helper for fake line numbers
    const LineNumbers = ({ text }: { text: string }) => {
        const lines = text.split('\n').length;
        return (
            <div className="flex flex-col text-right pr-3 select-none opacity-20 text-[10px] font-mono py-4 text-slate-600 dark:text-slate-400">
                {Array.from({ length: Math.max(lines, 10) }).map((_, i) => (
                    <div key={i} className="leading-6">{i + 1}</div>
                ))}
            </div>
        );
    };

    // If no active tab, show empty state
    if (!activeTab) {
        return (
            <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500">
                <div className="text-center">
                    <Code size={48} className="mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No active tab. Create a new tab to get started.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-[#050510] text-slate-900 dark:text-slate-200 transition-colors">
            <EndpointBar
                url={url}
                onUrlChange={handleUrlChange}
                onConnect={handleConnect}
                isLoading={isLoading}
                activeTab={activeTab}
                onSave={handleSave}
                onSaveAs={() => setShowSaveAsDialog(true)}
                finalUrl={finalUrl}
                urlError={urlError}
                urlWarning={urlWarning}
            />

            {/* SaveAsDialog */}
            <SaveAsDialog
                isOpen={showSaveAsDialog}
                onClose={() => setShowSaveAsDialog(false)}
                onSave={handleSaveAs}
                collections={collections}
                defaultName={url}
            />

            {/* Mobile Tab Bar - Enhanced */}
            <div className="md:hidden flex gap-1.5 p-2 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg">
                <button
                    onClick={() => setActiveTabView('explorer')}
                    className={`flex-1 py-2.5 px-2 rounded-xl text-[11px] font-bold uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all duration-200 ${activeTabView === 'explorer'
                        ? 'bg-primary text-white shadow-lg shadow-primary/30'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10'
                        }`}
                >
                    <Database size={14} />
                    Explorer
                </button>
                <button
                    onClick={() => setActiveTabView('request')}
                    className={`flex-1 py-2.5 px-2 rounded-xl text-[11px] font-bold uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all duration-200 ${activeTabView === 'request'
                        ? 'bg-primary text-white shadow-lg shadow-primary/30'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10'
                        }`}
                >
                    <Code size={14} />
                    Query
                </button>
                <button
                    onClick={() => setActiveTabView('response')}
                    className={`flex-1 py-2.5 px-2 rounded-xl text-[11px] font-bold uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all duration-200 ${activeTabView === 'response'
                        ? 'bg-primary text-white shadow-lg shadow-primary/30'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10'
                        }`}
                >
                    <Activity size={14} />
                    Response
                </button>
                <button
                    onClick={() => setActiveTabView('variables')}
                    className={`flex-1 py-2.5 px-2 rounded-xl text-[11px] font-bold uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all duration-200 ${activeTabView === 'variables'
                        ? 'bg-primary text-white shadow-lg shadow-primary/30'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10'
                        }`}
                >
                    <BracesIcon size={14} />
                    Vars
                </button>
            </div>

            {/* Main Content Area - Card Grid */}
            <div className="flex-1 overflow-hidden relative p-4 md:grid md:grid-cols-12 md:grid-rows-[1fr] md:gap-6 min-h-0">

                {/* 1. Explorer Card */}
                <div className={`
                    absolute inset-0 z-10 md:static md:col-span-3
                    bg-white/95 dark:bg-slate-900/80 backdrop-blur-xl
                    md:rounded-3xl md:border md:border-slate-200 md:dark:border-white/5 md:shadow-xl md:shadow-slate-200/50 md:dark:shadow-black/50
                    flex flex-col overflow-auto custom-scrollbar min-w-0 min-h-0
                    transition-all duration-300 md:hover:shadow-2xl md:hover:shadow-slate-300/50 md:dark:hover:shadow-black/80
                    ${activeTabView === 'explorer' ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                `}>
                    <div className="h-12 px-5 border-b border-slate-200/50 dark:border-white/5 flex items-center bg-linear-to-r from-slate-100/50 to-transparent dark:from-white/5">
                        <Database size={15} className="mr-2 opacity-60 text-indigo-600 dark:text-indigo-400" />
                        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">Explorer</span>
                    </div>
                    {error && !schema && (
                        <div className="p-3 m-4 text-xs bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl flex gap-2 items-start">
                            <AlertCircle size={14} className="mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                    <SchemaTree schema={schema} onSelectionChange={handleSelectionChange} />
                </div>

                {/* 2. Query & Variables Column */}
                <div className="absolute inset-0 z-20 md:static md:col-span-5 md:flex md:flex-col md:gap-4 overflow-hidden min-h-0">

                    {/* Query Card */}
                    <div className={`
                        absolute inset-0 md:static md:flex-1
                        bg-white/95 dark:bg-slate-900/80 backdrop-blur-xl
                        md:rounded-3xl md:border md:border-slate-200 md:dark:border-white/5 md:shadow-xl md:shadow-slate-200/50 md:dark:shadow-black/50
                        flex flex-col overflow-hidden
                        transition-all duration-300 md:hover:shadow-2xl md:hover:shadow-slate-300/50 md:dark:hover:shadow-black/80
                        ${activeTabView === 'request' ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
                        min-h-0
                    `}>
                        {/* Query Section */}
                        <div className="flex-1 flex flex-col relative group min-h-0">
                            <div className="h-12 px-5 border-b border-slate-200/50 dark:border-white/5 flex items-center justify-between bg-linear-to-r from-slate-100/50 to-transparent dark:from-white/5">
                                <div className="flex items-center">
                                    <Code size={15} className="mr-2 opacity-60 text-pink-600 dark:text-pink-400" />
                                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">Query</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8! px-3! text-[10px]! rounded-lg! text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-white"
                                        onClick={() => navigator.clipboard.writeText(query)}
                                    >
                                        <Copy size={12} className="mr-1" /> COPY
                                    </Button>
                                    <Button
                                        variant={query ? 'primary' : 'ghost'}
                                        size="sm"
                                        className={`h-8! px-4! text-[10px]! rounded-lg! shadow-lg! shadow-primary/20! ${!query ? 'opacity-50 blur-[1px]' : ''}`}
                                        onClick={() => { handleExecute(); setActiveTabView('response'); }}
                                        disabled={!query || isLoading}
                                    >
                                        <Play size={12} className="mr-1 fill-current" /> RUN
                                    </Button>
                                </div>
                            </div>
                            <div className="flex-1 flex relative bg-slate-50 dark:bg-slate-950/50 overflow-auto custom-scrollbar min-h-0">
                                <LineNumbers text={query} />
                                <textarea
                                    className="flex-1 bg-transparent text-sm font-mono text-purple-700 dark:text-blue-300 p-4 pl-0 resize-none focus:outline-none leading-6 placeholder:opacity-40 overflow-hidden"
                                    value={query}
                                    onChange={(e) => handleQueryChange(e.target.value)}
                                    spellCheck={false}
                                    placeholder="# Select fields from Explorer..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Variables Card - Compact and Sticky */}
                    <div className={`
                        absolute inset-0 md:static md:h-32 md:shrink-0
                        bg-white/95 dark:bg-slate-900/80 backdrop-blur-xl
                        md:rounded-2xl md:border md:border-slate-200 md:dark:border-white/5 md:shadow-lg md:shadow-slate-200/40 md:dark:shadow-black/40
                        flex flex-col overflow-hidden
                        transition-all duration-300 md:hover:shadow-xl md:hover:shadow-slate-300/40 md:dark:hover:shadow-black/70
                        ${activeTabView === 'variables' ? 'translate-x-0 z-35' : '-translate-x-full md:translate-x-0'}
                    `}>
                        <div className="h-10 px-4 border-b border-slate-200/50 dark:border-white/5 flex items-center justify-between bg-linear-to-r from-slate-100/50 to-transparent dark:from-white/5">
                            <div className="flex items-center">
                                <BracesIcon size={13} className="mr-2 opacity-60 text-amber-600 dark:text-amber-400" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">Variables</span>
                            </div>
                            <button
                                onClick={() => navigator.clipboard.writeText(variables)}
                                className="h-7 px-2 text-[10px] font-bold uppercase tracking-wide rounded-lg text-slate-500 dark:text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-white/10 dark:hover:text-white transition-colors flex items-center gap-1"
                            >
                                <Copy size={11} /> Copy
                            </button>
                        </div>
                        <div className="flex-1 flex relative bg-slate-50 dark:bg-slate-950/50 overflow-auto custom-scrollbar min-h-0">
                            <LineNumbers text={variables} />
                            <textarea
                                className="flex-1 bg-transparent text-xs font-mono text-amber-700 dark:text-yellow-300 p-3 pl-0 resize-none focus:outline-none leading-5 placeholder:opacity-40 overflow-hidden"
                                value={variables}
                                onChange={(e) => setVariables(e.target.value)}
                                spellCheck={false}
                                placeholder="{}"
                            />
                        </div>
                    </div>
                </div>

                {/* 3. Response Container */}
                <div className="absolute inset-0 z-30 md:static md:col-span-4 md:flex md:flex-col min-h-0">
                    {/* Response Card */}
                    <div className={`
                        absolute inset-0 md:static md:flex-1 min-h-0
                        bg-white/95 dark:bg-slate-900/80 backdrop-blur-xl
                        md:rounded-3xl md:border md:border-slate-200 md:dark:border-white/5 md:shadow-xl md:shadow-slate-200/50 md:dark:shadow-black/50
                        flex flex-col overflow-hidden
                        transition-all duration-300 md:hover:shadow-2xl md:hover:shadow-slate-300/50 md:dark:hover:shadow-black/80
                        ${activeTabView === 'response' ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
                    `}>
                        <div className="h-12 px-5 border-b border-slate-200/50 dark:border-white/5 flex items-center justify-between bg-linear-to-r from-slate-100/50 to-transparent dark:from-white/5 shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center">
                                    <Activity size={15} className="mr-2 opacity-60 text-emerald-600 dark:text-emerald-400" />
                                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">Response</span>
                                </div>

                                {meta && (
                                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${meta.status >= 200 && meta.status < 300 ? 'bg-green-100/50 text-green-700 dark:bg-green-500/10 dark:text-green-400 border border-green-500/20' : 'bg-red-100/50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-500/20'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${meta.status >= 200 && meta.status < 300 ? 'bg-green-600 dark:bg-green-500' : 'bg-red-600 dark:bg-red-500'}`} />
                                            {meta.status}
                                        </div>
                                        <span className="text-[10px] text-slate-500 font-medium">{meta.time}ms</span>
                                    </div>
                                )}
                            </div>

                            {response && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8! px-3! text-[10px]! rounded-lg! text-green-600 dark:text-green-400/70 hover:text-green-700 dark:hover:text-green-400"
                                    onClick={() => navigator.clipboard.writeText(JSON.stringify(response, null, 2))}
                                >
                                    <Copy size={12} className="mr-1" /> JSON
                                </Button>
                            )}
                        </div>

                        <div className="flex-1 overflow-auto custom-scrollbar p-0 bg-slate-50 dark:bg-slate-950/50 min-h-0">
                            {response ? (
                                <div className="flex">
                                    <LineNumbers text={JSON.stringify(response, null, 2)} />
                                    <pre className="flex-1 p-5 pl-0 font-mono text-sm text-green-700 dark:text-green-300 leading-6">
                                        {JSON.stringify(response, null, 2)}
                                    </pre>
                                </div>
                            ) : error ? (
                                <div className="p-8 flex flex-col items-center justify-center opacity-50 h-full text-red-600 dark:text-red-400 animate-in zoom-in-95">
                                    <AlertCircle size={32} className="mb-2 opacity-50" />
                                    <div className="text-sm font-medium">Request Error</div>
                                    <div className="text-xs text-center max-w-xs mt-1 opacity-70">{error}</div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center opacity-20 select-none text-slate-800 dark:text-white">
                                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-current animate-spin-slow mb-4" />
                                    <span className="text-xs uppercase tracking-widest">Ready to run</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
