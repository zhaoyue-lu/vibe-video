import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 30;
const SECONDS = 5;
const TOTAL = FPS * SECONDS;

// override on CI: CHROME_PATH=$(which google-chrome)
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const FRAMES_DIR = path.join(__dirname, 'frames');
const OUT = path.join(__dirname, '..', 'render', 'demo-a.mp4');

fs.rmSync(FRAMES_DIR, { recursive: true, force: true });
fs.mkdirSync(FRAMES_DIR, { recursive: true });
fs.mkdirSync(path.dirname(OUT), { recursive: true });

const t0 = Date.now();
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-gpu',
    '--hide-scrollbars',
    '--font-render-hinting=none',
  ],
});

const page = await browser.newPage();
await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(path.join(__dirname, 'index.html')).href);
await page.waitForFunction('window.__ready === true');

for (let f = 0; f < TOTAL; f++) {
  await page.evaluate((n) => window.renderFrame(n), f);
  const file = path.join(FRAMES_DIR, `f${String(f).padStart(4, '0')}.png`);
  await page.screenshot({ path: file, type: 'png', captureBeyondViewport: false });
  if (f % 30 === 0) process.stdout.write(`  frame ${f}/${TOTAL}\n`);
}

await browser.close();
const captureMs = Date.now() - t0;
console.log(`captured ${TOTAL} frames in ${(captureMs / 1000).toFixed(1)}s`);

const ff = spawn(ffmpegPath, [
  '-y',
  '-framerate', String(FPS),
  '-i', path.join(FRAMES_DIR, 'f%04d.png'),
  '-c:v', 'libx264',
  '-preset', 'slow',
  '-crf', '18',
  '-pix_fmt', 'yuv420p',
  '-movflags', '+faststart',
  OUT,
], { stdio: ['ignore', 'inherit', 'inherit'] });

await new Promise((res, rej) => {
  ff.on('close', (code) => (code === 0 ? res() : rej(new Error('ffmpeg exited ' + code))));
});

const totalMs = Date.now() - t0;
console.log(`\nOK -> ${OUT}`);
console.log(`total ${(totalMs / 1000).toFixed(1)}s, capture ${(captureMs / 1000).toFixed(1)}s`);
