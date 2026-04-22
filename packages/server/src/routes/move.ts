import { Router } from 'express';
import { resolve } from 'path';
import type { AppConfig, MoveAction, MoveRequest } from '@bucketer/shared';
import * as local from '../services/local.js';
import * as s3 from '../services/s3.js';
import { getConfigDir } from '../config.js';

const undoStack: MoveAction[] = [];

export function moveRouter(config: AppConfig): Router {
  const router = Router();

  router.post('/api/move', async (req, res) => {
    const { filePath, bucketPath, newName } = req.body as MoveRequest & {
      newName?: string;
    };

    if (!filePath || !bucketPath) {
      res.status(400).json({ error: 'Missing filePath or bucketPath' });
      return;
    }

    try {
      const { source } = config;
      const action =
        source.type === 's3'
          ? await s3.moveFile(source.path, filePath, bucketPath, newName)
          : await local.moveFile(
              resolve(getConfigDir(), source.path),
              filePath,
              resolve(getConfigDir(), bucketPath),
              newName,
            );

      undoStack.push(action);

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
