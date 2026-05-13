import { useEffect, useRef, useState } from 'react';
import { modalStore } from '@renderer/lib/modal/modal-store';
import { useProjectSwitcher } from './use-project-switcher';
import { TabSwitcherOverlay } from './tab-switcher-overlay';

const OVERLAY_DELAY_MS = 200;

/**
 * Manages the Ctrl+Tab task cycling behavior:
 * - Tracks a snapshotted task list and current index while Ctrl is held
 * - Shows a lightweight overlay after a short delay
 * - Navigates to the selected task on Ctrl release
 *
 * Returns a React element to render (the overlay, or null).
 */
export function useTabSwitcher(enabled: boolean): React.ReactElement | null {
  const { getTaskList, navigateTo, currentTaskId } = useProjectSwitcher();
  const [showOverlay, setShowOverlay] = useState(false);
  const [cycleIndex, setCycleIndex] = useState(0);
  const cycleRef = useRef<{ list: Array<{ projectId: string; taskId: string; name: string }>; index: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const getTaskListRef = useRef(getTaskList);
  const navigateToRef = useRef(navigateTo);
  getTaskListRef.current = getTaskList;
  navigateToRef.current = navigateTo;

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && e.ctrlKey && !modalStore.isOpen) {
        e.preventDefault();
        if (!cycleRef.current) {
          cycleRef.current = { list: getTaskListRef.current(), index: -1 };
        }
        const cycle = cycleRef.current;
        if (cycle.list.length === 0) return;
        if (e.shiftKey) {
          cycle.index = (cycle.index - 1 + cycle.list.length) % cycle.list.length;
        } else {
          cycle.index = (cycle.index + 1) % cycle.list.length;
        }
        setCycleIndex(cycle.index);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setShowOverlay(true), OVERLAY_DELAY_MS);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control') {
        if (cycleRef.current && cycleRef.current.index >= 0) {
          navigateToRef.current(cycleRef.current.list[cycleRef.current.index]);
        }
        cycleRef.current = null;
        if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
        setShowOverlay(false);
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
    };
  }, [enabled]);

  if (!showOverlay || !cycleRef.current) return null;
  return <TabSwitcherOverlay tasks={cycleRef.current.list} index={cycleIndex} currentTaskId={currentTaskId} />;
}
