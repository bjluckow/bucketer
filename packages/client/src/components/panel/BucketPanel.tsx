import {
  useState,
  useCallback,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from 'react';
import type { Bucket } from '@bucketer/shared';

import styles from './BucketPanel.module.css';
import { keyLabel } from '@/lib/format';

interface BucketPanelProps {
  buckets: Bucket[];
  onMove: (bucketPath: string) => void;
  onUndo: () => void;
  canUndo: boolean;
  processed: number;
  total: number;
}

export interface BucketPanelHandle {
  pulseButton: (bucketPath: string) => void;
  pulseUndo: () => void;
}

const BucketPanel = forwardRef<BucketPanelHandle, BucketPanelProps>(
  ({ buckets, onMove, onUndo, canUndo, processed, total }, ref) => {
    const [pulsing, setPulsing] = useState<string | null>(null);
    const [undoPulsing, setUndoPulsing] = useState(false);

    const pulseButton = useCallback((bucketPath: string) => {
      setPulsing(bucketPath);
    }, []);

    const pulseUndo = useCallback(() => {
      setUndoPulsing(true);
    }, []);

    useImperativeHandle(ref, () => ({ pulseButton, pulseUndo }), [
      pulseButton,
      pulseUndo,
    ]);

    // Clear pulse after animation
    useEffect(() => {
      if (pulsing) {
        const timer = setTimeout(() => setPulsing(null), 300);
        return () => clearTimeout(timer);
      }
    }, [pulsing]);

    useEffect(() => {
      if (undoPulsing) {
        const timer = setTimeout(() => setUndoPulsing(false), 300);
        return () => clearTimeout(timer);
      }
    }, [undoPulsing]);

    const handleMove = (bucketPath: string) => {
      pulseButton(bucketPath);
      onMove(bucketPath);
    };

    const handleUndo = () => {
      pulseUndo();
      onUndo();
    };

    return (
      <div className={styles.container}>
        <div className={styles.progress}>
          <span className={styles.count}>
            {total > 0 ? Math.min(processed + 1, total) : 0} of {total}
          </span>
        </div>

        <div className={styles.buckets}>
          {buckets.map((bucket) => (
            <button
              key={bucket.path}
              className={`${styles.bucketBtn} ${pulsing === bucket.path ? styles.pulse : ''}`}
              onClick={() => handleMove(bucket.path)}
              disabled={processed >= total}
            >
              <span className={styles.bucketLabel}>{bucket.label}</span>
              {bucket.shortcut && (
                <kbd className={styles.shortcut}>
                  {keyLabel(bucket.shortcut)}
                </kbd>
              )}
            </button>
          ))}
        </div>

        <button
          className={`${styles.undoBtn} ${undoPulsing ? styles.undoPulse : ''}`}
          onClick={handleUndo}
          disabled={!canUndo}
        >
          Undo
          <kbd className={styles.shortcut}>{keyLabel('Backspace')}</kbd>
        </button>
      </div>
    );
  },
);

export default BucketPanel;
