const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');

// Allow overriding URL and output file via CLI: node run-lighthouse.js <url> <output.json>
const url = process.argv[2] || 'http://localhost:3000';
const outFile = process.argv[3] || 'lighthouse-report.json';

let chrome = null;

async function shutdown() {
  if (chrome) {
    try {
      await chrome.kill();
    } catch (e) {
      console.error('Failed to kill Chrome:', e);
    }
    chrome = null;
  }
}

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down...');
  shutdown().then(() => process.exit());
});
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down...');
  shutdown().then(() => process.exit());
});

async function run() {
  try {
    let chromePath;
    try {
      const puppeteer = require('puppeteer');
      chromePath = puppeteer.executablePath();
    } catch (e) {
      // puppeteer may not be installed; fall back to letting chrome-launcher find Chrome
      chromePath = undefined;
    }

    chrome = await chromeLauncher.launch({
      chromePath,
      chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu']
    });

    const options = { port: chrome.port, output: 'json', logLevel: 'info' };
    const runnerResult = await lighthouse(url, options);

    const reportJson = runnerResult.report;
    fs.writeFileSync(outFile, reportJson, 'utf8');

    console.log(`Lighthouse report saved to ${outFile}`);
  } catch (err) {
    console.error('Lighthouse run failed:', err);
    process.exitCode = 1;
  } finally {
    await shutdown();
  }
}

run();
