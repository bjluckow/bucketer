import { useState, useEffect, useCallback } from 'react';
import type { AppConfig, FileItem } from '@bucketer/shared';
import * as api from '../api';

interface UndoEntry {
  file: FileItem;
  index: number;
  originalName: string;
}

interface BucketerState {
  config: AppConfig | null;
  files: FileItem[];
  total: number;
  currentIndex: number;
  undoStack: UndoEntry[];
  loading: boolean;
  error: string | null;
}

export function useBucketer() {
  const [state, setState] = useState<BucketerState>({
    config: null,
    files: [],
    total: 0,
    currentIndex: 0,
    undoStack: [],
    loading: true,
    error: null,
  });

  const [editedName, setEditedName] = useState('');

  // Derived values
  const currentFile = state.files[state.currentIndex] ?? null;
  const processed = state.total - state.files.length;
  const canUndo = state.undoStack.length > 0;
  const done = state.files.length === 0 && state.total > 0;

  useEffect(() => {
    async function init() {
      try {
        const [config, files] = await Promise.all([
          api.fetchConfig(),
          api.fetchFiles(),
        ]);
        setState((s) => ({
          ...s,
          config,
          files,
          total: files.length,
          loading: false,
        }));
      } catch (err) {
        setState((s) => ({
          ...s,
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to load',
        }));
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (currentFile) {
      const dotIndex = currentFile.name.lastIndexOf('.');
      setEditedName(
        dotIndex > 0 ? currentFile.name.slice(0, dotIndex) : currentFile.name,
      );
    }
  }, [currentFile]);

  const move = useCallback(
    async (bucketPath: string) => {
      if (!currentFile) return;

      const ext = currentFile.name.slice(currentFile.name.lastIndexOf('.'));
      const originalName = currentFile.name;
      const newName =
        editedName + ext !== originalName ? editedName + ext : undefined;

      try {
        await api.moveFile(currentFile.path, bucketPath, newName);

        setState((s) => {
          const entry = {
            file: currentFile,
            index: s.currentIndex,
            originalName,
          };

          if (s.config?.source.copy) {
            return {
              ...s,
              currentIndex: Math.min(s.currentIndex + 1, s.files.length - 1),
              undoStack: [...s.undoStack, entry],
            };
          }

          const newFiles = s.files.filter((_, i) => i !== s.currentIndex);
          return {
            ...s,
            files: newFiles,
            currentIndex: Math.min(
              s.currentIndex,
              Math.max(0, newFiles.length - 1),
            ),
            undoStack: [...s.undoStack, entry],
          };
        });
      } catch (err) {
        setState((s) => ({
          ...s,
          error: err instanceof Error ? err.message : 'Move failed',
        }));
      }
    },
    [currentFile, editedName],
  );

  const undo = useCallback(async () => {
    if (!canUndo) return;

    try {
      const result = await api.undoMove();

      setState((s) => {
        const entry = s.undoStack[s.undoStack.length - 1];
        const newFiles = [...s.files];
        newFiles.splice(entry.index, 0, result.restoredFile);

        return {
          ...s,
          files: newFiles,
          currentIndex: entry.index,
          undoStack: s.undoStack.slice(0, -1),
        };
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        error: err instanceof Error ? err.message : 'Undo failed',
      }));
    }
  }, [canUndo]);

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }));
  }, []);

  return {
    config: state.config,
    currentFile,
    processed,
    totalOriginal: state.total,
    canUndo,
    done,
    loading: state.loading,
    error: state.error,
    editedName,
    setEditedName,
    move,
    undo,
    clearError,
  };
}
