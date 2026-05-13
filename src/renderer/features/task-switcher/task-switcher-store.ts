import { computed, makeAutoObservable } from 'mobx';
import { asMounted } from '@renderer/features/projects/stores/project-selectors';
import type { ProjectManagerStore } from '@renderer/features/projects/stores/project-manager';
import { registeredTaskData } from '@renderer/features/tasks/stores/task-store';
import { sortTasksForSwitcher, type SwitcherTask } from './sort-switcher-tasks';

export interface SwitcherEntry {
  projectId: string;
  taskId: string;
  name: string;
}

export class TaskSwitcherStore {
  isCycling = false;
  /** Snapshot of the task list frozen at cycle start. */
  private _cycleList: SwitcherEntry[] = [];
  private _currentTaskId: string | null = null;
  private _index = 0;

  constructor(private readonly projectManager: ProjectManagerStore) {
    makeAutoObservable(this, { tasks: computed });
  }

  /** Live MRU-sorted task list (recomputes reactively). */
  get tasks(): SwitcherEntry[] {
    const result: SwitcherEntry[] = [];
    for (const store of this.projectManager.projects.values()) {
      const mounted = asMounted(store);
      if (!mounted) continue;
      const projectId = mounted.data.id;
      const entries: SwitcherTask[] = [];
      for (const taskStore of mounted.taskManager.tasks.values()) {
        const task = registeredTaskData(taskStore);
        if (!task || task.archivedAt) continue;
        entries.push({
          id: task.id,
          name: task.name,
          status: task.status,
          lastInteractedAt: task.lastInteractedAt ?? task.updatedAt,
        });
      }
      for (const t of sortTasksForSwitcher(entries)) {
        result.push({ projectId, taskId: t.id, name: t.name });
      }
    }
    return result;
  }

  /** The task currently highlighted during a cycle. */
  get pendingTask(): SwitcherEntry | null {
    if (!this.isCycling) return null;
    return this._cycleList[this._index] ?? null;
  }

  /** The frozen list being cycled through (empty when not cycling). */
  get cycleList(): SwitcherEntry[] {
    return this._cycleList;
  }

  /** The task that was active when the cycle started. */
  get currentTaskId(): string | null {
    return this._currentTaskId;
  }

  /** Begin a Ctrl+Tab cycle. No-op if nothing to switch to. */
  startCycle(currentTaskId: string | undefined): boolean {
    const others = this.tasks.filter((t) => t.taskId !== currentTaskId);
    if (others.length === 0) return false;
    const current = this.tasks.find((t) => t.taskId === currentTaskId);
    // Show current task at the end of the list for context
    this._cycleList = current ? [...others, current] : others;
    this._currentTaskId = currentTaskId ?? null;
    this._index = 0;
    this.isCycling = true;
    return true;
  }

  /** Advance selection forward (+1) or backward (-1). */
  advance(direction: 1 | -1): void {
    if (!this.isCycling) return;
    const len = this._cycleList.length;
    this._index = (this._index + direction + len) % len;
  }

  /** Commit the current selection. Returns the target and resets state. */
  commit(): SwitcherEntry | null {
    const target = this.pendingTask;
    this._reset();
    return target;
  }

  /** Cancel the cycle without navigating. */
  cancel(): void {
    this._reset();
  }

  private _reset(): void {
    this.isCycling = false;
    this._cycleList = [];
    this._currentTaskId = null;
    this._index = 0;
  }
}
