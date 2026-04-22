import {
  readdir,
  stat,
  rename,
  mkdir,
  copyFile as fsCopyFile,
} from 'fs/promises';
import { join, basename, extname, relative } from 'path';
import { lookup } from 'mime-types';
import type { FileItem, MoveAction } from '@bucketer/shared';

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
              created: stats.birthtimeMs,
              modified: stats.mtimeMs,
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
      metadata: { created: stats.birthtimeMs, modified: stats.mtimeMs },
    },
    from: srcFull,
    to: destFull,
    timestamp: Date.now(),
    copied: copy || false,
  };
}

export async function undoMove(action: MoveAction): Promise<void> {
  if (action.copied) {
    const { unlink } = await import('fs/promises');
    await unlink(action.to);
  } else {
    const originalDir = action.from.replace(basename(action.from), '');
    await mkdir(originalDir, { recursive: true });
    await rename(action.to, action.from);
  }
}
