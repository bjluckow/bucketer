import { useState, useEffect, useCallback } from 'react';
import type { AppConfig, FileGroup } from '@bucketer/shared';
import * as api from '../api';

interface UndoEntry {
  group: FileGroup;
  index: number;
  originalName: string;
}

interface BucketerState {
  config: AppConfig | null;
  groups: FileGroup[];
  groupIndex: number;
  fileIndex: number;
  undoStack: UndoEntry[];
  loading: boolean;
  error: string | null;
  total: number;
  processed: number;
}

export function useBucketer() {
  const [state, setState] = useState<BucketerState>({
    config: null,
    groups: [],
    groupIndex: 0,
    fileIndex: 0,
    undoStack: [],
    loading: true,
    error: null,
    total: 0,
    processed: 0,
  });

  const [editedName, setEditedName] = useState('');

  const currentGroup = state.groups[state.groupIndex] ?? null;
  const currentFile = currentGroup?.files[state.fileIndex] ?? null;
  const canUndo = state.undoStack.length > 0;
  const done = state.groups.length === 0 && state.total > 0;
  const isGrouped = currentGroup?.directory !== null;
  const filesInGroup = currentGroup?.files.length ?? 0;

  useEffect(() => {
    async function init() {
      try {
        const [config, groups] = await Promise.all([
          api.fetchConfig(),
          api.fetchFiles(),
        ]);
        setState((s) => ({
          ...s,
          config,
          groups,
          total: groups.length,
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

  // Sync edited name to current group directory or file name
  useEffect(() => {
    if (!currentGroup) return;

    if (currentGroup.directory) {
      const name = currentGroup.directory.split('/').pop() || '';
      setEditedName(name);
    } else if (currentFile) {
      const dotIndex = currentFile.name.lastIndexOf('.');
      setEditedName(
        dotIndex > 0 ? currentFile.name.slice(0, dotIndex) : currentFile.name,
      );
    }
  }, [currentGroup, currentFile]);

  const move = useCallback(
    async (bucketPath: string) => {
      if (!currentGroup) return;

      const originalName = currentGroup.directory
        ? currentGroup.directory.split('/').pop() || ''
        : currentFile?.name || '';

      const isDir = currentGroup.directory !== null;
      const filePath = isDir ? currentGroup.directory! : currentFile!.path;

      let newName: string | undefined;
      if (isDir) {
        if (editedName !== originalName) newName = editedName;
      } else {
        const ext = currentFile!.name.slice(currentFile!.name.lastIndexOf('.'));
        if (editedName + ext !== originalName) newName = editedName + ext;
      }

      try {
        await api.moveFile(filePath, bucketPath, newName, isDir);

        setState((s) => {
          const entry = {
            group: currentGroup,
            index: s.groupIndex,
            originalName,
          };

          if (s.config?.source.copy) {
            return {
              ...s,
              groupIndex: Math.min(s.groupIndex + 1, s.groups.length - 1),
              fileIndex: 0,
              undoStack: [...s.undoStack, entry],
              processed: s.processed + 1,
            };
          }

          const newGroups = s.groups.filter((_, i) => i !== s.groupIndex);
          return {
            ...s,
            groups: newGroups,
            groupIndex: Math.min(
              s.groupIndex,
              Math.max(0, newGroups.length - 1),
            ),
            fileIndex: 0,
            undoStack: [...s.undoStack, entry],
            processed: s.processed + 1,
          };
        });
      } catch (err) {
        setState((s) => ({
          ...s,
          error: err instanceof Error ? err.message : 'Move failed',
        }));
      }
    },
    [currentGroup, currentFile, editedName],
  );

  const undo = useCallback(async () => {
    if (!canUndo) return;

    try {
      await api.undoMove();

      setState((s) => {
        const entry = s.undoStack[s.undoStack.length - 1];
        const newGroups = [...s.groups];
        newGroups.splice(entry.index, 0, entry.group);

        return {
          ...s,
          groups: newGroups,
          groupIndex: entry.index,
          fileIndex: 0,
          undoStack: s.undoStack.slice(0, -1),
          processed: Math.max(0, s.processed - 1),
        };
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        error: err instanceof Error ? err.message : 'Undo failed',
      }));
    }
  }, [canUndo]);

  const nextFile = useCallback(() => {
    setState((s) => {
      const group = s.groups[s.groupIndex];
      if (!group || s.fileIndex >= group.files.length - 1) return s;
      return { ...s, fileIndex: s.fileIndex + 1 };
    });
  }, []);

  const prevFile = useCallback(() => {
    setState((s) => {
      if (s.fileIndex <= 0) return s;
      return { ...s, fileIndex: s.fileIndex - 1 };
    });
  }, []);

  const goToFile = useCallback((index: number) => {
    setState((s) => {
      const group = s.groups[s.groupIndex];
      if (!group || index < 0 || index >= group.files.length) return s;
      return { ...s, fileIndex: index };
    });
  }, []);

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }));
  }, []);

  return {
    config: state.config,
    currentGroup,
    currentFile,
    fileIndex: state.fileIndex,
    filesInGroup,
    isGrouped,
    total: state.total,
    processed: state.processed,
    canUndo,
    done,
    loading: state.loading,
    error: state.error,
    editedName,
    setEditedName,
    move,
    undo,
    nextFile,
    prevFile,
    goToFile,
    clearError,
  };
}
