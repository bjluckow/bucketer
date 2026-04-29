import type { FileItem, FileGroup } from '@bucketer/shared';
import { formatSize, formatDate } from '@/lib/format';
import styles from './FileInfo.module.css';

interface FileInfoProps {
  group: FileGroup | null;
  file: FileItem | null;
  fileIndex: number;
  filesInGroup: number;
  isGrouped: boolean;
  editedName: string;
  onNameChange: (name: string) => void;
}

export default function FileInfo({
  group,
  file,
  fileIndex,
  filesInGroup,
  isGrouped,
  editedName,
  onNameChange,
}: FileInfoProps) {
  if (!group) {
    return (
      <div className={styles.container}>
        <p className={styles.empty}>No file selected</p>
      </div>
    );
  }

  const totalSize = group.files.reduce((sum, f) => sum + f.size, 0);

  return (
    <div className={styles.container}>
      <label className={styles.label}>
        {isGrouped ? 'Directory' : 'Filename'}
      </label>
      <div className={styles.nameRow}>
        <input
          className={styles.nameInput}
          type="text"
          value={editedName}
          onChange={(e) => onNameChange(e.target.value)}
          spellCheck={false}
        />
        {!isGrouped && file && (
          <span className={styles.ext}>
            {file.name.slice(file.name.lastIndexOf('.'))}
          </span>
        )}
      </div>

      {isGrouped && (
        <div className={styles.meta}>
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Files</span>
            <span className={styles.metaValue}>{filesInGroup}</span>
          </div>
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Total size</span>
            <span className={styles.metaValue}>{formatSize(totalSize)}</span>
          </div>
        </div>
      )}

      {file && (
        <div className={styles.meta}>
          {isGrouped && (
            <div className={styles.fileHeader}>
              <span className={styles.label}>
                File {fileIndex + 1} of {filesInGroup}
              </span>
            </div>
          )}
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Name</span>
            <span className={styles.metaValue} title={file.name}>
              {file.name}
            </span>
          </div>
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
          {file.metadata.createdAt > 0 && (
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Created</span>
              <span className={styles.metaValue}>
                {formatDate(file.metadata.createdAt)}
              </span>
            </div>
          )}
          {file.metadata.modifiedAt > 0 && (
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Modified</span>
              <span className={styles.metaValue}>
                {formatDate(file.metadata.modifiedAt)}
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
          {file.metadata.durationSecs && (
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Duration</span>
              <span className={styles.metaValue}>
                {Math.floor(file.metadata.durationSecs / 60)}:
                {String(Math.floor(file.metadata.durationSecs % 60)).padStart(
                  2,
                  '0',
                )}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
