import { useHotkey } from '@tanstack/react-hotkeys';
import { useObserver } from 'mobx-react-lite';
import { useTaskSwitcherShortcut } from '@renderer/features/task-switcher/use-task-switcher-shortcut';
import { useAppSettingsKey } from '@renderer/features/settings/use-app-settings-key';
import { getRegisteredTaskData } from '@renderer/features/tasks/stores/task-selectors';
import {
  getEffectiveHotkey,
  getHotkeyRegistration,
} from '@renderer/lib/hooks/useKeyboardShortcuts';
import { useTheme } from '@renderer/lib/hooks/useTheme';
import { useWorkspaceLayoutContext } from '@renderer/lib/layout/layout-provider';
import {
  useNavigate,
  useParams,
  useWorkspaceSlots,
} from '@renderer/lib/layout/navigation-provider';
import { useShowModal } from '@renderer/lib/modal/modal-provider';
import { modalStore } from '@renderer/lib/modal/modal-store';

/**
 * Mounts global keyboard shortcut handlers that require React context and
 * cannot be handled by the command registry.
 *
 * Shortcuts handled here:
 *   - commandPalette: needs showModal with current view context
 *   - projectSwitcher: needs showModal
 *   - switcherNextTask/switcherPrevTask: Ctrl+Tab opens tabSwitcherModal
 *   - toggleLeftSidebar: needs useWorkspaceLayoutContext
 *   - toggleTheme: needs useTheme
 *
 * Shortcuts NOT handled here (owned by the command registry via app-commands.ts):
 *   - settings, newProject, newTask, navigateBack, navigateForward
 */
export function AppKeyboardShortcuts() {
  const { value: keyboard } = useAppSettingsKey('keyboard');
  const showCommandPalette = useShowModal('commandPaletteModal');
  const showProjectSwitcher = useShowModal('projectSwitcherModal');
  const showTabSwitcher = useShowModal('tabSwitcherModal');
  const { toggleLeft } = useWorkspaceLayoutContext();
  const { toggleTheme } = useTheme();
  const { navigate } = useNavigate();

  const commandPaletteHotkey = getEffectiveHotkey('commandPalette', keyboard);
  const projectSwitcherHotkey = getEffectiveHotkey('projectSwitcher', keyboard);
  const closeModalHotkey = getEffectiveHotkey('closeModal', keyboard);
  const projectSwitcherHotkey = getEffectiveHotkey('projectSwitcher', keyboard);
  const toggleLeftSidebarHotkey = getEffectiveHotkey('toggleLeftSidebar', keyboard);
  const toggleThemeHotkey = getEffectiveHotkey('toggleTheme', keyboard);
  const switcherNextHotkey = getEffectiveHotkey('switcherNextTask', keyboard);
  const switcherPrevHotkey = getEffectiveHotkey('switcherPrevTask', keyboard);

  // Resolve current project/task context for the command palette
  const { currentView, lastNonSettingsView } = useWorkspaceSlots();
  const { params: taskParams } = useParams('task');
  const { params: projectParams } = useParams('project');

  const currentProjectId =
    currentView === 'task'
      ? taskParams.projectId
      : currentView === 'project'
        ? projectParams.projectId
        : undefined;
  const currentTaskId = currentView === 'task' ? taskParams.taskId : undefined;
  const currentWorkspaceId = useObserver(() => {
    if (!currentProjectId || !currentTaskId) return undefined;
    return getRegisteredTaskData(currentProjectId, currentTaskId)?.workspaceId ?? undefined;
  });

  useHotkey(
    getHotkeyRegistration('commandPalette', keyboard),
    () => showCommandPalette({ projectId: currentProjectId, taskId: currentTaskId, workspaceId: currentWorkspaceId }),
    { enabled: commandPaletteHotkey !== null }
  );

  useHotkey(
    getHotkeyRegistration('projectSwitcher', keyboard),
    () => showProjectSwitcher({}),
    { enabled: projectSwitcherHotkey !== null }
  );

  useHotkey(
    getHotkeyRegistration('closeModal', keyboard),
    () => {
      if (currentView === 'settings' && !modalStore.isOpen) {
        (navigate as (viewId: typeof lastNonSettingsView) => void)(lastNonSettingsView);
      }
    },
    { enabled: currentView === 'settings' && closeModalHotkey !== null }
  );

  useHotkey(getHotkeyRegistration('projectSwitcher', keyboard), () => showProjectSwitcher({}), {
    enabled: projectSwitcherHotkey !== null,
  });

  useHotkey(getHotkeyRegistration('toggleLeftSidebar', keyboard), () => toggleLeft(), {
    enabled: toggleLeftSidebarHotkey !== null,
  });

  useHotkey(getHotkeyRegistration('toggleTheme', keyboard), () => toggleTheme(), {
    enabled: toggleThemeHotkey !== null,
  });

  // Ctrl+Tab: drives TaskSwitcherStore, opens modal after delay
  useTaskSwitcherShortcut(
    !!(switcherNextHotkey || switcherPrevHotkey),
    currentTaskId,
    (target) => navigate('task', { projectId: target.projectId, taskId: target.taskId }),
    () => showTabSwitcher({})
  );

  return null;
}
