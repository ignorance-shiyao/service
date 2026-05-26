import path from 'path';
import fs from 'fs/promises';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
    const mockDbPath = path.resolve(__dirname, 'mock', 'mock-db.json');
    const aiDockSessionsPath = path.resolve(__dirname, 'mock', 'ai-dock-sessions.json');

    const mockDataPersistencePlugin = {
      name: 'mock-data-persistence',
      configureServer(server: any) {
        server.middlewares.use('/mock-api/bootstrap', async (req: any, res: any) => {
          if (req.method === 'GET') {
            try {
              const content = await fs.readFile(mockDbPath, 'utf-8');
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.statusCode = 200;
              res.end(content);
            } catch {
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ message: 'mock db file not found' }));
            }
            return;
          }

          if (req.method === 'PUT') {
            try {
              const chunks: Buffer[] = [];
              await new Promise<void>((resolve, reject) => {
                req.on('data', (chunk: Buffer) => chunks.push(chunk));
                req.on('end', () => resolve());
                req.on('error', (error: unknown) => reject(error));
              });

              const payload = Buffer.concat(chunks).toString('utf-8');
              JSON.parse(payload);

              await fs.mkdir(path.dirname(mockDbPath), { recursive: true });
              await fs.writeFile(mockDbPath, payload, 'utf-8');

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ ok: true, path: mockDbPath }));
            } catch (error) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ ok: false, message: (error as Error).message }));
            }
            return;
          }

          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ message: 'method not allowed' }));
        });

        server.middlewares.use('/mock-api/ai-dock-sessions', async (req: any, res: any) => {
          if (req.method === 'GET') {
            try {
              const content = await fs.readFile(aiDockSessionsPath, 'utf-8');
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.statusCode = 200;
              res.end(content);
            } catch {
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ message: 'ai dock sessions file not found' }));
            }
            return;
          }

          if (req.method === 'PUT') {
            try {
              const chunks: Buffer[] = [];
              await new Promise<void>((resolve, reject) => {
                req.on('data', (chunk: Buffer) => chunks.push(chunk));
                req.on('end', () => resolve());
                req.on('error', (error: unknown) => reject(error));
              });

              const payload = Buffer.concat(chunks).toString('utf-8');
              JSON.parse(payload);

              await fs.mkdir(path.dirname(aiDockSessionsPath), { recursive: true });
              await fs.writeFile(aiDockSessionsPath, payload, 'utf-8');

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ ok: true, path: aiDockSessionsPath }));
            } catch (error) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ ok: false, message: (error as Error).message }));
            }
            return;
          }

          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ message: 'method not allowed' }));
        });

        // ── 数字孪生素材上传 ───────────────────────────────────────
        server.middlewares.use('/mock-api/upload-svg', async (req: any, res: any) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ message: 'method not allowed' }));
            return;
          }
          try {
            const chunks: Buffer[] = [];
            await new Promise<void>((resolve, reject) => {
              req.on('data', (c: Buffer) => chunks.push(c));
              req.on('end', () => resolve());
              req.on('error', (e: unknown) => reject(e));
            });
            const body = JSON.parse(Buffer.concat(chunks).toString('utf-8')) as {
              filename: string;
              content: string; // base64
            };
            if (!body.filename || !body.content) throw new Error('missing filename / content');
            // 安全 filename：去除路径分隔符与特殊字符，附时间戳防覆盖
            const cleanName = body.filename.replace(/[\\/]/g, '_').replace(/[^A-Za-z0-9._\-一-龥]/g, '_');
            const ext = path.extname(cleanName) || '.svg';
            const base = path.basename(cleanName, ext);
            const safe = `${base}-${Date.now().toString(36)}${ext}`;
            const customDir = path.resolve(__dirname, 'public', 'svg', 'custom');
            await fs.mkdir(customDir, { recursive: true });
            const target = path.join(customDir, safe);
            const buf = Buffer.from(body.content, 'base64');
            await fs.writeFile(target, buf);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ ok: true, url: `/svg/custom/${safe}`, filename: safe, bytes: buf.length }));
          } catch (error) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ ok: false, message: (error as Error).message }));
          }
        });

        // 删除自定义素材
        server.middlewares.use('/mock-api/delete-svg', async (req: any, res: any) => {
          if (req.method !== 'POST') { res.statusCode = 405; res.end(); return; }
          try {
            const chunks: Buffer[] = [];
            await new Promise<void>((resolve, reject) => {
              req.on('data', (c: Buffer) => chunks.push(c));
              req.on('end', () => resolve());
              req.on('error', (e: unknown) => reject(e));
            });
            const { filename } = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
            const safe = String(filename || '').replace(/[\\/]/g, '');
            if (!safe) throw new Error('missing filename');
            const target = path.resolve(__dirname, 'public', 'svg', 'custom', safe);
            await fs.unlink(target).catch(() => {});
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ ok: true }));
          } catch (error) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ ok: false, message: (error as Error).message }));
          }
        });
      },
    };

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), mockDataPersistencePlugin],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        }
      }
    };
});
