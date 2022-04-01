/**
 * Merges two Args objects, for example azure.core.ResourceGroupArgs
 * @param defaults The default parameters that we like
 * @param args optional overrides provided by the consumer
 * @returns {T}
 */
export function combineArgs<T>(defaults: T, args?: DeepPartial<T>): T {
    if (!args) {
        return defaults;
    }

    args = args || {};
    const target = { ...defaults };

    mergeDeep(target, args);

    return target;
}

export type DeepPartial<T> = {
    [P in keyof T]?: DeepPartial<T[P]>;
};

function mergeDeep<T>(target: T, source: DeepPartial<T>) {
    if (isObject(source)) {
        for (const key in source) {
            const sourceValue = source[key];
            if (sourceValue !== undefined && isObject(sourceValue)) {
                if (!target[key]) {Object.assign(target, { [key]: {} });}
                mergeDeep(target[key], sourceValue);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }
}
// Code copied from linked Stack Overflow question
// https://stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge
// Answer by Salakar:
// https://stackoverflow.com/users/2938161/salakar

// eslint-disable-next-line @typescript-eslint/ban-types
function isObject(item: unknown): item is object {
    return (!!item && typeof item === "object" && !Array.isArray(item));
}
