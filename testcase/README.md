# KẾ HOẠCH & DANH MỤC CA KIỂM THỬ ESHOP (TEST SUITE REPOSITORY)

- **Môn học**: Kiểm thử Phần mềm (Software Testing) — FIT, HCMUS
- **Bài tập**: **HW02 — Domain Testing & Boundary Value Analysis on EShop SUT**
- **Thư mục quản lý**: [`testcase/`](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/testcase)
- **Tài liệu nguồn tham chiếu**:
  - [Đặc tả yêu cầu phần mềm EShop (README.md)](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/README.md)
  - [Đặc tả Backend API (api_specification.md)](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/api_specification.md)
  - [Đề bài và Thang điểm (docs/2026.HW02.Domain Testing_En.pdf)](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/docs/2026.HW02.Domain%20Testing_En.pdf)

---

## 1. PHƯƠNG PHÁP LUẬN KIỂM THỬ (TESTING METHODOLOGIES)

Dự án áp dụng 2 kỹ thuật kiểm thử hộp đen chuẩn tắc theo đúng nội dung giảng dạy của Bộ môn Công nghệ Phần mềm:

### 1.1. Domain Testing (Phân hoạch tương đương — Equivalence Partitioning)
- **Quy trình 4 bước chuẩn mực (Slide 16, 17, 18 FIT - HCMUS)**:
  1. **Bước 1**: Rà soát đặc tả, xác định toàn bộ các biến đầu vào ($Inputs$ trực tiếp và trạng thái CSDL) cùng kết quả đầu ra ($Outputs$).
  2. **Bước 2**: Xác định các lớp tương đương hợp lệ (**Valid EC**) và không hợp lệ (**Invalid EC**). **Gán sẵn giá trị đại diện cụ thể ($Val_{rep}$)** cho từng lớp.
  3. **Bước 3 (Bảng sơ bộ toàn diện)**: Duyệt **100% tất cả các lớp tương đương** ($EC_1 \rightarrow EC_n$) theo kiểu brute-force. Mỗi dòng kiểm tra một EC với **dữ liệu cụ thể**, áp dụng nguyên tắc **Cô lập lỗi (Single Fault Assumption)**: tất cả các biến còn lại giữ giá trị danh nghĩa hợp lệ ($Nom$).
  4. **Bước 4 (Bảng rút gọn)**: Gom các ca kiểm thử hợp lệ có cùng input và output thành 1 ca kiểm thử tổng hợp; giữ nguyên các ca kiểm thử không hợp lệ độc lập.
- **Quy ước mã test case**: `DT_<Mã_FR>_TC<Số_thứ_tự>` (Ví dụ: `DT_FR02_TC01`).

### 1.2. Boundary Value Analysis (Phân tích giá trị biên — Mô hình Robustness Testing $6n+1$)
- **Chuẩn hóa duy nhất mô hình Robustness Testing (Slide 23, 26 FIT - HCMUS)**:
  - Chỉ áp dụng cho các biến có miền dữ liệu **có thứ tự** (ordered domains: số, chuỗi theo độ dài, bộ đếm, mốc thời gian, tiền tệ).
  - Với mỗi biến $x_i$, trích xuất đúng **6 điểm biên**:
    1. $min_i^-$ ($LB_i - \epsilon$): Điểm ngoài biên dưới $\rightarrow$ **Invalid**
    2. $min_i$ ($LB_i$): Điểm ngay biên dưới $\rightarrow$ **Valid**
    3. $min_i^+$ ($LB_i + \epsilon$): Điểm trong biên dưới $\rightarrow$ **Valid**
    4. $max_i^-$ ($UB_i - \epsilon$): Điểm trong biên trên $\rightarrow$ **Valid**
    5. $max_i$ ($UB_i$): Điểm ngay biên trên $\rightarrow$ **Valid**
    6. $max_i^+$ ($UB_i + \epsilon$): Điểm ngoài biên trên $\rightarrow$ **Invalid**
  - Công thức số lượng ca kiểm thử với $n$ biến có thứ tự:
    $$\mathbf{f = 6n + 1}$$
    *(gồm $6n$ điểm biên của từng biến được cô lập với các biến khác ở giá trị $Nom$, cộng thêm 1 điểm Baseline khi tất cả biến đều ở $Nom$)*.
  - Bảng kiểm thử liệt kê đầy đủ $6n+1$ dòng với **100% số thực tế**, không dùng placeholder trừu tượng.
- **Quy ước mã test case**: `BVA_<Mã_FR>_TC<Số_thứ_tự>` (Ví dụ: `BVA_FR02_TC01`).

---

## 2. MA TRẬN TIẾN ĐỘ KIỂM THỬ (TESTING ROADMAP)

Theo đề bài HW02, sinh viên cần hoàn thành kiểm thử cho **4 chức năng** (mỗi Pool chọn 1 chức năng):

| Pool | Mã FR | Tên Chức năng Lựa chọn | File Báo cáo Test Case | Kỹ thuật Đã Áp Dụng | Số TC Thiết kế | Trạng thái Thực thi | Số Bug Phát Hiện |
| :---: | :---: | :--- | :--- | :---: | :---: | :---: | :---: |
| **Pool A** | **FR-02** | **Đăng nhập & Khóa tài khoản** | [FR-02_login_and_account_lockout.md](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/testcase/FR-02_login_and_account_lockout.md) | Domain + Robustness BVA ($6n+1$) | **21 TCs** (8 DT + 13 BVA) | **Đã thực thi** | **3 Bugs** (2 Backend, 1 UI) |
| **Pool B** | **FR-07** | **Giỏ hàng (Shopping Cart)** | [FR-07_shopping_cart.md](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/testcase/FR-07_shopping_cart.md) | Domain + Robustness BVA | **25 TCs** (15 DT + 10 BVA) | **Đã thực thi** | **7 Bugs** (1 Logic, 5 UI, 1 API) |
| **Pool C** | **FR-12** | **Kiểm soát truy cập (Access Control)** | [FR-12_access_control.md](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/testcase/FR-12_access_control.md) | Domain + Robustness BVA ($6n+1$) | **27 TCs** (14 DT + 13 BVA) | **Đã thực thi** | **6 Bugs** (4 Backend, 2 UI) |
| **Pool D** | **FR-02 (Mobile)** | **Mobile: Đăng nhập & Khóa tài khoản** | [FR-02_mobile_login_and_account_lockout.md](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/testcase/FR-02_mobile_login_and_account_lockout.md) | Domain + Robustness BVA ($6n+1$) | **21 TCs** (8 DT + 13 BVA) | **Đã thực thi** | **3 Bugs** (2 Backend, 1 Mobile Logic) |

---

## 3. TỔNG KẾT KẾT QUẢ CHO TỪNG TÍNH NĂNG ĐÃ HOÀN THÀNH

### 3.1. Chức năng FR-02: Đăng nhập & Khóa tài khoản (Pool A)
- **File chi tiết**: [FR-02_login_and_account_lockout.md](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/testcase/FR-02_login_and_account_lockout.md)
- **Domain Testing**:
  - Số lớp tương đương xác định: 15 ECs (7 Valid, 8 Invalid).
  - Bảng sơ bộ duyệt 100% ECs: 15 dòng có dữ liệu cụ thể.
  - Bảng rút gọn: **8 Test Cases** (`DT_TC01` $\rightarrow$ `DT_TC08`).
- **Robustness BVA ($6n+1$)**:
  - Số biến có thứ tự ($n=2$): `failed_attempts` ($[0..3]$) và `lockout_time_elapsed` ($[0..30]$s).
  - Số ca kiểm thử: $6 \times 2 + 1 =$ **13 Test Cases** (`BVA_TC01` $\rightarrow$ `BVA_TC13`).
- **Các Bug phát hiện được**:
  1. **Bug Backend 1**: Bộ đếm đăng nhập sai tăng `+ 2` thay vì `+ 1` ([backend/server.js: dòng 54](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/backend/server.js#L54)), khiến tài khoản bị khóa sớm ngay lần nhập sai thứ 2.
  2. **Bug Backend 2**: Thời gian khóa tài khoản bị hardcode là `180,000` ms (3 phút) thay vì `30 giây` ([backend/server.js: dòng 57](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/backend/server.js#L57)).
  3. **Bug Frontend UI**: Giao diện đăng nhập ([frontend-web/src/pages/Login.jsx](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/frontend-web/src/pages/Login.jsx)) dùng sai tiêu đề "Đăng Ký", dùng `<input type="text">` thay vì `type="email"` và `type="password"`, nút bấm tiếng Anh "Sign In", và hộp thông báo lỗi nằm sai vị trí (dưới nút bấm).

---

### 3.2. Chức năng FR-07: Giỏ hàng — Shopping Cart (Pool B)
- **File chi tiết**: [FR-07_shopping_cart.md](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/testcase/FR-07_shopping_cart.md)
- **Phạm vi kiểm thử**: Đa tầng toàn diện (**Frontend UI / State + Backend API / Payload Integrity**).
- **Domain Testing**:
  - Số lớp tương đương xác định: **25 ECs** (17 Lớp Đầu vào + 8 Lớp Đầu ra).
  - Bảng sơ bộ duyệt 100% ECs: 25 dòng với dữ liệu sản phẩm, số lượng, API payload cụ thể.
  - Bảng rút gọn: **15 Test Cases** (`DT_FR07_TC01` $\rightarrow$ `DT_FR07_TC15`).
- **Boundary Value Analysis (BVA)**:
  - Số biến có thứ tự ($n=2$): `item_quantity` ($[1 \dots 99]$ — 6 điểm biên) và `cart_distinct_items_count` ($[1 \dots +\infty)$ — 3 điểm biên dưới).
  - Số ca kiểm thử: $6 + 3 + 1 =$ **10 Test Cases** (`BVA_FR07_TC01` $\rightarrow$ `BVA_FR07_TC10`).
- **Tổng số test cases**: **25 Test Cases** (15 DT + 10 BVA).
- **Các Bug phát hiện được**:
  1. **Bug FE State/Logic**: Thêm cùng một sản phẩm vào giỏ không tăng số lượng mà tạo thêm dòng mới ([frontend-web/src/context/CartContext.jsx: dòng 8-10](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/frontend-web/src/context/CartContext.jsx#L8-L10)).
  2. **Bug FE UI 1**: Bảng giỏ hàng hiển thị số lượng dạng text tĩnh, thiếu nút `+` và `-` để điều chỉnh số lượng ([frontend-web/src/pages/Cart.jsx: dòng 47](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/frontend-web/src/pages/Cart.jsx#L47)).
  3. **Bug FE UI 2**: Nút Xóa sản phẩm thực hiện xóa ngay lập tức mà không có hộp thoại Dialog xác nhận ([frontend-web/src/pages/Cart.jsx: dòng 50-56](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/frontend-web/src/pages/Cart.jsx#L50-L56)).
  4. **Bug FE UI 3**: Nhãn tổng tiền hiển thị sai thành "Tổng tạm tính:" thay vì "Tổng cộng:" ([frontend-web/src/pages/Cart.jsx: dòng 63](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/frontend-web/src/pages/Cart.jsx#L63)).
  5. **Bug FE UI 4**: Nút quay về hiển thị nhãn "← Mua tiếp" thay vì "Tiếp tục mua sắm" ([frontend-web/src/pages/Cart.jsx: dòng 67](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/frontend-web/src/pages/Cart.jsx#L67)).
  6. **Bug FE UI 5**: Trạng thái giỏ hàng trống không có hình minh họa minh bạch ([frontend-web/src/pages/Cart.jsx: dòng 22-25](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/frontend-web/src/pages/Cart.jsx#L22-L25)).
  7. **Bug BE API**: API `POST /api/cart` push thẳng payload vào bộ nhớ mà không validate `product_id` tồn tại trong DB và không chặn `quantity <= 0` hoặc số âm ([backend/server.js: dòng 290-295](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/backend/server.js#L290-L295)).

---

### 3.3. Chức năng FR-12: Kiểm soát truy cập Web Admin (Pool C)
- **File chi tiết**: [FR-12_access_control.md](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/testcase/FR-12_access_control.md)
- **Phạm vi kiểm thử**: Đa tầng toàn diện (**Frontend Route Guarding / Header UI + Backend API Authorization / Security**).
- **Domain Testing**:
  - Số lớp tương đương xác định: **26 ECs** (19 Lớp Đầu vào & Trạng thái + 7 Lớp Đầu ra).
  - Bảng sơ bộ duyệt 100% ECs: 26 dòng với Token, Chữ ký, Hạn dùng, Roles, Claims, và Endpoint cụ thể.
  - Bảng rút gọn: **14 Test Cases** (`DT_FR12_TC01` $\rightarrow$ `DT_FR12_TC14`).
- **Robustness BVA ($6n+1$)**:
  - *Lưu ý học thuật & Cơ sở trích xuất biến*: Do đặc tả nghiệp vụ của FR-12 là kiểm soát phân quyền logic (chỉ bao gồm các biến rời rạc/danh nghĩa như Role, Token validity, Endpoint), theo lý thuyết môn học (Slide 22, 23 FIT - HCMUS), BVA chỉ áp dụng trên các biến có miền dữ liệu **có thứ tự (Ordered Domains)**. Tester đã trích xuất 2 biến tham số kỹ thuật có thứ tự xoay quanh cơ chế xác thực và bảo mật:
    1. `jwt_token_length` ($[100 \dots 500]$ ký tự): Dựa trên Chuẩn kỹ thuật RFC 7519 (JSON Web Token Standard) và Security Testing (chống lỗi cắt cụt token và Buffer Overflow).
    2. `admin_query_limit` ($[1 \dots 100]$ bản ghi): Dựa trên Best Practice thiết kế API Quản trị phân trang (tránh lỗi DoS khi tải danh sách lớn).
  - Số ca kiểm thử: $6 \times 2 + 1 =$ **13 Test Cases** (`BVA_FR12_TC01` $\rightarrow$ `BVA_FR12_TC13`).
- **Tổng số test cases**: **27 Test Cases** (14 DT + 13 BVA).
- **Các Bug phát hiện được**:
  1. **Bug Backend 1 (Critical Broken Access Control)**: Middleware xác thực token không hề kiểm tra `req.user.role === 'admin'`, dẫn đến người dùng thông thường (`role = 'user'`) có thể truy cập toàn bộ API Quản trị (`GET /api/admin/users`, `DELETE /api/admin/users/:id`, `GET /api/admin/orders`, `POST /api/admin/coupons`, v.v.) ([backend/server.js: dòng 100-110, 494-525](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/backend/server.js#L100-L110)).
  2. **Bug Backend 2 (Critical Missing Auth on Mutating APIs)**: Các API thay đổi sản phẩm (`POST/PUT/DELETE /api/products`) hoàn toàn không có middleware xác thực `authenticateToken`, cho phép khách vãng lai (Anonymous) thêm/sửa/xóa sản phẩm trái phép ([backend/server.js: dòng 167-196](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/backend/server.js#L167-L196)).
  3. **Bug Backend 3 (Privilege Escalation)**: API cập nhật hồ sơ `PUT /api/users/me` chấp nhận tham số `role` trực tiếp từ client và ghi đè vào CSDL mà không kiểm tra quyền, cho phép tài khoản thường tự thăng cấp thành `admin` ([backend/server.js: dòng 124-127](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/backend/server.js#L124-L127)).
  4. **Bug Backend 4 (Missing Pagination / API DoS Risk)**: API Quản trị đơn hàng `GET /api/admin/orders` bỏ qua hoàn toàn tham số phân trang `limit`, luôn query và trả về toàn bộ danh sách đơn hàng ([backend/server.js: dòng 510-523](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/backend/server.js#L510-L523)).
  5. **Bug Frontend 1 (Missing Admin Navigation)**: Header không render liên kết/menu truy cập trang Quản trị khi đăng nhập bằng tài khoản Quản trị `admin@eshop.com` ([frontend-web/src/App.jsx: dòng 24-36](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/frontend-web/src/App.jsx#L24-L36)).
  6. **Bug Frontend 2 (Missing Route Guard)**: Frontend thiếu hoàn toàn cơ chế Route Guard (Protected Route) để bảo vệ các tuyến đường Admin `/admin` khỏi việc truy cập trực tiếp từ người dùng không đủ quyền ([frontend-web/src/App.jsx: dòng 50-60](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/frontend-web/src/App.jsx#L50-L60)).

---

### 3.4. Chức năng FR-02: Đăng nhập & Khóa tài khoản trên Mobile App (Pool D)
- **File chi tiết**: [FR-02_mobile_login_and_account_lockout.md](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/testcase/FR-02_mobile_login_and_account_lockout.md)
- **Phạm vi kiểm thử**: Đa tầng toàn diện (**Frontend Mobile React Native UI/State + Backend API / Account Lockout Logic**).
- **Domain Testing**:
  - Số lớp tương đương xác định: **15 ECs** (7 Lớp Hợp lệ + 8 Lớp Không hợp lệ).
  - Bảng sơ bộ duyệt 100% ECs: 15 dòng với dữ liệu cụ thể và nguyên tắc cô lập lỗi Single Fault Assumption.
  - Bảng rút gọn: **8 Test Cases** (`DT_MOB_TC01` $\rightarrow$ `DT_MOB_TC08`).
- **Robustness BVA ($6n+1$)**:
  - Số biến có thứ tự ($n=2$): `consecutive_failed_attempts` ($[0 \dots 3]$) và `lockout_time_elapsed` ($[0 \dots 30]$s).
  - Số ca kiểm thử: $6 \times 2 + 1 =$ **13 Test Cases** (`BVA_MOB_TC01` $\rightarrow$ `BVA_MOB_TC13`).
- **Tổng số test cases**: **21 Test Cases** (8 DT + 13 BVA).
- **Các Bug phát hiện được**:
  1. **Bug Backend 1 (Tăng bộ đếm sai)**: Bộ đếm đăng nhập sai tăng `+ 2` thay vì `+ 1` ([backend/server.js: dòng 54](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/backend/server.js#L54)), khiến tài khoản bị khóa sớm ngay lần nhập sai thứ 2.
  2. **Bug Backend 2 (Thời gian khóa quá dài)**: Thời gian khóa tài khoản bị hardcode là `180,000` ms (3 phút) thay vì `30 giây` ([backend/server.js: dòng 57](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/backend/server.js#L57)).
  3. **Bug Mobile Logic (Nuốt thông báo khóa)**: Khối `catch` trong hàm `handleLogin` ghi đè toàn bộ lỗi trả về từ server thành thông báo tĩnh `"Đăng nhập thất bại. Vui lòng kiểm tra lại."`, khiến thông báo khóa tài khoản `"Tài khoản đã bị khóa. Vui lòng thử lại sau."` (HTTP 403) không bao giờ hiển thị tới người dùng ([frontend-mobile/App.js: dòng 194-206](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/frontend-mobile/App.js#L194-L206)).


