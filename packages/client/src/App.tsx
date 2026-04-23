import { useEffect, useCallback, useRef } from 'react';
import { useBucketer } from './hooks/useBucketer';
import FileViewer from './components/FileViewer';
import FileInfo from './components/FileInfo';
import BucketPanel from './components/BucketPanel';
import type { BucketPanelHandle } from './components/BucketPanel';
import { UNDO_KEY } from './lib/config';
import styles from './App.module.css';

export default function App() {
  const {
    config,
    currentFile,
    processed,
    total,
    canUndo,
    loading,
    error,
    editedName,
    setEditedName,
    move,
    undo,
    clearError,
  } = useBucketer();

  const panelRef = useRef<BucketPanelHandle>(null);

  const handleMove = useCallback(
    (bucketPath: string) => {
      move(bucketPath);
    },
    [move],
  );

  useEffect(() => {
    if (!config) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === UNDO_KEY) {
        e.preventDefault();
        panelRef.current?.pulseUndo();
        undo();
        return;
      }

      const bucket = config!.buckets.find((b) => b.shortcut === e.key);
      if (bucket) {
        e.preventDefault();
        panelRef.current?.pulseButton(bucket.path);
        move(bucket.path);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [config, move, undo]);

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
          ref={panelRef}
          buckets={config.buckets}
          onMove={handleMove}
          onUndo={undo}
          canUndo={canUndo}
          processed={processed}
          total={total}
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
