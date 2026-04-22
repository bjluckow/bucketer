export interface FileItem {
  path: string;
  name: string;
  mime: string;
  size: number;
  metadata: FileMetadata;
}

export interface FileMetadata {
  /** Timestamps */
  modified: number;
  created: number;
  /** Image/video dimensions */
  width?: number;
  height?: number;
  /** Audio/video duration in seconds */
  duration?: number;
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
  copy?: boolean; // If true, copy files instead of moving them
}

export interface AppConfig {
  source: SourceConfig;
  buckets: Bucket[];
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
