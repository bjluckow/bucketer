import { Router } from 'express';
import { resolve } from 'path';
import type { AppConfig, MoveAction } from '@bucketer/shared';
import { getConfigDir } from '../config.js';
import * as local from '../services/local.js';
import * as s3 from '../services/s3.js';

const undoStack: MoveAction[] = [];

export function moveRouter(config: AppConfig): Router {
  const router = Router();

  router.post('/api/move', async (req, res) => {
    const { filePath, bucketPath, newName, isDirectory } = req.body as {
      filePath: string;
      bucketPath: string;
      newName?: string;
      isDirectory?: boolean;
    };

    if (!filePath || !bucketPath) {
      res.status(400).json({ error: 'Missing filePath or bucketPath' });
      return;
    }

    try {
      const { source } = config;
      const configDir = getConfigDir();
      const copy = source.copy || false;

      if (isDirectory) {
        const action = await local.moveDirectory(
          resolve(configDir, source.path),
          filePath,
          resolve(configDir, bucketPath),
          newName,
          copy,
        );
        undoStack.push(action);
      } else {
        const action =
          source.type === 's3'
            ? await s3.moveFile(
                source.path,
                filePath,
                bucketPath,
                newName,
                copy,
              )
            : await local.moveFile(
                resolve(configDir, source.path),
                filePath,
                resolve(configDir, bucketPath),
                newName,
                copy,
              );
        undoStack.push(action);
      }

      res.json({
        success: true,
        undoToken: String(undoStack.length - 1),
      });
    } catch (err) {
      console.error('[move] error:', err);
      res.status(500).json({ error: 'Failed to move file' });
    }
  });

  router.post('/api/undo', async (_req, res) => {
    const action = undoStack.pop();

    if (!action) {
      res.status(400).json({ error: 'Nothing to undo' });
      return;
    }

    try {
      const { source } = config;

      if (source.type === 's3') {
        await s3.undoMove(action);
      } else {
        await local.undoMove(action);
      }

      res.json({
        success: true,
        restoredFile: action.file,
      });
    } catch (err) {
      console.error('[undo] error:', err);
      undoStack.push(action);
      res.status(500).json({ error: 'Failed to undo move' });
    }
  });

  return router;
}
