import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import yaml from 'js-yaml';
import type { AppConfig } from '@bucketer/shared';

let configDir = process.cwd();

export function getConfigDir(): string {
  return configDir;
}

export function loadConfig(configPath?: string): AppConfig {
  const resolvedPath = resolve(configPath || '../../config.yaml');
  configDir = dirname(resolvedPath);
  const raw = readFileSync(resolvedPath, 'utf-8');
  const parsed = yaml.load(raw) as AppConfig;

  if (!parsed.source) {
    throw new Error('config.yaml: missing "source" block');
  }

  if (!parsed.buckets || parsed.buckets.length === 0) {
    throw new Error('config.yaml: missing or empty "buckets" list');
  }

  parsed.source.recursive = parsed.source.recursive ?? true;
  parsed.source.include = parsed.source.include ?? [];
  parsed.source.exclude = parsed.source.exclude ?? [];

  return parsed;
}
