import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useBlocker } from 'react-router-dom';

interface UseDirtyStateOptions {
    /**
     * Whether dirty state tracking is enabled
     * @default true
     */
    enabled?: boolean;

    /**
     * Message to show in browser confirmation dialog
     * @default "You have unsaved changes. Are you sure you want to leave?"
     */
    message?: string;

    /**
     * Callback when user tries to navigate away with unsaved changes
     */
    onNavigateAway?: () => boolean | Promise<boolean>;
}

interface UseDirtyStateReturn {
    /**
     * Whether there are unsaved changes
     */
    isDirty: boolean;

    /**
     * Set the dirty state
     */
    setIsDirty: (dirty: boolean) => void;

    /**
     * Mark as dirty
     */
    markDirty: () => void;

    /**
     * Mark as clean (saved)
     */
    markClean: () => void;
}

/**
 * Hook for tracking unsaved changes and blocking navigation
 * 
 * @example
 * ```tsx
 * const { isDirty, markDirty, markClean } = useDirtyState({
 *   enabled: true,
 *   message: "You have unsaved changes. Are you sure you want to leave?"
 * });
 * 
 * // Mark as dirty when form changes
 * const handleChange = () => {
 *   markDirty();
 * };
 * 
 * // Mark as clean after saving
 * const handleSave = async () => {
 *   await saveData();
 *   markClean();
 * };
 * ```
 */
export function useDirtyState(
    options: UseDirtyStateOptions = {}
): UseDirtyStateReturn {
    const {
        enabled = true,
        message = "You have unsaved changes. Are you sure you want to leave?",
        onNavigateAway
    } = options;

    const [isDirty, setIsDirty] = useState(false);
    const isDirtyRef = useRef(isDirty);
    isDirtyRef.current = isDirty;

    // Block browser navigation (refresh, close tab, etc.)
    useEffect(() => {
        if (!enabled || !isDirty) return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = message;
            return message;
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [enabled, isDirty, message]);

    // Block React Router navigation
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) => {
            if (!enabled || !isDirtyRef.current) return false;

            // Allow navigation to same location
            if (currentLocation.pathname === nextLocation.pathname) return false;

            return true;
        }
    );

    // Handle blocked navigation
    useEffect(() => {
        if (blocker.state === 'blocked') {
            const shouldProceed = onNavigateAway ? onNavigateAway() : window.confirm(message);

            if (shouldProceed) {
                setIsDirty(false);
                blocker.proceed();
            } else {
                blocker.reset();
            }
        }
    }, [blocker, message, onNavigateAway]);

    const markDirty = useCallback(() => {
        setIsDirty(true);
    }, []);

    const markClean = useCallback(() => {
        setIsDirty(false);
    }, []);

    return {
        isDirty,
        setIsDirty,
        markDirty,
        markClean
    };
}

/**
 * Hook for tracking form dirty state
 * Automatically marks as dirty when form values change
 */
export function useFormDirtyState<T extends Record<string, any>>(
    initialValues: T,
    options: UseDirtyStateOptions = {}
) {
    const [values, setValues] = useState<T>(initialValues);
    const initialValuesRef = useRef(initialValues);

    // Check if values have changed
    const isDirty = JSON.stringify(values) !== JSON.stringify(initialValuesRef.current);

    const dirtyState = useDirtyState({
        ...options,
        enabled: options.enabled !== false && isDirty
    });

    const resetForm = useCallback(() => {
        setValues(initialValuesRef.current);
        dirtyState.markClean();
    }, [dirtyState]);

    const updateValues = useCallback((newValues: Partial<T>) => {
        setValues(prev => ({ ...prev, ...newValues }));
    }, []);

    return {
        ...dirtyState,
        values,
        setValues,
        updateValues,
        resetForm,
        isDirty
    };
}

export default useDirtyState;
