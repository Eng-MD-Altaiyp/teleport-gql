import { getIntrospectionQuery, buildClientSchema, type IntrospectionQuery, GraphQLSchema, GraphQLObjectType, isObjectType, isListType, isNonNullType, GraphQLList, GraphQLNonNull } from 'graphql';

export interface SchemaField {
    name: string;
    type: string;
    description?: string | null;
    isObject: boolean;
    children?: SchemaField[];
    args?: any[];
    rawType: string;
}

export const fetchIntrospection = async (url: string): Promise<GraphQLSchema> => {
    const query = getIntrospectionQuery();

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
    });

    const result = await response.json();

    if (result.errors) {
        throw new Error(result.errors.map((e: any) => e.message).join('\n'));
    }

    // Build the schema object from the JSON result
    return buildClientSchema(result.data as IntrospectionQuery);
};

export const executeQuery = async (url: string, query: string, variables?: string) => {
    let vars = {};
    try {
        if (variables) vars = JSON.parse(variables);
    } catch (e) {
        console.warn("Invalid variables JSON", e);
    }

    const startTime = performance.now();
    let status = 0;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query, variables: vars }),
        });

        status = response.status;
        const data = await response.json();
        const endTime = performance.now();

        return {
            status,
            data,
            time: Math.round(endTime - startTime),
            size: new TextEncoder().encode(JSON.stringify(data)).length
        };
    } catch (e: any) {
        return {
            status: 0, // Network error
            error: e.message,
            time: 0,
            size: 0
        };
    }
}

// Helper to convert Schema to a simple Tree structure for our UI
// This is a simplified traversal. For a full app, we need to handle cycles, fragments, etc.
// Here we just map the Query type fields for the root.
export const schemaToTree = (_schema: GraphQLSchema): SchemaField[] => {
    return []; // Placeholder or remove if unused. Let's keep empty to avoid errors
};

// New Helper: Get fields for a specific Type (used when expanding a node in the tree)
export const getFieldsForTypeName = (schema: GraphQLSchema, typeName: string): SchemaField[] => {
    const type = schema.getType(typeName);
    if (!type || !isObjectType(type)) return [];

    // Explicitly cast fields to allow mapping
    const fields = (type as GraphQLObjectType).getFields();

    return Object.values(fields).map((field: any) => {
        let fieldType = field.type;
        // Clean type name logic
        while (isNonNullType(fieldType) || isListType(fieldType)) {
            if (isNonNullType(fieldType)) fieldType = (fieldType as GraphQLNonNull<any>).ofType;
            if (isListType(fieldType)) fieldType = (fieldType as GraphQLList<any>).ofType;
        }

        return {
            name: field.name,
            type: field.type.toString(),
            rawType: fieldType.name,
            description: field.description,
            isObject: isObjectType(fieldType)
        };
    });
};

/**
 * Recursively collects all field paths for a given GraphQL type.
 * Uses path-based cycle detection: tracks the current ancestry of types
 * to prevent infinite loops while still exploring all unique branches.
 * 
 * Key Insight: When a cycle is detected (e.g., User -> Posts -> User),
 * we stop traversing INTO that specific field, but we still add the field
 * path itself to allow parent selection without causing infinite recursion.
 */
export const getRecursiveFields = (schema: GraphQLSchema, typeName: string): string[] => {
    const allPaths: string[] = [];

    // Use a stack-based approach for clarity and control
    interface TraversalItem {
        type: string;
        path: string;
        ancestorTypes: string[]; // Track the chain of types in current branch
    }

    const stack: TraversalItem[] = [{
        type: typeName,
        path: "",
        ancestorTypes: [typeName] // Start with root type as first ancestor
    }];

    // Safety limit to prevent runaway in pathological schemas
    const maxIterations = 10000;
    let iterations = 0;

    while (stack.length > 0 && iterations < maxIterations) {
        iterations++;
        const current = stack.pop()!;

        const fields = getFieldsForTypeName(schema, current.type);

        for (const field of fields) {
            const fieldPath = current.path
                ? `${current.path}.${field.name}`
                : field.name;

            // Always add the field path - this is a valid selection
            allPaths.push(fieldPath);

            // If this is an object type, consider recursing into it
            if (field.isObject && field.rawType) {
                // Cycle Check: Is this type already in our current ancestry chain?
                const isCycle = current.ancestorTypes.includes(field.rawType);

                if (!isCycle) {
                    // Safe to traverse - add to stack for processing
                    stack.push({
                        type: field.rawType,
                        path: fieldPath,
                        ancestorTypes: [...current.ancestorTypes, field.rawType]
                    });
                }
                // If cycle detected, we already added the fieldPath above,
                // so the field itself will be selected, but we won't recurse into its children.
            }
        }
    }

    return allPaths;
};
