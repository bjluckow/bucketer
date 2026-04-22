import styles from './VideoViewer.module.css';

interface VideoViewerProps {
  url: string;
  name: string;
}

export default function VideoViewer({ url, name }: VideoViewerProps) {
  return (
    <div className={styles.container}>
      <video
        className={styles.video}
        src={url}
        controls
        autoPlay={false}
        title={name}
      />
    </div>
  );
}
