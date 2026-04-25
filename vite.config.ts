import path from 'path';
import fs from 'fs/promises';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const mockDbPath = path.resolve(__dirname, 'mock', 'mock-db.json');

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
      },
    };

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), mockDataPersistencePlugin],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        }
      }
    };
});
