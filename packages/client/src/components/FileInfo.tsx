import type { FileItem } from '@bucketer/shared';
import { fileUrl } from '../api';
import styles from './FileInfo.module.css';
import { formatDate, formatSize } from '../lib/utils';

interface FileInfoProps {
  file: FileItem | null;
  editedName: string;
  onNameChange: (name: string) => void;
}

export default function FileInfo({
  file,
  editedName,
  onNameChange,
}: FileInfoProps) {
  if (!file) {
    return (
      <div className={styles.container}>
        <p className={styles.empty}>No file selected</p>
      </div>
    );
  }

  const ext = file.name.slice(file.name.lastIndexOf('.'));

  return (
    <div className={styles.container}>
      <label className={styles.label}>Filename</label>
      <div className={styles.nameRow}>
        <input
          className={styles.nameInput}
          type="text"
          value={editedName}
          onChange={(e) => onNameChange(e.target.value)}
          spellCheck={false}
        />
        <span className={styles.ext}>{ext}</span>
      </div>

      <div className={styles.meta}>
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>Path</span>
          <span className={styles.metaValue} title={file.path}>
            {file.path}
          </span>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>Type</span>
          <span className={styles.metaValue}>{file.mime}</span>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>Size</span>
          <span className={styles.metaValue}>{formatSize(file.size)}</span>
        </div>
        {file.metadata.created > 0 && (
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Created</span>
            <span className={styles.metaValue}>
              {formatDate(file.metadata.created)}
            </span>
          </div>
        )}
        {file.metadata.modified > 0 && (
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Modified</span>
            <span className={styles.metaValue}>
              {formatDate(file.metadata.modified)}
            </span>
          </div>
        )}
        {file.metadata.width && file.metadata.height && (
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Dimensions</span>
            <span className={styles.metaValue}>
              {file.metadata.width} × {file.metadata.height}
            </span>
          </div>
        )}
        {file.metadata.duration && (
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Duration</span>
            <span className={styles.metaValue}>
              {Math.floor(file.metadata.duration / 60)}:
              {String(Math.floor(file.metadata.duration % 60)).padStart(2, '0')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
