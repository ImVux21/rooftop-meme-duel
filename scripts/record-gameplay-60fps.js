import http from 'http';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');
const storeAssetsDir = path.resolve(__dirname, '../store-assets');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.mp4': 'video/mp4'
};

function startServer(port = 4173) {
  const server = http.createServer((req, res) => {
    let filePath = path.join(distDir, req.url.split('?')[0]);
    if (filePath.endsWith('/') || !path.extname(filePath)) filePath = path.join(filePath, 'index.html');
    const ext = path.extname(filePath);
    if (fs.existsSync(filePath)) {
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  return new Promise((resolve) => server.listen(port, () => resolve(server)));
}

function getBrowserExecutable() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error('Neither Chrome nor Edge was found on system.');
}

async function main() {
  console.log('[Server] Starting local server on port 4173...');
  const server = await startServer(4173);

  const executablePath = getBrowserExecutable();
  console.log(`[Browser] Launching hardware accelerated Chrome: ${executablePath}`);

  const browser = await puppeteer.launch({
    executablePath,
    headless: false, // Visible with real GPU acceleration for stable 60 FPS WebGL
    args: [
      '--enable-gpu',
      '--ignore-gpu-blocklist',
      '--enable-webgl',
      '--enable-webgl2',
      '--window-size=1280,720',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });

    // Pre-seed storage so no modals pop up
    await page.goto('http://localhost:4173');
    await page.evaluate(() => {
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem('rooftop_duel_daily_bonus_pending', 'null');
      localStorage.setItem('rooftop_duel_last_login_date', today);
    });

    console.log('[Page] Loading game...');
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForSelector('canvas', { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 1500));

    // Dismiss daily modal if present
    await page.evaluate(() => {
      const menu = window.game?.scene?.getScene('MenuScene');
      if (menu) {
        menu.children?.list?.filter(c => c.depth === 350).forEach(m => m.destroy());
      }
    });

    // Start 1P Match
    console.log('[Gameplay] Starting 1P GameScene...');
    await page.evaluate(() => {
      const menu = window.game?.scene?.getScene('MenuScene');
      menu.scene.start('GameScene', { mode: '1P', arena: 'rooftop' });
    });

    // Wait for countdown (3... 2... 1... DUEL!)
    console.log('[Countdown] Waiting 3.2s for countdown to finish...');
    await new Promise((r) => setTimeout(r, 3200));

    // Start 60 FPS MediaRecorder stream
    console.log('[Recording] Starting 60 FPS Canvas capture...');
    await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      const stream = canvas.captureStream(60);
      window._mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 12000000
      });
      window._recordedChunks = [];
      window._mediaRecorder.ondataavailable = (e) => {
        if (e.data?.size > 0) window._recordedChunks.push(e.data);
      };
      window._mediaRecorder.start();
    });

    // Play action gameplay for ~12 seconds
    console.log('[Gameplay] Simulating intense rooftop battle...');
    const startTime = Date.now();
    let toggle = false;

    while (Date.now() - startTime < 12000) {
      // Jump & lean
      await page.keyboard.down('KeyW');
      await new Promise((r) => setTimeout(r, toggle ? 180 : 260));
      await page.keyboard.up('KeyW');

      // Shoot
      await page.keyboard.press('KeyE');
      await new Promise((r) => setTimeout(r, 150));
      await page.keyboard.press('KeyE');
      await new Promise((r) => setTimeout(r, 350));

      toggle = !toggle;
    }

    console.log('[Recording] Stopping MediaRecorder...');
    const base64Video = await page.evaluate(async () => {
      return new Promise((resolve) => {
        window._mediaRecorder.onstop = () => {
          const blob = new Blob(window._recordedChunks, { type: 'video/webm' });
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result.split(',')[1]);
          reader.readAsDataURL(blob);
        };
        window._mediaRecorder.stop();
      });
    });

    await page.close();
    await browser.close();
    server.close();

    const tempWebm = path.resolve(__dirname, '../temp_raw_60fps.webm');
    fs.writeFileSync(tempWebm, Buffer.from(base64Video, 'base64'));
    console.log(`[Temp] Saved raw video: ${tempWebm} (${fs.statSync(tempWebm).size} bytes)`);

    // FFmpeg render standard 60 FPS MP4s
    const outLandscape = path.join(storeAssetsDir, 'preview_landscape.mp4');
    const outPortrait = path.join(storeAssetsDir, 'preview_portrait.mp4');

    console.log('[FFmpeg] Rendering Landscape 1920x1080 @ 60 FPS MP4...');
    execSync(`ffmpeg -y -i "${tempWebm}" -vf "scale=1920:1080:flags=lanczos" -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p -r 60 -an "${outLandscape}"`);

    console.log('[FFmpeg] Rendering Portrait 800x1200 @ 60 FPS MP4...');
    execSync(`ffmpeg -y -i "${tempWebm}" -vf "crop=480:720:(in_w-480)/2:(in_h-720)/2,scale=800:1200:flags=lanczos" -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p -r 60 -an "${outPortrait}"`);

    fs.unlinkSync(tempWebm);
    console.log('✅ Hoàn thành xuất 2 video 60 FPS chất lượng cao trong store-assets/!');
  } catch (err) {
    console.error('[Error] Recording failed:', err);
    try { await browser.close(); } catch (e) {}
    server.close();
    process.exit(1);
  }
}

main();
