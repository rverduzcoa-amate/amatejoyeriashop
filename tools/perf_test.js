const puppeteer = require('puppeteer');

const fs = require('fs');
const path = require('path');
const http = require('http');

function startStaticServer(rootDir, port = 8081) {
  const mime = {
    '.html':'text/html', '.js':'application/javascript', '.css':'text/css', '.json':'application/json',
    '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.png':'image/png', '.webp':'image/webp', '.avif':'image/avif', '.svg':'image/svg+xml'
  };
  const server = http.createServer((req, res) => {
    try {
      let urlPath = decodeURIComponent(req.url.split('?')[0]);
      if (urlPath === '/') urlPath = '/index.html';
      // strip leading slash
      const filePath = path.join(rootDir, urlPath.replace(/^\//,'') );
      if (!filePath.startsWith(rootDir)) { res.statusCode = 403; return res.end('Forbidden'); }
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        res.setHeader('Content-Type', mime[ext] || 'application/octet-stream');
        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
      } else {
        res.statusCode = 404; res.end('Not found');
      }
    } catch (e) { res.statusCode = 500; res.end('Server error'); }
  });
  return new Promise((resolve) => server.listen(port, () => resolve(server)));
}

async function runTest() {
  const serverPort = 8081;
  const serverRoot = path.resolve(__dirname, '..');
  const httpServer = await startStaticServer(serverRoot, serverPort);
  const server = `http://localhost:${serverPort}`;
  const tests = [
    { name: 'Home', url: `${server}/` },
    { name: 'Aretes', url: `${server}/#?categoria=aretes` },
    { name: 'Anillos', url: `${server}/#?categoria=anillos` }
  ];

  const results = [];

  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
  try {
    for (const mode of [ 'desktop', 'mobile' ]) {
      const page = await browser.newPage();
      if (mode === 'mobile') {
        const iPhone = puppeteer.devices['iPhone X'];
        await page.emulate(iPhone);
      } else {
        await page.setViewport({ width: 1280, height: 800 });
      }

      for (const t of tests) {
        const imgStats = { totalImages: 0, totalBytes: 0, optimizedImages: 0, optimizedBytes: 0, originalImages: 0, originalBytes: 0 };
        let firstImageTime = null;

        page.on('response', async (res) => {
          try {
            const req = res.request();
            if (req.resourceType() !== 'image') return;
            const url = res.url();
            const buf = await res.buffer();
            const bytes = buf ? buf.length : 0;
            imgStats.totalImages += 1;
            imgStats.totalBytes += bytes;
            if (/\/media\/optimized\//.test(url)) { imgStats.optimizedImages += 1; imgStats.optimizedBytes += bytes; }
            else if (/\/media\/img\//.test(url) || /\.jpg$|\.png$/.test(url)) { imgStats.originalImages += 1; imgStats.originalBytes += bytes; }
            if (!firstImageTime) firstImageTime = Date.now();
          } catch (e) {}
        });

        const start = Date.now();
        const resp = await page.goto(t.url, { waitUntil: 'load', timeout: 60000 });
        const loadTime = Date.now() - start;

        // Try to extract performance timing
        const perf = await page.evaluate(() => {
          try {
            const p = performance.timing;
            return { navigationStart: p.navigationStart, domContentLoaded: p.domContentLoadedEventEnd, loadEventEnd: p.loadEventEnd };
          } catch (e) { return null; }
        });

        results.push({
          mode,
          page: t.name,
          url: t.url,
          status: resp ? resp.status() : null,
          loadTimeMs: loadTime,
          perfTiming: perf,
          firstImageTimeMs: firstImageTime,
          images: imgStats
        });

        // small pause between tests
        await new Promise(r => setTimeout(r, 250));
        await page.close();
      }
    }
  } finally {
    await browser.close();
    httpServer.close();
  }

  console.log(JSON.stringify(results, null, 2));
}

runTest().catch(err => { console.error(err); process.exit(1); });
