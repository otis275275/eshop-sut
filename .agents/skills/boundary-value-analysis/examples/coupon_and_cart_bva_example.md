# Ví dụ Mẫu Thực tế: Boundary Value Analysis trên EShop (FR-09, FR-02, FR-06)

Tài liệu này minh họa chi tiết từng bước áp dụng kỹ năng **Boundary Value Analysis (BVA)** trên các chức năng của hệ thống EShop SUT, tuân thủ chuẩn mực Slide 21 đến Slide 26 của FIT - HCMUS. Tất cả các ca kiểm thử đều được **liệt kê đầy đủ (brute-force) với 100% giá trị số thực tế**, không dùng placeholder chung chung.

---

# PHẦN 1: BVA TRÊN CHỨC NĂNG MÃ GIẢM GIÁ (FR-09)

## Bước 1: Xác định các Biến có Thứ tự & Giá trị Danh nghĩa (Nominal)
Xét nghiệp vụ áp dụng mã giảm giá `SAVE10` (`type='percent'`, giảm 10%, `min_order_amount = 300,000` ₫, `max_uses_per_user = 1`):
1. **Biến `total_amount`** ($x_1$):
   - Ngưỡng hợp lệ danh nghĩa: $[300,000 \dots 50,000,000]$ ₫
   - Bước nhảy: $\epsilon_1 = 1$ ₫ (hoặc $1,000$ ₫)
   - Giá trị danh nghĩa ($Nom_1$): **$500,000$ ₫**
2. **Biến `usage_count`** ($x_2$):
   - Ngưỡng hợp lệ danh nghĩa: $[0 \dots 0]$ (với mã chỉ được dùng tối đa 1 lần, tức số lần đã dùng phải $< 1$, do đó $usage = 0$ là hợp lệ, $usage \ge 1$ là vi phạm)
   - Bước nhảy: $\epsilon_2 = 1$ lần
   - Giá trị danh nghĩa ($Nom_2$): **$0$ lần**
3. **Các biến định danh khác (cố định ở giá trị hợp lệ)**:
   - `code`: `"SAVE10"`
   - `user_id`: `2` (Test User)

---

## Bước 2: Bảng Trích xuất Tập Điểm Biên Chi tiết

### Bảng Điểm Biên Biến 1: `total_amount` quanh biên dưới $LB_1 = 300,000$ ₫
| Điểm Biên | Ký hiệu | Giá trị Số Cụ Thể | Tính Hợp Lệ | Hành vi Kỳ vọng (SRS) |
| :---: | :---: | :---: | :---: | :--- |
| Dưới biên dưới | $LB_1 - \epsilon$ | **$299,999$ ₫** | **Invalid** | Từ chối: Chưa đủ giá trị tối thiểu 300,000 ₫ |
| Ngay tại biên dưới | $LB_1$ | **$300,000$ ₫** | **Valid** | **Chấp nhận**: Giảm 10% (giảm 30,000 ₫) |
| Ngay trên biên dưới | $LB_1 + \epsilon$ | **$300,001$ ₫** | **Valid** | Chấp nhận: Giảm 10% (giảm 30,000 ₫) |
| Giá trị danh nghĩa | $Nom_1$ | **$500,000$ ₫** | **Valid** | Chấp nhận: Giảm 10% (giảm 50,000 ₫) |
| Ngay dưới biên trên | $UB_1 - \epsilon$ | **$49,999,999$ ₫** | **Valid** | Chấp nhận bình thường |
| Ngay tại biên trên | $UB_1$ | **$50,000,000$ ₫** | **Valid** | Chấp nhận bình thường |
| Vượt trên biên trên | $UB_1 + \epsilon$ | **$50,000,001$ ₫** | **Invalid/Extreme** | Tùy giới hạn giỏ hàng |

### Bảng Điểm Biên Biến 2: `usage_count` quanh ngưỡng tối đa $UB_2 = 0$ lần hợp lệ ($1$ lần vi phạm)
| Điểm Biên | Ký hiệu | Giá trị Số Cụ Thể | Tính Hợp Lệ | Hành vi Kỳ vọng (SRS) |
| :---: | :---: | :---: | :---: | :--- |
| Dưới biên dưới | $LB_2 - \epsilon$ | **$-1$ lần** | **Invalid** | Dữ liệu không hợp lệ |
| Ngay tại biên dưới/trên hợp lệ | $LB_2 = UB_2$ | **$0$ lần** | **Valid** | Chấp nhận: Cho phép sử dụng mã |
| Ngay trên ngưỡng (Vi phạm) | $UB_2 + \epsilon$ | **$1$ lần** | **Invalid** | Từ chối: Đã đạt giới hạn 1 lần |
| Vượt xa ngưỡng vi phạm | $UB_2 + 2\epsilon$ | **$2$ lần** | **Invalid** | Từ chối: Đã đạt giới hạn |

---

## Bước 3 & 4: Bảng Tổng hợp Ca Kiểm thử Biên Toàn diện (Robustness BVA $6n+1$)

Áp dụng mô hình **Robustness Testing** ($n=2 \rightarrow f = 6 \times 2 + 1 = 13$ ca kiểm thử). Khi một biến nhận giá trị biên, biến còn lại nhận giá trị danh nghĩa cụ thể ($Nom_1 = 500,000$, $Nom_2 = 0$).

### Bảng Các Ca Kiểm thử Trên Giá trị Biên (Full Concrete Test Cases Table)
| STT (TC ID) | Biến Kiểm Tra | Điểm Biên | `code` | `total_amount` (₫) | `usage_count` (lần) | `user_id` | Output Mong Đợi Cụ Thể (SRS) | Actual Output (Chạy trên SUT) | Kết luận |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- | :--- | :---: |
| **BVA_TC01** | `total_amount` | $LB_1$ (min) | `"SAVE10"` | **$300,000$** | `0` | `2` | **HTTP 200**, `discount=30000`, `final=270000` | **HTTP 400**: Đơn hàng chưa đủ giá trị tối thiểu... | **FAIL (BUG #1)** |
| **BVA_TC02** | `total_amount` | $LB_1 + \epsilon$ (min+) | `"SAVE10"` | **$300,001$** | `0` | `2` | **HTTP 200**, `discount=30000`, `final=270001` | HTTP 200 (Tính sai tiền do bug math) | **FAIL (BUG #2)** |
| **BVA_TC03** | `total_amount` | $UB_1 - \epsilon$ (max-) | `"SAVE10"` | **$49,999,999$** | `0` | `2` | **HTTP 200**, `discount=4999999`, `final=45000000` | HTTP 200 | **PASS** |
| **BVA_TC04** | `total_amount` | $UB_1$ (max) | `"SAVE10"` | **$50,000,000$** | `0` | `2` | **HTTP 200**, `discount=5000000`, `final=45000000` | HTTP 200 | **PASS** |
| **BVA_TC05** | `total_amount` | $LB_1 - \epsilon$ (min-) | `"SAVE10"` | **$299,999$** | `0` | `2` | **HTTP 400**: Đơn hàng chưa đủ giá trị tối thiểu... | HTTP 400: Đơn hàng chưa đủ giá trị tối thiểu... | **PASS** |
| **BVA_TC06** | `total_amount` | $UB_1 + \epsilon$ (max+) | `"SAVE10"` | **$50,000,001$** | `0` | `2` | **HTTP 400**: Vượt quá hạn mức đơn hàng | HTTP 200 | **NOTE** |
| **BVA_TC07** | `usage_count` | $LB_2$ (min) | `"SAVE10"` | **$500,000$** | `0` | `2` | **HTTP 200**, `discount=50000`, `final=450000` | HTTP 200 (Tính sai tiền do bug math) | **FAIL (BUG #2)** |
| **BVA_TC08** | `usage_count` | $LB_2 + \epsilon$ (min+) | `"SAVE10"` | **$500,000$** | `1` | `2` | **HTTP 400**: Bạn đã sử dụng mã này 1 lần (đã đạt giới hạn) | HTTP 400: Bạn đã sử dụng mã này 1 lần... | **PASS** |
| **BVA_TC09** | `usage_count` | $UB_2 - \epsilon$ (max-) | `"SAVE10"` | **$500,000$** | `0` | `2` | **HTTP 200**, `discount=50000`, `final=450000` | HTTP 200 | **PASS** |
| **BVA_TC10** | `usage_count` | $UB_2$ (max) | `"SAVE10"` | **$500,000$** | `0` | `2` | **HTTP 200**, `discount=50000`, `final=450000` | HTTP 200 | **PASS** |
| **BVA_TC11** | `usage_count` | $LB_2 - \epsilon$ (min-) | `"SAVE10"` | **$500,000$** | `-1` | `2` | **HTTP 400**: Dữ liệu không hợp lệ | HTTP 200 | **NOTE** |
| **BVA_TC12** | `usage_count` | $UB_2 + \epsilon$ (max+) | `"SAVE10"` | **$500,000$** | `2` | `2` | **HTTP 400**: Bạn đã sử dụng mã này 1 lần (đã đạt giới hạn) | HTTP 400: Bạn đã sử dụng mã này... | **PASS** |
| **BVA_TC13** | Baseline ($Nom$) | All nominal | `"SAVE10"` | **$500,000$** | `0` | `2` | **HTTP 200**, `discount=50000`, `final=450000` | HTTP 200 (Tính sai tiền do bug math) | **FAIL (BUG #2)** |

### Phân tích Phát hiện Bug từ Ca Kiểm thử BVA_TC01:
- **Đặc tả SRS**: `total_amount >= min_order_amount` (với 300,000 ₫ là phải được chấp nhận).
- **Mã nguồn `backend/server.js` dòng 379**:
  ```javascript
  if (total_amount > coupon.min_order_amount) { // LỖI: dùng '>' thay vì '>='
  ```
- **Hệ quả**: Tại $total\_amount = 300,000$, $300000 > 300000$ trả về `false`, hệ thống nhảy vào nhánh `else` và từ chối mã! 
- **Kết luận**: Ca kiểm thử `BVA_TC01` bắt chính xác lỗi ranh giới toán tử so sánh (Boundary Off-by-one Defect).

---

# PHẦN 2: BVA TRÊN CHỨC NĂNG SỐ LẦN ĐĂNG NHẬP SAI & KHÓA TÀI KHOẢN (FR-02)

## Bước 1: Rà soát Biến & Điểm Biên
- Đặc tả: Khóa tài khoản khi số lần đăng nhập sai đạt từ **3 lần trở lên** liên tiếp.
- Biến: `failed_attempts` (nguyên, $[0 \dots 3]$).
- Điểm ranh giới: $UB = 3$ lần.
- Bước nhảy: $\epsilon = 1$ lần.

## Bước 2 & 3: Bảng Các Ca Kiểm thử Biên Chi tiết (Concrete Test Suite)
| STT | Điểm Biên | Số lần sai liên tiếp | Input Email / Password | Expected Output (Theo SRS) | Actual Output (SUT `backend/server.js`) | Kết luận |
| :---: | :---: | :---: | :--- | :--- | :--- | :---: |
| **TC01** | $UB - 2$ ($min$) | 1 lần | `test@eshop.com` / `WrongPass1` | Báo sai mật khẩu, `login_attempts = 1`, tài khoản CHƯA bị khóa | Báo sai mật khẩu, `login_attempts = 2` | **FAIL (BUG: tăng 2 đơn vị/lần)** |
| **TC02** | $UB - 1$ ($max^-$) | 2 lần | `test@eshop.com` / `WrongPass2` | Báo sai mật khẩu, `login_attempts = 2`, tài khoản CHƯA bị khóa | Báo sai mật khẩu, `login_attempts = 4`, **bị khóa sớm** | **FAIL (BUG: khóa ngay ở lần 2)** |
| **TC03** | $UB$ ($max$) | 3 lần | `test@eshop.com` / `WrongPass3` | Báo sai mật khẩu, `login_attempts = 3`, **bắt đầu bị khóa 30 giây** | Tài khoản bị khóa trong 180 giây (3 phút) | **FAIL (BUG: khóa 180s thay vì 30s)** |
| **TC04** | $UB + 1$ ($max^+$) | 4 lần | `test@eshop.com` / `WrongPass4` | HTTP 403: "Tài khoản đã bị khóa. Vui lòng thử lại sau." | HTTP 403: "Tài khoản đã bị khóa..." | **PASS** |

---

# PHẦN 3: BVA TRÊN SỐ LƯỢNG MUA SẢN PHẨM (FR-06)

## Bước 1: Rà soát Biến & Điểm Biên
- Đặc tả: Ô nhập số lượng sản phẩm chi tiết chỉ nhận **số nguyên dương, tối thiểu là 1**. Giới hạn tối đa UI thường là 99.
- Miền hợp lệ: $[1 \dots 99]$, bước nhảy $\epsilon = 1$.
- Điểm biên: $\{0, 1, 2, 50, 98, 99, 100\}$.

## Bước 2 & 3: Bảng Các Ca Kiểm thử Biên Chi tiết (Concrete Test Suite)
| STT | Điểm Biên | Input `quantity` | Input khác (Sản phẩm) | Expected Output (Theo SRS) |
| :---: | :---: | :---: | :--- | :--- |
| **TC01** | $LB - 1$ (min-) | **$0$** | `product_id = 1` | Báo lỗi: Số lượng phải lớn hơn hoặc bằng 1, nút "Thêm vào giỏ" bị vô hiệu |
| **TC02** | $LB$ (min) | **$1$** | `product_id = 1` | Thành công: Thêm đúng 1 sản phẩm vào giỏ hàng |
| **TC03** | $LB + 1$ (min+) | **$2$** | `product_id = 1` | Thành công: Thêm đúng 2 sản phẩm vào giỏ hàng |
| **TC04** | $Nom$ | **$5$** | `product_id = 1` | Thành công: Thêm đúng 5 sản phẩm vào giỏ hàng |
| **TC05** | $UB - 1$ (max-) | **$98$** | `product_id = 1` | Thành công: Thêm đúng 98 sản phẩm vào giỏ hàng |
| **TC06** | $UB$ (max) | **$99$** | `product_id = 1` | Thành công: Thêm đúng 99 sản phẩm vào giỏ hàng |
| **TC07** | $UB + 1$ (max+) | **$100$** | `product_id = 1` | Báo lỗi hoặc chặn không cho nhập quá 99 |
| **TC08** | Extreme (min--) | **$-1$** | `product_id = 1` | Báo lỗi: Không chấp nhận số âm |
