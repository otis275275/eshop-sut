# Ví dụ Mẫu Thực tế: Domain Testing trên EShop FR-09 (Discount Coupons)

Tài liệu này minh họa chi tiết từng bước áp dụng kỹ năng **Domain Testing** trên chức năng **FR-09: Áp dụng Mã Giảm Giá (Discount Coupons)** của hệ thống EShop SUT, tuân thủ đúng chuẩn mực 4 bước giảng dạy tại FIT - HCMUS (bao gồm **Bảng tổng hợp sơ bộ duyệt toàn bộ 100% các lớp tương đương** ở Bước 3 và **Bảng rút gọn** ở Bước 4).

---

## 1. Phân tích Đặc tả Nghiệp vụ (SRS FR-09)

Theo tài liệu đặc tả EShop `README.md`, chức năng áp dụng mã giảm giá phụ thuộc vào 5 điều kiện bắt buộc:
1. **C1 (Mã tồn tại & Kích hoạt)**: Mã phải tồn tại trong CSDL và `is_active = 1`.
2. **C2 (Hạn sử dụng)**: Ngày hiện tại phải trước ngày `expired_at`.
3. **C3 (Ngưỡng đơn hàng)**: Tổng đơn hàng `total_amount` $\ge$ `min_order_amount`.
4. **C4 (Đã đăng nhập)**: Người dùng phải có Token hợp lệ (`user_id` xác định).
5. **C5 (Lượt sử dụng)**: Số lần user đã dùng mã `< max_uses_per_user`.

Công thức tính:
- Loại `percent`: `discount_amount = total * discount_value / 100`
- Loại `fixed`: `discount_amount = discount_value`
- `final_amount = total - discount_amount`

---

## BƯỚC 1: XÁC ĐỊNH BIẾN ĐẦU VÀO VÀ ĐẦU RA (INPUTS & OUTPUTS)

### 1.1. Bảng Biến Đầu vào (Inputs)
| Tên Biến / Thuộc tính | Kiểu Dữ liệu | Ràng buộc nghiệp vụ (Đặc tả SRS) | Giá trị Hợp lệ Mặc định (Nominal Value) |
| :--- | :--- | :--- | :--- |
| `code` | String | Mã ký tự coupon, phải tồn tại trong DB, `is_active = 1` | `"SAVE10"` |
| `total_amount` | Number (VND) | Tổng tiền giỏ hàng, $\ge$ `min_order_amount` (300,000 ₫) | $400,000$ ₫ |
| `user_id` | Integer | ID người dùng đã đăng nhập, hợp lệ trong DB | `2` (Test User) |
| `expired_at` (DB) | DateTime | Thời hạn sử dụng, phải sau thời điểm hiện tại | `"2099-12-31"` |
| `usage_count` (DB) | Integer | Số lần đã dùng mã của user, phải $<$ `max_uses_per_user` (1) | `0` (chưa dùng) |
| `type` (DB) | String | Loại giảm giá: `'percent'` hoặc `'fixed'` | `'percent'` |

### 1.2. Bảng Biến Đầu ra (Outputs)
| Tên Đầu ra | Loại Đầu ra | Kết quả mong đợi (SRS) |
| :--- | :--- | :--- |
| `Output_Success` | Trạng thái / Dữ liệu | HTTP 200 OK, JSON `{ success: true, discount_amount, final_amount, message }` |
| `Output_Error` | Thông báo ngoại lệ | HTTP 400 hoặc 404, JSON `{ error: string }` |

---

## BƯỚC 2: XÁC ĐỊNH LỚP TƯƠNG ĐƯƠNG VÀ GIÁ TRỊ ĐẠI DIỆN

> **Nguyên tắc**: Xác định đầy đủ các lớp Valid và Invalid cho từng biến và đầu ra, đồng thời gán trước **Giá trị đại diện cụ thể ($Val_{rep}$)** cho từng lớp tương đương (tương ứng Slide 16 của bài giảng).

### Bảng Tổng hợp Lớp Tương đương (Equivalence Classes Table)
| STT | Biến / Điều kiện | Mã Lớp (EC ID) | Mô tả Lớp Tương Đương | Loại | Giá trị Đại diện Cụ thể ($Val_{rep}$) |
| :---: | :--- | :---: | :--- | :---: | :--- |
| 1 | `code` | **EC01** | Mã hợp lệ, có trong DB, `is_active = 1` | **Valid** | `"SAVE10"` |
| 2 | | **EC02** | Mã không tồn tại trong CSDL | **Invalid** | `"NOSUCHCODE"` |
| 3 | | **EC03** | Mã để trống (chuỗi rỗng) | **Invalid** | `""` |
| 4 | | **EC04** | Mã có trong DB nhưng `is_active = 0` | **Invalid** | `"INACTIVE10"` |
| 5 | `expired_at` | **EC05** | Mã còn hạn (`now < expired_at`) | **Valid** | `"2099-12-31"` (của `SAVE10`) |
| 6 | | **EC06** | Mã đã hết hạn (`now > expired_at`) | **Invalid** | `"2020-01-01"` (của `EXPIRED`) |
| 7 | `total_amount` | **EC07** | Đạt ngưỡng tối thiểu (`total >= 300,000`) | **Valid** | $400,000$ ₫ |
| 8 | | **EC08** | Chưa đạt ngưỡng tối thiểu (`total < 300,000`) | **Invalid** | $200,000$ ₫ |
| 9 | `user_id` | **EC09** | Người dùng đã đăng nhập hợp lệ | **Valid** | `2` (User Test) |
| 10 | | **EC10** | Người dùng chưa đăng nhập (`user_id = null`) | **Invalid** | `null` |
| 11 | `usage_count` | **EC11** | Chưa quá giới hạn (`usage < max_uses`) | **Valid** | `0` (chưa sử dụng) |
| 12 | | **EC12** | Đã hết lượt dùng (`usage >= max_uses`) | **Invalid** | `1` (đã sử dụng 1 lần) |
| 13 | `type` | **EC13** | Loại giảm theo tỷ lệ phần trăm (`percent`) | **Valid** | `'percent'` (với `SAVE10`: 10%) |
| 14 | | **EC14** | Loại giảm số tiền cố định (`fixed`) | **Valid** | `'fixed'` (với `BIGBUY`: 50,000 ₫, total: 600k) |
| 15 | `Output` | **EC15** | Áp dụng thành công (HTTP 200) | **Valid** | `{ success: true, discount_amount, final_amount }` |
| 16 | | **EC16** | Thông báo lỗi không hợp lệ (HTTP 4xx) | **Invalid** | `{ error: "Thông báo lỗi cụ thể" }` |

---

## BƯỚC 3: XÁC ĐỊNH CÁC CA KIỂM THỬ SƠ BỘ (DUYỆT TOÀN BỘ 16 ECs)

> [!IMPORTANT]
> **QUY TẮC DUYỆT ĐẦY ĐỦ (BRUTE-FORCE THEO SLIDE 17 FIT - HCMUS):**
> Duyệt tuần tự qua **100% toàn bộ 16 lớp tương đương** ($EC01 \rightarrow EC16$).
> Khi xét lớp $EC_k$: biến đang xét nhận giá trị đại diện của $EC_k$, **TẤT CẢ các biến còn lại BẮT BUỘC NHẬN GIÁ TRỊ ĐẠI DIỆN HỢP LỆ CỤ THỂ ĐÃ CHỌN Ở BƯỚC 2** (`code="SAVE10"`, `total=400,000`, `user_id=2`, `usage=0`).
> Tuyệt đối không dùng cụm từ trừu tượng "Giá trị hợp lệ", mà ghi rõ giá trị thực tế!

### Bảng Tổng hợp Ca Kiểm thử Sơ bộ (Full Preliminary Test Cases)
| STT | Lớp Tương Đương Được Test | `code` | `total_amount` | `user_id` | `usage_count` | Trạng thái mã (DB) | Output mong đợi cụ thể (Expected Output) |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **1** | **EC01** (`code` hợp lệ) | `"SAVE10"` | $400,000$ | `2` | `0` | Active, Exp: 2099 | HTTP 200, `discount=40000`, `final=360000` |
| **2** | **EC02** (`code` không tồn tại) | `"NOSUCHCODE"` | $400,000$ | `2` | `0` | Không có trong DB | HTTP 404: "Mã giảm giá không tồn tại hoặc đã bị vô hiệu hóa" |
| **3** | **EC03** (`code` rỗng) | `""` | $400,000$ | `2` | `0` | Không áp dụng | HTTP 400: "Vui lòng nhập mã giảm giá" |
| **4** | **EC04** (`code` inactive) | `"INACTIVE10"` | $400,000$ | `2` | `0` | `is_active = 0` | HTTP 404: "Mã giảm giá không tồn tại hoặc đã bị vô hiệu hóa" |
| **5** | **EC05** (`expired_at` còn hạn) | `"SAVE10"` | $400,000$ | `2` | `0` | Exp: 2099-12-31 | HTTP 200, `discount=40000`, `final=360000` |
| **6** | **EC06** (`expired_at` hết hạn) | `"EXPIRED"` | $400,000$ | `2` | `0` | Exp: 2020-01-01 | HTTP 400: "Mã giảm giá đã hết hạn" |
| **7** | **EC07** (`total` $\ge$ min) | `"SAVE10"` | $400,000$ | `2` | `0` | Min: 300,000 | HTTP 200, `discount=40000`, `final=360000` |
| **8** | **EC08** (`total` $<$ min) | `"SAVE10"` | $200,000$ | `2` | `0` | Min: 300,000 | HTTP 400: "Đơn hàng chưa đủ giá trị tối thiểu 300,000 ₫ để áp dụng mã này" |
| **9** | **EC09** (`user_id` đã login) | `"SAVE10"` | $400,000$ | `2` | `0` | User tồn tại | HTTP 200, `discount=40000`, `final=360000` |
| **10** | **EC10** (`user_id` null) | `"SAVE10"` | $400,000$ | `null` | `0` | Khách vãng lai | HTTP 401 hoặc từ chối áp dụng theo C4 SRS FR-09 |
| **11** | **EC11** (`usage` $<$ max) | `"SAVE10"` | $400,000$ | `2` | `0` | Max: 1 | HTTP 200, `discount=40000`, `final=360000` |
| **12** | **EC12** (`usage` $\ge$ max) | `"SAVE10"` | $400,000$ | `2` | `1` | Max: 1 | HTTP 400: "Bạn đã sử dụng mã này 1 lần (đã đạt giới hạn)" |
| **13** | **EC13** (`type` percent) | `"SAVE10"` | $400,000$ | `2` | `0` | Type: percent (10%) | HTTP 200, `discount=40000`, `final=360000` |
| **14** | **EC14** (`type` fixed) | `"BIGBUY"` | $600,000$ | `2` | `0` | Type: fixed (50,000) | HTTP 200, `discount=50000`, `final=550000` |
| **15** | **EC15** (Output thành công) | `"SAVE10"` | $400,000$ | `2` | `0` | Thỏa mãn mọi C | HTTP 200, `discount=40000`, `final=360000` |
| **16** | **EC16** (Output lỗi vi phạm) | `"NOSUCHCODE"` | $400,000$ | `2` | `0` | Vi phạm C1 | HTTP 404, Báo lỗi không tìm thấy |

---

## BƯỚC 4: BẢNG RÚT GỌN CÁC CA KIỂM THỬ (THEO SLIDE 18 FIT - HCMUS)

### 4.1. Phân tích Rút gọn Trùng lặp
- Nhận thấy các dòng kiểm thử hợp lệ gồm: **Dòng 1 (EC01)**, **Dòng 5 (EC05)**, **Dòng 7 (EC07)**, **Dòng 9 (EC09)**, **Dòng 11 (EC11)**, **Dòng 13 (EC13)** và **Dòng 15 (EC15)** đều có cùng bộ tham số đầu vào (`code="SAVE10"`, `total=400,000`, `user_id=2`, `usage=0`) và cùng kết quả mong đợi (`HTTP 200, discount=40000, final=360000`).
- Do đó, theo nguyên tắc tối ưu hóa của bài giảng, ta **gom 7 dòng hợp lệ này lại thành duy nhất 1 Ca kiểm thử hợp lệ TC01** bao phủ đồng thời tất cả các lớp tương đương hợp lệ đó.
- Dòng 14 kiểm tra loại giảm giá `fixed` (EC14) với mã `BIGBUY` hình thành **TC02**.
- Dòng 16 (EC16 - Output thông báo lỗi) được kết hợp cùng với dòng 2 (EC02).
- Các dòng không hợp lệ còn lại (dòng 2, 3, 4, 6, 8, 10, 12) mỗi dòng kiểm tra độc lập một Invalid EC riêng biệt để **cô lập lỗi tuyệt đối** và được giữ nguyên.

### 4.2. Bảng Rút gọn các Ca Kiểm thử Hoàn chỉnh (Final Test Suite)
| TC ID | Lớp Tương Đương Được Phủ (Covered ECs) | `code` | `total_amount` | `user_id` | Trạng thái CSDL | Output mong đợi (Expected Output) |
| :---: | :--- | :---: | :---: | :---: | :--- | :--- |
| **TC01** | **EC01, EC05, EC07, EC09, EC11, EC13, EC15** | `"SAVE10"` | $400,000$ | `2` | Active, Exp: 2099, Chưa dùng | **HTTP 200**, `discount_amount=40000`, `final_amount=360000` |
| **TC02** | **EC01, EC05, EC07, EC09, EC11, EC14, EC15** | `"BIGBUY"` | $600,000$ | `2` | Active, Exp: 2099, Chưa dùng | **HTTP 200**, `discount_amount=50000`, `final_amount=550000` |
| **TC03** | **EC02, EC16** | `"NOSUCHCODE"` | $400,000$ | `2` | Không có trong CSDL | **HTTP 404**: "Mã giảm giá không tồn tại hoặc đã bị vô hiệu hóa" |
| **TC04** | **EC03, EC16** | `""` | $400,000$ | `2` | Không áp dụng | **HTTP 400**: "Vui lòng nhập mã giảm giá" |
| **TC05** | **EC04, EC16** | `"INACTIVE10"` | $400,000$ | `2` | Mã có `is_active = 0` | **HTTP 404**: "Mã giảm giá không tồn tại hoặc đã bị vô hiệu hóa" |
| **TC06** | **EC06, EC16** | `"EXPIRED"` | $400,000$ | `2` | Mã có `expired_at = '2020-01-01'` | **HTTP 400**: "Mã giảm giá đã hết hạn" |
| **TC07** | **EC08, EC16** | `"SAVE10"` | $200,000$ | `2` | Ngưỡng min 300,000 | **HTTP 400**: "Đơn hàng chưa đủ giá trị tối thiểu 300,000 ₫..." |
| **TC08** | **EC10, EC16** | `"SAVE10"` | $400,000$ | `null` | Chưa đăng nhập (khách vãng lai) | **HTTP 401**: Yêu cầu đăng nhập trước khi dùng mã |
| **TC09** | **EC12, EC16** | `"SAVE10"` | $400,000$ | `2` | Đã dùng 1 lần (`usage_count = 1`) | **HTTP 400**: "Bạn đã sử dụng mã này 1 lần (đã đạt giới hạn)" |

> [!CAUTION]
> **KẾT QUẢ THỰC THI THỰC TẾ & PHÁT HIỆN BUG:**
> Khi thực thi ca kiểm thử `TC01` trên Backend thực tế tại `backend/server.js` (dòng 399-401):
> Biểu thức tính tiền: `discount_amount = Math.floor(total_amount * (1 - coupon.discount_value))` tính ra: $400000 \times (1 - 10) = -3,600,000$ ₫! 
> Dẫn đến `final_amount = 400000 - (-3600000) = 4,000,000` ₫ (thay vì $360,000$ ₫). Ca kiểm thử `TC01` thiết kế theo Domain Testing chuẩn đã bắt được bug tính sai công thức phần trăm này ngay lập tức!
