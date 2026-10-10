# BÁO CÁO THIẾT KẾ & THỰC THI KIỂM THỬ: FR-02 ĐĂNG NHẬP & KHÓA TÀI KHOẢN

- **Mã chức năng**: **FR-02** (Thuộc Pool A — Authentication, Categories, and Products)
- **Hệ thống kiểm thử (SUT)**: EShop Platform (Backend Express + SQLite / Frontend React Vite)
- **Kỹ thuật áp dụng**:
  1. **Domain Testing (Phân hoạch tương đương — Equivalence Partitioning)** theo chuẩn 4 bước FIT - HCMUS (Slide 16, 17, 18).
  2. **Boundary Value Analysis (Phân tích giá trị biên)** theo mô hình chuẩn hóa duy nhất **Robustness Testing ($f = 6n + 1$)** (Slide 23, 26).
- **Tài khoản kiểm thử định danh**: `test@eshop.com` / Mật khẩu chuẩn: `Test1234!`

---

## 1. ĐẶC TẢ NGHIỆP VỤ (REQUIREMENT SPECIFICATION)

1. **Thông tin đầu vào**: Người dùng nhập `email` và `password`.
2. **Quy định trường nhập**:
   - Trường email phải dùng `type="email"` (có validate format HTML5).
   - Trường mật khẩu phải dùng `type="password"`.
3. **Cơ chế đếm lỗi**: Sau mỗi lần đăng nhập sai, hệ thống tăng bộ đếm số lần thất bại lên **đúng 1 đơn vị**.
4. **Cơ chế khóa tài khoản**: Nếu đăng nhập sai liên tiếp từ **3 lần trở lên** ($failed\_attempts \ge 3$), tài khoản bị tạm khóa trong vòng **30 giây** (trong môi trường demo).
5. **Thông báo lỗi**:
   - Khi sai email hoặc mật khẩu: Trả về thông báo lỗi chung phù hợp, **không để lộ chi tiết nguyên nhân** (ví dụ không được báo rõ là "sai mật khẩu" hay "không tồn tại email" để phòng chống User Enumeration).
   - Khi tài khoản đang bị khóa: Trả về thông báo "Tài khoản đã bị khóa. Vui lòng thử lại sau.", mã phản hồi HTTP 403.
6. **Đăng nhập thành công**: Cấp chuỗi JWT Token và thông tin `user`. Reset bộ đếm thất bại về 0 (`login_attempts = 0`, `locked_until = NULL`).

---

# PHẦN A: THIẾT KẾ KIỂM THỬ VỚI DOMAIN TESTING (EQUIVALENCE PARTITIONING)

---

### BƯỚC 1: XÁC ĐỊNH ĐẦU VÀO VÀ ĐẦU RA (INPUTS & OUTPUTS)

#### 1.1. Bảng Biến Đầu vào (Direct Inputs & Database State Fixture)
| Tên Biến / Thuộc tính | Phân loại | Kiểu Dữ liệu | Ràng buộc nghiệp vụ (SRS) | Giá trị Hợp lệ Mặc định ($Nom$) |
| :--- | :--- | :--- | :--- | :--- |
| `email` | Direct Input (Body/UI) | String | Định dạng email hợp lệ, tồn tại trong DB | `"test@eshop.com"` |
| `password` | Direct Input (Body/UI) | String | Khớp chính xác với mật khẩu trong DB | `"Test1234!"` |
| `user_exists` | State Input (DB: `users`) | Boolean | Tài khoản có tồn tại trong hệ thống | `true` (Tồn tại trong CSDL) |
| `consecutive_failed` | State Input (DB: `login_attempts`)| Integer | Số lần đăng nhập sai liên tiếp trước đó ($< 2$ để chưa kích hoạt khóa) | `0` lần |
| `locked_until_state` | State Input (DB: `locked_until`) | DateTime | Trạng thái thời gian khóa của tài khoản (`now >= locked_until` hoặc `NULL`) | `NULL` (Không bị khóa) |

#### 1.2. Bảng Biến Đầu ra (Outputs)
| Tên Đầu ra | Mã Trạng thái | Dữ liệu / Thông báo mong đợi |
| :--- | :---: | :--- |
| `OUT_SUCCESS` | HTTP 200 OK | Trả về chuỗi JWT `token`, object `user`, reset `login_attempts = 0`, `locked_until = NULL` |
| `OUT_ERR_CREDENTIAL` | HTTP 401 Unauthorized | Thông báo: "Invalid email or password" (hoặc "Đăng nhập thất bại..."), tăng `login_attempts` thêm 1 |
| `OUT_ERR_LOCKED` | HTTP 403 Forbidden | Thông báo: "Tài khoản đã bị khóa. Vui lòng thử lại sau.", đặt `locked_until = now + 30s` |
| `OUT_ERR_FORMAT` | Client Validation | Trình duyệt chặn submit hoặc báo lỗi email không hợp lệ / không được để trống |

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
| 12 | `Output` | **EC12** | Đăng nhập thành công, cấp JWT Token | **Valid** | HTTP 200, Token trả về |
| 13 | | **EC13** | Báo lỗi thông tin đăng nhập không hợp lệ (sai email hoặc sai mật khẩu) | **Invalid** | HTTP 401: "Invalid email or password" |
| 14 | | **EC14** | Báo lỗi tài khoản bị tạm khóa | **Invalid** | HTTP 403: "Tài khoản đã bị khóa..." |
| 15 | | **EC15** | Báo lỗi định dạng đầu vào hoặc trường bắt buộc để trống | **Invalid** | Validation message (HTML5 tooltip / HTTP 400) |

---

### BƯỚC 3: XÁC ĐỊNH CA KIỂM THỬ SƠ BỘ (DUYỆT TOÀN BỘ 15 ECs - SLIDE 17)

> [!IMPORTANT]
> **QUY TẮC DUYỆT BRUTE-FORCE TOÀN DIỆN (SLIDE 17 BÀI GIẢNG FIT - HCMUS):**
> 1. Duyệt tuần tự qua **100% tất cả 15 lớp tương đương** ($EC01 \rightarrow EC15$).
> 2. Điền **giá trị cụ thể** cho từng cột (Email, Password, Số lần sai trước đó, Trạng thái khóa).
> 3. **Cô lập lỗi (Fault Isolation)**: Khi dòng đó kiểm tra một Invalid EC, tất cả các biến còn lại **bắt buộc mang giá trị đại diện hợp lệ cụ thể** (`email="test@eshop.com"`, `password="Test1234!"`, `failed=0`, `locked=NULL`).

### Bảng Tổng hợp Ca Kiểm thử Sơ bộ (Full Preliminary Test Cases Table)
| STT | Lớp Tương Đương Được Test | `email` (Request) | `password` (Request) | Số lần sai trước (`login_attempts`) | Trạng thái khóa (`locked_until`) | Output mong đợi cụ thể (Expected Output) |
| :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **1** | **EC01** (`email` hợp lệ & tồn tại) | `"test@eshop.com"` | `"Test1234!"` | `0` | `NULL` | HTTP 200, JWT Token, `login_attempts = 0` |
| **2** | **EC02** (`email` không tồn tại) | `"nonexistent@eshop.com"` | `"Test1234!"` | `0` | `NULL` | HTTP 401: "Invalid email or password" |
| **3** | **EC03** (`email` sai định dạng) | `"invalid-email"` | `"Test1234!"` | `0` | `NULL` | Bị chặn bởi validation format email (HTML5 tooltip / HTTP 400) |
| **4** | **EC04** (`email` để trống) | `""` | `"Test1234!"` | `0` | `NULL` | Báo lỗi trường email không được để trống (HTML5 tooltip / HTTP 400) |
| **5** | **EC05** (`password` khớp) | `"test@eshop.com"` | `"Test1234!"` | `0` | `NULL` | HTTP 200, JWT Token, `login_attempts = 0` |
| **6** | **EC06** (`password` sai) | `"test@eshop.com"` | `"WrongPassword123!"` | `0` | `NULL` | HTTP 401: "Invalid email or password", `login_attempts` tăng lên `1` |
| **7** | **EC07** (`password` để trống) | `"test@eshop.com"` | `""` | `0` | `NULL` | Báo lỗi trường mật khẩu không được để trống (HTML5 tooltip / HTTP 400) |
| **8** | **EC08** (Sai pass lần 1: failed $< 2$) | `"test@eshop.com"` | `"WrongPassword123!"` | `0` | `NULL` | HTTP 401, `login_attempts` tăng từ `0` lên `1`, chưa khóa |
| **9** | **EC09** (Sai pass lần 3: failed $>= 2$) | `"test@eshop.com"` | `"WrongPassword123!"` | `2` | `NULL` | HTTP 401, `login_attempts` tăng từ `2` lên `3`, **khóa 30 giây** |
| **10** | **EC10** (Tài khoản không bị khóa) | `"test@eshop.com"` | `"Test1234!"` | `0` | `NULL` | HTTP 200, JWT Token thành công |
| **11** | **EC11** (Tài khoản đang bị khóa) | `"test@eshop.com"` | `"Test1234!"` | `3` | `now + 30s` | HTTP 403: "Tài khoản đã bị khóa. Vui lòng thử lại sau." |
| **12** | **EC12** (Output thành công) | `"test@eshop.com"` | `"Test1234!"` | `0` | `NULL` | HTTP 200, JWT Token thành công |
| **13** | **EC13** (Output lỗi sai thông tin) | `"nonexistent@eshop.com"` | `"Test1234!"` | `0` | `NULL` | HTTP 401: "Invalid email or password" |
| **14** | **EC14** (Output lỗi bị khóa) | `"test@eshop.com"` | `"Test1234!"` | `3` | `now + 30s` | HTTP 403: "Tài khoản đã bị khóa..." |
| **15** | **EC15** (Output lỗi format / rỗng)| `"invalid-email"` | `"Test1234!"` | `0` | `NULL` | Validation message chặn submit (HTML5 tooltip / HTTP 400) |

---

### BƯỚC 4: BẢNG RÚT GỌN CÁC CA KIỂM THỬ (SLIDE 18 FIT - HCMUS)

#### 4.1. Phân tích Rút gọn Trùng lặp
- **Gộp ca kiểm thử hợp lệ**:
  Nhận thấy **Dòng 1 ($EC01$)**, **Dòng 5 ($EC05$)**, **Dòng 10 ($EC10$)** và **Dòng 12 ($EC12$)** có cùng toàn bộ giá trị đầu vào (`email="test@eshop.com"`, `password="Test1234!"`, `failed=0`, `locked=NULL`) và cùng kết quả mong đợi (HTTP 200). Theo nguyên tắc tối ưu hóa của bài giảng, ta **gộp 4 dòng này thành 1 Ca kiểm thử hợp lệ duy nhất TC01**.
- **Gộp dòng sai mật khẩu lần 1**: Dòng 6 ($EC06$) và Dòng 8 ($EC08$) cùng kiểm tra tình huống sai mật khẩu lần đầu $\rightarrow$ Gộp thành **TC05**.
- **Gộp Output ngoại lệ**: 
  - Dòng 13 ($EC13$) kết hợp cùng Dòng 2 ($EC02$).
  - Dòng 14 ($EC14$) kết hợp cùng Dòng 11 ($EC11$).
  - Dòng 15 ($EC15$) kết hợp cùng Dòng 3 ($EC03$).
- Các dòng kiểm tra vi phạm độc lập còn lại được giữ nguyên để bảo đảm nguyên tắc cô lập lỗi.

#### 4.2. Bảng Rút gọn các Ca Kiểm thử Hoàn chỉnh (Optimized Test Suite)
| TC ID | Lớp Tương Đương Được Phủ (Covered ECs) | `email` | `password` | Số lần sai trước | Trạng thái khóa | Output mong đợi (Expected Output) |
| :---: | :--- | :---: | :---: | :---: | :---: | :--- |
| **DT_TC01** | **EC01, EC05, EC10, EC12** | `"test@eshop.com"` | `"Test1234!"` | `0` | `NULL` | **HTTP 200 OK**: Trả về Token JWT, thông tin user, `login_attempts = 0` |
| **DT_TC02** | **EC02, EC13** | `"nonexistent@eshop.com"` | `"Test1234!"` | `0` | `NULL` | **HTTP 401 Unauthorized**: "Invalid email or password", không lộ thông tin |
| **DT_TC03** | **EC03, EC15** | `"invalid-email"` | `"Test1234!"` | `0` | `NULL` | **Bị chặn**: Trình duyệt báo "Vui lòng nhập đúng định dạng email" (HTML5 tooltip / HTTP 400) |
| **DT_TC04** | **EC04** | `""` | `"Test1234!"` | `0` | `NULL` | **Bị chặn**: Báo lỗi trường email không được để trống (HTML5 tooltip / HTTP 400) |
| **DT_TC05** | **EC06, EC08** | `"test@eshop.com"` | `"WrongPassword123!"` | `0` | `NULL` | **HTTP 401**: "Invalid email or password", `login_attempts` tăng từ 0 lên 1 |
| **DT_TC06** | **EC07** | `"test@eshop.com"` | `""` | `0` | `NULL` | **Bị chặn**: Báo lỗi trường mật khẩu không được để trống (HTML5 tooltip / HTTP 400) |
| **DT_TC07** | **EC09** | `"test@eshop.com"` | `"WrongPassword123!"` | `2` | `NULL` | **HTTP 401**: Lần sai thứ 3 $\rightarrow$ kích hoạt khóa tài khoản 30 giây (`locked_until = now + 30s`) |
| **DT_TC08** | **EC11, EC14** | `"test@eshop.com"` | `"Test1234!"` | `3` | `now + 30s` | **HTTP 403 Forbidden**: "Tài khoản đã bị khóa. Vui lòng thử lại sau.", từ chối ngay cả khi pass đúng |

---

# PHẦN B: THIẾT KẾ KIỂM THỬ VỚI BOUNDARY VALUE ANALYSIS (ROBUSTNESS TESTING 6n + 1)

---

### BƯỚC 1: XÁC ĐỊNH CÁC BIẾN CÓ THỨ TỰ & GIÁ TRỊ DANH NGHĨA ($Nom$)

Chức năng FR-02 có **$n = 2$ biến có thứ tự (ordered variables)** liên quan đến cơ chế khóa tài khoản:
1. **Biến $x_1$**: `consecutive_failed_attempts` (Số lần đăng nhập sai liên tiếp)
   - Miền danh nghĩa: $[0 \dots 3]$ lần.
   - Ngưỡng biên dưới $LB_1 = 0$ (trạng thái sạch chưa sai lần nào).
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
| 1 | **$min_1^-$** | Dưới biên dưới | $LB_1 - \epsilon$ | **$-1$ lần** | **Invalid** | Dữ liệu không hợp lệ, hệ thống không chấp nhận số âm |
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
| 2 | **$min_2$** | Ngay khi vừa bị khóa | $LB_2$ | **$0$ giây** | **Valid** | Tài khoản đang bị khóa, HTTP 403 |
| 3 | **$min_2^+$** | Vừa khóa được 1 giây | $LB_2 + \epsilon$ | **$1$ giây** | **Valid** | Tài khoản đang trong thời gian khóa, HTTP 403 |
| 4 | **$max_2^-$** | Khóa được 29 giây | $UB_2 - \epsilon$ | **$29$ giây** | **Valid** | Còn 1 giây nữa mới hết khóa, vẫn trả về HTTP 403 |
| 5 | **$max_2$** | Đúng mốc 30 giây | $UB_2$ | **$30$ giây** | **Valid** | Vừa hết 30 giây khóa, **bắt đầu mở khóa lại bình thường** |
| 6 | **$max_2^+$** | Sau khi khóa 31 giây | $UB_2 + \epsilon$ | **$31$ giây** | **Valid** | Đã hết hạn khóa, cho phép đăng nhập thành công với HTTP 200 |
| - | **$Nom_2$** | Giá trị danh nghĩa | Baseline | **$45$ giây** | **Valid** | Đã hết hạn khóa từ lâu, đăng nhập bình thường |

---

### BƯỚC 3 & 4: BẢNG CA KIỂM THỬ ROBUSTNESS TOÀN DIỆN ($6n + 1 = 13$ DÒNG)

> [!IMPORTANT]
> **QUY TẮC CÔ LẬP LỖI**:
> - Khi kiểm tra $x_1$ (`consecutive_failed_attempts`): Biến $x_2$ nhận giá trị danh nghĩa $Nom_2 = 45$ giây (tài khoản không bị cản trở bởi thời gian khóa cũ).
> - Khi kiểm tra $x_2$ (`lockout_time_elapsed`): Biến $x_1$ nhận giá trị danh nghĩa $Nom_1 = 3$ lần (tài khoản đã bị kích hoạt khóa trước đó).
> - Tất cả các trường dữ liệu ghi số thực tế cụ thể.

### Bảng Ca Kiểm thử Robustness Testing ($f = 13$)
| STT (TC ID) | Biến Kiểm Tra | Điểm Biên | Input Email / Password | `failed_attempts` ($x_1$) | `time_elapsed` ($x_2$) | Output Mong Đợi Cụ Thể (Theo SRS) | Actual Output (Chạy trên SUT) | Kết luận |
| :---: | :---: | :---: | :---: | :---: | :---: | :--- | :--- | :---: |
| **BVA_TC01** | $x_1$ | $min_1$ ($0$) | `test@eshop.com` / `WrongPass` | **$0$** | $Nom_2$ ($45$s) | HTTP 401, `login_attempts` tăng từ 0 lên **1**, chưa khóa | `attempts` tăng thành **2** | **FAIL (BUG #1)** |
| **BVA_TC02** | $x_1$ | $min_1^+$ ($1$) | `test@eshop.com` / `WrongPass` | **$1$** | $Nom_2$ ($45$s) | HTTP 401, `login_attempts` tăng từ 1 lên **2**, chưa khóa | `attempts` tăng thành **3**, **bị khóa sớm** | **FAIL (BUG #1)** |
| **BVA_TC03** | $x_1$ | $max_1^-$ ($2$) | `test@eshop.com` / `WrongPass` | **$2$** | $Nom_2$ ($45$s) | HTTP 401, `login_attempts` tăng từ 2 lên **3**, **bắt đầu khóa 30s** | `attempts` tăng thành **4**, khóa 180s | **FAIL (BUG #1, #2)** |
| **BVA_TC04** | $x_1$ | $max_1$ ($3$) | `test@eshop.com` / `Test1234!` | **$3$** | $0$s | HTTP 403: "Tài khoản đã bị khóa. Vui lòng thử lại sau." | HTTP 403: "Tài khoản đã bị khóa..." | **PASS** |
| **BVA_TC05** | $x_1$ | $min_1^-$ ($-1$) | `test@eshop.com` / `Test1234!` | **$-1$** | $Nom_2$ ($45$s) | HTTP 400 hoặc CSDL chuẩn hóa về 0, không có số âm | CSDL lưu số âm trực tiếp | **FAIL (BUG #3)** |
| **BVA_TC06** | $x_1$ | $max_1^+$ ($4$) | `test@eshop.com` / `Test1234!` | **$4$** | $0$s | HTTP 403: "Tài khoản đã bị khóa. Vui lòng thử lại sau." | HTTP 403: "Tài khoản đã bị khóa..." | **PASS** |
| **BVA_TC07** | $x_2$ | $min_2$ ($0$s) | `test@eshop.com` / `Test1234!` | $Nom_1$ ($3$) | **$0$ giây** | HTTP 403: Tài khoản vừa khóa, từ chối đăng nhập | HTTP 403: Tài khoản đã bị khóa | **PASS** |
| **BVA_TC08** | $x_2$ | $min_2^+$ ($1$s) | `test@eshop.com` / `Test1234!` | $Nom_1$ ($3$) | **$1$ giây** | HTTP 403: Đang trong thời gian khóa, từ chối đăng nhập | HTTP 403: Tài khoản đã bị khóa | **PASS** |
| **BVA_TC09** | $x_2$ | $max_2^-$ ($29$s) | `test@eshop.com` / `Test1234!` | $Nom_1$ ($3$) | **$29$ giây** | HTTP 403: Vẫn còn trong 30 giây khóa, từ chối | HTTP 403: Tài khoản đã bị khóa | **PASS** |
| **BVA_TC10** | $x_2$ | $max_2$ ($30$s) | `test@eshop.com` / `Test1234!` | $Nom_1$ ($3$) | **$30$ giây** | **HTTP 200 OK**: Vừa hết 30 giây khóa, cho phép đăng nhập thành công | **HTTP 403: Vẫn bị khóa (do khóa tới 180s)** | **FAIL (BUG #2)** |
| **BVA_TC11** | $x_2$ | $min_2^-$ ($-1$s) | `test@eshop.com` / `Test1234!` | $Nom_1$ ($3$) | **$-1$ giây** | Invalid thời gian, không xảy ra trong dòng thời gian thực | Không áp dụng | **NOTE** |
| **BVA_TC12** | $x_2$ | $max_2^+$ ($31$s) | `test@eshop.com` / `Test1234!` | $Nom_1$ ($3$) | **$31$ giây** | **HTTP 200 OK**: Đã qua 31 giây, đăng nhập thành công | **HTTP 403: Vẫn bị khóa (do khóa tới 180s)** | **FAIL (BUG #2)** |
| **BVA_TC13** | Baseline | All Nominal | `test@eshop.com` / `Test1234!` | $Nom_1$ ($1$) | $Nom_2$ ($45$s) | **HTTP 200 OK**: Đăng nhập bình thường, reset counter về 0 | HTTP 200 OK: Đăng nhập thành công | **PASS** |

---

# PHẦN C: TỔNG HỢP BUG PHÁT HIỆN TRÊN FR-02 (DEFECT AUDIT & ROOT CAUSE)

Qua quá trình thực thi bộ ca kiểm thử thiết kế bởi Domain Testing và Robustness BVA, chúng ta phát hiện **4 lỗi sai nghiêm trọng** so với tài liệu đặc tả SRS:

### BUG 1: Bộ đếm đăng nhập sai tăng 2 đơn vị mỗi lần thay vì 1 đơn vị
- **Ca kiểm thử phát hiện**: `DT_TC05`, `BVA_TC01`, `BVA_TC02`.
- **Vị trí mã nguồn**: [backend/server.js: dòng 54](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/backend/server.js#L54).
- **Mã nguồn lỗi**:
  ```javascript
  const newAttempts = user.login_attempts + 2; // LỖI: Tăng 2 thay vì 1
  ```
- **Hệ quả thực tế**: Người dùng đăng nhập sai lần 1 $\rightarrow$ `login_attempts = 2`. Đăng nhập sai lần 2 $\rightarrow$ `login_attempts = 4 \ge 3` $\rightarrow$ **Bị khóa tài khoản ngay từ lần sai thứ 2**, vi phạm nghiêm trọng yêu cầu *"Chỉ khóa khi sai từ 3 lần trở lên liên tiếp"*.

---

### BUG 2: Thời gian khóa tài khoản kéo dài 180 giây (3 phút) thay vì 30 giây
- **Ca kiểm thử phát hiện**: `BVA_TC10`, `BVA_TC12`.
- **Vị trí mã nguồn**: [backend/server.js: dòng 57](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/backend/server.js#L57).
- **Mã nguồn lỗi**:
  ```javascript
  if (newAttempts >= 3) {
    lockedUntil = new Date(Date.now() + 180000).toISOString(); // LỖI: 180,000 ms = 180 giây (3 phút)
  }
  ```
- **Hệ quả thực tế**: Tại thời điểm $t = 30$ giây và $t = 31$ giây sau khi bị khóa, người dùng nhập đúng mật khẩu nhưng hệ thống vẫn từ chối với HTTP 403. Người dùng phải đợi gấp 6 lần thời gian quy định trong đặc tả mới được mở khóa.

---

### BUG 3: Giao diện Form Đăng nhập dùng sai thẻ HTML và sai tiêu đề (UI Defect)
- **Ca kiểm thử phát hiện**: `DT_TC03`, `DT_TC04`, `DT_TC06`.
- **Vị trí mã nguồn**: [frontend-web/src/pages/Login.jsx: dòng 24, 30, 40, 58, 66](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/frontend-web/src/pages/Login.jsx#L24-L66).
- **Các lỗi cụ thể**:
  1. Dòng 24: Tiêu đề trang hiển thị `<h2>Đăng Ký</h2>` thay vì `"Đăng nhập"`.
  2. Dòng 30: Trường email dùng `<input type="text" ... />` thay vì `type="email"`, dẫn đến không kích hoạt được cơ chế validate HTML5 format theo FR-02 và FR-22.
  3. Dòng 40: Trường mật khẩu dùng `<input type="text" ... />` thay vì `type="password"`, làm lộ rõ mật khẩu trên màn hình (vi phạm FR-22 & SEC-01).
  4. Dòng 58: Nút bấm ghi tiếng Anh `"Sign In"` thay vì `"Đăng nhập"` (vi phạm FR-21 chuẩn tiếng Việt).
  5. Dòng 66: Hộp thông báo lỗi render **phía dưới nút bấm** thay vì phía trên nút bấm (vi phạm FR-22).
