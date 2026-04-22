import { useEffect, useCallback } from 'react';
import { useBucketer } from './hooks/useBucketer';
import FileViewer from './components/FileViewer';
import FileInfo from './components/FileInfo';
import BucketPanel from './components/BucketPanel';
import styles from './App.module.css';
import { UNDO_KEY } from './lib/config';

export default function App() {
  const {
    config,
    currentFile,
    totalOriginal,
    processed,
    canUndo,
    loading,
    error,
    editedName,
    setEditedName,
    move,
    undo,
    clearError,
  } = useBucketer();

  const handleMove = useCallback(
    (bucketPath: string) => {
      move(bucketPath);
    },
    [move],
  );

  // Keyboard shortcuts
  useEffect(() => {
    if (!config) return;

    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Undo
      if (e.key === UNDO_KEY && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Bucket shortcuts
      const bucket = config!.buckets.find((b) => b.shortcut === e.key);
      if (bucket) {
        e.preventDefault();
        move(bucket.path);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [config, move, undo]);

  // Auto-dismiss errors
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(clearError, 4000);
    return () => clearTimeout(timer);
  }, [error, clearError]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <p>Loading…</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className={styles.loading}>
        <p className={styles.errorText}>Failed to load configuration</p>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <main className={styles.viewer}>
        <FileViewer file={currentFile} />
      </main>

      <aside className={styles.panel}>
        <FileInfo
          file={currentFile}
          editedName={editedName}
          onNameChange={setEditedName}
        />

        <div className={styles.divider} />

        <BucketPanel
          buckets={config.buckets}
          onMove={handleMove}
          onUndo={undo}
          canUndo={canUndo}
          processed={processed}
          totalOriginal={totalOriginal}
        />
      </aside>

      {error && (
        <div className={styles.toast} onClick={clearError}>
          {error}
        </div>
      )}
    </div>
  );
}
