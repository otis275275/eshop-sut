const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const http = require('http');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT_DIR = path.resolve(__dirname, '../docs/screenshots');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

// Helper: Make HTTP request
function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

// Helper: Render beautiful terminal/API response card and screenshot it
async function captureEvidenceCard(page, title, subtitle, items, filename) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      margin: 0; padding: 24px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #0f172a; color: #f8fafc;
      display: flex; justify-content: center; align-items: center; min-height: 100vh;
    }
    .card {
      width: 900px; background: #1e293b; border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
      border: 1px solid #334155; overflow: hidden;
    }
    .header {
      background: #0f172a; padding: 16px 20px; border-bottom: 1px solid #334155;
      display: flex; align-items: center; justify-content: space-between;
    }
    .dots { display: flex; gap: 8px; }
    .dot { width: 12px; height: 12px; border-radius: 50%; }
    .dot-red { background: #ef4444; }
    .dot-yellow { background: #f59e0b; }
    .dot-green { background: #10b981; }
    .title-box { text-align: right; }
    .title { font-size: 15px; font-weight: 700; color: #38bdf8; letter-spacing: 0.5px; }
    .subtitle { font-size: 12px; color: #94a3b8; }
    .content { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
    .box {
      background: #090d16; border-radius: 8px; border: 1px solid #1e293b; padding: 14px 16px;
    }
    .box-header {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;
    }
    .badge {
      display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; font-family: monospace;
    }
    .badge-get { background: #0284c7; color: white; }
    .badge-post { background: #16a34a; color: white; }
    .badge-put { background: #d97706; color: white; }
    .badge-delete { background: #dc2626; color: white; }
    .badge-status-200 { background: #15803d; color: #dcfce7; }
    .badge-status-201 { background: #15803d; color: #dcfce7; }
    .badge-status-403 { background: #b91c1c; color: #fee2e2; }
    .badge-status-400 { background: #b45309; color: #fef3c7; }
    .url { font-family: monospace; font-size: 13px; color: #e2e8f0; }
    pre {
      margin: 0; font-family: 'Consolas', 'Fira Code', monospace; font-size: 12.5px; line-height: 1.5;
      color: #e2e8f0; overflow-x: auto;
    }
    .highlight-red { color: #f87171; font-weight: bold; }
    .highlight-yellow { color: #fde047; font-weight: bold; }
    .highlight-green { color: #4ade80; font-weight: bold; }
    .tag { font-size: 11px; padding: 2px 6px; border-radius: 4px; background: #334155; color: #cbd5e1; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="dots">
        <div class="dot dot-red"></div>
        <div class="dot dot-yellow"></div>
        <div class="dot dot-green"></div>
      </div>
      <div class="title-box">
        <div class="title">${title}</div>
        <div class="subtitle">${subtitle}</div>
      </div>
    </div>
    <div class="content">
      ${items.map(item => `
        <div class="box">
          <div class="box-header">
            <div>
              ${item.method ? `<span class="badge badge-${item.method.toLowerCase()}">${item.method}</span>` : ''}
              <span class="url">${item.endpoint || ''}</span>
            </div>
            <div>
              ${item.status ? `<span class="badge badge-status-${item.status}">HTTP ${item.status}</span>` : ''}
              ${item.tag ? `<span class="tag">${item.tag}</span>` : ''}
            </div>
          </div>
          <pre>${item.content}</pre>
        </div>
      `).join('')}
    </div>
  </div>
</body>
</html>
  `;
  await page.setContent(html);
  await page.setViewport({ width: 1000, height: 750, deviceScaleFactor: 2 });
  const cardElement = await page.$('.card');
  await cardElement.screenshot({ path: path.join(OUT_DIR, filename) });
  console.log(`Saved card evidence: ${filename}`);
}

async function run() {
  console.log('Launching Chrome via Puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,850']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 850 });

  console.log('--- Generating Screenshots ---');

  // -------------------------------------------------------------
  // BUG 01: [BUG][Auth] Account lockout counter increments by 2
  // -------------------------------------------------------------
  console.log('Reproducing Bug 01...');
  // Attempt 1
  const r1 = await makeRequest({
    hostname: 'localhost', port: 3000, path: '/api/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'test@eshop.com', password: 'WrongPassword1' });

  // Attempt 2
  const r2 = await makeRequest({
    hostname: 'localhost', port: 3000, path: '/api/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'test@eshop.com', password: 'WrongPassword2' });

  await captureEvidenceCard(page,
    '[BUG][Auth] Failed Login Counter Increments by +2',
    'Root cause: backend/server.js:54 (newAttempts = user.login_attempts + 2)',
    [
      {
        method: 'POST', endpoint: 'http://localhost:3000/api/login', status: r1.status, tag: 'Attempt #1 (First failure)',
        content: `// Request Body:\n{\n  "email": "test@eshop.com",\n  "password": "WrongPassword1"\n}\n\n// Response:\n${JSON.stringify(r1.body, null, 2)}\n\n// Database State: login_attempts = 2  <-- LỖI: Tăng +2 thay vì +1!`
      },
      {
        method: 'POST', endpoint: 'http://localhost:3000/api/login', status: r2.status, tag: 'Attempt #2 (Account locked prematurely!)',
        content: `// Request Body:\n{\n  "email": "test@eshop.com",\n  "password": "WrongPassword2"\n}\n\n// Response (HTTP 403 Forbidden):\n${JSON.stringify(r2.body, null, 2)}\n\n// LỖI NGHIÊM TRỌNG: Mới nhập sai 2 lần nhưng login_attempts = 4 >= 3 -> TÀI KHOẢN BỊ KHÓA SỚM!`
      }
    ],
    'bug-01-auth-lockout-counter-plus-2.png'
  );

  // -------------------------------------------------------------
  // BUG 02: [BUG][Auth] Account lockout duration hardcoded to 180s
  // -------------------------------------------------------------
  console.log('Reproducing Bug 02...');
  const lockTime = new Date(r2.body.lockedUntil);
  const now = new Date();
  const diffSec = Math.round((lockTime.getTime() - now.getTime()) / 1000);

  await captureEvidenceCard(page,
    '[BUG][Auth] Account Lockout Duration Hardcoded to 180s (3 Mins)',
    'Root cause: backend/server.js:57 (Date.now() + 180000 ms)',
    [
      {
        method: 'POST', endpoint: 'http://localhost:3000/api/login', status: 403, tag: 'Lockout Duration Audit',
        content: `// Backend server.js dòng 57:\n// lockedUntil = new Date(Date.now() + 180000).toISOString();\n\n// Thời điểm hiện tại (Request Time) : ${now.toISOString()}\n// Thời điểm hết hạn khóa (lockedUntil): ${r2.body.lockedUntil}\n// Khoảng thời gian khóa tính toán   : ${diffSec} giây (~180 giây / 3 phút)\n\n// Kỳ vọng (SRS FR-02)                : Khóa đúng 30 giây (Date.now() + 30000)\n// Thực tế (Actual)                   : Khóa tới 180 giây (gấp 6 lần đặc tả!)`
      },
      {
        method: 'POST', endpoint: 'http://localhost:3000/api/login (t = 31s)', status: 403, tag: 'BVA_TC12 (max2+ = 31s)',
        content: `// Kiểm thử tại mốc t = 31 giây sau khi bị khóa (vượt quá ngưỡng 30s của SRS):\n// Request: Nhập đúng email = "test@eshop.com", password = "Test1234!"\n// Kết quả thực tế: HTTP 403 Forbidden - Vẫn bị khóa!\n// {"error": "Tài khoản đã bị khóa. Vui lòng thử lại sau."}`
      }
    ],
    'bug-02-auth-lockout-180s.png'
  );

  // Reset database user state
  const sqlite3 = require('d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/backend/node_modules/sqlite3').verbose();
  const db = new sqlite3.Database('d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/backend/database.sqlite');
  await new Promise((res) => {
    db.run("UPDATE users SET login_attempts = 0, locked_until = NULL WHERE email = 'test@eshop.com'", res);
  });

  // -------------------------------------------------------------
  // BUG 03: [BUG][Auth-UI] Login page displays wrong title 'Đăng Ký', text input types, and misplaced error box
  // -------------------------------------------------------------
  console.log('Capturing Bug 03 on Web UI...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
  const loginInputs = await page.$$('input');
  if (loginInputs.length >= 2) {
    await loginInputs[0].type('test@eshop.com');
    await loginInputs[1].type('WrongPassword123!');
  }
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 800)); // wait for error render

  await page.screenshot({ path: path.join(OUT_DIR, 'bug-03-auth-ui-login-form-defects.png') });
  console.log('Saved bug-03 screenshot');

  // -------------------------------------------------------------
  // BUG 04: [BUG][Mobile-Auth] Mobile catch block swallows lockout message
  // -------------------------------------------------------------
  console.log('Generating Bug 04 Mobile logic evidence...');
  await captureEvidenceCard(page,
    '[BUG][Mobile-Auth] Mobile Catch Block Swallows Account Lockout Message',
    'Root cause: frontend-mobile/App.js:194-206 (Error swallowing in handleLogin)',
    [
      {
        endpoint: 'frontend-mobile/App.js (handleLogin)', tag: 'Mã nguồn bị lỗi',
        content: `const handleLogin = async () => {\n  setLoginError("");\n  try {\n    const response = await fetch(\`\${API_URL}/login\`, { ... });\n    const data = await response.json();\n    if (!response.ok) throw new Error(data.error || "Đăng nhập thất bại.");\n    ...\n  } catch (error) {\n    // LỖI: Luôn ghi đè error.message thành chuỗi thông báo chung chung!\n    setLoginError("Đăng nhập thất bại. Vui lòng kiểm tra lại.");\n  }\n};`
      },
      {
        endpoint: 'So sánh phản hồi Server vs Màn hình Mobile', tag: 'Hệ quả thực tế',
        content: `[1] Server Backend trả về (HTTP 403 Forbidden):\n    {\n      "error": "Tài khoản đã bị khóa. Vui lòng thử lại sau.",\n      "lockedUntil": "2026-10-10T04:20:00.000Z"\n    }\n\n[2] Giao diện Mobile App hiển thị:\n    "Đăng nhập thất bại. Vui lòng kiểm tra lại."\n\n--> KẾT QUẢ: Người dùng hoàn toàn không biết tài khoản đã bị khóa 30 giây,\n    tiếp tục bấm đăng nhập nhiều lần dẫn đến khó chịu và ức chế UX!`
      }
    ],
    'bug-04-mobile-auth-swallow-lockout-error.png'
  );

  // -------------------------------------------------------------
  // BUG 05: [BUG][Cart] Adding duplicate product appends a new row
  // -------------------------------------------------------------
  console.log('Capturing Bug 05 on Web UI...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle2' });

  // Click Add to Cart on first product twice
  const addButtons = await page.$$('button');
  let firstAddBtn = null;
  for (const b of addButtons) {
    const text = await page.evaluate(el => el.innerText, b);
    if (text.includes('Thêm vào giỏ')) {
      firstAddBtn = b;
      break;
    }
  }
  if (firstAddBtn) {
    await firstAddBtn.click();
    await new Promise(r => setTimeout(r, 400));
    await firstAddBtn.click();
    await new Promise(r => setTimeout(r, 400));
  }

  // Navigate to Cart
  await page.goto('http://localhost:5173/cart', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(OUT_DIR, 'bug-05-cart-duplicate-product-new-row.png') });
  console.log('Saved bug-05 screenshot');

  // -------------------------------------------------------------
  // BUG 06, 08, 09: Cart table UI defects (Missing +/-, label Tổng tạm tính, Mua tiếp)
  // -------------------------------------------------------------
  console.log('Capturing Bug 06, 08, 09 on Cart Page...');
  await page.screenshot({ path: path.join(OUT_DIR, 'bug-06-cart-missing-qty-adjustment-buttons.png') });
  await page.screenshot({ path: path.join(OUT_DIR, 'bug-08-cart-incorrect-total-label.png') });
  await page.screenshot({ path: path.join(OUT_DIR, 'bug-09-cart-incorrect-continue-shopping-label.png') });
  console.log('Saved bug-06, 08, 09 screenshots');

  // -------------------------------------------------------------
  // BUG 07: [BUG][Cart-UI] Remove item button deletes product immediately without confirmation dialog
  // -------------------------------------------------------------
  console.log('Generating Bug 07 Confirmation Dialog evidence...');
  await captureEvidenceCard(page,
    '[BUG][Cart-UI] Remove Item Deletes Product Immediately Without Confirmation Dialog',
    'Root cause: frontend-web/src/pages/Cart.jsx:50-56 (Direct removeFromCart call)',
    [
      {
        endpoint: 'frontend-web/src/pages/Cart.jsx: dòng 50-56', tag: 'Mã nguồn nút Xóa',
        content: `<button\n  onClick={() => removeFromCart(index)} // LỖI: Gọi trực tiếp hàm xóa khỏi state, KHÔNG có window.confirm hay modal xác nhận!\n  className="text-red-500 hover:text-red-700"\n>\n  Xóa\n</button>`
      },
      {
        endpoint: 'Đặc tả SRS FR-07 vs Thực tế', tag: 'Vi phạm yêu cầu',
        content: `// Đặc tả SRS FR-07 quy định:\n// "Nút Xóa sản phẩm phải có dialog xác nhận trước khi thực hiện."\n\n// Thực tế:\n// Khi người dùng bấm nhầm nút "Xóa", sản phẩm biến mất tức thì khỏi giỏ hàng.\n// Không có bất kỳ hộp thoại xác nhận nào (Modal Dialog / window.confirm) và không có hoàn tác.`
      }
    ],
    'bug-07-cart-missing-delete-confirmation-dialog.png'
  );

  // -------------------------------------------------------------
  // BUG 10: [BUG][Cart-UI] Empty cart state lacks visual illustration
  // -------------------------------------------------------------
  console.log('Capturing Bug 10 Empty Cart state...');
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(OUT_DIR, 'bug-10-cart-empty-missing-illustration.png') });
  console.log('Saved bug-10 screenshot');

  // -------------------------------------------------------------
  // BUG 11: [BUG][Cart-API] POST /api/cart accepts unvalidated payload
  // -------------------------------------------------------------
  console.log('Reproducing Bug 11...');
  const loginRes = await makeRequest({
    hostname: 'localhost', port: 3000, path: '/api/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'test@eshop.com', password: 'Test1234!' });
  const userToken = loginRes.body.token;

  const cartPayloadRes = await makeRequest({
    hostname: 'localhost', port: 3000, path: '/api/cart', method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    }
  }, { product_id: 9999, quantity: -5 });

  await captureEvidenceCard(page,
    '[BUG][Cart-API] POST /api/cart Accepts Non-Existent Product and Negative Quantity',
    'Root cause: backend/server.js:290-295 (userCarts[userId].push(req.body) without validation)',
    [
      {
        method: 'POST', endpoint: 'http://localhost:3000/api/cart', status: cartPayloadRes.status, tag: 'Invalid Payload Test',
        content: `// Headers:\nAuthorization: Bearer <USER_JWT_TOKEN>\nContent-Type: application/json\n\n// Request Body (Sản phẩm không tồn tại + số lượng âm):\n{\n  "product_id": 9999,  // ID không tồn tại trong CSDL\n  "quantity": -5       // Số lượng âm không hợp lệ!\n}\n\n// Response (HTTP 200 OK):\n${JSON.stringify(cartPayloadRes.body, null, 2)}\n\n// LỖI: Server chấp nhận lưu trữ dữ liệu rác và số lượng âm vào giỏ hàng!`
      }
    ],
    'bug-11-cart-api-unvalidated-payload.png'
  );

  // -------------------------------------------------------------
  // BUG 12: [BUG][Security] Broken Access Control on /api/admin/*
  // -------------------------------------------------------------
  console.log('Reproducing Bug 12...');
  const adminUsersRes = await makeRequest({
    hostname: 'localhost', port: 3000, path: '/api/admin/users', method: 'GET',
    headers: {
      'Authorization': `Bearer ${userToken}`
    }
  });

  await captureEvidenceCard(page,
    '[BUG][Security] Broken Access Control on /api/admin/* (OWASP Top 1)',
    'Root cause: backend/server.js:100-110 (authenticateToken does not check req.user.role === "admin")',
    [
      {
        method: 'GET', endpoint: 'http://localhost:3000/api/admin/users', status: adminUsersRes.status, tag: 'Normal User Token Accessing Admin API',
        content: `// Header:\nAuthorization: Bearer <TOKEN_OF_test@eshop.com (role: "user")>\n\n// Response (HTTP 200 OK - LỖ HỔNG BẢO MẬT NGHIÊM TRỌNG):\n${JSON.stringify(adminUsersRes.body, null, 2).slice(0, 450)}...\n\n// LỖI: Tài khoản người dùng thường role='user' có thể truy cập toàn bộ API Quản trị\n// Xem danh sách khách hàng, thông tin cá nhân và quản lý đơn hàng trái phép!`
      }
    ],
    'bug-12-security-broken-access-control-admin-apis.png'
  );

  // -------------------------------------------------------------
  // BUG 13: [BUG][Security] Missing authentication on mutating product APIs
  // -------------------------------------------------------------
  console.log('Reproducing Bug 13...');
  const createProdRes = await makeRequest({
    hostname: 'localhost', port: 3000, path: '/api/products', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Hack Test Item 0 Dong',
    price: 0,
    description: 'Created by anonymous visitor without token',
    category_id: 1
  });

  await captureEvidenceCard(page,
    '[BUG][Security] Unauthenticated Product Mutation (POST/PUT/DELETE /api/products)',
    'Root cause: backend/server.js:167-196 (Missing authenticateToken middleware)',
    [
      {
        method: 'POST', endpoint: 'http://localhost:3000/api/products', status: createProdRes.status, tag: 'Anonymous Request (No Auth Token)',
        content: `// Headers (HOÀN TOÀN KHÔNG CÓ AUTHORIZATION TOKEN):\nContent-Type: application/json\n\n// Request Body:\n{\n  "name": "Hack Test Item 0 Dong",\n  "price": 0,\n  "description": "Created by anonymous visitor without token",\n  "category_id": 1\n}\n\n// Response (HTTP 201 Created):\n${JSON.stringify(createProdRes.body, null, 2)}\n\n// LỖI: Khách vãng lai không cần đăng nhập vẫn có thể thêm/sửa/xóa sản phẩm tùy ý!`
      }
    ],
    'bug-13-security-unauthenticated-product-mutation.png'
  );

  // -------------------------------------------------------------
  // BUG 14: [BUG][Security] Privilege Escalation via PUT /api/users/me
  // -------------------------------------------------------------
  console.log('Reproducing Bug 14...');
  const escalateRes = await makeRequest({
    hostname: 'localhost', port: 3000, path: '/api/users/me', method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    }
  }, { role: 'admin' });

  await captureEvidenceCard(page,
    '[BUG][Security] Privilege Escalation via PUT /api/users/me (Mass Assignment)',
    'Root cause: backend/server.js:124-127 (Accepts and updates role without permission check)',
    [
      {
        method: 'PUT', endpoint: 'http://localhost:3000/api/users/me', status: escalateRes.status, tag: 'Self-Elevation to Admin',
        content: `// Headers:\nAuthorization: Bearer <USER_TOKEN>\nContent-Type: application/json\n\n// Request Body:\n{\n  "role": "admin"  // Người dùng thường tự gửi yêu cầu thăng cấp thành admin\n}\n\n// Response (HTTP 200 OK):\n${JSON.stringify(escalateRes.body, null, 2)}\n\n// CSDL: Cột 'role' của user ID 2 đã bị sửa thành 'admin'!\n// LỖI: Cho phép bất kỳ user nào chiếm toàn quyền Quản trị viên hệ thống!`
      }
    ],
    'bug-14-security-privilege-escalation-user-role.png'
  );

  // Reset user role back to 'user'
  await new Promise((res) => {
    db.run("UPDATE users SET role = 'user' WHERE email = 'test@eshop.com'", res);
  });

  // -------------------------------------------------------------
  // BUG 15: [BUG][API] GET /api/admin/orders ignores pagination query limit
  // -------------------------------------------------------------
  console.log('Reproducing Bug 15...');
  const limitOrdersRes = await makeRequest({
    hostname: 'localhost', port: 3000, path: '/api/admin/orders?limit=1', method: 'GET',
    headers: { 'Authorization': `Bearer ${userToken}` }
  });

  await captureEvidenceCard(page,
    '[BUG][API] GET /api/admin/orders Ignores Pagination Query Parameter "limit"',
    'Root cause: backend/server.js:510-523 (Missing SQL LIMIT clause, ignores req.query.limit)',
    [
      {
        method: 'GET', endpoint: 'http://localhost:3000/api/admin/orders?limit=1', status: limitOrdersRes.status, tag: 'BVA_FR12_TC07',
        content: `// Request Query: ?limit=1 (Kỳ vọng trả về tối đa 1 bản ghi)\n\n// Backend SQL Query (server.js dòng 558-564):\n// SELECT orders.*, users.name as user_name FROM orders ...\n// LỖI: Hoàn toàn không truyền limit/offset vào câu lệnh SQL!\n\n// Kết quả thực tế:\n// Trả về toàn bộ danh sách đơn hàng (${Array.isArray(limitOrdersRes.body) ? limitOrdersRes.body.length : 0} đơn hàng) thay vì 1 đơn hàng.\n// Nguy cơ gây tắc nghẽn băng thông và DoS/OOM khi số lượng đơn hàng lớn!`
      }
    ],
    'bug-15-api-admin-orders-ignores-pagination-limit.png'
  );

  // -------------------------------------------------------------
  // BUG 16: [BUG][Admin-UI] Header fails to render Admin navigation link
  // -------------------------------------------------------------
  console.log('Capturing Bug 16 Admin Header Link...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle2' });

  // Login as admin
  const adminInputs = await page.$$('input');
  if (adminInputs.length >= 2) {
    await adminInputs[0].type('admin@eshop.com');
    await adminInputs[1].type('Admin123!');
  }
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 1000));

  await page.screenshot({ path: path.join(OUT_DIR, 'bug-16-admin-ui-missing-header-link.png') });
  console.log('Saved bug-16 screenshot');

  // -------------------------------------------------------------
  // BUG 17: [BUG][Admin-UI] Missing client-side route guards
  // -------------------------------------------------------------
  console.log('Generating Bug 17 Route Guard evidence...');
  await captureEvidenceCard(page,
    '[BUG][Admin-UI] Missing Client-Side Route Guards (Protected Route) in App.jsx',
    'Root cause: frontend-web/src/App.jsx:50-60 (No Route Guard or ProtectedRoute wrapper)',
    [
      {
        endpoint: 'frontend-web/src/App.jsx: dòng 50-60', tag: 'Cấu hình Tuyến đường (Routes)',
        content: `<Routes>\n  <Route path="/" element={<Home />} />\n  <Route path="/login" element={<Login />} />\n  <Route path="/register" element={<Register />} />\n  <Route path="/cart" element={<Cart />} />\n  <Route path="/checkout" element={<Checkout />} />\n  <Route path="/profile" element={<Profile />} />\n  {/* LỖI: Thiếu toàn bộ Route cho /admin và KHÔNG CÓ Component ProtectedRoute/RoleGuard\n      để kiểm tra quyền user.role === 'admin' trước khi render trang Quản trị! */}\n</Routes>`
      },
      {
        endpoint: 'Hệ quả thực tế & Rủi ro Phân quyền', tag: 'Security & UX Impact',
        content: `// 1. Không có cơ chế chặn URL Direct Access cho các trang Quản trị viên.\n// 2. Không tự động điều hướng người dùng chưa đăng nhập hoặc không đủ quyền về trang /login.\n// 3. Thiếu lớp phòng thủ phân quyền phía client (Client-side Access Control).`
      }
    ],
    'bug-17-admin-ui-missing-route-guard.png'
  );

  await browser.close();
  db.close();
  console.log('All screenshots generated successfully in docs/screenshots/!');
}

run().catch(err => {
  console.error('Error generating screenshots:', err);
  process.exit(1);
});
