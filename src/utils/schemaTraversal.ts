/**
 * Schema Traversal Utilities
 * 
 * This file contains the logic for recursively traversing a GraphQL schema
 * and collecting all field paths. It is isolated here for easy modification
 * and testing.
 * 
 * @file schemaTraversal.ts
 */

import type {
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLInterfaceType,
    GraphQLNamedType,
    GraphQLField,
} from 'graphql';
import { getNamedType, isInterfaceType, isObjectType } from 'graphql';

// ============================================================================
// TYPES
// ============================================================================

export interface FieldInfo {
    name: string;
    type: string;           // Display type like "[User!]!"
    rawType: string;        // Unwrapped type name like "User"
    /**
     * True when the underlying type can expose child fields.
     * This now includes both Object and Interface types.
     */
    isObject: boolean;
    description?: string | null;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all fields for a given type name from the schema.
 * Unwraps NonNull and List wrappers to get the core type.
 */
export function getFieldsForType(schema: GraphQLSchema, typeName: string): FieldInfo[] {
    const type = schema.getType(typeName);

    // We can only traverse object-like types (objects + interfaces)
    if (!type || !(isObjectType(type) || isInterfaceType(type))) {
        return [];
    }

    // `getFields` exists on both Object and Interface types
    const fields = (type as GraphQLObjectType | GraphQLInterfaceType).getFields();

    return Object.values(fields).map((field: GraphQLField<unknown, unknown>) => {
        // Unwrap all wrappers to the named type (e.g., [User!]! -> User)
        const namedType = getNamedType(field.type);
        const traversable = !!namedType && (isObjectType(namedType) || isInterfaceType(namedType));

        return {
            name: field.name,
            type: field.type.toString(),
            rawType: (namedType as GraphQLNamedType | undefined)?.name || 'Unknown',
            // Mark interface types as traversable so we keep walking their fields
            isObject: traversable,
            description: field.description
        };
    });
}

// ============================================================================
// MAIN TRAVERSAL FUNCTION
// ============================================================================

/**
 * Recursively collects ALL field paths for a given GraphQL type.
 * 
 * ALGORITHM:
 * - Uses breadth-first traversal with a queue
 * - Tracks visited (type + path prefix) combinations to prevent infinite loops
 * - No depth limit - traverses until all unique paths are found
 * 
 * CYCLE DETECTION:
 * - A cycle is detected when we try to traverse into a type that already
 *   exists in the current ancestry chain (not globally)
 * - Example: User -> Posts -> Author(User) is a cycle
 * - But User in branch A and User in branch B are both explored independently
 * 
 * @param schema - The GraphQL schema
 * @param rootTypeName - The starting type name (e.g., "AlbumsPage")
 * @returns Array of all field paths (e.g., ["data", "data.id", "data.user", "data.user.name", ...])
 */
export function collectAllFieldPaths(schema: GraphQLSchema, rootTypeName: string): string[] {
    const allPaths: string[] = [];

    // Queue item structure
    interface QueueItem {
        typeName: string;
        pathPrefix: string;
        ancestorTypes: Set<string>; // Types in the current branch's ancestry
    }

    // Initialize queue with root type
    const queue: QueueItem[] = [{
        typeName: rootTypeName,
        pathPrefix: '',
        ancestorTypes: new Set([rootTypeName])
    }];

    // Process queue (BFS style)
    let safetyCounter = 0;
    const MAX_ITERATIONS = 50000; // Safety limit

    while (queue.length > 0 && safetyCounter < MAX_ITERATIONS) {
        safetyCounter++;

        const current = queue.shift()!; // Take from front (FIFO for BFS)
        const fields = getFieldsForType(schema, current.typeName);

        for (const field of fields) {
            // Build the full path for this field
            const fieldPath = current.pathPrefix
                ? `${current.pathPrefix}.${field.name}`
                : field.name;

            // Add this field's path to our result
            allPaths.push(fieldPath);

            // If this field exposes child fields (object or interface), traverse into it
            if (field.isObject && field.rawType) {
                // Check if this would create a cycle in the current branch
                const wouldCycle = current.ancestorTypes.has(field.rawType);

                if (!wouldCycle) {
                    // Safe to traverse - add to queue
                    const newAncestors = new Set(current.ancestorTypes);
                    newAncestors.add(field.rawType);

                    queue.push({
                        typeName: field.rawType,
                        pathPrefix: fieldPath,
                        ancestorTypes: newAncestors
                    });
                }
                // If cycle detected, field path is already added above,
                // we just don't queue its children for traversal
            }
        }
    }

    if (safetyCounter >= MAX_ITERATIONS) {
        console.warn('[schemaTraversal] Hit safety limit of', MAX_ITERATIONS, 'iterations');
    }

    return allPaths;
}

// ============================================================================
// DEBUG HELPER
// ============================================================================

/**
 * Debug function to log traversal details.
 * Call this instead of collectAllFieldPaths when debugging.
 */
export function collectAllFieldPathsWithDebug(schema: GraphQLSchema, rootTypeName: string): string[] {
    console.group('[schemaTraversal] Starting traversal for:', rootTypeName);

    const paths = collectAllFieldPaths(schema, rootTypeName);

    console.log('Total paths collected:', paths.length);
    console.log('Sample paths:', paths.slice(0, 20));
    console.groupEnd();

    return paths;
}
