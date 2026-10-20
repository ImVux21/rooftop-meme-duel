import puppeteer from 'puppeteer-core';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');
const storeAssetsDir = path.resolve(__dirname, '../store-assets');

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

async function generateCovers() {
  const executablePath = getBrowserExecutable();

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // 1. Generate Landscape Cover: 1920 x 1080 (16:9)
    console.log('[Cover] Generating Landscape Cover (1920x1080)...');
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700;800&family=Lilita+One&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            width: 1920px;
            height: 1080px;
            overflow: hidden;
            background: linear-gradient(135deg, #090d16 0%, #151c2d 50%, #0a0f1d 100%);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 100px 140px;
            font-family: 'Lilita One', 'Fredoka', cursive, sans-serif;
            position: relative;
          }
          .skyline {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 380px;
            background: repeating-linear-gradient(90deg, #0b1120 0px, #0b1120 120px, #111a2e 120px, #111a2e 200px);
            opacity: 0.35;
            z-index: 1;
            clip-path: polygon(0 40%, 15% 30%, 30% 60%, 45% 20%, 65% 50%, 80% 30%, 100% 45%, 100% 100%, 0% 100%);
          }
          .content-left {
            z-index: 2;
            max-width: 950px;
          }
          .tagline {
            display: inline-flex;
            align-items: center;
            gap: 12px;
            background: linear-gradient(90deg, #e11d48, #f43f5e);
            color: #fff;
            font-size: 28px;
            font-weight: 800;
            padding: 10px 28px;
            border-radius: 30px;
            letter-spacing: 2px;
            margin-bottom: 24px;
            box-shadow: 0 8px 25px rgba(225,29,72,0.4);
            border: 3px solid rgba(255,255,255,0.3);
          }
          h1 {
            font-size: 124px;
            line-height: 1.02;
            color: #facc15;
            text-shadow: 0 8px 0 #ca8a04, 0 16px 30px rgba(0,0,0,0.9);
            margin-bottom: 24px;
          }
          h1 .sub {
            color: #38bdf8;
            text-shadow: 0 8px 0 #0284c7, 0 16px 30px rgba(0,0,0,0.9);
          }
          p {
            font-size: 34px;
            color: #cbd5e1;
            font-family: 'Fredoka', sans-serif;
            line-height: 1.4;
            margin-bottom: 40px;
          }
          .badges {
            display: flex;
            gap: 20px;
          }
          .badge {
            background: rgba(255,255,255,0.08);
            backdrop-filter: blur(10px);
            border-radius: 18px;
            padding: 12px 24px;
            font-size: 24px;
            font-weight: 700;
          }
          .content-right {
            z-index: 2;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .duel-circle {
            display: flex;
            align-items: center;
            gap: 30px;
          }
          .fighter-box {
            width: 220px;
            height: 220px;
            border-radius: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 130px;
            box-shadow: 0 16px 40px rgba(0,0,0,0.7);
          }
          .blue-fighter {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            border: 6px solid #60a5fa;
            box-shadow: 0 0 50px rgba(37,99,235,0.6);
          }
          .red-fighter {
            background: linear-gradient(135deg, #dc2626, #b91c1c);
            border: 6px solid #f87171;
            box-shadow: 0 0 50px rgba(220,38,38,0.6);
          }
          .vs-badge {
            font-size: 72px;
            color: #f59e0b;
            font-weight: 900;
            text-shadow: 0 4px 10px rgba(0,0,0,0.8);
          }
          .rating-badge {
            margin-top: 36px;
            background: rgba(0,0,0,0.65);
            padding: 16px 36px;
            border-radius: 28px;
            border: 3px solid #475569;
            color: #e2e8f0;
            font-size: 24px;
            letter-spacing: 1px;
          }
        </style>
      </head>
      <body>
        <div class="skyline"></div>
        <div class="content-left">
          <div class="tagline">🔥 WACKY 2-PLAYER PHYSICS SHOWDOWN</div>
          <h1>ROOFTOP<br><span class="sub">MEME DUEL</span></h1>
          <p>Hilarious ragdoll physics battle! Blast meme opponents off the rooftop with bazookas, lasers & flapping tuna fish!</p>
          <div class="badges">
            <span class="badge" style="border: 2px solid #38bdf8; color: #38bdf8;">👥 1P vs CPU & 2P Local</span>
            <span class="badge" style="border: 2px solid #f43f5e; color: #f43f5e;">🗼 Meme Tower Gauntlet</span>
            <span class="badge" style="border: 2px solid #facc15; color: #facc15;">⚡ Sudden Death Lava</span>
          </div>
        </div>
        <div class="content-right">
          <div class="duel-circle">
            <div class="fighter-box blue-fighter">🥊</div>
            <div class="vs-badge">VS</div>
            <div class="fighter-box red-fighter">🐟</div>
          </div>
          <div class="rating-badge">⭐ Instant Web Play • 60 FPS • Fullscreen</div>
        </div>
      </body>
      </html>
    `, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => document.fonts.ready);
    await new Promise(r => setTimeout(r, 600));

    await page.screenshot({
      path: path.join(storeAssetsDir, 'cover_landscape_1920x1080.png')
    });

    // 2. Generate Portrait Cover: 800 x 1200 (2:3)
    console.log('[Cover] Generating Portrait Cover (800x1200)...');
    await page.setViewport({ width: 800, height: 1200, deviceScaleFactor: 1 });
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700;800&family=Lilita+One&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            width: 800px;
            height: 1200px;
            overflow: hidden;
            background: linear-gradient(180deg, #090d16 0%, #172033 60%, #0a0e1c 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            padding: 80px 50px 70px 50px;
            font-family: 'Lilita One', 'Fredoka', cursive, sans-serif;
            text-align: center;
            position: relative;
          }
          .tagline {
            background: linear-gradient(90deg, #e11d48, #f43f5e);
            color: #fff;
            font-size: 22px;
            font-weight: 800;
            padding: 8px 24px;
            border-radius: 24px;
            letter-spacing: 2px;
            box-shadow: 0 6px 20px rgba(225,29,72,0.4);
            border: 2px solid rgba(255,255,255,0.3);
          }
          h1 {
            font-size: 84px;
            line-height: 1.05;
            color: #facc15;
            text-shadow: 0 6px 0 #ca8a04, 0 12px 24px rgba(0,0,0,0.9);
            margin: 20px 0;
          }
          h1 .sub {
            color: #38bdf8;
            text-shadow: 0 6px 0 #0284c7, 0 12px 24px rgba(0,0,0,0.9);
          }
          .duel-showcase {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 20px;
            margin: 25px 0;
          }
          .fighter-box {
            width: 170px;
            height: 170px;
            border-radius: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 96px;
            box-shadow: 0 12px 30px rgba(0,0,0,0.7);
          }
          .blue-fighter {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            border: 5px solid #60a5fa;
            box-shadow: 0 0 35px rgba(37,99,235,0.6);
          }
          .red-fighter {
            background: linear-gradient(135deg, #dc2626, #b91c1c);
            border: 5px solid #f87171;
            box-shadow: 0 0 35px rgba(220,38,38,0.6);
          }
          .vs-badge {
            font-size: 54px;
            color: #f59e0b;
            font-weight: 900;
          }
          p {
            font-size: 26px;
            color: #cbd5e1;
            font-family: 'Fredoka', sans-serif;
            line-height: 1.35;
            max-width: 650px;
          }
          .footer-badge {
            background: rgba(0,0,0,0.6);
            padding: 14px 30px;
            border-radius: 24px;
            border: 2px solid #38bdf8;
            color: #38bdf8;
            font-size: 22px;
            letter-spacing: 1px;
          }
        </style>
      </head>
      <body>
        <div class="tagline">⚡ WACKY 2-PLAYER DUEL</div>
        <div>
          <h1>ROOFTOP<br><span class="sub">MEME DUEL</span></h1>
          <p>Blast meme rivals off the roof with hilarious weapons & sudden death lava!</p>
        </div>
        <div class="duel-showcase">
          <div class="fighter-box blue-fighter">🥊</div>
          <div class="vs-badge">VS</div>
          <div class="fighter-box red-fighter">🐟</div>
        </div>
        <div class="footer-badge">👥 1P vs CPU & 2P Local • 60 FPS</div>
      </body>
      </html>
    `, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => document.fonts.ready);
    await new Promise(r => setTimeout(r, 600));

    await page.screenshot({
      path: path.join(storeAssetsDir, 'cover_portrait_800x1200.png')
    });

    // 3. Generate Square Cover: 800 x 800 (1:1)
    console.log('[Cover] Generating Square Cover / Icon (800x800)...');
    await page.setViewport({ width: 800, height: 800, deviceScaleFactor: 1 });
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700;800&family=Lilita+One&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            width: 800px;
            height: 800px;
            overflow: hidden;
            background: radial-gradient(circle at 50% 35%, #1e293b 0%, #090d16 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-family: 'Lilita One', 'Fredoka', cursive, sans-serif;
            text-align: center;
            border: 12px solid #facc15;
            box-shadow: inset 0 0 60px rgba(0,0,0,0.8);
          }
          .emoji-box {
            font-size: 190px;
            line-height: 1;
            filter: drop-shadow(0 15px 30px rgba(0,0,0,0.8));
            margin-bottom: 10px;
          }
          h1 {
            font-size: 76px;
            line-height: 1.05;
            color: #facc15;
            text-shadow: 0 6px 0 #ca8a04, 0 12px 24px rgba(0,0,0,0.9);
          }
          h1 .sub {
            color: #38bdf8;
            text-shadow: 0 6px 0 #0284c7, 0 12px 24px rgba(0,0,0,0.9);
          }
          .pill {
            margin-top: 24px;
            background: linear-gradient(90deg, #e11d48, #f59e0b);
            color: #fff;
            font-size: 26px;
            font-weight: 800;
            padding: 10px 32px;
            border-radius: 28px;
            letter-spacing: 2px;
            border: 3px solid #fff;
            box-shadow: 0 8px 24px rgba(0,0,0,0.7);
          }
        </style>
      </head>
      <body>
        <div class="emoji-box">🥊</div>
        <h1>ROOFTOP<br><span class="sub">MEME DUEL</span></h1>
        <div class="pill">2 PLAYER BATTLE</div>
      </body>
      </html>
    `, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => document.fonts.ready);
    await new Promise(r => setTimeout(r, 600));

    await page.screenshot({
      path: path.join(storeAssetsDir, 'cover_square_800x800.png')
    });

    console.log('[Success] All 3 CrazyGames Cover Images generated in store-assets/!');
  } finally {
    await browser.close();
  }
}

generateCovers().catch((err) => {
  console.error('[Error] Cover generation failed:', err);
  process.exit(1);
});
