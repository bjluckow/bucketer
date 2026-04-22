import styles from './AudioViewer.module.css';

interface AudioViewerProps {
  url: string;
  name: string;
}

export default function AudioViewer({ url, name }: AudioViewerProps) {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <p className={styles.name}>{name}</p>
        <audio className={styles.audio} src={url} controls />
      </div>
    </div>
  );
}
