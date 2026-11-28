const fs = require('fs');
const path = require('path');

const reportPath = path.join(__dirname, '..', '..', 'report', 'playwright-report', 'index.html');
const studentId = process.env.STUDENT_ID || '23120228';
const isoTimestamp = new Date().toISOString();
const stampText = `Run by: ${studentId} | ${isoTimestamp}`;

if (fs.existsSync(reportPath)) {
  let html = fs.readFileSync(reportPath, 'utf8');

  // Update <title>
  html = html.replace(
    /<title>(.*?)<\/title>/i,
    `<title>Playwright Test Report — ${stampText}</title>`
  );

  // Inject visible header banner if not already present
  const banner = `<div id="student-run-stamp" style="background:#0f172a;color:#f8fafc;padding:10px 16px;font-family:system-ui,sans-serif;font-size:14px;font-weight:600;border-bottom:2px solid #38bdf8;text-align:center;">${stampText}</div>`;
  if (!html.includes('id="student-run-stamp"')) {
    html = html.replace('<body>', `<body>\n${banner}`);
  }

  fs.writeFileSync(reportPath, html, 'utf8');
  console.log(`[stamp-report] Updated HTML report with: ${stampText}`);
} else {
  console.warn(`[stamp-report] Report not found at ${reportPath}`);
}
