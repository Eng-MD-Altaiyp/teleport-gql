import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Braces, Type } from 'lucide-react';
import { getFieldsForTypeName } from '../../services/graphqlService';
import { collectAllFieldPaths } from '../../utils/schemaTraversal';
import { GraphQLSchema } from 'graphql';

// Selection State: Record<PathString, boolean>
// PathString: "user" / "user.id" / "user.posts"
export type SelectionMap = Record<string, boolean>;

interface SchemaTreeProps {
    schema: GraphQLSchema | null;
    onSelectionChange: (selections: SelectionMap) => void;
}

interface TreeNodeProps {
    name: string;
    typeName: string; // The raw type name (e.g. "User", not "[User]!")
    displayType: string;
    isObject: boolean;
    schema: GraphQLSchema;
    path: string;
    selections: SelectionMap;
    onToggle: (path: string, selected: boolean, typeName?: string) => void;
    level?: number;
}

const TreeNode = ({ name, typeName, displayType, isObject, schema, path, selections, onToggle, level = 0 }: TreeNodeProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [children, setChildren] = useState<any[]>([]);

    const isSelected = !!selections[path];

    useEffect(() => {
        if (isOpen && isObject && children.length === 0) {
            // Lazy load fields
            const fields = getFieldsForTypeName(schema, typeName);
            setChildren(fields);
        }
    }, [isOpen, isObject, typeName, schema, children.length]);

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onToggle(path, e.target.checked, isObject ? typeName : undefined);
    };

    const handleExpand = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    return (
        <div className="select-none animate-in fade-in slide-in-from-left-2 duration-300">
            <div
                className={`flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 group border border-transparent hover:border-black/5 dark:hover:border-white/5 transition-all ${isSelected ? 'bg-primary/10 dark:bg-primary/5 border-primary/20 dark:border-primary/10' : ''}`}
                style={{ marginLeft: `${level * 12}px` }}
            >
                {/* Custom Checkbox */}
                <div className="relative flex items-center justify-center w-4 h-4 mr-1">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={handleCheckboxChange}
                        className="peer appearance-none w-4 h-4 rounded border border-slate-300 dark:border-white/20 bg-slate-100 dark:bg-black/20 checked:bg-primary checked:border-primary transition-colors cursor-pointer"
                    />
                    <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                {/* Arrow / Icon */}
                <div
                    onClick={isObject ? handleExpand : undefined}
                    className={`cursor-pointer w-4 h-4 flex items-center justify-center transition-all ${isObject ? 'hover:text-primary hover:scale-110' : 'opacity-30'}`}
                >
                    {isObject ? (
                        isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                    ) : (
                        <Type size={10} />
                    )}
                </div>

                {/* Name & Type Badge */}
                <div onClick={isObject ? handleExpand : undefined} className="flex-1 flex items-center justify-between cursor-pointer overflow-hidden gap-2">
                    <span className={`text-xs font-semibold truncate transition-colors ${isSelected ? 'text-primary' : 'text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                        {name}
                    </span>

                    {/* Type Badge */}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono border ${isObject
                        ? 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20'
                        : 'bg-amber-100 dark:bg-yellow-500/10 text-amber-600 dark:text-yellow-400 border-amber-200 dark:border-yellow-500/20'
                        }`}>
                        {displayType}
                    </span>
                </div>
            </div>

            {/* Children container with connecting line guide */}
            {isOpen && (
                <div className="relative ml-2 pl-2 border-l border-slate-200 dark:border-white/5">
                    {children.map(child => (
                        <TreeNode
                            key={child.name}
                            name={child.name}
                            typeName={child.rawType}
                            displayType={child.type}
                            isObject={child.isObject}
                            schema={schema}
                            path={`${path}.${child.name}`}
                            selections={selections}
                            onToggle={onToggle}
                            level={level + 1} /* Level handling manual indentation in style above, or we can use level + 1 */
                        />
                    ))}
                    {children.length === 0 && (
                        <div className="ml-8 py-2 text-[10px] text-slate-500 italic">No fields available</div>
                    )}
                </div>
            )}
        </div>
    );
};

export const SchemaTree = ({ schema, onSelectionChange }: SchemaTreeProps) => {
    const [selections, setSelections] = useState<SelectionMap>({});

    const handleToggle = (path: string, selected: boolean, typeName?: string) => {
        const newSelections = { ...selections };

        if (selected) {
            newSelections[path] = true;

            // Recursive selection for objects
            if (typeName && schema) {
                // Get ALL nested field paths using the isolated utility
                const subFields = collectAllFieldPaths(schema, typeName);
                subFields.forEach(subPath => {
                    newSelections[`${path}.${subPath}`] = true;
                });
            }
        } else {
            delete newSelections[path];

            // 1. Recursively deselect children
            Object.keys(newSelections).forEach(key => {
                if (key.startsWith(path + ".")) {
                    delete newSelections[key];
                }
            });

            // 2. Auto-deselect Ancestors (Parent/Grandparent)
            // This prevents parents from remaining as "Leaf" selections when their children are modified.
            // If children exist, the parent will still appear in the Query via the generator logic,
            // but it won't be forced as a "Select All" scalar.
            const parts = path.split('.');
            // Walk up: "user.posts.title" -> "user.posts" -> "user"
            for (let i = parts.length - 1; i > 0; i--) {
                const parentPath = parts.slice(0, i).join('.');
                if (newSelections[parentPath]) {
                    delete newSelections[parentPath];
                }
            }
        }
        setSelections(newSelections);
        onSelectionChange(newSelections);
    };

    if (!schema) return (
        <div className="h-full flex flex-col items-center justify-center p-6 text-center opacity-40">
            <Braces size={40} className="mb-4 text-slate-500" />
            <p className="text-xs font-medium uppercase tracking-widest">No Schema</p>
            <p className="text-[10px] mt-2 max-w-[150px]">Enter a URL and connect to explore the API.</p>
        </div>
    );

    const queryType = schema.getQueryType();
    if (!queryType) return <div className="p-4 text-xs opacity-50">No Query Type found</div>;

    // Root fields of Query
    const rootFields = getFieldsForTypeName(schema, queryType.name);

    return (
        <div className="flex flex-col h-full min-h-0 min-w-0 overflow-auto custom-scrollbar p-2">
            <div className="w-max">
                {rootFields.map(field => (
                    <TreeNode
                        key={field.name}
                        name={field.name}
                        typeName={field.rawType}
                        displayType={field.type}
                        isObject={field.isObject}
                        schema={schema}
                        path={field.name}
                        selections={selections}
                        onToggle={handleToggle}
                    />
                ))}
            </div>
        </div>
    );
};
