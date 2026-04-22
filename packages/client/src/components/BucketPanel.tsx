import type { Bucket } from '@bucketer/shared';
import styles from './BucketPanel.module.css';
import { keyLabel } from '../lib/utils';
import { UNDO_KEY } from '../lib/config';

interface BucketPanelProps {
  buckets: Bucket[];
  onMove: (bucketPath: string) => void;
  onUndo: () => void;
  canUndo: boolean;
  processed: number;
  totalOriginal: number;
}

export default function BucketPanel({
  buckets,
  onMove,
  onUndo,
  canUndo,
  processed,
  totalOriginal,
}: BucketPanelProps) {
  return (
    <div className={styles.container}>
      <div className={styles.progress}>
        <span className={styles.count}>
          {totalOriginal > 0 ? processed + 1 : 0} of {totalOriginal}
        </span>
      </div>

      <div className={styles.buckets}>
        {buckets.map((bucket) => (
          <button
            key={bucket.path}
            className={styles.bucketBtn}
            onClick={() => onMove(bucket.path)}
            disabled={processed >= totalOriginal}
          >
            <span className={styles.bucketLabel}>{bucket.label}</span>
            {bucket.shortcut && (
              <kbd className={styles.shortcut}>{bucket.shortcut}</kbd>
            )}
          </button>
        ))}
      </div>

      <button className={styles.undoBtn} onClick={onUndo} disabled={!canUndo}>
        Undo
        <kbd className={styles.shortcut}>{keyLabel(UNDO_KEY)}</kbd>
      </button>
    </div>
  );
}
