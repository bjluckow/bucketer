import { useState, useEffect } from 'react';
import PostalMime from 'postal-mime';
import { fileUrl } from '../../api';
import styles from './EmailViewer.module.css';

interface EmailViewerProps {
  url: string;
  name: string;
}

interface ParsedEmail {
  subject: string;
  from: { name?: string; address?: string };
  to: { name?: string; address?: string }[];
  date?: string;
  html: string;
  text: string;
  attachments: {
    filename: string;
    mimeType: string;
    content: ArrayBuffer;
  }[];
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Attachment({
  att,
  blobUrl,
}: {
  att: { filename: string; mimeType: string; content: ArrayBuffer };
  blobUrl: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const isImage = att.mimeType.startsWith('image/');
  const isPdf = att.mimeType === 'application/pdf';
  const isText =
    att.mimeType.startsWith('text/') ||
    att.mimeType === 'application/json' ||
    att.mimeType === 'application/xml';
  const hasPreview = isImage || isPdf || isText;

  const [textContent, setTextContent] = useState<string | null>(null);

  useEffect(() => {
    if (expanded && isText && !textContent) {
      const decoder = new TextDecoder();
      setTextContent(decoder.decode(att.content));
    }
  }, [expanded, isText, textContent, att.content]);

  return (
    <div className={styles.attachment}>
      <div
        className={styles.attachmentHeader}
        onClick={() => hasPreview && setExpanded(!expanded)}
        style={{ cursor: hasPreview ? 'pointer' : 'default' }}
      >
        <div className={styles.attachmentInfo}>
          {hasPreview && (
            <span className={styles.chevron}>{expanded ? '▾' : '▸'}</span>
          )}
          <a
            className={styles.attachmentName}
            href={blobUrl}
            target="_blank"
            rel="noopener noreferrer"
            download={att.filename}
            onClick={(e) => e.stopPropagation()}
          >
            {att.filename}
          </a>
        </div>
        <span className={styles.attachmentMeta}>
          {att.mimeType} · {formatSize(att.content.byteLength)}
        </span>
      </div>

      {expanded && (
        <div className={styles.attachmentPreviewWrap}>
          {isImage && (
            <img
              className={styles.attachmentPreview}
              src={blobUrl}
              alt={att.filename}
            />
          )}
          {isPdf && (
            <iframe
              className={styles.attachmentPdf}
              src={blobUrl}
              title={att.filename}
            />
          )}
          {isText && textContent !== null && (
            <pre className={styles.attachmentText}>{textContent}</pre>
          )}
        </div>
      )}
    </div>
  );
}

export default function EmailViewer({ url, name }: EmailViewerProps) {
  const [email, setEmail] = useState<ParsedEmail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load email');
        return res.text();
      })
      .then((raw) => PostalMime.parse(raw))
      .then((parsed) => {
        setEmail(parsed as ParsedEmail);

        const urls = (parsed.attachments || []).map((att) => {
          const blob = new Blob([att.content as BlobPart], {
            type: att.mimeType,
          });
          return URL.createObjectURL(blob);
        });
        setAttachmentUrls(urls);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });

    return () => {
      attachmentUrls.forEach(URL.revokeObjectURL);
    };
  }, [url]);

  if (loading) {
    return (
      <div className={styles.container}>
        <p className={styles.status}>Loading…</p>
      </div>
    );
  }

  if (error || !email) {
    return (
      <div className={styles.container}>
        <p className={styles.error}>{error || 'Failed to load email'}</p>
      </div>
    );
  }

  const fromStr = email.from?.name
    ? `${email.from.name} <${email.from.address}>`
    : email.from?.address || '';

  const toStr =
    email.to
      ?.map((t) => (t.name ? `${t.name} <${t.address}>` : t.address))
      .join(', ') || '';

  return (
    <div className={styles.container}>
      <div className={styles.headers}>
        <h2 className={styles.subject}>{email.subject || '(no subject)'}</h2>
        <div className={styles.headerRow}>
          <span className={styles.headerLabel}>From</span>
          <span className={styles.headerValue}>{fromStr}</span>
        </div>
        <div className={styles.headerRow}>
          <span className={styles.headerLabel}>To</span>
          <span className={styles.headerValue}>{toStr}</span>
        </div>
        {email.date && (
          <div className={styles.headerRow}>
            <span className={styles.headerLabel}>Date</span>
            <span className={styles.headerValue}>
              {new Date(email.date).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      <div className={styles.body}>
        {email.html ? (
          <iframe
            className={styles.htmlFrame}
            srcDoc={email.html}
            sandbox=""
            title={email.subject || name}
          />
        ) : (
          <pre className={styles.textBody}>{email.text}</pre>
        )}
      </div>

      {email.attachments.length > 0 && (
        <div className={styles.attachments}>
          <h3 className={styles.attachmentsTitle}>
            Attachments ({email.attachments.length})
          </h3>
          {email.attachments.map((att, i) => (
            <Attachment key={i} att={att} blobUrl={attachmentUrls[i]} />
          ))}
        </div>
      )}
    </div>
  );
}
