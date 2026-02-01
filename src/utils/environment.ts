import { type Environment, type EnvVariable } from '../types/models';

const PLACEHOLDER_REGEX = /{{\s*([A-Za-z0-9_.-]+)\s*}}/g;

const resolveFromList = (list: EnvVariable[] | undefined, key: string): string | undefined => {
    const hit = list?.find(v => v.key === key);
    if (!hit) return undefined;
    return hit.localValue ?? hit.sharedValue;
};

export const processVariables = (
    input: string,
    environment?: Environment | null,
    globals?: { globalVariables?: EnvVariable[]; globalParams?: EnvVariable[]; globalSecrets?: EnvVariable[] }
): string => {
    if (!input) return input;

    return input.replace(PLACEHOLDER_REGEX, (match, key) => {
        const envValue =
            resolveFromList(environment?.variables, key) ??
            resolveFromList(environment?.params, key) ??
            resolveFromList(environment?.secrets, key);

        const globalValue =
            resolveFromList(globals?.globalVariables, key) ??
            resolveFromList(globals?.globalParams, key) ??
            resolveFromList(globals?.globalSecrets, key);

        const value = envValue ?? globalValue;
        return value !== undefined ? value : match;
    });
};

export const interpolateHeaders = (
    headers: Record<string, string> | undefined,
    environment?: Environment | null,
    globals?: { globalVariables?: EnvVariable[]; globalParams?: EnvVariable[]; globalSecrets?: EnvVariable[] }
): Record<string, string> | undefined => {
    if (!headers) return headers;

    const resolved: Record<string, string> = {};
    Object.entries(headers).forEach(([headerKey, headerValue]) => {
        resolved[headerKey] = processVariables(headerValue, environment, globals);
    });
    return resolved;
};

export const getActiveEnvironment = (
    environments: Environment[],
    activeEnvironmentId: string | null
): Environment | undefined => {
    if (!activeEnvironmentId) return undefined;
    return environments.find(env => env.id === activeEnvironmentId);
};
