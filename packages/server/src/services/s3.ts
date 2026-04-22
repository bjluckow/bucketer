import {
  S3Client,
  ListObjectsV2Command,
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { basename } from 'path';
import { lookup } from 'mime-types';
import type { FileItem, MoveAction } from '@bucketer/shared';

let client: S3Client | null = null;

function getClient(): S3Client {
  if (!client) {
    client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }
  return client;
}

function parsePath(s3Path: string): { bucket: string; prefix: string } {
  const withoutProtocol = s3Path.replace(/^s3:\/\//, '');
  const slashIndex = withoutProtocol.indexOf('/');
  if (slashIndex === -1) {
    return { bucket: withoutProtocol, prefix: '' };
  }
  return {
    bucket: withoutProtocol.slice(0, slashIndex),
    prefix: withoutProtocol.slice(slashIndex + 1),
  };
}

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
  key: string,
  include: string[],
  exclude: string[],
): boolean {
  const name = basename(key);

  if (exclude.some((p) => matchesGlob(key, p) || matchesGlob(name, p))) {
    return false;
  }

  if (include.length === 0) {
    return true;
  }

  return include.some((p) => matchesGlob(name, p));
}

export async function listFiles(
  s3Path: string,
  recursive: boolean,
  include: string[],
  exclude: string[],
): Promise<FileItem[]> {
  const s3 = getClient();
  const { bucket, prefix } = parsePath(s3Path);
  const files: FileItem[] = [];

  let continuationToken: string | undefined;

  do {
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      Delimiter: recursive ? undefined : '/',
      ContinuationToken: continuationToken,
    });

    const response = await s3.send(command);

    for (const obj of response.Contents || []) {
      const key = obj.Key!;
      const relPath = prefix ? key.slice(prefix.length) : key;

      if (
        relPath &&
        !relPath.endsWith('/') &&
        shouldInclude(relPath, include, exclude)
      ) {
        files.push({
          path: relPath,
          name: basename(key),
          mime: lookup(key) || 'application/octet-stream',
          size: obj.Size || 0,
          metadata: {
            modified: obj.LastModified?.getTime() || 0,
          },
        });
      }
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return files;
}

export async function moveFile(
  sourcePath: string,
  filePath: string,
  bucketPath: string,
  newName?: string,
): Promise<MoveAction> {
  const s3 = getClient();
  const src = parsePath(sourcePath);
  const dest = parsePath(bucketPath);
  const fileName = newName || basename(filePath);

  const sourceKey = src.prefix + filePath;
  const destKey = dest.prefix + fileName;

  await s3.send(
    new CopyObjectCommand({
      Bucket: dest.bucket,
      Key: destKey,
      CopySource: `${src.bucket}/${sourceKey}`,
    }),
  );

  await s3.send(
    new DeleteObjectCommand({
      Bucket: src.bucket,
      Key: sourceKey,
    }),
  );

  return {
    file: {
      path: filePath,
      name: basename(filePath),
      mime: lookup(filePath) || 'application/octet-stream',
      size: 0,
      metadata: { modified: Date.now() },
    },
    from: `s3://${src.bucket}/${sourceKey}`,
    to: `s3://${dest.bucket}/${destKey}`,
    timestamp: Date.now(),
  };
}

export async function undoMove(action: MoveAction): Promise<void> {
  const s3 = getClient();
  const src = parsePath(action.to);
  const dest = parsePath(action.from);

  const srcKey = src.prefix || basename(action.to);
  const destKey = dest.prefix || basename(action.from);

  await s3.send(
    new CopyObjectCommand({
      Bucket: dest.bucket,
      Key: destKey,
      CopySource: `${src.bucket}/${srcKey}`,
    }),
  );

  await s3.send(
    new DeleteObjectCommand({
      Bucket: src.bucket,
      Key: srcKey,
    }),
  );
}

export async function getObjectStream(
  s3Path: string,
  filePath: string,
): Promise<{ stream: ReadableStream; mime: string }> {
  const s3 = getClient();
  const { bucket, prefix } = parsePath(s3Path);
  const key = prefix + filePath;

  const response = await s3.send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  );

  return {
    stream: response.Body as unknown as ReadableStream,
    mime: response.ContentType || lookup(key) || 'application/octet-stream',
  };
}
