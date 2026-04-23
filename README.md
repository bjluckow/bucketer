# bucketer

A local file triage tool. Point it at a directory or S3 bucket, view each file, and sort it into configurable destination folders with keyboard shortcuts.

## Setup

```bash
npm install
cp config.example.yaml config.yaml   # edit to match your paths
cp .env.example .env                  # add AWS creds if using S3
```

## Usage

```bash
npm run dev
```

Opens the client at `http://localhost:5173` with the API server on port 3001.

## Configuration

**config.yaml**

```yaml
source:
  type: local # or "s3"
  path: ./incoming # local dir or s3://bucket/prefix
  recursive: true
  copy: false # true to copy instead of move
  include:
    - '*.jpg'
    - '*.png'
    - '*.pdf'
  exclude:
    - '.DS_Store'

buckets:
  - label: Keep
    path: ./sorted/keep
    shortcut: '1'
  - label: Trash
    path: ./sorted/trash
    shortcut: '2'
  - label: Review Later
    path: ./sorted/review
    shortcut: '3'
```

**.env** (only needed for S3)

```
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
```

## Keyboard Shortcuts

Each bucket is triggered by its configured `shortcut` key. Undo is bound to Backspace. Shortcuts are disabled while the filename input is focused.

## Supported File Types

- **Images** — jpg, png, gif, webp
- **Video** — mp4, webm
- **Audio** — mp3, wav
- **PDF** — rendered in an embedded viewer
- **Text** — txt, md, json, xml

## Project Structure

```
packages/
  client/       # React + Vite SPA
  server/       # Express API (file listing, move/copy, undo)
  shared/       # TypeScript types shared between client and server
```

## License

MIT
