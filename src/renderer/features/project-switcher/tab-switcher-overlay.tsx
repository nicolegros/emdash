import { GitBranch } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useProjectSwitcher } from './use-project-switcher';

interface TabSwitcherOverlayProps {
  onSelect: (projectId: string, taskId: string) => void;
  onDismiss: () => void;
}

export function TabSwitcherOverlay({ onSelect, onDismiss }: TabSwitcherOverlayProps) {
  const { getTaskList, currentTaskId } = useProjectSwitcher();
  const [tasks] = useState(() => getTaskList());
  const [index, setIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();
        setIndex((i) => {
          if (e.shiftKey) return (i - 1 + tasks.length) % tasks.length;
          return (i + 1) % tasks.length;
        });
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onDismiss();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control') {
        const target = tasks[index];
        if (target) onSelect(target.projectId, target.taskId);
        else onDismiss();
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
    };
  }, [tasks, index, onSelect, onDismiss]);

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.children[index] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [index]);

  if (tasks.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20%]">
      <div className="w-80 max-h-96 overflow-y-auto rounded-lg bg-background-quaternary ring-1 ring-foreground/10 shadow-xl p-1">
        <div ref={listRef}>
          {tasks.map((task, i) => (
            <div
              key={task.taskId}
              className={`flex items-center gap-2.5 rounded-md px-2 py-2 text-sm ${
                i === index
                  ? 'bg-background-2 text-foreground'
                  : 'text-foreground-muted'
              }`}
            >
              <GitBranch size={14} className="shrink-0 text-foreground/40" />
              <span className="flex-1 truncate">{task.name}</span>
              {task.taskId === currentTaskId && (
                <span className="shrink-0 text-xs text-foreground/40">current</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
