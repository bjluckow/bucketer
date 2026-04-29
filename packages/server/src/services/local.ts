import {
  readdir,
  stat,
  rename,
  mkdir,
  copyFile as fsCopyFile,
  cp,
  rm,
} from 'fs/promises';
import { join, basename, extname, relative, dirname } from 'path';
import { lookup } from 'mime-types';
import type { FileGroup, FileItem, MoveAction } from '@bucketer/shared';

function matchesGlob(filename: string, pattern: string): boolean {
  if (pattern.startsWith('*.')) {
    return filename.endsWith(pattern.slice(1));
  }
  if (pattern.endsWith('/')) {
    return filename.startsWith(pattern);
  }
  return filename === pattern;
}

function shouldInclude(
  filePath: string,
  include: string[],
  exclude: string[],
): boolean {
  const name = basename(filePath);

  if (
    exclude.some(
      (pattern) => matchesGlob(filePath, pattern) || matchesGlob(name, pattern),
    )
  ) {
    return false;
  }

  if (include.length === 0) {
    return true;
  }

  return include.some((pattern) => matchesGlob(name, pattern));
}

export async function listFiles(
  rootDir: string,
  recursive: boolean,
  include: string[],
  exclude: string[],
): Promise<FileItem[]> {
  const files: FileItem[] = [];

  async function walk(dir: string) {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relPath = relative(rootDir, fullPath);

      if (entry.isDirectory()) {
        if (
          recursive &&
          !exclude.some((p) => matchesGlob(entry.name + '/', p))
        ) {
          await walk(fullPath);
        }
      } else if (entry.isFile()) {
        if (shouldInclude(relPath, include, exclude)) {
          const stats = await stat(fullPath);
          const mime = lookup(entry.name) || 'application/octet-stream';

          files.push({
            path: relPath,
            name: entry.name,
            mime,
            size: stats.size,
            metadata: {
              createdAt: stats.birthtimeMs,
              modifiedAt: stats.mtimeMs,
            },
          });
        }
      }
    }
  }

  await walk(rootDir);
  return files;
}

export async function moveFile(
  sourceRoot: string,
  filePath: string,
  bucketPath: string,
  newName?: string,
  copy?: boolean,
): Promise<MoveAction> {
  const srcFull = join(sourceRoot, filePath);
  const fileName = newName || basename(filePath);
  const destDir = bucketPath;

  await mkdir(destDir, { recursive: true });

  const destFull = join(destDir, fileName);

  if (copy) {
    await fsCopyFile(srcFull, destFull);
  } else {
    await rename(srcFull, destFull);
  }

  const stats = await stat(destFull);
  const mime = lookup(fileName) || 'application/octet-stream';

  return {
    file: {
      path: filePath,
      name: basename(filePath),
      mime,
      size: stats.size,
      metadata: { createdAt: stats.birthtimeMs, modifiedAt: stats.mtimeMs },
    },
    from: srcFull,
    to: destFull,
    timestamp: Date.now(),
    copied: copy || false,
  };
}

export async function undoMove(action: MoveAction): Promise<void> {
  if (action.copied) {
    const stats = await stat(action.to);
    if (stats.isDirectory()) {
      await rm(action.to, { recursive: true });
    } else {
      const { unlink } = await import('fs/promises');
      await unlink(action.to);
    }
  } else {
    const originalDir = dirname(action.from);
    await mkdir(originalDir, { recursive: true });
    await rename(action.to, action.from);
  }
}

export function groupByDirectory(files: FileItem[]): FileGroup[] {
  const groups = new Map<string, FileItem[]>();
  const ungrouped: FileItem[] = [];

  for (const file of files) {
    const dir = file.path.includes('/') ? file.path.split('/')[0] : null;

    if (dir) {
      if (!groups.has(dir)) {
        groups.set(dir, []);
      }
      groups.get(dir)!.push(file);
    } else {
      ungrouped.push(file);
    }
  }

  const result: FileGroup[] = [];

  // Each ungrouped file is its own group
  for (const file of ungrouped) {
    result.push({ directory: null, files: [file] });
  }

  // Directories as groups
  for (const [directory, files] of groups) {
    result.push({ directory, files });
  }

  return result;
}

export async function moveDirectory(
  sourceRoot: string,
  dirPath: string,
  bucketPath: string,
  newName?: string,
  copy?: boolean,
): Promise<MoveAction> {
  const srcFull = join(sourceRoot, dirPath);
  const dirName = newName || basename(dirPath);
  const destFull = join(bucketPath, dirName);

  await mkdir(bucketPath, { recursive: true });

  if (copy) {
    await cp(srcFull, destFull, { recursive: true });
  } else {
    await rename(srcFull, destFull);
  }

  const stats = await stat(destFull);

  return {
    file: {
      path: dirPath,
      name: basename(dirPath),
      mime: 'inode/directory',
      size: 0,
      metadata: {
        modifiedAt: stats.mtimeMs,
        createdAt: stats.birthtimeMs,
      },
    },
    from: srcFull,
    to: destFull,
    timestamp: Date.now(),
    copied: copy || false,
  };
}
