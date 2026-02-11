import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  // Force read .env.local to ensure it overrides shell environment variables
  let localApiKey = env.GEMINI_API_KEY;
  try {
    const envLocalPath = path.resolve(__dirname, '.env.local');
    if (fs.existsSync(envLocalPath)) {
      const content = fs.readFileSync(envLocalPath, 'utf-8');
      const match = content.match(/^GEMINI_API_KEY=(.*)$/m);
      if (match && match[1]) {
        localApiKey = match[1].trim();
      }
    }
  } catch (e) {
    console.error("Error reading .env.local:", e);
  }

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(localApiKey)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
