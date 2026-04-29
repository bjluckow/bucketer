import styles from './PdfViewer.module.css';

interface PdfViewerProps {
  url: string;
  name: string;
}

export default function PdfViewer({ url, name }: PdfViewerProps) {
  return (
    <div className={styles.container}>
      <iframe className={styles.iframe} src={url} title={name} />
    </div>
  );
}
