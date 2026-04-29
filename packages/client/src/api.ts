import type {
  AppConfig,
  FileGroup,
  FileItem,
  MoveResponse,
} from '@bucketer/shared';

const BASE = '/api';

export async function fetchConfig(): Promise<AppConfig> {
  const res = await fetch(`${BASE}/config`);
  if (!res.ok) throw new Error('Failed to fetch config');
  return res.json();
}

export async function fetchFiles(): Promise<FileGroup[]> {
  const res = await fetch(`${BASE}/files`);
  if (!res.ok) throw new Error('Failed to fetch files');
  return res.json();
}

export function fileUrl(path: string): string {
  return `${BASE}/file?path=${encodeURIComponent(path)}`;
}

export async function moveFile(
  filePath: string,
  bucketPath: string,
  newName?: string,
  isDirectory?: boolean,
): Promise<MoveResponse> {
  const res = await fetch(`${BASE}/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filePath, bucketPath, newName, isDirectory }),
  });
  if (!res.ok) throw new Error('Failed to move file');
  return res.json();
}

export async function undoMove(): Promise<{
  success: boolean;
  restoredFile: FileItem;
}> {
  const res = await fetch(`${BASE}/undo`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Nothing to undo');
  return res.json();
}
