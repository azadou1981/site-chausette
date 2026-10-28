import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import type { RequestHandler } from 'express';
import type { Env } from '../config/env.js';

const EXT: Record<string, string> = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp' };
const MAX_BYTES = 2 * 1024 * 1024;

// Declared mime type can lie: also check the file's magic bytes.
const magicOk = (file: string, mime: string) => {
  const b = Buffer.alloc(12);
  const fd = fs.openSync(file, 'r');
  fs.readSync(fd, b, 0, 12, 0);
  fs.closeSync(fd);
  if (mime === 'image/png') return b.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  if (mime === 'image/jpeg') return b.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  return b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP';
};

export const removeUpload = (env: Env, name?: string | null) => {
  if (name) fs.rmSync(path.join(env.UPLOAD_DIR, path.basename(name)), { force: true });
};

// Optional single `image` file; rejects non-images with 400 and oversize with 413.
export function uploadImage(env: Env): RequestHandler {
  fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });
  const m = multer({
    storage: multer.diskStorage({
      destination: env.UPLOAD_DIR,
      filename: (_req, file, cb) => cb(null, crypto.randomBytes(16).toString('hex') + EXT[file.mimetype]),
    }),
    limits: { fileSize: MAX_BYTES, files: 1 },
    fileFilter: (_req, file, cb) => (EXT[file.mimetype] ? cb(null, true) : cb(Object.assign(new Error('Only PNG, JPEG or WebP images'), { code: 'BAD_TYPE' }))),
  }).single('image');
  return (req, res, next) =>
    m(req, res, (e) => {
      if (!e) {
        if (req.file && !magicOk(req.file.path, req.file.mimetype)) {
          removeUpload(env, req.file.filename);
          e = Object.assign(new Error('Not a valid image'), { code: 'BAD_TYPE' });
        } else return next();
      }
      const tooBig = e.code === 'LIMIT_FILE_SIZE';
      res.status(tooBig ? 413 : 400).json({ error: { code: tooBig ? 'FILE_TOO_LARGE' : 'BAD_UPLOAD', message: tooBig ? 'Image too large (max 2 MB)' : e.message } });
    });
}
