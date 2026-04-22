import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { loadConfig } from './config.js';
import { filesRouter } from './routes/files.js';
import { moveRouter } from './routes/move.js';

config({ path: '../../.env' });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const appConfig = loadConfig();

app.use(filesRouter(appConfig));
app.use(moveRouter(appConfig));

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
  console.log(
    `[server] source: ${appConfig.source.type} @ ${appConfig.source.path}`,
  );
  console.log(
    `[server] buckets: ${appConfig.buckets.map((b) => b.label).join(', ')}`,
  );
});
