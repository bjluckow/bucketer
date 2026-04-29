export interface AppConfig {
  source: SourceConfig;
  buckets: Bucket[];
}

export interface FileItem {
  path: string;
  name: string;
  mime: string;
  size: number;
  metadata: FileMetadata;
}

export interface FileMetadata {
  /** Timestamps */
  modifiedAt: number;
  createdAt: number;
  /** Image/video dimensions */
  width?: number;
  height?: number;
  /** Audio/video duration in seconds */
  durationSecs?: number;
}

export interface Bucket {
  label: string;
  path: string;
  shortcut?: string; // Keyboard shortcut, e.g. "1", "k", "ctrl+d"
}

export interface SourceConfig {
  type: 'local' | 's3';
  path: string;
  recursive: boolean;
  include: string[];
  exclude: string[];
  copy?: boolean; // copy files instead of moving them
  groupBy?: 'none' | 'directory';
}

export interface FileGroup {
  directory: string | null;
  files: FileItem[];
}

export interface MoveAction {
  file: FileItem;
  from: string;
  to: string;
  timestamp: number;
  copied: boolean;
}

export interface MoveRequest {
  filePath: string;
  bucketPath: string;
  newName?: string;
}

export interface MoveResponse {
  success: boolean;
  undoToken: string;
}
