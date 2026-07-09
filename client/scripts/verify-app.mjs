// Browser end-to-end check for the ERD explorer: drives a real headless
// Chromium against a running dev server and clicks through all sample
// datasets, verifying the detail panel behaves correctly.
//
// Prerequisite: a dev server must already be running (`npm run dev`).
// Usage: node scripts/verify-app.mjs [baseUrl]
//   (defaults to http://localhost:5173/, Vite's default port)
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.join(__dirname, 'screenshots');
fs.mkdirSync(screenshotDir, { recursive: true });

const BASE_URL = process.argv[2] ?? 'http://localhost:5173/';

const results = [];
function record(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} - ${name}${detail ? ' :: ' + detail : ''}`);
}

const DATASETS = [
  { label: 'Sample: customers/orders/products', key: 'sample1' },
  { label: 'Sample: departments/employees/projects', key: 'sample2' },
  { label: 'Sample: e-commerce (users/products/orders/reviews)', key: 'sample3' },
];

const browser = await chromium.launch();
const page = await browser.newPage();
const consoleErrors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});
page.on('pageerror', (err) => consoleErrors.push('pageerror: ' + err.message));

await page.goto(BASE_URL);
await page.waitForSelector('.react-flow__renderer', { timeout: 15000 });
await page.waitForTimeout(500);

const emptyText = await page.locator('.detail-panel__empty').textContent().catch(() => null);
record('Empty state shows placeholder text on load', emptyText === 'Select a table to view its details.', emptyText);

for (const ds of DATASETS) {
  console.log(`\n=== ${ds.label} ===`);
  await page.selectOption('.data-source-controls select', { label: ds.label });
  await page.waitForTimeout(800);

  // Fully expand the graph: click every revealed-but-not-yet-clicked header,
  // repeating until no new node appears. Each node is clicked exactly once -
  // a node click both selects it AND toggles expand/collapse, so re-clicking
  // an already-expanded node would collapse it back down.
  const clickedOrder = [];
  const clickedSet = new Set();
  for (let round = 0; round < 10; round++) {
    const headers = await page.locator('.table-node.revealed .table-header').all();
    let clickedSomething = false;
    for (const h of headers) {
      const id = await h.locator('xpath=ancestor::*[@data-id][1]').getAttribute('data-id').catch(() => null);
      if (!id || clickedSet.has(id)) continue;
      await h.click({ force: true });
      clickedSet.add(id);
      clickedOrder.push(id);
      clickedSomething = true;
      await page.waitForTimeout(350);
    }
    if (!clickedSomething) break;
  }

  // The panel already reflects the last-clicked node - no extra click needed.
  const lastId = clickedOrder[clickedOrder.length - 1];
  const panelTitle = await page.locator('.detail-panel__title span:nth-child(2)').textContent().catch(() => null);
  const colCount = await page.locator('.detail-panel__col-row').count();
  record(`[${ds.key}] Entity click opens panel (${lastId})`, panelTitle === lastId && colCount > 0, `title=${panelTitle}, cols=${colCount}`);

  const panelHTML = await page.locator('.detail-panel').innerHTML();
  const hasRawId = /\w+\.\w+->\w+\.\w+/.test(panelHTML);
  record(`[${ds.key}] No raw FK ids in panel`, !hasRawId);

  const edgeCount = await page.locator('.react-flow__edge').count();
  if (edgeCount > 0) {
    const edge = page.locator('.react-flow__edge').first();
    const edgeId = await edge.getAttribute('data-id').catch(() => null);
    // Click a point sampled from the path's own geometry rather than the
    // group's bounding-box center - self-loop curves bulge out with a hollow
    // center, so a naive center-click can miss the stroked path entirely.
    const pt = await edge.evaluate((g) => {
      const path = g.querySelector('path.react-flow__edge-interaction') ?? g.querySelector('path');
      const len = path.getTotalLength();
      const p = path.getPointAtLength(len * 0.5);
      const ctm = path.getScreenCTM();
      return { x: p.x * ctm.a + p.y * ctm.c + ctm.e, y: p.x * ctm.b + p.y * ctm.d + ctm.f };
    });
    await page.mouse.click(pt.x, pt.y);
    await page.waitForTimeout(300);
    const selectedRelCount = await page.locator('.detail-panel__rel-row--selected').count();
    const panelOpenAfterEdge = await page.locator('.detail-panel__title').count();
    record(`[${ds.key}] Edge click opens panel with relationship highlighted (edge=${edgeId})`, panelOpenAfterEdge > 0 && selectedRelCount > 0, `selectedRelRows=${selectedRelCount}`);

    const relSectionText = await page.locator('.detail-panel__relationships').innerText().catch(() => '');
    record(`[${ds.key}] Relationships section shows related tables/fields`, relSectionText.length > 0);
  } else {
    record(`[${ds.key}] Edge click test`, false, 'no edges found in DOM after expansion');
  }

  await page.screenshot({ path: path.join(screenshotDir, `${ds.key}.png`) });
  record(`[${ds.key}] No console/page errors after interaction`, consoleErrors.length === 0, consoleErrors.slice(-3).join(' | '));
}

await browser.close();

console.log('\n=== SUMMARY ===');
const failed = results.filter((r) => !r.pass);
console.log(`${results.length - failed.length}/${results.length} passed`);
if (failed.length) {
  console.log('FAILED:');
  failed.forEach((f) => console.log(`  - ${f.name}: ${f.detail}`));
}
process.exit(failed.length ? 1 : 0);
