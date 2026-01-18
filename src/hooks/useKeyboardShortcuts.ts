import { useEffect, useRef, useCallback } from 'react';

type KeyboardShortcutHandler = (event: KeyboardEvent) => void;

interface KeyboardShortcut {
    key: string;
    handler: KeyboardShortcutHandler;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
    preventDefault?: boolean;
}

interface UseKeyboardShortcutsOptions {
    /**
     * Whether shortcuts are enabled
     * @default true
     */
    enabled?: boolean;

    /**
     * Whether to prevent default browser behavior
     * @default true
     */
    preventDefault?: boolean;

    /**
     * Whether to stop event propagation
     * @default false
     */
    stopPropagation?: boolean;
}

/**
 * Hook for registering keyboard shortcuts
 */
export function useKeyboardShortcuts(
    shortcuts: Record<string, KeyboardShortcutHandler>,
    options: UseKeyboardShortcutsOptions = {}
) {
    const {
        enabled = true,
        preventDefault = true,
        stopPropagation = false
    } = options;

    const shortcutsRef = useRef(shortcuts);
    shortcutsRef.current = shortcuts;

    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            const key = event.key;
            const handler = shortcutsRef.current[key];

            if (handler) {
                // Don't trigger if user is typing in an input
                const target = event.target as HTMLElement;
                const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
                const isContentEditable = target.isContentEditable;

                if (isInput || isContentEditable) {
                    return;
                }

                if (preventDefault) {
                    event.preventDefault();
                }

                if (stopPropagation) {
                    event.stopPropagation();
                }

                handler(event);
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [enabled, preventDefault, stopPropagation]);
}

/**
 * Advanced hook for complex keyboard shortcuts with modifiers
 */
export function useAdvancedKeyboardShortcuts(
    shortcuts: KeyboardShortcut[],
    options: UseKeyboardShortcutsOptions = {}
) {
    const {
        enabled = true,
        preventDefault: defaultPreventDefault = true,
        stopPropagation = false
    } = options;

    const shortcutsRef = useRef(shortcuts);
    shortcutsRef.current = shortcuts;

    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement;
            const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
            const isContentEditable = target.isContentEditable;

            if (isInput || isContentEditable) {
                return;
            }

            for (const shortcut of shortcutsRef.current) {
                const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
                const ctrlMatches = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey;
                const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey;
                const altMatches = shortcut.alt ? event.altKey : !event.altKey;
                const metaMatches = shortcut.meta ? event.metaKey : !event.metaKey;

                if (keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches) {
                    const shouldPreventDefault = shortcut.preventDefault ?? defaultPreventDefault;

                    if (shouldPreventDefault) {
                        event.preventDefault();
                    }

                    if (stopPropagation) {
                        event.stopPropagation();
                    }

                    shortcut.handler(event);
                    break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [enabled, defaultPreventDefault, stopPropagation]);
}

/**
 * Hook for Cmd+K / Ctrl+K style shortcuts (cross-platform)
 */
export function useCmdK(handler: () => void, enabled = true) {
    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const isCommandK = (isMac && event.metaKey && event.key === 'k') ||
                (!isMac && event.ctrlKey && event.key === 'k');

            if (isCommandK) {
                event.preventDefault();
                handler();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handler, enabled]);
}

/**
 * Hook for escape key
 */
export function useEscape(handler: () => void, enabled = true) {
    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                handler();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handler, enabled]);
}

/**
 * Hook for arrow key navigation
 */
export function useArrowNavigation(
    handlers: {
        onUp?: () => void;
        onDown?: () => void;
        onLeft?: () => void;
        onRight?: () => void;
        onEnter?: () => void;
    },
    enabled = true
) {
    const handlersRef = useRef(handlers);
    handlersRef.current = handlers;

    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement;
            const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);

            if (isInput) return;

            switch (event.key) {
                case 'ArrowUp':
                    event.preventDefault();
                    handlersRef.current.onUp?.();
                    break;
                case 'ArrowDown':
                    event.preventDefault();
                    handlersRef.current.onDown?.();
                    break;
                case 'ArrowLeft':
                    handlersRef.current.onLeft?.();
                    break;
                case 'ArrowRight':
                    handlersRef.current.onRight?.();
                    break;
                case 'Enter':
                    handlersRef.current.onEnter?.();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [enabled]);
}

export default useKeyboardShortcuts;
