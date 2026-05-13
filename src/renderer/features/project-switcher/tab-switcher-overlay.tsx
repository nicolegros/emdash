import { GitBranch } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface TabSwitcherOverlayProps {
  tasks: Array<{ projectId: string; taskId: string; name: string }>;
  index: number;
  currentTaskId: string | undefined;
}

export function TabSwitcherOverlay({ tasks, index, currentTaskId }: TabSwitcherOverlayProps) {
  const listRef = useRef<HTMLDivElement>(null);

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
      </div>
    </div>
  );
}
