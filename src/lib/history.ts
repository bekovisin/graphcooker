import type { StoreApi } from 'zustand';
import type { ChartSettings, ColumnMapping } from '@/types/chart';
import type { DataRow } from '@/types/data';
import type { ColumnTypeConfig } from '@/components/editor/spreadsheet/types';

interface HistorySnapshot {
  data: DataRow[];
  columnOrder: string[];
  columnMapping: ColumnMapping;
  columnTypes: Record<string, ColumnTypeConfig>;
  seriesNames: Record<string, string>;
  settings: ChartSettings;
}

const MAX_HISTORY = 50;
const DEBOUNCE_MS = 1000;

// Module-level state
let _undoStack: HistorySnapshot[] = [];
let _redoStack: HistorySnapshot[] = [];
let _isUndoRedo = false;
let _pendingSnapshot: HistorySnapshot | null = null;
let _debounceTimer: ReturnType<typeof setTimeout> | null = null;

const TRACKED_KEYS: (keyof HistorySnapshot)[] = [
  'data', 'columnOrder', 'columnMapping',
  'columnTypes', 'seriesNames', 'settings',
];

function captureSnapshot(state: Record<string, unknown>): HistorySnapshot {
  const partial: Record<string, unknown> = {};
  for (const key of TRACKED_KEYS) {
    partial[key] = state[key];
  }
  return structuredClone(partial) as unknown as HistorySnapshot;
}

function contentChanged(state: Record<string, unknown>, prevState: Record<string, unknown>): boolean {
  for (const key of TRACKED_KEYS) {
    if (state[key] !== prevState[key]) return true;
  }
  return false;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyStore = StoreApi<any>;

function updateCounters(store: AnyStore) {
  store.setState({ _undoLen: _undoStack.length, _redoLen: _redoStack.length });
}

function flushPending(store: AnyStore) {
  if (_debounceTimer) {
    clearTimeout(_debounceTimer);
    _debounceTimer = null;
  }
  if (_pendingSnapshot) {
    _undoStack.push(_pendingSnapshot);
    if (_undoStack.length > MAX_HISTORY) _undoStack.shift();
    _redoStack = [];
    _pendingSnapshot = null;
    updateCounters(store);
  }
}

export function initHistory(store: AnyStore): void {
  store.subscribe((state: Record<string, unknown>, prevState: Record<string, unknown>) => {
    if (_isUndoRedo) return;
    if (!contentChanged(state, prevState)) return;

    // Debounce: capture prevState snapshot, reset timer
    // If there's already a pending snapshot, keep it (it's the "before" state of the first change)
    if (!_pendingSnapshot) {
      _pendingSnapshot = captureSnapshot(prevState);
    }

    if (_debounceTimer) clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(() => {
      _debounceTimer = null;
      if (_pendingSnapshot) {
        _undoStack.push(_pendingSnapshot);
        if (_undoStack.length > MAX_HISTORY) _undoStack.shift();
        _redoStack = [];
        _pendingSnapshot = null;
        updateCounters(store);
      }
    }, DEBOUNCE_MS);
  });
}

export function undo(store: AnyStore): void {
  // Flush any pending debounced snapshot first
  flushPending(store);

  if (_undoStack.length === 0) return;

  _isUndoRedo = true;
  try {
    const currentSnapshot = captureSnapshot(store.getState());
    _redoStack.push(currentSnapshot);
    const prev = _undoStack.pop()!;
    store.setState({ ...prev, isDirty: true });
    updateCounters(store);
  } finally {
    _isUndoRedo = false;
  }
}

export function redo(store: AnyStore): void {
  if (_redoStack.length === 0) return;

  _isUndoRedo = true;
  try {
    const currentSnapshot = captureSnapshot(store.getState());
    _undoStack.push(currentSnapshot);
    const next = _redoStack.pop()!;
    store.setState({ ...next, isDirty: true });
    updateCounters(store);
  } finally {
    _isUndoRedo = false;
  }
}

export function clearHistory(store: AnyStore): void {
  _undoStack = [];
  _redoStack = [];
  _pendingSnapshot = null;
  if (_debounceTimer) {
    clearTimeout(_debounceTimer);
    _debounceTimer = null;
  }
  updateCounters(store);
}
