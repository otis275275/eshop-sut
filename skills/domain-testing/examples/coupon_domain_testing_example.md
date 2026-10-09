# Ví dụ Mẫu Thực tế: Domain Testing trên EShop FR-09 (Discount Coupons)

Tài liệu này minh họa chi tiết từng bước áp dụng kỹ năng **Domain Testing** trên chức năng **FR-09: Áp dụng Mã Giảm Giá (Discount Coupons)** của hệ thống EShop SUT.

---

## 1. Phân tích Đặc tả Nghiệp vụ (SRS FR-09)

Theo tài liệu đặc tả EShop `README.md`, chức năng áp dụng mã giảm giá phụ thuộc vào 5 điều kiện bắt buộc:
1. **C1 (Mã tồn tại)**: Mã phải tồn tại trong CSDL và `is_active = 1`.
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

### Biến Đầu vào (Inputs):
- `code` (String): Chuỗi mã giảm giá người dùng nhập vào.
- `total_amount` (Number): Tổng giá trị giỏ hàng trước giảm giá.
- `user_id` / `Token` (Context/Header): Thông tin xác thực người dùng đã đăng nhập.
- `coupon_record` (Database State): Bản ghi mã trong DB gồm `is_active`, `expired_at`, `min_order_amount`, `max_uses_per_user`, `type`, `discount_value`.
- `user_usage_count` (Database State): Số lần `user_id` đã sử dụng coupon này trong bảng `coupon_usage`.

### Biến Đầu ra (Outputs):
- Trạng thái thành công: HTTP 200, trả về JSON `{ success: true, discount_amount, final_amount, message }`.
- Trạng thái lỗi (HTTP 400 / 404): Trả về JSON `{ error: string }`.

---

## BƯỚC 2: XÁC ĐỊNH LỚP TƯƠNG ĐƯƠNG (EQUIVALENCE CLASSES)

| Biến / Điều kiện | Mã Lớp (EC ID) | Mô tả Lớp Tương Đương | Loại | Giá trị / Trạng thái Đại diện |
| :--- | :--- | :--- | :--- | :--- |
| **`code` (Mã nhập vào)** | **EC01** | Mã hợp lệ, tồn tại trong DB, `is_active = 1` | Valid | `"SAVE10"` |
| | **EC02** | Mã không tồn tại trong DB | Invalid | `"NOSUCHCODE"` |
| | **EC03** | Mã rỗng / Chưa nhập | Invalid | `""` hoặc `null` |
| | **EC04** | Mã có trong DB nhưng `is_active = 0` | Invalid | `"INACTIVE10"` |
| **`expired_at` (Hạn dùng)** | **EC05** | Mã còn hạn (`now < expired_at`) | Valid | `"2099-12-31"` |
| | **EC06** | Mã đã hết hạn (`now > expired_at`) | Invalid | `"2020-01-01"` (`EXPIRED`) |
| **`total_amount` (Giá trị đơn)** | **EC07** | `total_amount` $\ge$ `min_order_amount` | Valid | $400,000$ ₫ (với min 300k) |
| | **EC08** | `total_amount` $<$ `min_order_amount` | Invalid | $200,000$ ₫ (với min 300k) |
| **`user_id` (Đăng nhập)** | **EC09** | Đã đăng nhập (`user_id` hợp lệ, token đúng) | Valid | `user_id = 2` |
| | **EC10** | Chưa đăng nhập (`user_id = null` / No token) | Invalid / Fallback | `null` |
| **`usage_count` (Số lần dùng)**| **EC11** | Chưa quá giới hạn (`usage < max_uses`) | Valid | $0$ lần (với max 1) |
| | **EC12** | Đã hết lượt dùng (`usage >= max_uses`) | Invalid | $1$ lần (với max 1) |
| **`type` (Loại giảm giá)** | **EC13** | Loại giảm theo tỷ lệ phần trăm (`percent`) | Valid | `type = 'percent'` (`SAVE10`) |
| | **EC14** | Loại giảm số tiền cố định (`fixed`) | Valid | `type = 'fixed'` (`BIGBUY`) |

---

## BƯỚC 3: THIẾT KẾ CA KIỂM THỬ VÀ CÔ LẬP LỖI (FAULT ISOLATION)

Áp dụng quy tắc:
1. **Ca kiểm thử hợp lệ**: Ghép tất cả các Valid ECs (`EC01, EC05, EC07, EC09, EC11, EC13`) vào 1 ca kiểm thử để kiểm tra giảm giá phần trăm, và ca thứ 2 kiểm tra giảm giá cố định (`EC14`).
2. **Ca kiểm thử không hợp lệ**: Với mỗi Invalid EC, các biến còn lại **PHẢI** lấy giá trị hợp lệ danh nghĩa:
   - Khi test `EC02` (Mã không tồn tại): `total_amount = 400,000` (hợp lệ), user đã đăng nhập, chưa dùng.
   - Khi test `EC06` (Hết hạn): Dùng mã `EXPIRED`, `total_amount = 400,000` (hợp lệ), user đã đăng nhập.
   - Khi test `EC08` (Chưa đủ ngưỡng): Dùng mã `SAVE10` (hợp lệ), `total_amount = 200,000` (dưới 300k), user hợp lệ.
   - Khi test `EC12` (Đã hết lượt dùng): Dùng mã `SAVE10`, `total_amount = 400,000`, user đã dùng mã 1 lần trước đó.

---

## BƯỚC 4: BẢNG RÚT GỌN CÁC CA KIỂM THỬ (FINAL TEST SUITE)

| TC ID | Mục tiêu Kiểm thử | EC bao phủ | Inputs (`code`, `total`, `user`) | Expected Output |
| :--- | :--- | :--- | :--- | :--- |
| **DT_FR09_TC01** | Áp dụng thành công coupon loại `percent` | `EC01, EC05, EC07, EC09, EC11, EC13` | `code="SAVE10"`, `total=400000`, `user_id=2` (lượt dùng 0) | HTTP 200, `discount_amount=40000`, `final_amount=360000` |
| **DT_FR09_TC02** | Áp dụng thành công coupon loại `fixed` | `EC01, EC05, EC07, EC09, EC11, EC14` | `code="BIGBUY"`, `total=600000`, `user_id=2` (lượt dùng 0) | HTTP 200, `discount_amount=50000`, `final_amount=550000` |
| **DT_FR09_TC03** | Lỗi: Mã không tồn tại | `EC02` | `code="FAKE123"`, `total=400000`, `user_id=2` | HTTP 404, Thông báo "Mã giảm giá không tồn tại" |
| **DT_FR09_TC04** | Lỗi: Để trống mã giảm giá | `EC03` | `code=""`, `total=400000`, `user_id=2` | HTTP 400, Thông báo "Vui lòng nhập mã giảm giá" |
| **DT_FR09_TC05** | Lỗi: Mã đã hết hạn sử dụng | `EC06` | `code="EXPIRED"`, `total=400000`, `user_id=2` | HTTP 400, Thông báo "Mã giảm giá đã hết hạn" |
| **DT_FR09_TC06** | Lỗi: Chưa đạt giá trị đơn hàng tối thiểu | `EC08` | `code="SAVE10"`, `total=200000`, `user_id=2` | HTTP 400, Thông báo "Đơn hàng chưa đủ giá trị tối thiểu..." |
| **DT_FR09_TC07** | Lỗi: Người dùng đã dùng hết số lượt | `EC12` | `code="SAVE10"`, `total=400000`, `user_id=2` (đã dùng 1 lần) | HTTP 400, Thông báo "Bạn đã sử dụng mã này 1 lần (đã đạt giới hạn)" |

> [!NOTE]
> Khi thực thi ca kiểm thử `DT_FR09_TC01` trên Backend thực tế của SUT tại `backend/server.js` (dòng 400):
> Đoạn code backend: `discount_amount = Math.floor(total_amount * (1 - coupon.discount_value))` sẽ tính sai ra con số âm khổng lồ thay vì giảm 10%! Domain test case này đã giúp ta phát hiện ra ngay 1 bug nghiêm trọng của SUT.
