import styles from './ImageViewer.module.css';

interface ImageViewerProps {
  url: string;
  name: string;
}

export default function ImageViewer({ url, name }: ImageViewerProps) {
  return (
    <div className={styles.container}>
      <img className={styles.image} src={url} alt={name} draggable={false} />
    </div>
  );
}
