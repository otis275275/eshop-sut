# BÁO CÁO THIẾT KẾ & THỰC THI KIỂM THỬ: FR-12 KIỂM SOÁT TRUY CẬP WEB ADMIN (ACCESS CONTROL)

- **Mã chức năng**: **FR-12** (Thuộc Pool C — Admin and Coupons / Web Admin)
- **Hệ thống kiểm thử (SUT)**: EShop Platform
  - **Tầng Frontend**: React + Vite + React Router (`http://localhost:5173/`)
  - **Tầng Backend**: Node.js + Express + SQLite API (`/api/admin/*`, `POST/PUT/DELETE /api/products`, `POST /api/categories`, `PUT /api/users/me`)
- **Phạm vi kiểm thử Đa tầng (Full-Stack Scope)**:
  - **Kiểm thử Giao diện & Điều hướng Client (FE)**: Render menu/liên kết Admin trên Header khi đăng nhập tài khoản có `role = 'admin'`, cơ chế Route Guard bảo vệ các tuyến đường `/admin/*`, điều hướng người dùng chưa xác thực hoặc không đủ quyền về trang `/login` / hiển thị thông báo lỗi 403 Forbidden.
  - **Kiểm thử API & Phân quyền Server-Side (BE)**: Kiểm tra mã trạng thái HTTP (`200, 201, 401, 403`), xác thực chuỗi JWT Token, kiểm tra quyền hạn `role = 'admin'` trên tất cả các endpoint quản trị (`/api/admin/*`), bảo vệ các API thay đổi dữ liệu (`POST/PUT/DELETE /api/products`, `POST /api/categories`), phòng chống lỗ hổng leo thang đặc quyền (Privilege Escalation via `PUT /api/users/me`).
- **Kỹ thuật áp dụng**:
  1. **Domain Testing (Phân hoạch tương đương — Equivalence Partitioning)** theo chuẩn 4 bước FIT - HCMUS (Slide 16, 17, 18).
  2. **Boundary Value Analysis (Phân tích giá trị biên)** theo mô hình chuẩn hóa duy nhất **Robustness Testing ($f = 6n + 1$)** (Slide 23, 26).
- **Dữ liệu tài khoản kiểm thử định danh**:
  - Tài khoản Admin: `admin@eshop.com` / Mật khẩu: `Admin123!` (Role: `admin`)
  - Tài khoản User: `test@eshop.com` / Mật khẩu: `Test1234!` (Role: `user`)
  - Khách vãng lai (Anonymous Visitor): Không đăng nhập / Không gửi Token

---

## 1. ĐẶC TẢ NGHIỆP VỤ (REQUIREMENT SPECIFICATION)

Căn cứ theo [README.md](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/README.md) (Mục 6 - FR-12) và [api_specification.md](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/api_specification.md) (Mục 6):

1. **Phân quyền truy cập Phân hệ Admin**:
   - Phân hệ Web Admin và tất cả các chức năng quản trị chỉ dành riêng cho tài khoản có `role = 'admin'`.
2. **Yêu cầu bảo vệ API Quản trị (`/api/admin/*`)**:
   - Tất cả các API Admin (`GET /api/admin/users`, `DELETE /api/admin/users/:id`, `GET /api/admin/orders`, `PUT /api/admin/orders/:id/status`, `POST /api/admin/import-products`, `POST /api/admin/coupons`, `DELETE /api/admin/coupons/:id`) bắt buộc phải yêu cầu đồng thời:
     1. **Token JWT hợp lệ** đính kèm trong Header `Authorization: Bearer <token>`. Nếu thiếu Token, trả về **HTTP 401 Unauthorized**. Nếu Token giả mạo/hết hạn/malformed, trả về **HTTP 403 Forbidden**.
     2. Claim **`role = 'admin'`** được giải mã từ Token. Nếu tài khoản có `role = 'user'`, hệ thống bắt buộc phải từ chối truy cập và trả về **HTTP 403 Forbidden**.
3. **Bảo vệ các API Thay đổi Dữ liệu Hệ thống (Mutating Data APIs)**:
   - Các API tạo mới, chỉnh sửa, xóa sản phẩm (`POST /api/products`, `PUT /api/products/:id`, `DELETE /api/products/:id`), danh mục (`POST /api/categories`), mã giảm giá (`POST/DELETE /api/admin/coupons`) bắt buộc phải yêu cầu Token hợp lệ và quyền `admin`.
4. **Phòng chống Leo thang Đặc quyền (Privilege Escalation)**:
   - Người dùng thông thường (`role = 'user'`) tuyệt đối không được phép tự ý thay đổi quyền hạn của mình thành `admin` qua API cập nhật hồ sơ (`PUT /api/users/me`). Server phải bỏ qua trường `role` hoặc từ chối request.
5. **Kiểm soát Giao diện & Route Guard phía Client (Frontend)**:
   - Header chỉ hiển thị menu/nút truy cập "Quản trị" (Admin Panel) khi `user.role === 'admin'`.
   - Các trang quản trị phải được bọc bởi Route Guard. Nếu người dùng chưa đăng nhập hoặc không có quyền Admin mà cố tình gõ trực tiếp URL `/admin`, ứng dụng phải chặn lại và chuyển hướng về `/login` hoặc hiển thị thông báo "403 - Bạn không có quyền truy cập".

---

# PHẦN A: THIẾT KẾ KIỂM THỬ VỚI DOMAIN TESTING (EQUIVALENCE PARTITIONING)

---

### BƯỚC 1: XÁC ĐỊNH ĐẦU VÀO VÀ ĐẦU RA (INPUTS & OUTPUTS)

#### 1.1. Bảng Biến Đầu vào & Trạng thái (Inputs & State Variables)
| Tên Biến / Thuộc tính | Phân loại | Kiểu Dữ liệu | Ràng buộc nghiệp vụ (SRS & Security) | Giá trị Hợp lệ Mặc định ($Nom$) |
| :--- | :--- | :--- | :--- | :--- |
| `auth_header` | Direct Input (Header) | String | Header `Authorization: Bearer <token>` | `"Bearer " + <Token_Admin>` |
| `jwt_token_integrity` | Security Token State | Enum | Chữ ký khớp với `SECRET_KEY` và còn hạn sử dụng | `Valid & Active` (Ký đúng, chưa hết hạn) |
| `jwt_role_claim` | Token Payload Claim | Enum | Claim `role` trong payload: `admin`, `user`, `null` | `'admin'` |
| `target_endpoint` | API Route Target | Enum | Endpoint truy cập: `/api/admin/*`, `POST /api/products` | `GET /api/admin/users` |
| `user_profile_role_input`| Direct Input (Body) | String | Trường `role` gửi lên API `PUT /api/users/me` | `undefined` (Không gửi trường role) |
| `client_auth_state` | Client Session State | Object | Trạng thái đăng nhập trong LocalStorage/Context | `{ token: "<Token_Admin>", user: { role: "admin" } }` |
| `client_route_path` | UI Route State | String | Tuyến đường URL truy cập trên trình duyệt | `"/admin"` |

#### 1.2. Bảng Biến Đầu ra (Outputs)
| Tên Đầu ra | Phân loại | Kết quả & Giao diện mong đợi theo SRS / Security Standard |
| :--- | :---: | :--- |
| `OUT_ALLOW_ADMIN_ACCESS` | API Response | **HTTP 200 OK / 201 Created**: Cho phép thực thi thành công thao tác quản trị, trả về dữ liệu bảo mật |
| `OUT_ERR_UNAUTHORIZED` | API Response | **HTTP 401 Unauthorized**: Thông báo lỗi yêu cầu đăng nhập khi thiếu Token xác thực hoặc Header sai |
| `OUT_ERR_FORBIDDEN_BAD_TOKEN` | API Response | **HTTP 403 Forbidden**: Thông báo "Token không hợp lệ, chữ ký sai hoặc đã hết hạn" |
| `OUT_ERR_FORBIDDEN_ROLE` | API Response | **HTTP 403 Forbidden**: Thông báo "Yêu cầu quyền Admin" khi tài khoản chỉ có `role = 'user'` |
| `OUT_PREVENT_PRIVILEGE_ESCALATION` | Security Response| **CSDL giữ nguyên `role = 'user'`**: Bỏ qua hoặc báo lỗi 403 khi User cố tình sửa `role` |
| `OUT_UI_ROUTE_BLOCKED` | UI Route Guard | Chặn truy cập trang Admin, chuyển hướng trình duyệt về `/login` hoặc hiển thị thông báo "403 Forbidden" |
| `OUT_UI_NAV_RENDER_ADMIN` | UI Navigation | Header hiển thị liên kết/nút "Quản trị" dẫn tới Dashboard cho tài khoản Admin |

---

### BƯỚC 2: XÁC ĐỊNH LỚP TƯƠNG ĐƯƠNG VÀ GIÁ TRỊ ĐẠI DIỆN

> **Quy định**: Khai báo đầy đủ các lớp tương đương Valid và Invalid **bám sát 100% từ tên biến đã định nghĩa ở Bước 1**, gán sẵn **Giá trị đại diện cụ thể ($Val_{rep}$)** cho từng lớp tương đương (theo Slide 16 FIT - HCMUS).

### Bảng Tổng hợp Lớp Tương đương (Equivalence Partitioning Table)
| STT | Biến / Điều kiện liên quan | Mã Lớp (EC ID) | Mô tả Lớp tương đương | Loại | Giá trị Đại diện Cụ thể ($Val_{rep}$) |
| :---: | :--- | :---: | :--- | :---: | :--- |
| **I** | **CÁC LỚP ĐẦU VÀO & TRẠNG THÁI (INPUT & STATE ECs)** | | | | |
| 1 | `auth_header` | **EC01** | Header `Authorization` có tiền tố `"Bearer <token>"` chuẩn | **Valid** | `Authorization: "Bearer " + <Token_Admin>` |
| 2 | (Định dạng Header) | **EC02** | Không gửi Header `Authorization` (Thiếu header / Null) | **Invalid** | Không đính kèm Header `Authorization` |
| 3 | | **EC03** | Header `Authorization` sai format (Thiếu chữ `Bearer `, chỉ có token thô) | **Invalid** | `Authorization: "<Token_Admin_Raw>"` |
| 4 | `jwt_token_integrity` | **EC04** | Token JWT hợp lệ (Chữ ký đúng với `SECRET_KEY` và còn hạn) | **Valid** | Token ký bởi `SECRET_KEY`, còn hạn 24h |
| 5 | (Tính toàn vẹn & Hạn dùng) | **EC05** | Token JWT bị giả mạo chữ ký (Ký bằng secret key khác) | **Invalid** | Token được tạo và ký từ `"wrong_secret_key"` |
| 6 | | **EC06** | Token JWT đã hết hạn sử dụng ($exp < now$) | **Invalid** | Token có claim `exp: 1577836800` (Năm 2020) |
| 7 | | **EC07** | Token JWT sai định dạng cấu trúc (Malformed / chuỗi rác) | **Invalid** | `Authorization: "Bearer invalid.jwt.string"` |
| 8 | `jwt_role_claim` | **EC08** | Token có claim `role = 'admin'` (Quyền Quản trị viên) | **Valid** | Payload: `{"id": 1, "role": "admin"}` |
| 9 | (Claim phân quyền) | **EC09** | Token có claim `role = 'user'` (Quyền Người dùng thông thường) | **Invalid (với Admin)** | Payload: `{"id": 2, "role": "user"}` |
| 10 | | **EC10** | Token không có claim `role` hoặc `role` rỗng/null | **Invalid (với Admin)** | Payload: `{"id": 2, "role": null}` |
| 11 | `target_endpoint` | **EC11** | Endpoint API Quản trị chuyên biệt (`/api/admin/*`) | **Valid** | `GET /api/admin/users`, `GET /api/admin/orders` |
| 12 | (Phân loại Endpoint) | **EC12** | Endpoint API Thay đổi dữ liệu sản phẩm/danh mục | **Valid** | `POST /api/products`, `DELETE /api/products/1` |
| 13 | `user_profile_role_input` | **EC13** | Không gửi trường `role` (hoặc gửi đúng role hiện tại `"user"`) | **Valid** | `PUT /api/users/me` body: `{"name": "Test User"}` |
| 14 | (Chống leo thang quyền) | **EC14** | Cố tình gửi `{"role": "admin"}` để leo thang đặc quyền từ User | **Invalid** | `PUT /api/users/me` body: `{"name": "Test", "role": "admin"}` |
| 15 | `client_auth_state` | **EC15** | Đã đăng nhập tài khoản Admin (`user.role === 'admin'`) | **Valid** | `{ token: "<Token_Admin>", user: { role: "admin" } }` |
| 16 | (Trạng thái Client) | **EC16** | Đã đăng nhập tài khoản User thường (`user.role === 'user'`) | **Invalid (với Admin)** | `{ token: "<Token_User>", user: { role: "user" } }` |
| 17 | | **EC17** | Chưa đăng nhập (Không có token trong LocalStorage / Anonymous) | **Invalid** | `null` (Chưa đăng nhập) |
| 18 | `client_route_path` | **EC18** | Truy cập tuyến đường URL phân hệ Quản trị (`/admin`) | **Valid/Target** | URL `http://localhost:5173/admin` |
| 19 | (Tuyến đường UI) | **EC19** | Truy cập tuyến đường URL công khai (`/`, `/login`, `/cart`) | **Valid** | URL `http://localhost:5173/` |
| **II**| **CÁC LỚP ĐẦU RA MONG ĐỢI (OUTPUT ECs)** | | | | |
| 20 | `OUT_ALLOW_ADMIN_ACCESS` | **EC20** | Cho phép truy cập tài nguyên quản trị, trả về **HTTP 200 OK / 201 Created** | **Valid** | HTTP 200/201: Dữ liệu JSON danh sách users, orders, coupons |
| 21 | `OUT_ERR_UNAUTHORIZED` | **EC21** | Từ chối truy cập do chưa đăng nhập, trả về **HTTP 401 Unauthorized** | **Invalid** | HTTP 401: `{"error": "Unauthorized"}` |
| 22 | `OUT_ERR_FORBIDDEN_BAD_TOKEN` | **EC22** | Từ chối truy cập do Token sai chữ ký/hết hạn/rác, trả về **HTTP 403 Forbidden** | **Invalid** | HTTP 403: `{"error": "Forbidden"}` |
| 23 | `OUT_ERR_FORBIDDEN_ROLE` | **EC23** | Từ chối truy cập do không có quyền Admin, trả về **HTTP 403 Forbidden** | **Invalid** | HTTP 403: `{"error": "Forbidden: Yêu cầu quyền Admin"}` |
| 24 | `OUT_PREVENT_PRIVILEGE_ESCALATION`| **EC24** | CSDL giữ nguyên `role = 'user'`, ngăn chặn tự nâng quyền | **Invalid** | CSDL giữ nguyên `role = 'user'`, trả về 403 hoặc bỏ qua role |
| 25 | `OUT_UI_ROUTE_BLOCKED` | **EC25** | Route Guard chặn hiển thị trang Admin, redirect về `/login` hoặc báo 403 | **Invalid** | Trình duyệt chuyển về `/login` kèm thông báo cần đăng nhập Admin |
| 26 | `OUT_UI_NAV_RENDER_ADMIN` | **EC26** | Header giao diện hiển thị liên kết/menu "Quản trị" (Admin Panel) | **Valid** | Render thẻ `<Link to="/admin">Quản trị</Link>` trên Header |

---

### BƯỚC 3: XÁC ĐỊNH CA KIỂM THỬ SƠ BỘ (DUYỆT TOÀN BỘ 26 ECs - SLIDE 17)

> [!IMPORTANT]
> **QUY TẮC DUYỆT BRUTE-FORCE TOÀN DIỆN (SLIDE 17 BÀI GIẢNG FIT - HCMUS):**
> 1. Duyệt tuần tự qua **100% tất cả 26 lớp tương đương** ($EC01 \rightarrow EC26$).
> 2. Điền **giá trị cụ thể** cho từng cột dữ liệu (cả Header, Chữ ký Token, Role Claim, Endpoint, Body và Tuyến đường UI).
> 3. **Cô lập lỗi (Fault Isolation / Single Fault Assumption)**: Khi dòng đó kiểm tra một Invalid EC, tất cả các tham số/trạng thái còn lại **bắt buộc mang giá trị danh nghĩa hợp lệ cụ thể** (`auth_header = "Bearer <Token_Admin>"`, `jwt_token_integrity = Valid`, `jwt_role_claim = "admin"`, `target_endpoint = "GET /api/admin/users"`).

### Bảng Tổng hợp Ca Kiểm thử Sơ bộ (Full Preliminary Test Cases Table)
| STT | Lớp Tương Đương Được Test | `auth_header` | `jwt_token_integrity` | `jwt_role_claim` | `target_endpoint` / `client_route_path` | `user_profile_role_input` / `client_auth_state` | Output mong đợi cụ thể (Expected Output) |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **1** | **EC01** (`auth_header` chuẩn) | `"Bearer " + <Token_Admin>` | `Valid & Active` | `admin` | `GET /api/admin/users` | `undefined` | **HTTP 200 OK**: Trả về danh sách người dùng trong hệ thống |
| **2** | **EC02** (Không có `auth_header`)| *(Không gửi Header)* | N/A | N/A | `GET /api/admin/users` | `undefined` | **HTTP 401 Unauthorized**: Báo lỗi yêu cầu đăng nhập |
| **3** | **EC03** (`auth_header` sai format)| `<Token_Admin>` (No Bearer)| `Valid & Active` | `admin` | `GET /api/admin/users` | `undefined` | **HTTP 401 / 403**: Báo lỗi định dạng Authorization không hợp lệ |
| **4** | **EC04** (`jwt_integrity` hợp lệ) | `"Bearer " + <Token_Admin>` | `Valid & Active` | `admin` | `GET /api/admin/orders` | `undefined` | **HTTP 200 OK**: Xác thực thành công, trả về danh sách đơn hàng |
| **5** | **EC05** (`jwt_integrity` chữ ký giả)| `"Bearer " + <Token_Fake_Sign>`| `Fake Signature` | `admin` | `GET /api/admin/users` | `undefined` | **HTTP 403 Forbidden**: Chữ ký không khớp `SECRET_KEY`, từ chối |
| **6** | **EC06** (`jwt_integrity` hết hạn)| `"Bearer " + <Token_Expired>` | `Expired (2020)` | `admin` | `GET /api/admin/users` | `undefined` | **HTTP 403 Forbidden**: Token đã hết hạn sử dụng, từ chối |
| **7** | **EC07** (`jwt_integrity` chuỗi rác)| `"Bearer invalid.jwt.string"`| `Malformed` | N/A | `GET /api/admin/users` | `undefined` | **HTTP 403 Forbidden**: Cấu trúc JWT sai định dạng |
| **8** | **EC08** (`jwt_role_claim = 'admin'`)| `"Bearer " + <Token_Admin>` | `Valid & Active` | `admin` | `GET /api/admin/users` | `undefined` | **HTTP 200 OK**: Cho phép Admin truy cập tài nguyên quản trị |
| **9** | **EC09** (`jwt_role_claim = 'user'`)| `"Bearer " + <Token_User>` | `Valid & Active` | `user` | `GET /api/admin/users` | `undefined` | **HTTP 403 Forbidden**: Từ chối User thường truy cập API Admin |
| **10** | **EC10** (`jwt_role_claim = null`)| `"Bearer " + <Token_No_Role>`| `Valid & Active` | `null` | `GET /api/admin/users` | `undefined` | **HTTP 403 Forbidden**: Từ chối Token không có quyền Admin |
| **11** | **EC11** (`target_endpoint` Admin)| `"Bearer " + <Token_Admin>` | `Valid & Active` | `admin` | `GET /api/admin/orders` | `undefined` | **HTTP 200 OK**: Xử lý thành công API quản trị đơn hàng |
| **12** | **EC12** (`target_endpoint` Mutating)| `"Bearer " + <Token_Admin>` | `Valid & Active` | `admin` | `POST /api/products` | Body: `{"name":"SP Mới","price":10000}` | **HTTP 200 / 201**: Admin tạo sản phẩm mới thành công |
| **13** | **EC13** (`role_input` không sửa)| `"Bearer " + <Token_User>` | `Valid & Active` | `user` | `PUT /api/users/me` | Body: `{"name":"Test User"}` | **HTTP 200 OK**: Cập nhật thông tin cá nhân bình thường |
| **14** | **EC14** (`role_input = 'admin'`)| `"Bearer " + <Token_User>` | `Valid & Active` | `user` | `PUT /api/users/me` | Body: `{"role":"admin"}` | **HTTP 403 / Bỏ qua role**: CSDL không được đổi `role` thành `admin` |
| **15** | **EC15** (`client_auth_state = admin`)| `"Bearer " + <Token_Admin>` | `Valid & Active` | `admin` | URL `/admin` | State: `{ role: "admin" }` | **UI Render**: Hiển thị thành công trang Dashboard Quản trị |
| **16** | **EC16** (`client_auth_state = user`)| `"Bearer " + <Token_User>` | `Valid & Active` | `user` | URL `/admin` | State: `{ role: "user" }` | **Route Guard**: Hiển thị "403 - Bạn không có quyền truy cập" |
| **17** | **EC17** (`client_auth_state = null`)| *(Chưa đăng nhập)* | N/A | N/A | URL `/admin` | State: `null` | **Route Guard**: Chuyển hướng về `/login` kèm thông báo đăng nhập |
| **18** | **EC18** (`client_route_path = /admin`)| `"Bearer " + <Token_Admin>` | `Valid & Active` | `admin` | URL `http://localhost:5173/admin`| State: `{ role: "admin" }` | **UI Render**: Render giao diện Quản trị viên |
| **19** | **EC19** (`client_route_path = /`)| `"Bearer " + <Token_Admin>` | `Valid & Active` | `admin` | URL `http://localhost:5173/` | State: `{ role: "admin" }` | **UI Render**: Header hiển thị nút/menu "Quản trị" |
| **20** | **EC20** (Output: Cho phép Admin)| `"Bearer " + <Token_Admin>` | `Valid & Active` | `admin` | `GET /api/admin/users` | `undefined` | **HTTP 200 OK**: Trả về danh sách người dùng toàn hệ thống |
| **21** | **EC21** (Output: Lỗi 401) | *(Không gửi Header)* | N/A | N/A | `GET /api/admin/users` | `undefined` | **HTTP 401 Unauthorized**: Báo lỗi thiếu Token xác thực |
| **22** | **EC22** (Output: Lỗi 403 Token)| `"Bearer " + <Token_Fake_Sign>`| `Fake Signature` | `admin` | `GET /api/admin/users` | `undefined` | **HTTP 403 Forbidden**: Chặn Token giả mạo chữ ký |
| **23** | **EC23** (Output: Lỗi 403 Role)| `"Bearer " + <Token_User>` | `Valid & Active` | `user` | `GET /api/admin/users` | `undefined` | **HTTP 403 Forbidden**: Chặn User thường xem dữ liệu Admin |
| **24** | **EC24** (Output: Chặn sửa role)| `"Bearer " + <Token_User>` | `Valid & Active` | `user` | `PUT /api/users/me` | Body: `{"role":"admin"}` | CSDL giữ nguyên `role = 'user'`, ngăn chặn đặc quyền bất hợp pháp |
| **25** | **EC25** (Output: Route Guard)| *(Chưa đăng nhập)* | N/A | N/A | URL `/admin` | State: `null` | Chuyển hướng về `/login`, bảo vệ an toàn giao diện quản trị |
| **26** | **EC26** (Output: Render Header)| `"Bearer " + <Token_Admin>` | `Valid & Active` | `admin` | URL `/` | State: `{ role: "admin" }` | Header hiển thị menu/link "Quản trị" cạnh thông tin tài khoản |

---

### BƯỚC 4: BẢNG RÚT GỌN CÁC CA KIỂM THỬ (SLIDE 18 FIT - HCMUS)

#### 4.1. Phân tích Rút gọn Trùng lặp (Test Case Reduction Analysis)
Theo nguyên tắc tối ưu hóa ca kiểm thử (Slide 18 bài giảng FIT - HCMUS), các dòng kiểm tra lớp tương đương hợp lệ ở Bước 3 có cùng toàn bộ giá trị đầu vào và cùng kết quả mong đợi được gộp thành 1 ca kiểm thử tổng hợp, đồng thời các Lớp tương đương Đầu ra (Output ECs) được ánh xạ trực tiếp vào từng ca kiểm thử tương ứng để bao phủ toàn bộ 26 ECs:

1. **Gộp ca kiểm thử truy cập API Admin bằng Token Admin hợp lệ**: Dòng 1 ($EC01$), Dòng 4 ($EC04$), Dòng 8 ($EC08$), Dòng 11 ($EC11$) và Dòng 20 ($EC20$) có cùng Token Admin hợp lệ và cùng kết quả thành công $\rightarrow$ Gộp thành **DT_FR12_TC01** (Phủ `EC01, EC04, EC08, EC11, EC20`).
2. **Gộp ca kiểm thử từ chối API Admin khi thiếu Header Authorization**: Dòng 2 ($EC02$) và Dòng 21 ($EC21$) có cùng đầu vào thiếu Header và cùng kết quả HTTP 401 $\rightarrow$ Gộp thành **DT_FR12_TC02** (Phủ `EC02, EC21`).
3. **Ca kiểm thử Header Authorization sai định dạng (No Bearer)**: Dòng 3 ($EC03$) kiểm tra từ chối header không có prefix `Bearer ` $\rightarrow$ Đứng độc lập thành **DT_FR12_TC03** (Phủ `EC03`).
4. **Gộp ca kiểm thử Token JWT chữ ký giả mạo**: Dòng 5 ($EC05$) và Dòng 22 ($EC22$) kiểm tra từ chối token ký sai secret $\rightarrow$ Gộp thành **DT_FR12_TC04** (Phủ `EC05, EC22`).
5. **Ca kiểm thử Token JWT đã hết hạn sử dụng**: Dòng 6 ($EC06$) kiểm tra từ chối token đã hết hạn $exp < now$ $\rightarrow$ Đứng độc lập thành **DT_FR12_TC05** (Phủ `EC06`).
6. **Ca kiểm thử Token JWT chuỗi rác/malformed**: Dòng 7 ($EC07$) kiểm tra từ chối chuỗi rác $\rightarrow$ Đứng độc lập thành **DT_FR12_TC06** (Phủ `EC07`).
7. **Gộp ca kiểm thử từ chối API Admin khi dùng Token User thường**: Dòng 9 ($EC09$) và Dòng 23 ($EC23$) có cùng Token User và cùng kết quả HTTP 403 $\rightarrow$ Gộp thành **DT_FR12_TC07** (Phủ `EC09, EC23`).
8. **Ca kiểm thử từ chối Token không có claim `role`**: Dòng 10 ($EC10$) kiểm tra từ chối token thiếu role $\rightarrow$ Đứng độc lập thành **DT_FR12_TC08** (Phủ `EC10`).
9. **Gộp ca kiểm thử tạo sản phẩm bằng Token Admin**: Dòng 12 ($EC12$) kết hợp cùng Dòng 20 ($EC20$) kiểm tra cho phép Admin gọi Mutating API `POST /api/products` $\rightarrow$ Gộp thành **DT_FR12_TC09** (Phủ `EC12, EC20`).
10. **Gộp ca kiểm thử cập nhật hồ sơ cá nhân hợp lệ (không đổi role)**: Dòng 13 ($EC13$) kết hợp cùng Dòng 20 ($EC20$) kiểm tra `PUT /api/users/me` hoạt động bình thường $\rightarrow$ Gộp thành **DT_FR12_TC10** (Phủ `EC13, EC20`).
11. **Gộp ca kiểm thử phòng chống leo thang quyền lực (Privilege Escalation)**: Dòng 14 ($EC14$) và Dòng 24 ($EC24$) kiểm tra API `PUT /api/users/me` không cho phép đổi `role` $\rightarrow$ Gộp thành **DT_FR12_TC11** (Phủ `EC14, EC24`).
12. **Gộp ca kiểm thử Route Guard chặn khách vãng lai**: Dòng 17 ($EC17$), Dòng 18 ($EC18$) và Dòng 25 ($EC25$) kiểm tra chặn truy cập URL `/admin` khi chưa đăng nhập $\rightarrow$ Gộp thành **DT_FR12_TC12** (Phủ `EC17, EC18, EC25`).
13. **Ca kiểm thử Route Guard chặn User thường vào trang Admin**: Dòng 16 ($EC16$) kết hợp cùng Dòng 18 ($EC18$) kiểm tra chặn User thường gõ URL `/admin` $\rightarrow$ Đứng độc lập thành **DT_FR12_TC13** (Phủ `EC16, EC18`).
14. **Gộp ca kiểm thử Header UI & Dashboard Admin**: Dòng 15 ($EC15$), Dòng 19 ($EC19$) và Dòng 26 ($EC26$) kiểm tra hiển thị menu Quản trị trên Header và truy cập thành công trang Admin $\rightarrow$ Gộp thành **DT_FR12_TC14** (Phủ `EC15, EC19, EC26`).

#### 4.2. Bảng Rút gọn các Ca Kiểm thử Hoàn chỉnh (Optimized Test Suite)
| TC ID | Lớp Tương Đương Được Phủ (Covered ECs) | Tầng Kiểm Thử | `auth_header` / Token Gửi Kèm | Endpoint / Tuyến Đường Mục Tiêu | Payload Request Body | Output mong đợi (Expected Output) |
| :---: | :--- | :---: | :--- | :--- | :--- | :--- |
| **DT_FR12_TC01** | **EC01, EC04, EC08, EC11, EC20** | Backend API | `"Bearer " + <Token_Admin>` | `GET /api/admin/users`, `GET /api/admin/orders` | Trống | **HTTP 200 OK**: Cho phép truy cập dữ liệu quản trị toàn hệ thống |
| **DT_FR12_TC02** | **EC02, EC21** | Backend API | *(Không gửi Header Authorization)* | `GET /api/admin/users` | Trống | **HTTP 401 Unauthorized**: Báo lỗi yêu cầu đăng nhập |
| **DT_FR12_TC03** | **EC03** | Backend API | `<Token_Admin_Raw>` (Thiếu `"Bearer "`) | `GET /api/admin/users` | Trống | **HTTP 401 / 403**: Từ chối định dạng Header không hợp lệ |
| **DT_FR12_TC04** | **EC05, EC22** | Backend API | `"Bearer " + <Token_Fake_Sign>` | `GET /api/admin/users` | Trống | **HTTP 403 Forbidden**: Chữ ký không hợp lệ, từ chối request |
| **DT_FR12_TC05** | **EC06** | Backend API | `"Bearer " + <Token_Expired>` | `GET /api/admin/users` | Trống | **HTTP 403 Forbidden**: Token đã hết hạn sử dụng ($exp < now$) |
| **DT_FR12_TC06** | **EC07** | Backend API | `"Bearer invalid.jwt.string"` | `GET /api/admin/users` | Trống | **HTTP 403 Forbidden**: Cấu trúc JWT sai định dạng |
| **DT_FR12_TC07** | **EC09, EC23** | Backend API | `"Bearer " + <Token_User>` (`role = 'user'`) | `GET /api/admin/users`, `GET /api/admin/orders` | Trống | **HTTP 403 Forbidden**: Báo lỗi tài khoản không có quyền Admin |
| **DT_FR12_TC08** | **EC10** | Backend API | `"Bearer " + <Token_No_Role>` (`role = null`) | `GET /api/admin/users` | Trống | **HTTP 403 Forbidden**: Báo lỗi Token thiếu quyền Admin |
| **DT_FR12_TC09** | **EC12, EC20** | Backend API | `"Bearer " + <Token_Admin>` (`role = 'admin'`) | `POST /api/products` | `{"name": "MacBook Air", "price": 25000000, "category_id": 2}` | **HTTP 200 / 201**: Admin tạo sản phẩm thành công vào CSDL |
| **DT_FR12_TC10** | **EC13, EC20** | Backend API | `"Bearer " + <Token_User>` (`role = 'user'`) | `PUT /api/users/me` | `{"name": "Test User", "shipping_address": "HCM"}` | **HTTP 200 OK**: Cập nhật thông tin cá nhân thành công |
| **DT_FR12_TC11** | **EC14, EC24** | Backend API | `"Bearer " + <Token_User>` (`role = 'user'`) | `PUT /api/users/me` | `{"name": "Test User", "role": "admin"}` | **HTTP 403 / Bỏ qua role**: CSDL không thay đổi `role`, ngăn chặn leo thang quyền lực |
| **DT_FR12_TC12** | **EC17, EC18, EC25** | Frontend UI | Chưa đăng nhập (Không có Token trong LocalStorage) | URL `http://localhost:5173/admin` | N/A | **Route Guard**: Chặn truy cập trang Admin, chuyển hướng về `/login` |
| **DT_FR12_TC13** | **EC16, EC18** | Frontend UI | Đã đăng nhập `test@eshop.com` (`role = 'user'`) | URL `http://localhost:5173/admin` | N/A | **Route Guard**: Chặn truy cập, hiển thị thông báo "403 Forbidden - Cần quyền Admin" |
| **DT_FR12_TC14** | **EC15, EC19, EC26** | Frontend UI | Đã đăng nhập `admin@eshop.com` (`role = 'admin'`) | Header Navigation & URL `/admin` | N/A | **UI Render**: Header hiển thị menu "Quản trị", click chuyển đến Dashboard Admin |

---

# PHẦN B: THIẾT KẾ KIỂM THỬ VỚI BOUNDARY VALUE ANALYSIS (ROBUSTNESS TESTING 6n + 1)

---

### BƯỚC 1: XÁC ĐỊNH CÁC BIẾN CÓ THỨ TỰ & GIÁ TRỊ DANH NGHĨA ($Nom$)

> [!NOTE]
> **CƠ SỞ TRÍCH XUẤT BIẾN THEO CHUẨN MÔN HỌC (SLIDE 22, 23 FIT - HCMUS):**
> - Bản chất nghiệp vụ của FR-12 (Kiểm soát truy cập) thuần về phân quyền logic (chỉ gồm các biến rời rạc/danh nghĩa như Role, Token State, Endpoint).
> - Để thực hiện kỹ thuật **Boundary Value Analysis (BVA)** theo yêu cầu đề bài HW02 (vốn chỉ áp dụng cho các biến có miền dữ liệu **có thứ tự - Ordered Domains**), Tester đã trích xuất 2 tham số kỹ thuật có thứ tự xoay quanh cơ chế xác thực và bảo mật:
>   1. `jwt_token_length`: Dựa trên Chuẩn cấu trúc chuỗi JWT (RFC 7519) và Security Testing (chống lỗi cắt cụt token và Buffer Overflow).
>   2. `admin_query_limit`: Dựa trên Best Practice thiết kế API Quản trị phân trang (tránh lỗi DoS khi tải danh sách lớn).

Chức năng FR-12 có **$n = 2$ biến có thứ tự (ordered variables)** trong cơ chế xác thực và phân trang quản trị:
1. **Biến $x_1$**: `jwt_token_length` (Độ dài chuỗi Token JWT tính bằng ký tự)
   - Miền giá trị hợp lệ: $[100 \dots 500]$ ký tự (chuẩn kích thước JWT chứa Header, Claims và Signature theo RFC 7519).
   - Ngưỡng biên dưới: $LB_1 = 100$ ký tự (độ dài tối thiểu của 1 token JWT hợp lệ).
   - Ngưỡng biên trên: $UB_1 = 500$ ký tự (độ dài tối đa của Token trong hệ thống).
   - Bước nhảy: $\epsilon_1 = 1$ ký tự.
   - Giá trị danh nghĩa ($Nom_1$): **$180$ ký tự** (kích thước chuỗi JWT tiêu chuẩn do `jsonwebtoken` sinh ra).
2. **Biến $x_2$**: `admin_query_limit` (Số lượng bản ghi truy vấn tối đa trong API quản trị `GET /api/admin/orders?limit=N` hoặc `GET /api/admin/users?limit=N`)
   - Miền giá trị hợp lệ: $[1 \dots 100]$ bản ghi / trang (theo Best Practice phân trang API).
   - Ngưỡng biên dưới: $LB_2 = 1$ bản ghi.
   - Ngưỡng biên trên: $UB_2 = 100$ bản ghi.
   - Bước nhảy: $\epsilon_2 = 1$ bản ghi.
   - Giá trị danh nghĩa ($Nom_2$): **$20$ bản ghi / trang**.

- **Công thức tính số ca kiểm thử Robustness Testing**:
  $$\mathbf{f = 6n + 1 = 6 \times 2 + 1 = 13 \text{ ca kiểm thử}}$$

---

### BƯỚC 2: BẢNG 6 ĐIỂM BIÊN CHI TIẾT CHO TỪNG BIẾN (ROBUSTNESS POINTS)

#### Bảng Điểm Biên Biến 1: `jwt_token_length` (x1) — Miền [100 .. 500] ký tự
| STT | Ký hiệu Điểm | Vị trí Ranh giới | Công thức | Giá trị Số Cụ Thể | Tính Hợp Lệ | Hành vi Kỳ vọng (SRS & Security) |
| :---: | :---: | :--- | :---: | :---: | :---: | :--- |
| 1 | **$min_1^-$** | Dưới biên dưới | $LB_1 - \epsilon_1$ | **$99$ ký tự** | **Invalid** | Token bị cắt cụt (thiếu phần signature), hệ thống từ chối với HTTP 403 |
| 2 | **$min_1$** | Ngay biên dưới | $LB_1$ | **$100$ ký tự** | **Valid** | Token nhỏ gọn hợp lệ tối thiểu, xác thực thành công |
| 3 | **$min_1^+$** | Ngay trên biên dưới | $LB_1 + \epsilon_1$ | **$101$ ký tự** | **Valid** | Token hợp lệ, xác thực thành công |
| 4 | **$max_1^-$** | Ngay dưới biên trên | $UB_1 - \epsilon_1$ | **$499$ ký tự** | **Valid** | Token kích thước lớn hợp lệ, xác thực thành công |
| 5 | **$max_1$** | Ngay tại biên trên | $UB_1$ | **$500$ ký tự** | **Valid** | Token tối đa cho phép, xác thực thành công |
| 6 | **$max_1^+$** | Vượt trên biên trên | $UB_1 + \epsilon_1$ | **$501$ ký tự** | **Invalid** | Token vượt quá giới hạn độ dài cho phép, từ chối với HTTP 400 / 403 |
| - | **$Nom_1$** | Giá trị danh nghĩa | Baseline | **$180$ ký tự** | **Valid** | Kích thước Token JWT Admin chuẩn |

#### Bảng Điểm Biên Biến 2: `admin_query_limit` (x2) — Miền [1 .. 100] bản ghi
| STT | Ký hiệu Điểm | Vị trí Ranh giới | Công thức | Giá trị Số Cụ Thể | Tính Hợp Lệ | Hành vi Kỳ vọng (SRS) |
| :---: | :---: | :--- | :---: | :---: | :---: | :--- |
| 1 | **$min_2^-$** | Dưới biên dưới | $LB_2 - \epsilon_2$ | **0 bản ghi** | **Invalid** | Tham số phân trang không hợp lệ, báo lỗi HTTP 400 |
| 2 | **$min_2$** | Ngay biên dưới | $LB_2$ | **1 bản ghi** | **Valid** | Trả về đúng 1 bản ghi đơn hàng/người dùng |
| 3 | **$min_2^+$** | Ngay trên biên dưới | $LB_2 + \epsilon_2$ | **2 bản ghi** | **Valid** | Trả về đúng 2 bản ghi |
| 4 | **$max_2^-$** | Ngay dưới biên trên | $UB_2 - \epsilon_2$ | **99 bản ghi** | **Valid** | Trả về tối đa 99 bản ghi |
| 5 | **$max_2$** | Ngay tại biên trên | $UB_2$ | **100 bản ghi** | **Valid** | Trả về tối đa 100 bản ghi |
| 6 | **$max_2^+$** | Vượt trên biên trên | $UB_2 + \epsilon_2$ | **101 bản ghi** | **Invalid** | Vượt quá giới hạn phân trang tối đa, từ chối với HTTP 400 |
| - | **$Nom_2$** | Giá trị danh nghĩa | Baseline | **20 bản ghi** | **Valid** | Mức phân trang danh nghĩa chuẩn |

---

### BƯỚC 3 & 4: BẢNG CA KIỂM THỬ ROBUSTNESS TOÀN DIỆN ($6n + 1 = 13$ DÒNG)

> [!IMPORTANT]
> **QUY TẮC CÔ LẬP LỖI (SINGLE FAULT ASSUMPTION)**:
> - Khi kiểm tra điểm biên của $x_1$ (`jwt_token_length`): Tham số phân trang $x_2$ giữ cố định ở $Nom_2 = 20$ bản ghi.
> - Khi kiểm tra điểm biên của $x_2$ (`admin_query_limit`): Chuỗi Token Admin $x_1$ giữ cố định ở $Nom_1 = 180$ ký tự hợp lệ (`admin@eshop.com`).
> - Điểm Baseline: Tất cả các biến đều ở giá trị danh nghĩa ($Nom_1 = 180$ ký tự, $Nom_2 = 20$ bản ghi).

### Bảng Ca Kiểm thử Robustness Testing ($f = 13$)
| STT (TC ID) | Biến Kiểm Tra | Điểm Biên | `jwt_token_length` ($x_1$) | `admin_query_limit` ($x_2$) | Chi tiết Dữ liệu Kiểm thử | Output Mong Đợi Cụ Thể (Theo SRS & Security) | Actual Output (Chạy thực tế trên SUT) | Kết luận |
| :---: | :---: | :---: | :---: | :---: | :--- | :--- | :--- | :---: |
| **BVA_FR12_TC01** | $x_1$ | $min_1$ ($100$) | **$100$ ký tự** | $Nom_2$ ($20$) | Gửi Token Admin tối thiểu $100$ ký tự hợp lệ | **HTTP 200 OK**: Xác thực thành công, trả về tối đa 20 bản ghi | Xác thực thành công, nhưng không kiểm tra role Admin | **PASS / NOTE** |
| **BVA_FR12_TC02** | $x_1$ | $min_1^+$ ($101$) | **$101$ ký tự** | $Nom_2$ ($20$) | Gửi Token Admin $101$ ký tự hợp lệ | **HTTP 200 OK**: Xác thực thành công, trả về tối đa 20 bản ghi | Xác thực thành công | **PASS** |
| **BVA_FR12_TC03** | $x_1$ | $max_1^-$ ($499$) | **$499$ ký tự** | $Nom_2$ ($20$) | Gửi Token Admin $499$ ký tự hợp lệ | **HTTP 200 OK**: Xác thực thành công, trả về tối đa 20 bản ghi | Xác thực thành công | **PASS** |
| **BVA_FR12_TC04** | $x_1$ | $max_1$ ($500$) | **$500$ ký tự** | $Nom_2$ ($20$) | Gửi Token Admin tối đa $500$ ký tự hợp lệ | **HTTP 200 OK**: Xác thực thành công, trả về tối đa 20 bản ghi | Xác thực thành công | **PASS** |
| **BVA_FR12_TC05** | $x_1$ | $min_1^-$ ($99$) | **$99$ ký tự** | $Nom_2$ ($20$) | Gửi Token bị cắt cụt còn $99$ ký tự | **HTTP 403 Forbidden**: Token malformed / chữ ký không đầy đủ | Trả về HTTP 403 Forbidden | **PASS** |
| **BVA_FR12_TC06** | $x_1$ | $max_1^+$ ($501$) | **$501$ ký tự** | $Nom_2$ ($20$) | Gửi Token quá dài $501$ ký tự chứa payload rác | **HTTP 400 / 403**: Từ chối Token vượt quá kích thước cho phép | Chấp nhận parse nếu JWT hợp lệ, không kiểm soát trần | **NOTE** |
| **BVA_FR12_TC07** | $x_2$ | $min_2$ ($1$) | $Nom_1$ ($180$) | **$1$ bản ghi** | `GET /api/admin/orders?limit=1` | **HTTP 200 OK**: Trả về đúng 1 đơn hàng | Trả về toàn bộ danh sách đơn hàng (chưa có phân trang) | **FAIL (FEATURE)** |
| **BVA_FR12_TC08** | $x_2$ | $min_2^+$ ($2$) | $Nom_1$ ($180$) | **$2$ bản ghi** | `GET /api/admin/orders?limit=2` | **HTTP 200 OK**: Trả về đúng 2 đơn hàng | Trả về toàn bộ danh sách đơn hàng | **FAIL (FEATURE)** |
| **BVA_FR12_TC09** | $x_2$ | $max_2^-$ ($99$) | $Nom_1$ ($180$) | **$99$ bản ghi** | `GET /api/admin/orders?limit=99` | **HTTP 200 OK**: Trả về tối đa 99 đơn hàng | Trả về toàn bộ danh sách đơn hàng | **FAIL (FEATURE)** |
| **BVA_FR12_TC10** | $x_2$ | $max_2$ ($100$) | $Nom_1$ ($180$) | **$100$ bản ghi** | `GET /api/admin/orders?limit=100` | **HTTP 200 OK**: Trả về tối đa 100 đơn hàng | Trả về toàn bộ danh sách đơn hàng | **FAIL (FEATURE)** |
| **BVA_FR12_TC11** | $x_2$ | $min_2^-$ ($0$) | $Nom_1$ ($180$) | **$0$ bản ghi** | `GET /api/admin/orders?limit=0` | **HTTP 400 Bad Request**: Báo lỗi `limit` phải $\ge 1$ | Bỏ qua query param, trả về toàn bộ mảng | **FAIL (FEATURE)** |
| **BVA_FR12_TC12** | $x_2$ | $max_2^+$ ($101$) | $Nom_1$ ($180$) | **$101$ bản ghi** | `GET /api/admin/orders?limit=101` | **HTTP 400 Bad Request**: Báo lỗi `limit` vượt quá trần 100 | Bỏ qua query param, trả về toàn bộ mảng | **FAIL (FEATURE)** |
| **BVA_FR12_TC13** | Baseline | All Nominal | $Nom_1$ ($180$) | $Nom_2$ ($20$) | `GET /api/admin/orders` kèm Token Admin chuẩn | **HTTP 200 OK**: Trả về danh sách đơn hàng, bảo vệ quyền Admin | Trả về 200 OK nhưng không kiểm tra `role === 'admin'` | **FAIL (BUG #1)** |

---

# PHẦN C: TỔNG HỢP BUG PHÁT HIỆN TRÊN FR-12 (DEFECT AUDIT & ROOT CAUSE)

Qua quá trình thực thi toàn diện bộ ca kiểm thử thiết kế bởi Domain Testing và Robustness BVA trên cả hai tầng **Frontend UI & Backend API**, chúng ta phát hiện **6 lỗi bảo mật, phân quyền và hiệu năng API (Security & API Defects)**:

---

### NHÓM 1: CÁC LỖI TẦNG BACKEND API (SECURITY & ACCESS CONTROL VULNERABILITIES)

#### BUG 1: Lỗ hổng Broken Access Control trên toàn bộ API Quản trị (`/api/admin/*`)
- **Mức độ nghiêm trọng**: **Đặc biệt nghiêm trọng (Critical / Broken Object Level Authorization - OWASP Top 1)**
- **Ca kiểm thử phát hiện**: `DT_FR12_TC07`, `BVA_FR12_TC13`.
- **Vị trí mã nguồn**: [backend/server.js: dòng 100-110 và 494-525](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/backend/server.js#L100-L110).
- **Mã nguồn lỗi**:
  ```javascript
  const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (token == null) return res.status(401).json({ error: "Unauthorized" });

    jwt.verify(token, SECRET_KEY, (err, user) => {
      if (err) return res.status(403).json({ error: "Forbidden" });
      req.user = user; // LỖI: Chỉ gán user từ token, HOÀN TOÀN KHÔNG KIỂM TRA req.user.role === 'admin'
      next();
    });
  };

  app.get("/api/admin/users", authenticateToken, (req, res) => { ... });
  app.delete("/api/admin/users/:id", authenticateToken, (req, res) => { ... });
  app.get("/api/admin/orders", authenticateToken, (req, res) => { ... });
  ```
- **Hệ quả thực tế**:
  1. Người dùng thông thường (`test@eshop.com` với `role = 'user'`) chỉ cần đăng nhập và lấy Token JWT là có thể gọi trực tiếp `GET /api/admin/users` để tải về toàn bộ danh sách khách hàng, email và địa chỉ trong hệ thống (rò rỉ dữ liệu PII).
  2. Người dùng thông thường có thể gọi `DELETE /api/admin/users/:id` để xóa tài khoản của người khác hoặc xóa tài khoản Admin.
  3. Người dùng thông thường có thể gọi `GET /api/admin/orders` để xem toàn bộ đơn hàng của tất cả khách hàng khác và gọi `PUT /api/admin/orders/:id/status` để thay đổi trạng thái đơn hàng bất kỳ.

---

#### BUG 2: Các API thay đổi sản phẩm (`POST/PUT/DELETE /api/products`) hoàn toàn không có xác thực (Unauthenticated Mutating APIs)
- **Mức độ nghiêm trọng**: **Đặc biệt nghiêm trọng (Critical / Missing Authentication)**
- **Ca kiểm thử phát hiện**: `DT_FR12_TC09` (Kiểm thử mở rộng API Mutating).
- **Vị trí mã nguồn**: [backend/server.js: dòng 167-196](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/backend/server.js#L167-L196).
- **Mã nguồn lỗi**:
  ```javascript
  app.post("/api/products", (req, res) => { // LỖI: Hoàn toàn không có middleware authenticateToken
    const { name, price, description, imageUrl, category_id } = req.body;
    db.run("INSERT INTO products ...", ...);
  });

  app.put("/api/products/:id", (req, res) => { ... }); // LỖI: Không có xác thực
  app.delete("/api/products/:id", (req, res) => { ... }); // LỖI: Không có xác thực
  ```
- **Hệ quả thực tế**: Khách vãng lai (Anonymous Visitor) không cần đăng nhập vẫn có thể gửi request `POST /api/products` để thêm sản phẩm rác, `PUT /api/products/:id` để sửa giá sản phẩm về 0 đồng, hoặc `DELETE /api/products/:id` để xóa sạch toàn bộ danh mục sản phẩm của cửa hàng.

---

#### BUG 3: Lỗ hổng Leo thang Đặc quyền (Privilege Escalation) qua API `PUT /api/users/me`
- **Mức độ nghiêm trọng**: **Nghiêm trọng (High / Privilege Escalation - Mass Assignment)**
- **Ca kiểm thử phát hiện**: `DT_FR12_TC11`.
- **Vị trí mã nguồn**: [backend/server.js: dòng 118-135](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/backend/server.js#L118-L135).
- **Mã nguồn lỗi**:
  ```javascript
  app.put("/api/users/me", authenticateToken, (req, res) => {
    const { name, shipping_address, phone, role } = req.body; // LỖI: Nhận trực tiếp trường role từ client
    ...
    if (role) {
      query += ", role = ?";
      params.push(role); // Cập nhật thẳng giá trị role vào CSDL mà không có bất kỳ khâu kiểm tra quyền hạn nào!
    }
    query += " WHERE id = ?";
    params.push(req.user.id);
    db.run(query, params, ...);
  });
  ```
- **Hệ quả thực tế**: Bất kỳ tài khoản thường nào cũng có thể gửi request `PUT /api/users/me` kèm payload `{"role": "admin"}` để tự thăng cấp tài khoản của mình thành Quản trị viên tối cao, chiếm toàn quyền điều khiển hệ thống.

---

#### BUG 4: Thiếu cơ chế phân trang và bỏ qua tham số `limit` trên API Quản trị `GET /api/admin/orders`
- **Mức độ nghiêm trọng**: **Trung bình (Medium / API Performance & Resource Exhaustion)**
- **Ca kiểm thử phát hiện**: `BVA_FR12_TC07`, `BVA_FR12_TC08`, `BVA_FR12_TC09`, `BVA_FR12_TC11`, `BVA_FR12_TC12`.
- **Vị trí mã nguồn**: [backend/server.js: dòng 510-523](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/backend/server.js#L510-L523).
- **Mã nguồn lỗi**:
  ```javascript
  app.get("/api/admin/orders", authenticateToken, (req, res) => {
    db.all(
      `
          SELECT orders.*, users.name as user_name 
          FROM orders 
          LEFT JOIN users ON orders.user_id = users.id
          ORDER BY orders.id DESC
      `,
      [], // LỖI: Không truyền limit/offset vào SQL, bỏ qua hoàn toàn req.query.limit
      (err, orders) => {
        res.json(orders);
      },
    );
  });
  ```
- **Hệ quả thực tế**: Khi gửi request `GET /api/admin/orders?limit=1`, server bỏ qua tham số `limit` và luôn query trả về toàn bộ dữ liệu đơn hàng trong CSDL. Khi hệ thống có hàng ngàn đơn hàng, việc không phân trang sẽ làm tăng tải CPU, gây nghẽn băng thông và có nguy cơ làm treo server (Denial of Service / Out of Memory).

---

### NHÓM 2: CÁC LỖI TẦNG FRONTEND (UI & CLIENT ROUTE GUARDING)

#### BUG 5: Header giao diện không có menu/liên kết truy cập Admin khi đăng nhập tài khoản Quản trị
- **Mức độ nghiêm trọng**: **Trung bình (Medium / UI Missing Feature)**
- **Ca kiểm thử phát hiện**: `DT_FR12_TC14`.
- **Vị trí mã nguồn**: [frontend-web/src/App.jsx: dòng 24-36](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/frontend-web/src/App.jsx#L24-L36).
- **Mã nguồn lỗi**:
  ```jsx
  {user ? (
    <div className="flex gap-4 items-center">
      <Link to="/profile" className="hover:underline text-yellow-300">
        <span dangerouslySetInnerHTML={{ __html: `Chào, ${user.name}` }} />
      </Link>
      {/* LỖI: Thiếu điều kiện kiểm tra user.role === 'admin' để render Link to="/admin" */}
      <button onClick={logout} className="bg-red-500 px-3 py-1 rounded">Thoát</button>
    </div>
  ) : ( ... )}
  ```
- **Hệ quả thực tế**: Quản trị viên (`admin@eshop.com`) sau khi đăng nhập thành công không hề thấy bất kỳ menu hay liên kết nào để truy cập vào Phân hệ Web Admin (Dashboard, Quản lý sản phẩm, Quản lý đơn hàng).

---

#### BUG 6: Thiếu hoàn toàn cơ chế Route Guard (Protected Route) để bảo vệ các tuyến đường Admin
- **Mức độ nghiêm trọng**: **Cao (High / Client-Side Access Control Flaw)**
- **Ca kiểm thử phát hiện**: `DT_FR12_TC12`, `DT_FR12_TC13`.
- **Vị trí mã nguồn**: [frontend-web/src/App.jsx: dòng 50-60](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/frontend-web/src/App.jsx#L50-L60).
- **Mã nguồn lỗi**:
  ```jsx
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/login" element={<Login />} />
    ...
    {/* LỖI: Không có Route /admin và không có Component ProtectedRoute/RoleGuard để kiểm tra quyền admin */}
  </Routes>
  ```
- **Hệ quả thực tế**: Ứng dụng Frontend không có cơ chế chặn đường dẫn trực tiếp (URL Direct Access), không kiểm tra quyền `user.role === 'admin'` để bảo vệ các trang quản trị hoặc điều hướng người dùng trái phép về trang đăng nhập.
