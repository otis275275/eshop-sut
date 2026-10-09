# Ví dụ Mẫu Thực tế: Boundary Value Analysis trên EShop FR-09 & FR-02

Tài liệu này minh họa ứng dụng chuẩn mực của kỹ thuật **Boundary Value Analysis (BVA)** trên hệ thống EShop SUT, dẫn chứng thực tế cách kỹ thuật này phát hiện lỗi nghiêm trọng trong mã nguồn backend (`backend/server.js`).

---

## TÌNH HUỐNG 1: BVA TRÊN NGƯỠNG TỐI THIỂU MÃ GIẢM GIÁ (FR-09)

### 1. Phân tích Ràng buộc Đặc tả (SRS FR-09)
- Ràng buộc C3: *"Tổng đơn hàng `>= (lớn hơn hoặc bằng)` min_order_amount"*.
- Xét mã coupon `SAVE10`:
  - `min_order_amount` = $300,000$ ₫.
  - Đơn vị bước nhảy: $\epsilon = 1$ ₫ (hoặc $1,000$ ₫ trong môi trường tiền tệ).

### 2. Xác định Tập Điểm Biên (3-Point BVA)
Xét biến `total_amount` quanh biên dưới $LB = 300,000$ ₫:
1. **$LB - \epsilon$ (299,999 ₫ hoặc 299,000 ₫)**: Dưới ngưỡng $\rightarrow$ **Invalid**. Hệ thống phải từ chối và báo lỗi.
2. **$LB$ (300,000 ₫)**: Đúng ngưỡng tối thiểu $\rightarrow$ **Valid**. Hệ thống **BẮT BUỘC** phải chấp nhận mã giảm giá.
3. **$LB + \epsilon$ (300,001 ₫ hoặc 301,000 ₫)**: Trên ngưỡng $\rightarrow$ **Valid**. Hệ thống chấp nhận mã giảm giá.

### 3. Thiết kế Ca Kiểm thử Biên (BVA Test Suite)

| TC ID | Biến & Điểm Biên | Input `total_amount` | Input khác (Nominal) | Expected Output (Theo SRS) | Actual Output (Chạy trên SUT) | Kết luận Bug |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BVA_FR09_TC01** | $LB - \epsilon$ (299,999 ₫) | $299,999$ | `code="SAVE10"`, `user_id=2` | HTTP 400: Đơn hàng chưa đủ giá trị tối thiểu 300,000 ₫ | HTTP 400: Đơn hàng chưa đủ giá trị tối thiểu... | **PASS** |
| **BVA_FR09_TC02** | $LB$ (300,000 ₫) | $300,000$ | `code="SAVE10"`, `user_id=2` | HTTP 200: Áp dụng thành công, giảm 10% | **HTTP 400: Đơn hàng chưa đủ giá trị tối thiểu 300,000 ₫** | **FAIL (BUG PHÁT HIỆN)** |
| **BVA_FR09_TC03** | $LB + \epsilon$ (300,001 ₫) | $300,001$ | `code="SAVE10"`, `user_id=2` | HTTP 200: Áp dụng thành công, giảm 10% | HTTP 200: Áp dụng thành công | **PASS** |

### 4. Giải mã Nguyên nhân Gốc rễ (Root Cause Analysis từ Source Code)
Mở file [backend/server.js](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/backend/server.js#L379):
```javascript
// Dòng 379:
if (total_amount > coupon.min_order_amount) { // LỖI Ở ĐÂY: Dùng '>' thay vì '>='
  ...
} else {
  return res.status(400).json({ error: "Đơn hàng chưa đủ giá trị tối thiểu..." });
}
```
> [!CAUTION]
> **PHÁT HIỆN BUG ĐIỂN HÌNH BẰNG BVA:**  
> Tại `total_amount = 300,000`, biểu thức $300000 > 300000$ cho kết quả `false`, dẫn tới việc hệ thống từ chối coupon một cách trái phép! Nếu người kiểm thử chỉ dùng Domain Testing với giá trị $400,000$ ₫ (nằm sâu trong miền hợp lệ) thì **hoàn toàn không thể phát hiện lỗi này**. Kỹ thuật BVA đã phát hiện chính xác bug toán tử so sánh ranh giới!

---

## TÌNH HUỐNG 2: BVA TRÊN BỘ ĐẾM ĐĂNG NHẬP THẤT BẠI & KHÓA TÀI KHOẢN (FR-02)

### 1. Phân tích Ràng buộc Đặc tả (SRS FR-02)
- Ràng buộc:
  - *"Sau mỗi lần đăng nhập sai, hệ thống tăng bộ đếm lên đúng 1 đơn vị"*.
  - *"Nếu đăng nhập sai từ 3 lần trở lên liên tiếp, tài khoản bị tạm khóa 30 giây"*.
- Biến: `failed_attempts` (nguyên, $[0..3]$).
- Điểm ranh giới: $UB = 3$ lần.

### 2. Thiết kế Ca Kiểm thử Biên (BVA Suite)

| TC ID | Số lần đăng nhập sai | Điểm Biên | Expected Output (SRS) | Actual Output (SUT `backend/server.js`) | Kết luận |
| :--- | :---: | :---: | :--- | :--- | :--- |
| **BVA_FR02_TC01** | Lần 1 | $1$ (Dưới ngưỡng) | Báo sai mật khẩu, `login_attempts = 1`, tài khoản chưa khóa | Báo sai mật khẩu, `login_attempts = 2` | **FAIL (BUG: tăng 2 đơn vị/lần)** |
| **BVA_FR02_TC02** | Lần 2 | $2$ (Ngay dưới biên $UB-1$) | Báo sai mật khẩu, `login_attempts = 2`, tài khoản chưa khóa | Báo sai mật khẩu, `login_attempts = 4`, **bị khóa sớm** | **FAIL (BUG: bị khóa ngay từ lần 2)** |
| **BVA_FR02_TC03** | Lần 3 | $3$ (Ngay tại biên $UB$) | Báo sai mật khẩu, `login_attempts = 3`, **bắt đầu bị khóa 30 giây** | Tài khoản bị khóa trong 180 giây (3 phút) | **FAIL (BUG: khóa 180s thay vì 30s)** |
