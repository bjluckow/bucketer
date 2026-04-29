import { useEffect, useCallback, useRef } from 'react';
import { useBucketer } from './hooks/useBucketer';
import { FileViewer, Filmstrip } from './components/viewer';
import { BucketPanel, FileInfo } from './components/panel';
import type { BucketPanelHandle } from './components/panel';
import { UNDO_KEY } from './lib/config';
import styles from './App.module.css';

export default function App() {
  const {
    config,
    currentGroup,
    currentFile,
    fileIndex,
    filesInGroup,
    isGrouped,
    processed,
    total,
    canUndo,
    done,
    loading,
    error,
    editedName,
    setEditedName,
    move,
    undo,
    nextFile,
    prevFile,
    goToFile,
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

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevFile();
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextFile();
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
  }, [config, move, undo, nextFile, prevFile]);

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

  if (done) {
    return (
      <div className={styles.loading}>
        <p>All done! {total} items processed.</p>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <div className={styles.main}>
        <div className={styles.viewer}>
          <FileViewer file={currentFile} />
        </div>

        {isGrouped && currentGroup && filesInGroup > 1 && (
          <Filmstrip
            files={currentGroup.files}
            activeIndex={fileIndex}
            onSelect={goToFile}
          />
        )}
      </div>

      <aside className={styles.panel}>
        <FileInfo
          group={currentGroup}
          file={currentFile}
          fileIndex={fileIndex}
          filesInGroup={filesInGroup}
          isGrouped={isGrouped}
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
