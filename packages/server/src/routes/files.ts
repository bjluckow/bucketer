import { Router } from 'express';
import { resolve, join } from 'path';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import { lookup } from 'mime-types';
import type { AppConfig, FileGroup } from '@bucketer/shared';
import * as local from '../services/local.js';
import * as s3 from '../services/s3.js';
import { getConfigDir } from '../config.js';

export function filesRouter(config: AppConfig): Router {
  const router = Router();

  router.get('/api/config', (_req, res) => {
    res.json(config);
  });

  router.get('/api/files', async (_req, res) => {
    try {
      const { source } = config;
      const files =
        source.type === 's3'
          ? await s3.listFiles(
              source.path,
              source.recursive,
              source.include,
              source.exclude,
            )
          : await local.listFiles(
              resolve(getConfigDir(), source.path),
              source.recursive,
              source.include,
              source.exclude,
            );

      if (source.groupBy === 'directory') {
        res.json(local.groupByDirectory(files));
      } else {
        // Wrap each file as its own group for consistent shape
        const groups: FileGroup[] = files.map((f) => ({
          directory: null,
          files: [f],
        }));
        res.json(groups);
      }
    } catch (err) {
      console.error('[files] list error:', err);
      res.status(500).json({ error: 'Failed to list files' });
    }
  });

  router.get('/api/file', async (req, res) => {
    const filePath = req.query.path as string;

    if (!filePath) {
      res.status(400).json({ error: 'Missing path query param' });
      return;
    }

    try {
      const { source } = config;

      if (source.type === 's3') {
        const { stream, mime } = await s3.getObjectStream(
          source.path,
          filePath,
        );
        res.setHeader('Content-Type', mime);
        // Pipe the S3 stream to response
        const reader = stream.getReader();
        const pump = async () => {
          const { done, value } = await reader.read();
          if (done) {
            res.end();
            return;
          }
          res.write(value);
          await pump();
        };
        await pump();
      } else {
        const fullPath = join(resolve(getConfigDir(), source.path), filePath);
        const stats = await stat(fullPath);
        const mime = lookup(fullPath) || 'application/octet-stream';

        res.setHeader('Content-Type', mime);
        res.setHeader('Content-Length', stats.size);
        createReadStream(fullPath).pipe(res);
      }
    } catch (err) {
      console.error('[files] serve error:', err);
      res.status(404).json({ error: 'File not found' });
    }
  });

  return router;
}
