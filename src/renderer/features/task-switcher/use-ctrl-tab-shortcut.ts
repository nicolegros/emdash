import { useEffect } from 'react';
import { modalStore } from '@renderer/lib/modal/modal-store';

/**
 * Registers a raw keydown listener for Ctrl+Tab that opens the tab switcher modal.
 * Uses a raw listener because TanStack hotkeys can't handle Ctrl+Tab reliably.
 */
export function useCtrlTabShortcut(enabled: boolean, showTabSwitcher: (args: {}) => void): void {
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && e.ctrlKey && modalStore.activeModalId !== 'tabSwitcherModal') {
        e.preventDefault();
        showTabSwitcher({});
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [enabled, showTabSwitcher]);
}
