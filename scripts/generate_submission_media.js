import puppeteer from 'puppeteer-core';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');
const outputDir = path.resolve(__dirname, '../submission_assets');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.woff2': 'font/woff2'
};

function startServer(port = 4173) {
  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
    const filePath = path.join(distDir, reqPath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`[Server] Serving dist on http://localhost:${port}`);
      resolve(server);
    });
  });
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

async function run() {
  const server = await startServer(4173);
  const executablePath = getBrowserExecutable();

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,720']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.error('PAGE ERROR:', err.toString()));

    console.log('[Page] Loading http://localhost:4173...');
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle0' });
    await page.waitForSelector('canvas', { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 2000));

    // Dismiss daily modal if present
    await page.evaluate(() => {
      const menu = window.game?.scene?.getScene('MenuScene');
      if (menu) {
        menu.children?.list?.filter(c => c.depth === 350).forEach(m => m.destroy());
      }
    });
    await new Promise((r) => setTimeout(r, 500));

    const canvasElement = await page.$('canvas');

    // Screenshot 1: Clean Main Menu
    console.log('[Capture] Capturing Menu Scene...');
    await canvasElement.screenshot({
      path: path.join(outputDir, 'screenshot_1_main_menu.png')
    });

    // Screenshot 2: Meme Tower Scene
    console.log('[Capture] Navigating to Meme Tower...');
    await page.evaluate(() => {
      const menu = window.game?.scene?.getScene('MenuScene');
      menu.scene.start('MemeTowerScene');
    });
    await new Promise((r) => setTimeout(r, 1200));
    await canvasElement.screenshot({
      path: path.join(outputDir, 'screenshot_2_meme_tower.png')
    });

    // Screenshot 3: Skin Shop Scene
    console.log('[Capture] Navigating to Skin Shop...');
    await page.evaluate(() => {
      const tower = window.game?.scene?.getScene('MemeTowerScene');
      tower.scene.start('ShopScene');
    });
    await new Promise((r) => setTimeout(r, 1200));
    await canvasElement.screenshot({
      path: path.join(outputDir, 'screenshot_3_skin_shop.png')
    });

    // Screenshot 4: 1P Duel GameScene
    console.log('[Capture] Starting GameScene 1P...');
    await page.evaluate(() => {
      const shop = window.game?.scene?.getScene('ShopScene');
      shop.scene.start('GameScene', { mode: '1P' });
    });
    console.log('[Wait] Waiting for round countdown and gameplay...');
    await new Promise((r) => setTimeout(r, 3500));

    // Player 1 jump & shoot
    await page.keyboard.down('KeyW');
    await new Promise((r) => setTimeout(r, 250));
    await page.keyboard.up('KeyW');
    await page.keyboard.press('KeyE');
    await new Promise((r) => setTimeout(r, 300));
    await page.keyboard.press('KeyE');
    await new Promise((r) => setTimeout(r, 500));

    await canvasElement.screenshot({
      path: path.join(outputDir, 'screenshot_4_gameplay_duel.png')
    });

    // Screenshot 5: 2P PvP / Mayhem
    console.log('[Capture] Starting GameScene 2P PvP...');
    await page.evaluate(() => {
      const gameScene = window.game?.scene?.getScene('GameScene');
      gameScene.scene.start('GameScene', { mode: '2P' });
    });
    await new Promise((r) => setTimeout(r, 3500));

    await page.keyboard.down('KeyW');
    await page.keyboard.down('KeyI');
    await new Promise((r) => setTimeout(r, 200));
    await page.keyboard.up('KeyW');
    await page.keyboard.up('KeyI');
    await page.keyboard.press('KeyE');
    await page.keyboard.press('KeyO');
    await new Promise((r) => setTimeout(r, 600));

    await canvasElement.screenshot({
      path: path.join(outputDir, 'screenshot_5_action_mayhem.png')
    });

    console.log('[Success] All screenshots generated!');
  } finally {
    await browser.close();
    server.close();
  }
}

run().catch((err) => {
  console.error('[Error] Generation failed:', err);
  process.exit(1);
});
