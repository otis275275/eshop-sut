# BÁO CÁO THIẾT KẾ & THỰC THI KIỂM THỬ: FR-02 ĐĂNG NHẬP & KHÓA TÀI KHOẢN TRÊN MOBILE APP

- **Mã chức năng**: **FR-02 (Mobile)** / **FR-20 (Mobile Authentication)** (Thuộc Pool D — Mobile Application)
- **Hệ thống kiểm thử (SUT)**: EShop Mobile Platform
  - **Tầng Frontend Mobile**: React Native + Expo (`frontend-mobile/App.js`)
  - **Tầng Backend**: Node.js + Express + SQLite API (`POST /api/login`)
- **Phạm vi kiểm thử Đa tầng (Full-Stack Scope)**:
  - **Tầng Mobile UI / Client State**: Kiểm thử tương tác form đăng nhập di động, bàn phím ảo (`keyboardType`), thông báo lỗi, vị trí render error box, nhãn ngôn ngữ tiếng Việt, quản lý State Token và điều hướng (Navigation) chuyển màn hình (`view = "home"`).
  - **Tầng Backend API / Cơ chế Khóa (BE)**: Kiểm thử logic xác thực `POST /api/login`, cơ chế đếm số lần thất bại, kích hoạt khóa tài khoản 30 giây khi sai $\ge 3$ lần, mã phản hồi HTTP (`200, 401, 403`), và tính toàn vẹn dữ liệu trong CSDL SQLite.
- **Kỹ thuật áp dụng**:
  1. **Domain Testing (Phân hoạch tương đương — Equivalence Partitioning)** theo chuẩn 4 bước FIT - HCMUS (Slide 16, 17, 18).
  2. **Boundary Value Analysis (Phân tích giá trị biên)** theo mô hình chuẩn hóa duy nhất **Robustness Testing ($f = 6n + 1$)** (Slide 23, 26).
- **Tài khoản kiểm thử định danh**: `test@eshop.com` / Mật khẩu chuẩn: `Test1234!`

---

## 1. ĐẶC TẢ NGHIỆP VỤ & PHÂN TÍCH KHÁC BIỆT WEB vs MOBILE

### 1.1. Yêu cầu Nghiệp vụ Chung (SRS FR-02 & FR-20)
1. **Thông tin đầu vào**: Người dùng nhập `email` và `password` vào form đăng nhập trên ứng dụng Mobile.
2. **Cơ chế đếm lỗi**: Sau mỗi lần đăng nhập sai, hệ thống tăng bộ đếm số lần thất bại lên **đúng 1 đơn vị**.
3. **Cơ chế khóa tài khoản**: Nếu đăng nhập sai liên tiếp từ **3 lần trở lên** ($failed\_attempts \ge 3$), tài khoản bị tạm khóa trong vòng **30 giây** (trong môi trường demo).
4. **Thông báo lỗi xác thực**:
   - Khi sai email hoặc mật khẩu: Trả về thông báo lỗi chung phù hợp ("Invalid email or password" / "Đăng nhập thất bại..."), **không để lộ chi tiết nguyên nhân** (phòng chống User Enumeration).
   - Khi tài khoản đang bị khóa: Trả về thông báo "Tài khoản đã bị khóa. Vui lòng thử lại sau.", mã phản hồi HTTP 403.
5. **Đăng nhập thành công**: Cấp chuỗi JWT Token và thông tin `user`. Reset bộ đếm thất bại về 0 (`login_attempts = 0`, `locked_until = NULL`). Ứng dụng Mobile lưu Token vào state, tự động tải danh sách đơn hàng (`fetchOrders`) và điều hướng về màn hình Trang chủ (`view = "home"`), thanh điều hướng Header cập nhật hiển thị "Chào, {user.name}".

### 1.2. Phân tích Điểm Khác Biệt & Đặc thù Nền tảng (Mobile vs Web)
| Tiêu chí | Phiên bản Web (React Vite) | Phiên bản Mobile (React Native + Expo) | Lưu ý Kiểm thử Mobile |
| :--- | :--- | :--- | :--- |
| **Thành phần nhập liệu (Input Component)** | Thẻ HTML `<input type="email">` và `<input type="password">` | `<TextInput>` của React Native với `secureTextEntry={true}` | Mobile không có cơ chế HTML5 validation popup tự động của trình duyệt; cần kiểm tra cấu hình bàn phím ảo `keyboardType="email-address"` |
| **Xử lý Bắt lỗi (Catch Error Handling)** | Hiển thị trực tiếp thông điệp lỗi từ Backend (`data.error`) | Hàm `handleLogin` có khối `catch (error)` xử lý lỗi từ chối HTTP | Kiểm tra xem Mobile có hiển thị đúng thông điệp khóa tài khoản (HTTP 403) hay ghi đè lỗi thành chuỗi tĩnh |
| **Tiêu chuẩn Giao diện (FR-21, FR-22)** | Nhãn tiếng Việt, dấu `*` cho trường bắt buộc, thông báo lỗi đặt TRÊN nút Submit | Tương tự Web: Nhãn "Email *", "Mật khẩu *", nút "Đăng nhập", Error message phía TRÊN nút bấm | Kiểm tra các vi phạm UI: nhãn tiếng Anh ("Username", "Sign In"), thiếu `*`, lỗi render bên dưới nút |
| **Quản lý Phiên làm việc (Session & Nav)** | React State / LocalStorage, điều hướng URL `/` | React State (`token`, `user`, `view = "home"`), cập nhật Header NavBar di động | Kiểm tra sự đồng bộ State và chuyển màn hình sau khi đăng nhập |

---

# PHẦN A: THIẾT KẾ KIỂM THỬ VỚI DOMAIN TESTING (EQUIVALENCE PARTITIONING)

---

### BƯỚC 1: XÁC ĐỊNH ĐẦU VÀO VÀ ĐẦU RA (INPUTS & OUTPUTS)

#### 1.1. Bảng Biến Đầu vào (Mobile Inputs & Database State Fixtures)
| Tên Biến / Thuộc tính | Phân loại | Kiểu Dữ liệu | Ràng buộc nghiệp vụ (SRS) | Giá trị Hợp lệ Mặc định ($Nom$) |
| :--- | :--- | :--- | :--- | :--- |
| `email` | Direct Input (Mobile UI) | String | Định dạng email hợp lệ, tồn tại trong CSDL | `"test@eshop.com"` |
| `password` | Direct Input (Mobile UI) | String | Khớp chính xác với mật khẩu trong CSDL | `"Test1234!"` |
| `user_exists` | State Input (DB: `users`) | Boolean | Tài khoản có tồn tại trong hệ thống | `true` (Tồn tại trong CSDL) |
| `consecutive_failed` | State Input (DB: `login_attempts`)| Integer | Số lần đăng nhập sai liên tiếp trước đó ($< 2$ để chưa kích hoạt khóa) | `0` lần |
| `locked_until_state` | State Input (DB: `locked_until`) | DateTime | Trạng thái thời gian khóa của tài khoản (`now >= locked_until` hoặc `NULL`) | `NULL` (Không bị khóa) |

#### 1.2. Bảng Biến Đầu ra (Outputs)
| Tên Đầu ra | Mã Trạng thái / Hành vi | Dữ liệu / Thông báo mong đợi |
| :--- | :---: | :--- |
| `OUT_SUCCESS` | HTTP 200 OK / Client State | Cấp chuỗi JWT `token`, lưu `user`, reset `login_attempts = 0`, điều hướng về trang chủ (`view = "home"`), Header hiển thị "Chào, test" |
| `OUT_ERR_CREDENTIAL` | HTTP 401 Unauthorized | Thông báo lỗi: "Invalid email or password" (hoặc "Đăng nhập thất bại..."), tăng `login_attempts` thêm 1, giữ nguyên màn hình Login |
| `OUT_ERR_LOCKED` | HTTP 403 Forbidden | Thông báo lỗi: "Tài khoản đã bị khóa. Vui lòng thử lại sau.", cập nhật `locked_until = now + 30s` |
| `OUT_ERR_FORMAT` | Client Validation / HTTP 401 | Cảnh báo lỗi định dạng đầu vào không hợp lệ hoặc trường bắt buộc để trống (email/mật khẩu) |

---

### BƯỚC 2: XÁC ĐỊNH LỚP TƯƠNG ĐƯƠNG VÀ GIÁ TRỊ ĐẠI DIỆN

> **Quy định**: Xác định toàn bộ các lớp tương đương Valid và Invalid, gán sẵn **Giá trị đại diện cụ thể ($Val_{rep}$)** cho từng lớp tương đương (theo Slide 16 FIT - HCMUS).

### Bảng Tổng hợp Lớp Tương đương (Equivalence Partitioning Table)
| STT | Biến / Điều kiện liên quan | Mã Lớp (EC ID) | Mô tả Lớp tương đương | Loại | Giá trị Đại diện Cụ thể ($Val_{rep}$) |
| :---: | :--- | :---: | :--- | :---: | :--- |
| 1 | `email` | **EC01** | Email đúng định dạng và có tồn tại trong CSDL | **Valid** | `"test@eshop.com"` |
| 2 | | **EC02** | Email đúng định dạng nhưng KHÔNG tồn tại trong CSDL | **Invalid** | `"nonexistent@eshop.com"` |
| 3 | | **EC03** | Email sai định dạng (thiếu `@`, thiếu domain) | **Invalid** | `"invalid-email"` |
| 4 | | **EC04** | Email để trống (chuỗi rỗng) | **Invalid** | `""` |
| 5 | `password` | **EC05** | Mật khẩu khớp chính xác với CSDL | **Valid** | `"Test1234!"` |
| 6 | | **EC06** | Mật khẩu không khớp với CSDL (sai mật khẩu) | **Invalid** | `"WrongPassword123!"` |
| 7 | | **EC07** | Mật khẩu để trống (chuỗi rỗng) | **Invalid** | `""` |
| 8 | `consecutive_failed` | **EC08** | Số lần sai trước đó $< 2$ (lần sai này là lần 1 hoặc 2, chưa khóa) | **Valid** | `0` lần sai trước đó |
| 9 | (Khi sai pass) | **EC09** | Số lần sai trước đó $>= 2$ (lần sai này là lần thứ 3 $\rightarrow$ kích hoạt khóa) | **Invalid** | `2` lần sai trước đó |
| 10 | `locked_until_state` | **EC10** | Tài khoản không bị khóa (`locked_until = NULL` hoặc đã hết hạn) | **Valid** | `locked_until = NULL` |
| 11 | | **EC11** | Tài khoản đang trong thời gian bị khóa (`now < locked_until`) | **Invalid** | `locked_until = now + 30s` |
| 12 | `Output` | **EC12** | Đăng nhập thành công, cấp JWT Token, chuyển về Trang chủ | **Valid** | HTTP 200, Token trả về, Header hiển thị "Chào, test" |
| 13 | | **EC13** | Báo lỗi thông tin đăng nhập không hợp lệ (sai email hoặc sai mật khẩu) | **Invalid** | HTTP 401: "Invalid email or password" |
| 14 | | **EC14** | Báo lỗi tài khoản bị tạm khóa trên Mobile | **Invalid** | HTTP 403: "Tài khoản đã bị khóa. Vui lòng thử lại sau." |
| 15 | | **EC15** | Báo lỗi định dạng đầu vào hoặc trường bắt buộc để trống | **Invalid** | Validation message cảnh báo trường rỗng / sai định dạng |

---

### BƯỚC 3: XÁC ĐỊNH CA KIỂM THỬ SƠ BỘ (DUYỆT TOÀN BỘ 15 ECs - SLIDE 17)

> [!IMPORTANT]
> **QUY TẮC DUYỆT BRUTE-FORCE TOÀN DIỆN (SLIDE 17 BÀI GIẢNG FIT - HCMUS):**
> 1. Duyệt tuần tự qua **100% tất cả 15 lớp tương đương** ($EC01 \rightarrow EC15$).
> 2. Điền **giá trị cụ thể** cho từng cột (Email, Password, Số lần sai trước đó, Trạng thái khóa).
> 3. **Cô lập lỗi (Fault Isolation)**: Khi dòng đó kiểm tra một Invalid EC, tất cả các biến còn lại **bắt buộc mang giá trị đại diện hợp lệ cụ thể** (`email="test@eshop.com"`, `password="Test1234!"`, `failed=0`, `locked=NULL`).

### Bảng Tổng hợp Ca Kiểm thử Sơ bộ (Full Preliminary Test Cases Table)
| STT | Lớp Tương Đương Được Test | `email` (Mobile UI) | `password` (Mobile UI) | Số lần sai trước (`login_attempts`) | Trạng thái khóa (`locked_until`) | Output mong đợi cụ thể (Expected Output) |
| :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **1** | **EC01** (`email` hợp lệ & tồn tại) | `"test@eshop.com"` | `"Test1234!"` | `0` | `NULL` | HTTP 200, cấp Token JWT, `view = "home"`, Header hiển thị "Chào, test" |
| **2** | **EC02** (`email` không tồn tại) | `"nonexistent@eshop.com"` | `"Test1234!"` | `0` | `NULL` | HTTP 401: Báo lỗi "Invalid email or password", không lộ thông tin user |
| **3** | **EC03** (`email` sai định dạng) | `"invalid-email"` | `"Test1234!"` | `0` | `NULL` | Báo lỗi định dạng email không hợp lệ / HTTP 401 từ chối |
| **4** | **EC04** (`email` để trống) | `""` | `"Test1234!"` | `0` | `NULL` | Báo lỗi trường email không được để trống / không gửi request rỗng |
| **5** | **EC05** (`password` khớp) | `"test@eshop.com"` | `"Test1234!"` | `0` | `NULL` | HTTP 200, cấp Token JWT, đăng nhập thành công |
| **6** | **EC06** (`password` sai) | `"test@eshop.com"` | `"WrongPassword123!"` | `0` | `NULL` | HTTP 401: Báo lỗi "Invalid email or password", `login_attempts` tăng lên `1` |
| **7** | **EC07** (`password` để trống) | `"test@eshop.com"` | `""` | `0` | `NULL` | Báo lỗi trường mật khẩu không được để trống / không gửi request rỗng |
| **8** | **EC08** (Sai pass lần 1: failed $< 2$) | `"test@eshop.com"` | `"WrongPassword123!"` | `0` | `NULL` | HTTP 401, `login_attempts` tăng từ `0` lên `1`, tài khoản chưa bị khóa |
| **9** | **EC09** (Sai pass lần 3: failed $>= 2$) | `"test@eshop.com"` | `"WrongPassword123!"` | `2` | `NULL` | HTTP 401, `login_attempts` tăng từ `2` lên `3`, **khóa tài khoản 30 giây** |
| **10** | **EC10** (Tài khoản không bị khóa) | `"test@eshop.com"` | `"Test1234!"` | `0` | `NULL` | HTTP 200, cấp Token JWT thành công |
| **11** | **EC11** (Tài khoản đang bị khóa) | `"test@eshop.com"` | `"Test1234!"` | `3` | `now + 30s` | HTTP 403: "Tài khoản đã bị khóa. Vui lòng thử lại sau." |
| **12** | **EC12** (Output thành công) | `"test@eshop.com"` | `"Test1234!"` | `0` | `NULL` | HTTP 200, lưu token, cập nhật navbar |
| **13** | **EC13** (Output lỗi sai thông tin) | `"nonexistent@eshop.com"` | `"Test1234!"` | `0` | `NULL` | HTTP 401: "Invalid email or password" |
| **14** | **EC14** (Output lỗi bị khóa) | `"test@eshop.com"` | `"Test1234!"` | `3` | `now + 30s` | HTTP 403: "Tài khoản đã bị khóa..." hiển thị rõ trên Mobile UI |
| **15** | **EC15** (Output lỗi format / rỗng)| `"invalid-email"` | `"Test1234!"` | `0` | `NULL` | Cảnh báo lỗi trên màn hình đăng nhập |

---

### BƯỚC 4: BẢNG RÚT GỌN CÁC CA KIỂM THỬ (SLIDE 18 FIT - HCMUS)

#### 4.1. Phân tích Rút gọn Trùng lặp
- **Gộp ca kiểm thử hợp lệ**:
  Nhận thấy **Dòng 1 ($EC01$)**, **Dòng 5 ($EC05$)**, **Dòng 10 ($EC10$)** và **Dòng 12 ($EC12$)** có cùng toàn bộ giá trị đầu vào (`email="test@eshop.com"`, `password="Test1234!"`, `failed=0`, `locked=NULL`) và cùng kết quả mong đợi (HTTP 200, chuyển màn hình Trang chủ). Ta **gộp 4 dòng này thành 1 Ca kiểm thử hợp lệ duy nhất DT_MOB_TC01**.
- **Gộp dòng sai mật khẩu lần 1**: Dòng 6 ($EC06$) và Dòng 8 ($EC08$) cùng kiểm tra tình huống sai mật khẩu lần đầu $\rightarrow$ Gộp thành **DT_MOB_TC05**.
- **Gộp Output ngoại lệ**:
  - Dòng 13 ($EC13$) kết hợp cùng Dòng 2 ($EC02$) $\rightarrow$ **DT_MOB_TC02**.
  - Dòng 14 ($EC14$) kết hợp cùng Dòng 11 ($EC11$) $\rightarrow$ **DT_MOB_TC08**.
  - Dòng 15 ($EC15$) kết hợp cùng Dòng 3 ($EC03$) $\rightarrow$ **DT_MOB_TC03**.
- Các dòng kiểm tra vi phạm độc lập còn lại được giữ nguyên để bảo đảm nguyên tắc cô lập lỗi.

#### 4.2. Bảng Rút gọn các Ca Kiểm thử Hoàn chỉnh (Optimized Test Suite)
| TC ID | Lớp Tương Đương Được Phủ (Covered ECs) | `email` | `password` | Số lần sai trước | Trạng thái khóa | Output mong đợi (Expected Output) |
| :---: | :--- | :---: | :---: | :---: | :---: | :--- |
| **DT_MOB_TC01** | **EC01, EC05, EC10, EC12** | `"test@eshop.com"` | `"Test1234!"` | `0` | `NULL` | **HTTP 200 OK**: Cấp JWT Token, lưu `user`, chuyển về Trang chủ (`view = "home"`), Header hiển thị "Chào, test" |
| **DT_MOB_TC02** | **EC02, EC13** | `"nonexistent@eshop.com"` | `"Test1234!"` | `0` | `NULL` | **HTTP 401 Unauthorized**: Thông báo lỗi "Invalid email or password", không tiết lộ sự tồn tại của email |
| **DT_MOB_TC03** | **EC03, EC15** | `"invalid-email"` | `"Test1234!"` | `0` | `NULL` | **Cảnh báo lỗi**: Báo lỗi định dạng email không hợp lệ (hoặc HTTP 401 từ chối) |
| **DT_MOB_TC04** | **EC04** | `""` | `"Test1234!"` | `0` | `NULL` | **Cảnh báo lỗi**: Báo lỗi trường email không được để trống, không gửi payload rỗng |
| **DT_MOB_TC05** | **EC06, EC08** | `"test@eshop.com"` | `"WrongPassword123!"` | `0` | `NULL` | **HTTP 401**: "Invalid email or password", `login_attempts` tăng từ 0 lên 1, tài khoản CHƯA bị khóa |
| **DT_MOB_TC06** | **EC07** | `"test@eshop.com"` | `""` | `0` | `NULL` | **Cảnh báo lỗi**: Báo lỗi trường mật khẩu không được để trống |
| **DT_MOB_TC07** | **EC09** | `"test@eshop.com"` | `"WrongPassword123!"` | `2` | `NULL` | **HTTP 401**: Lần sai thứ 3 $\rightarrow$ kích hoạt khóa tài khoản 30 giây (`locked_until = now + 30s`) |
| **DT_MOB_TC08** | **EC11, EC14** | `"test@eshop.com"` | `"Test1234!"` | `3` | `now + 30s` | **HTTP 403 Forbidden**: "Tài khoản đã bị khóa. Vui lòng thử lại sau.", từ chối đăng nhập ngay cả khi đúng mật khẩu |

---

# PHẦN B: THIẾT KẾ KIỂM THỬ VỚI BOUNDARY VALUE ANALYSIS (ROBUSTNESS TESTING 6n + 1)

---

### BƯỚC 1: XÁC ĐỊNH CÁC BIẾN CÓ THỨ TỰ & GIÁ TRỊ DANH NGHĨA ($Nom$)

Chức năng FR-02 trên Mobile sử dụng chung cơ chế khóa tài khoản của hệ thống với **$n = 2$ biến có thứ tự (ordered variables)**:
1. **Biến $x_1$**: `consecutive_failed_attempts` (Số lần đăng nhập sai liên tiếp)
   - Miền danh nghĩa: $[0 \dots 3]$ lần.
   - Ngưỡng biên dưới $LB_1 = 0$ (trạng thái sạch, chưa sai lần nào).
   - Ngưỡng biên trên $UB_1 = 3$ (ngưỡng bắt đầu khóa tài khoản).
   - Bước nhảy: $\epsilon_1 = 1$ lần.
   - Giá trị danh nghĩa ($Nom_1$): **$1$ lần** (đang ở trạng thái sai 1 lần, an toàn, chưa bị khóa).
2. **Biến $x_2$**: `lockout_time_elapsed` (Thời gian đã trôi qua sau khi tài khoản bị khóa, tính bằng giây)
   - Đặc tả quy định thời gian khóa: **30 giây** ($[0 \dots 30]$ giây là thời gian khóa, sau 30 giây là mở khóa).
   - Ngưỡng biên dưới $LB_2 = 0$ giây (ngay thời điểm vừa bị khóa).
   - Ngưỡng biên trên $UB_2 = 30$ giây (thời điểm chạm mốc kết thúc thời gian khóa).
   - Bước nhảy: $\epsilon_2 = 1$ giây.
   - Giá trị danh nghĩa ($Nom_2$): **$45$ giây** (thời điểm đã hết hạn khóa hoàn toàn, tài khoản mở lại bình thường).

- **Công thức tính số ca kiểm thử Robustness Testing**:
  $$\mathbf{f = 6n + 1 = 6 \times 2 + 1 = 13 \text{ ca kiểm thử}}$$

---

### BƯỚC 2: BẢNG 6 ĐIỂM BIÊN CHI TIẾT CHO TỪNG BIẾN (ROBUSTNESS POINTS)

#### Bảng Điểm Biên Biến 1: `consecutive_failed_attempts` ($x_1$)
| STT | Ký hiệu Điểm | Vị trí Ranh giới | Công thức | Giá trị Số Cụ Thể | Tính Hợp Lệ | Hành vi Kỳ vọng (SRS) |
| :---: | :---: | :--- | :---: | :---: | :---: | :--- |
| 1 | **$min_1^-$** | Dưới biên dưới | $LB_1 - \epsilon$ | **$-1$ lần** | **Invalid** | Dữ liệu không hợp lệ, hệ thống không chấp nhận số âm trong CSDL |
| 2 | **$min_1$** | Ngay biên dưới | $LB_1$ | **$0$ lần** | **Valid** | Trạng thái ban đầu, tài khoản hoàn toàn bình thường |
| 3 | **$min_1^+$** | Ngay trên biên dưới | $LB_1 + \epsilon$ | **$1$ lần** | **Valid** | Đăng nhập sai lần 1, `attempts = 1`, tài khoản CHƯA bị khóa |
| 4 | **$max_1^-$** | Ngay dưới biên trên | $UB_1 - \epsilon$ | **$2$ lần** | **Valid** | Đăng nhập sai lần 2, `attempts = 2`, tài khoản CHƯA bị khóa |
| 5 | **$max_1$** | Ngay tại biên trên | $UB_1$ | **$3$ lần** | **Valid** | Đăng nhập sai lần 3, `attempts = 3`, **bắt đầu bị khóa 30 giây** |
| 6 | **$max_1^+$** | Vượt trên biên trên | $UB_1 + \epsilon$ | **$4$ lần** | **Invalid** | Đã vượt ngưỡng, tài khoản đang bị khóa, từ chối với HTTP 403 |
| - | **$Nom_1$** | Giá trị danh nghĩa | Baseline | **$1$ lần** | **Valid** | Trạng thái danh nghĩa an toàn (chưa khóa) |

#### Bảng Điểm Biên Biến 2: `lockout_time_elapsed` ($x_2$, tính bằng giây sau khi khóa)
| STT | Ký hiệu Điểm | Vị trí Ranh giới | Công thức | Giá trị Số Cụ Thể | Tính Hợp Lệ | Hành vi Kỳ vọng (SRS) |
| :---: | :---: | :--- | :---: | :---: | :---: | :--- |
| 1 | **$min_2^-$** | Trước thời điểm khóa | $LB_2 - \epsilon$ | **$-1$ giây** | **Invalid** | Mốc thời gian trước khi khóa |
| 2 | **$min_2$** | Ngay khi vừa bị khóa | $LB_2$ | **$0$ giây** | **Valid** | Tài khoản đang bị khóa, HTTP 403, báo khóa trên Mobile |
| 3 | **$min_2^+$** | Vừa khóa được 1 giây | $LB_2 + \epsilon$ | **$1$ giây** | **Valid** | Tài khoản đang trong thời gian khóa, HTTP 403 |
| 4 | **$max_2^-$** | Khóa được 29 giây | $UB_2 - \epsilon$ | **$29$ giây** | **Valid** | Còn 1 giây nữa mới hết khóa, vẫn trả về HTTP 403 |
| 5 | **$max_2$** | Đúng mốc 30 giây | $UB_2$ | **$30$ giây** | **Valid** | Vừa hết 30 giây khóa, **bắt đầu mở khóa lại bình thường** |
| 6 | **$max_2^+$** | Sau khi khóa 31 giây | $UB_2 + \epsilon$ | **$31$ giây** | **Valid** | Đã hết hạn khóa, cho phép đăng nhập thành công với HTTP 200 |
| - | **$Nom_2$** | Giá trị danh nghĩa | Baseline | **$45$ giây** | **Valid** | Đã hết hạn khóa từ lâu, đăng nhập bình thường |

---

### BƯỚC 3 & 4: BẢNG CA KIỂM THỬ ROBUSTNESS TOÀN DIỆN ($6n + 1 = 13$ DÒNG)

> [!IMPORTANT]
> **QUY TẮC CÔ LẬP LỖI (SINGLE FAULT ASSUMPTION)**:
> - Khi kiểm tra $x_1$ (`consecutive_failed_attempts`): Biến $x_2$ nhận giá trị danh nghĩa $Nom_2 = 45$ giây (tài khoản không bị cản trở bởi thời gian khóa cũ).
> - Khi kiểm tra $x_2$ (`lockout_time_elapsed`): Biến $x_1$ nhận giá trị danh nghĩa $Nom_1 = 3$ lần (tài khoản đã bị kích hoạt khóa trước đó).
> - Tất cả các trường dữ liệu ghi số thực tế cụ thể.

### Bảng Ca Kiểm thử Robustness Testing ($f = 13$)
| STT (TC ID) | Biến Kiểm Tra | Điểm Biên | Input Email / Password | `failed_attempts` ($x_1$) | `time_elapsed` ($x_2$) | Output Mong Đợi Cụ Thể (Theo SRS) | Actual Output (Chạy trên Mobile SUT) | Kết luận |
| :---: | :---: | :---: | :---: | :---: | :---: | :--- | :--- | :---: |
| **BVA_MOB_TC01** | $x_1$ | $min_1$ ($0$) | `test@eshop.com` / `WrongPass` | **$0$** | $Nom_2$ ($45$s) | HTTP 401, `login_attempts` tăng từ 0 lên **1**, chưa khóa | `attempts` tăng thành **2** | **FAIL (BUG #1)** |
| **BVA_MOB_TC02** | $x_1$ | $min_1^+$ ($1$) | `test@eshop.com` / `WrongPass` | **$1$** | $Nom_2$ ($45$s) | HTTP 401, `login_attempts` tăng từ 1 lên **2**, chưa khóa | `attempts` tăng thành **3**, **bị khóa sớm** | **FAIL (BUG #1)** |
| **BVA_MOB_TC03** | $x_1$ | $max_1^-$ ($2$) | `test@eshop.com` / `WrongPass` | **$2$** | $Nom_2$ ($45$s) | HTTP 401, `login_attempts` tăng từ 2 lên **3**, **bắt đầu khóa 30s** | `attempts` tăng thành **4**, khóa 180s | **FAIL (BUG #1, #2)** |
| **BVA_MOB_TC04** | $x_1$ | $max_1$ ($3$) | `test@eshop.com` / `Test1234!` | **$3$** | $0$s | HTTP 403: "Tài khoản đã bị khóa. Vui lòng thử lại sau." | HTTP 403 từ BE, nhưng Mobile hiển thị "Đăng nhập thất bại..." (nuốt thông báo khóa) | **FAIL (BUG #3)** |
| **BVA_MOB_TC05** | $x_1$ | $min_1^-$ ($-1$) | `test@eshop.com` / `Test1234!` | **$-1$** | $Nom_2$ ($45$s) | HTTP 400 hoặc CSDL chuẩn hóa về 0, không có số âm | CSDL lưu số âm trực tiếp | **FAIL (Backend Bug)** |
| **BVA_MOB_TC06** | $x_1$ | $max_1^+$ ($4$) | `test@eshop.com` / `Test1234!` | **$4$** | $0$s | HTTP 403: "Tài khoản đã bị khóa. Vui lòng thử lại sau." | HTTP 403 từ BE, Mobile hiển thị "Đăng nhập thất bại..." | **FAIL (BUG #3)** |
| **BVA_MOB_TC07** | $x_2$ | $min_2$ ($0$s) | `test@eshop.com` / `Test1234!` | $Nom_1$ ($3$) | **$0$ giây** | HTTP 403: Tài khoản vừa khóa, từ chối đăng nhập và báo khóa | BE trả về 403, Mobile nuốt thông báo | **FAIL (BUG #3)** |
| **BVA_MOB_TC08** | $x_2$ | $min_2^+$ ($1$s) | `test@eshop.com` / `Test1234!` | $Nom_1$ ($3$) | **$1$ giây** | HTTP 403: Đang trong thời gian khóa, từ chối đăng nhập và báo khóa | BE trả về 403, Mobile nuốt thông báo | **FAIL (BUG #3)** |
| **BVA_MOB_TC09** | $x_2$ | $max_2^-$ ($29$s) | `test@eshop.com` / `Test1234!` | $Nom_1$ ($3$) | **$29$ giây** | HTTP 403: Vẫn còn trong 30 giây khóa, từ chối và báo khóa | BE trả về 403, Mobile nuốt thông báo | **FAIL (BUG #3)** |
| **BVA_MOB_TC10** | $x_2$ | $max_2$ ($30$s) | `test@eshop.com` / `Test1234!` | $Nom_1$ ($3$) | **$30$ giây** | **HTTP 200 OK**: Vừa hết 30 giây khóa, cho phép đăng nhập thành công | **HTTP 403: Vẫn bị khóa (do backend khóa tới 180s)** | **FAIL (BUG #2)** |
| **BVA_MOB_TC11** | $x_2$ | $min_2^-$ ($-1$s) | `test@eshop.com` / `Test1234!` | $Nom_1$ ($3$) | **$-1$ giây** | Invalid thời gian, không xảy ra trong dòng thời gian thực | Không áp dụng | **NOTE** |
| **BVA_MOB_TC12** | $x_2$ | $max_2^+$ ($31$s) | `test@eshop.com` / `Test1234!` | $Nom_1$ ($3$) | **$31$ giây** | **HTTP 200 OK**: Đã qua 31 giây, đăng nhập thành công | **HTTP 403: Vẫn bị khóa (do backend khóa tới 180s)** | **FAIL (BUG #2)** |
| **BVA_MOB_TC13** | Baseline | All Nominal | `test@eshop.com` / `Test1234!` | $Nom_1$ ($1$) | $Nom_2$ ($45$s) | **HTTP 200 OK**: Đăng nhập bình thường, reset counter về 0, chuyển home | `attempts` tăng thành **3**, **bị khóa sớm** | **FAIL** |

---

# PHẦN C: TỔNG HỢP BUG PHÁT HIỆN TRÊN FR-02 MOBILE (DEFECT AUDIT & ROOT CAUSE)

Qua quá trình thực thi bộ ca kiểm thử thiết kế bởi Domain Testing và Robustness BVA trên phân hệ Mobile, chúng ta phát hiện **3 lỗi sai cốt lõi** vi phạm trực tiếp đặc tả nghiệp vụ **FR-02 (Đăng nhập & Khóa tài khoản)**:

---

### BUG 1 (Backend Logic): Bộ đếm đăng nhập sai tăng 2 đơn vị mỗi lần thay vì 1 đơn vị
- **Ca kiểm thử phát hiện**: `DT_MOB_TC05`, `BVA_MOB_TC01`, `BVA_MOB_TC02`.
- **Vị trí mã nguồn**: [backend/server.js: dòng 54](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/backend/server.js#L54).
- **Mã nguồn lỗi**:
  ```javascript
  const newAttempts = user.login_attempts + 2; // LỖI: Tăng 2 thay vì 1
  ```
- **Hệ quả thực tế**: Người dùng đăng nhập sai lần 1 $\rightarrow$ `login_attempts = 2`. Đăng nhập sai lần 2 $\rightarrow$ `login_attempts = 4 \ge 3` $\rightarrow$ **Bị khóa tài khoản ngay từ lần sai thứ 2**, vi phạm nghiêm trọng yêu cầu FR-02: *"Sau mỗi lần đăng nhập sai, hệ thống tăng bộ đếm lên đúng 1 đơn vị"* và *"Chỉ khóa khi sai từ 3 lần trở lên liên tiếp"*.

---

### BUG 2 (Backend Logic): Thời gian khóa tài khoản kéo dài 180 giây (3 phút) thay vì 30 giây
- **Ca kiểm thử phát hiện**: `BVA_MOB_TC10`, `BVA_MOB_TC12`, `BVA_MOB_TC13`.
- **Vị trí mã nguồn**: [backend/server.js: dòng 57](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/backend/server.js#L57).
- **Mã nguồn lỗi**:
  ```javascript
  if (newAttempts >= 3) {
    lockedUntil = new Date(Date.now() + 180000).toISOString(); // LỖI: 180,000 ms = 180 giây (3 phút)
  }
  ```
- **Hệ quả thực tế**: Vi phạm đặc tả FR-02: *"Nếu đăng nhập sai từ 3 lần trở lên liên tiếp, tài khoản bị tạm khóa 30 giây (môi trường demo)"*. Tại thời điểm $t = 30$ giây, $t = 31$ giây và $t = 45$ giây sau khi bị khóa, người dùng nhập đúng mật khẩu nhưng hệ thống vẫn từ chối với HTTP 403. Người dùng phải đợi gấp 6 lần thời gian quy định mới được mở khóa.

---

### BUG 3 (Mobile Client Logic & Error Handling): Ứng dụng Mobile nuốt thông báo khóa tài khoản từ Server trong khối `catch` (Error Swallowing)
- **Ca kiểm thử phát hiện**: `DT_MOB_TC08`, `BVA_MOB_TC04`, `BVA_MOB_TC06`, `BVA_MOB_TC07`, `BVA_MOB_TC08`, `BVA_MOB_TC09`.
- **Vị trí mã nguồn**: [frontend-mobile/App.js: dòng 194-206](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/frontend-mobile/App.js#L194-L206).
- **Mã nguồn lỗi**:
  ```javascript
  const handleLogin = async () => {
    setLoginError("");
    try {
      const response = await fetch(`${API_URL}/login`, { ... });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Đăng nhập thất bại.");
      ...
    } catch (error) {
      // LỖI: Luôn gán chuỗi tĩnh, bỏ qua error.message (như "Tài khoản đã bị khóa. Vui lòng thử lại sau.")
      setLoginError("Đăng nhập thất bại. Vui lòng kiểm tra lại.");
    }
  };
  ```
- **Hệ quả thực tế**: Vi phạm trực tiếp yêu cầu xử lý lỗi của FR-02 trên nền tảng Mobile: *"Khi tài khoản đang bị khóa: Trả về thông báo 'Tài khoản đã bị khóa. Vui lòng thử lại sau.'"*. Khi Backend trả về HTTP 403 kèm thông điệp khóa tài khoản chính xác, ứng dụng Mobile lại ghi đè thành `"Đăng nhập thất bại. Vui lòng kiểm tra lại."`. Người dùng hoàn toàn không biết tài khoản của mình đang bị tạm khóa và tiếp tục thử lại nhiều lần, gây ức chế trải nghiệm người dùng trên thiết bị di động.

