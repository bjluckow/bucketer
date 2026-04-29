import { useRef, useEffect } from 'react';
import type { FileItem } from '@bucketer/shared';
import { fileUrl } from '../../api';
import styles from './Filmstrip.module.css';

interface FilmstripProps {
  files: FileItem[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

export default function Filmstrip({
  files,
  activeIndex,
  onSelect,
}: FilmstripProps) {
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }, [activeIndex]);

  return (
    <div className={styles.container}>
      <div className={styles.track}>
        {files.map((file, i) => {
          const isActive = i === activeIndex;
          const isImage = file.mime.startsWith('image/');

          return (
            <button
              key={file.path}
              ref={isActive ? activeRef : null}
              className={`${styles.thumb} ${isActive ? styles.active : ''}`}
              onClick={() => onSelect(i)}
              title={file.name}
            >
              {isImage ? (
                <img
                  className={styles.thumbImg}
                  src={fileUrl(file.path)}
                  alt={file.name}
                  loading="lazy"
                />
              ) : (
                <span className={styles.thumbLabel}>
                  {file.name.split('.').pop()?.toUpperCase() || '?'}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
