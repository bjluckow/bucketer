export interface FileItem {
  path: string;
  name: string;
  mime: string;
  size: number;
}

export interface Bucket {
  label: string;
  path: string;
  /** Keyboard shortcut, e.g. "1", "k", "ctrl+d" */
  shortcut?: string;
}

export interface SourceConfig {
  type: 'local' | 's3';
  path: string;
  recursive: boolean;
  include: string[];
  exclude: string[];
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
}

export interface MoveRequest {
  filePath: string;
  bucketPath: string;
}

export interface MoveResponse {
  success: boolean;
  undoToken: string;
}
