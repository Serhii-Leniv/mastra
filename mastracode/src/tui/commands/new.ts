import type { SlashCommandContext } from './types.js';

export async function handleNewCommand(ctx: SlashCommandContext): Promise<void> {
  const { state } = ctx;

  // Detach from the old thread's event stream so cross-process events
  // don't leak into the new conversation. Unlike bare abort(), this also
  // unsubscribes from the PubSub topic — preventing another mc instance
  // on the same thread from pushing output into this TUI.
  state.session.thread.detachFromCurrent();

  state.pendingNewThread = true;
  state.chatContainer.clear();
  state.pendingTools.clear();
  state.pendingTaskToolIds?.clear();
  state.allToolComponents = [];
  state.allSlashCommandComponents = [];
  state.allSystemReminderComponents = [];
  state.messageComponentsById.clear();
  state.allShellComponents = [];
  // Reset per-run streaming state so orphaned references don't leak.
  state.streamingComponent = undefined;
  state.streamingMessage = undefined;
  state.seenToolCallIds.clear();
  state.subagentToolCallIds.clear();
  state.currentRunSystemReminderKeys.clear();
  state.followUpComponents = [];
  // Clear file tracking in display state (thread_created will also reset this)
  state.session.displayState.get().modifiedFiles.clear();
  // Clear per-thread ephemeral state from the global controller state
  await state.session.state.set({ tasks: [], activePlan: null, sandboxAllowedPaths: [] });
  state.previousPlanSnapshot = undefined;
  if (state.taskProgress) {
    state.taskProgress.updateTasks([]);
  }
  state.taskToolInsertIndex = -1;

  ctx.updateStatusLine();
  // Force a full TUI redraw to reset the differential rendering cache.
  state.ui.requestRender(true);
  ctx.showInfo('Ready for new conversation');
}
