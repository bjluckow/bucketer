import type { FileItem } from '@bucketer/shared';
import { fileUrl } from '../api';
import ImageViewer from './viewers/ImageViewer';
import VideoViewer from './viewers/VideoViewer';
import AudioViewer from './viewers/AudioViewer';
import PdfViewer from './viewers/PdfViewer';
import TextViewer from './viewers/TextViewer';
import styles from './FileViewer.module.css';
import EmailViewer from './viewers/EmailViewer';

interface FileViewerProps {
  file: FileItem | null;
}

export default function FileViewer({ file }: FileViewerProps) {
  if (!file) {
    return (
      <div className={styles.container}>
        <p className={styles.empty}>No files to display</p>
      </div>
    );
  }

  const url = fileUrl(file.path);
  const mime = file.mime;

  if (mime.startsWith('image/')) {
    return <ImageViewer url={url} name={file.name} />;
  }

  if (mime.startsWith('video/')) {
    return <VideoViewer url={url} name={file.name} />;
  }

  if (mime.startsWith('audio/')) {
    return <AudioViewer url={url} name={file.name} />;
  }

  if (mime === 'application/pdf') {
    return <PdfViewer url={url} name={file.name} />;
  }

  if (mime === 'message/rfc822' || file.name.endsWith('.eml')) {
    return <EmailViewer url={fileUrl(file.path)} name={file.name} />;
  }

  if (
    mime.startsWith('text/') ||
    mime === 'application/json' ||
    mime === 'application/xml'
  ) {
    return <TextViewer url={url} name={file.name} />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.unsupported}>
        <p className={styles.unsupportedName}>{file.name}</p>
        <p className={styles.unsupportedMime}>{mime}</p>
        <p className={styles.unsupportedHint}>Preview not available</p>
      </div>
    </div>
  );
}
