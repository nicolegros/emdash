import { GitBranch } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { type BaseModalProps } from '@renderer/lib/modal/modal-provider';
import { useProjectSwitcher } from './use-project-switcher';

export function TabSwitcherModal({ onClose }: BaseModalProps) {
  const { getTaskList, navigateTo, currentTaskId } = useProjectSwitcher();
  const [tasks] = useState(() => getTaskList());
  const [index, setIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();
        setIndex((i) => e.shiftKey
          ? (i - 1 + tasks.length) % tasks.length
          : (i + 1) % tasks.length
        );
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control') {
        const target = tasks[index];
        if (target) navigateTo(target);
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
    };
  }, [tasks, index, navigateTo, onClose]);

  useEffect(() => {
    const el = listRef.current?.children[index] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [index]);

  if (tasks.length === 0) return null;

  return (
    <div ref={listRef} className="p-1">
      {tasks.map((task, i) => (
        <div
          key={task.taskId}
          className={`flex items-center gap-2.5 rounded-md px-2 py-2 text-sm ${
            i === index ? 'bg-background-2 text-foreground' : 'text-foreground-muted'
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
  );
}
