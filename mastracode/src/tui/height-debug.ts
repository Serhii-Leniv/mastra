/**
 * Height debug logging for diagnosing TUI height corruption.
 * Enabled via MC_DEBUG_HEIGHT=1 environment variable.
 * Logs to: <appDataDir>/height-debug.log
 *
 * Also enables pi-tui's built-in debug modes:
 * - PI_DEBUG_REDRAW=1 → logs full redraw triggers to ~/.pi/agent/pi-debug.log
 * - PI_TUI_DEBUG=1 → logs every render frame to /tmp/tui/render-*.log
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

import { getAppDataDir } from '../utils/project.js';

const enabled = ['1', 'true'].includes(process.env.MC_DEBUG_HEIGHT ?? '');

let logStream: fs.WriteStream | undefined;
let frameCount = 0;

function getLogStream(): fs.WriteStream | undefined {
  if (!enabled) return undefined;
  if (!logStream) {
    const logFile = path.join(getAppDataDir(), 'height-debug.log');
    // Truncate on start so we get a clean session
    logStream = fs.createWriteStream(logFile, { flags: 'w' });
    logStream.write(`=== MC Height Debug started ${new Date().toISOString()} ===\n`);
    logStream.write(`PID: ${process.pid}\n`);
    logStream.write(`Terminal: ${process.stdout.columns}x${process.stdout.rows}\n`);
    logStream.write(`TERM: ${process.env.TERM ?? '(unset)'}\n\n`);
  }
  return logStream;
}

export function heightDebugEnabled(): boolean {
  return enabled;
}

/**
 * Log a render frame with key dimensions.
 */
export function logRenderFrame(data: {
  termRows: number;
  termCols: number;
  chatChildrenCount: number;
  totalRenderedLines: number;
  maxLinesRendered: number;
  previousViewportTop: number;
  trigger: string;
}): void {
  const stream = getLogStream();
  if (!stream) return;
  frameCount++;
  const ts = Date.now();
  stream.write(
    `[${ts}] frame#${frameCount} rows=${data.termRows} cols=${data.termCols} ` +
      `children=${data.chatChildrenCount} lines=${data.totalRenderedLines} ` +
      `maxLines=${data.maxLinesRendered} vpTop=${data.previousViewportTop} ` +
      `trigger=${data.trigger}\n`,
  );
}

/**
 * Log when terminal resize is detected.
 */
export function logResize(oldRows: number, newRows: number, oldCols: number, newCols: number): void {
  const stream = getLogStream();
  if (!stream) return;
  stream.write(`[${Date.now()}] RESIZE ${oldCols}x${oldRows} → ${newCols}x${newRows}\n`);
}

/**
 * Log when a thread is loaded/switched.
 */
export function logThreadLoad(threadId: string, messageCount: number): void {
  const stream = getLogStream();
  if (!stream) return;
  stream.write(`[${Date.now()}] THREAD_LOAD id=${threadId} messages=${messageCount}\n`);
}

/**
 * Log when requestRender(force=true) is called.
 */
export function logForceRender(reason: string): void {
  const stream = getLogStream();
  if (!stream) return;
  stream.write(`[${Date.now()}] FORCE_RENDER reason=${reason}\n`);
}

/**
 * Log arbitrary debug messages.
 */
export function logHeightDebug(message: string): void {
  const stream = getLogStream();
  if (!stream) return;
  stream.write(`[${Date.now()}] ${message}\n`);
}

/**
 * Enable pi-tui's built-in debug env vars if MC_DEBUG_HEIGHT is set.
 * Must be called before pi-tui is initialized.
 */
export function enablePiTuiDebug(): void {
  if (!enabled) return;
  process.env.PI_DEBUG_REDRAW = '1';
  process.env.PI_TUI_DEBUG = '1';
}
