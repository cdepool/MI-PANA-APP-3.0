import { useState, useCallback, useRef } from 'react';

interface OptimisticUpdateOptions<TData, TResult> {
    /**
     * Function called immediately to update local state optimistically
     */
    onOptimistic: (data: TData) => void;

    /**
     * Async function that performs the actual server update
     */
    onExecute: (data: TData) => Promise<TResult>;

    /**
     * Function called when server update succeeds
     */
    onSuccess?: (result: TResult, data: TData) => void;

    /**
     * Function called when server update fails
     */
    onError?: (error: Error, data: TData) => void;

    /**
     * Function called to rollback optimistic changes on error
     */
    onRollback: (data: TData) => void;
}

interface OptimisticUpdateReturn<TData> {
    /**
     * Execute an optimistic update
     */
    execute: (data: TData) => Promise<void>;

    /**
     * Whether an optimistic update is currently in progress
     */
    isOptimistic: boolean;

    /**
     * Whether the last update failed
     */
    hasError: boolean;

    /**
     * The last error that occurred
     */
    error: Error | null;
}

/**
 * Hook for managing optimistic UI updates with automatic rollback on error
 */
export function useOptimisticUpdate<TData, TResult = void>(
    options: OptimisticUpdateOptions<TData, TResult>
): OptimisticUpdateReturn<TData> {
    const [isOptimistic, setIsOptimistic] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Use ref to always have latest callbacks
    const optionsRef = useRef(options);
    optionsRef.current = options;

    const execute = useCallback(async (data: TData) => {
        const { onOptimistic, onExecute, onSuccess, onError, onRollback } = optionsRef.current;

        // Reset error state
        setHasError(false);
        setError(null);

        // Apply optimistic update immediately
        onOptimistic(data);
        setIsOptimistic(true);

        try {
            // Perform actual server update
            const result = await onExecute(data);

            // Success! Call success callback
            onSuccess?.(result, data);

        } catch (err) {
            // Error! Rollback optimistic changes
            const error = err instanceof Error ? err : new Error(String(err));

            onRollback(data);
            onError?.(error, data);

            setHasError(true);
            setError(error);

        } finally {
            setIsOptimistic(false);
        }
    }, []);

    return {
        execute,
        isOptimistic,
        hasError,
        error
    };
}

/**
 * Simplified version for common use case: updating a single item in a list
 */
export function useOptimisticListUpdate<TItem extends { id: string }>(
    items: TItem[],
    setItems: (items: TItem[]) => void,
    updateFn: (id: string, data: Partial<TItem>) => Promise<void>,
    options?: {
        onSuccess?: (id: string) => void;
        onError?: (error: Error, id: string) => void;
    }
) {
    const itemsRef = useRef<Map<string, TItem>>(new Map());

    return useOptimisticUpdate<{ id: string; updates: Partial<TItem> }, void>({
        onOptimistic: ({ id, updates }) => {
            // Store original item
            const original = items.find(item => item.id === id);
            if (original) {
                itemsRef.current.set(id, original);
            }

            // Apply optimistic update
            setItems(items.map(item =>
                item.id === id ? { ...item, ...updates } : item
            ));
        },
        onExecute: async ({ id, updates }) => {
            await updateFn(id, updates);
        },
        onSuccess: (_, { id }) => {
            // Clear stored original
            itemsRef.current.delete(id);
            options?.onSuccess?.(id);
        },
        onError: (error, { id }) => {
            options?.onError?.(error, id);
        },
        onRollback: ({ id }) => {
            // Restore original item
            const original = itemsRef.current.get(id);
            if (original) {
                setItems(items.map(item =>
                    item.id === id ? original : item
                ));
                itemsRef.current.delete(id);
            }
        }
    });
}

export default useOptimisticUpdate;
