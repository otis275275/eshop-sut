# Biểu mẫu Báo cáo: Boundary Value Analysis (BVA)

Tài liệu này cung cấp khung mẫu chuẩn mực (Markdown Template) để áp dụng kỹ thuật Boundary Value Analysis cho bất kỳ chức năng nào trong bài tập HW02. Biểu mẫu tuân thủ nghiêm ngặt chuẩn bài giảng FIT - HCMUS (Slide 21 đến 26), yêu cầu **lập bảng kiểm thử biên chi tiết đầy đủ toàn diện (brute-force) với 100% giá trị cụ thể**, không dùng placeholder trừu tượng.

---

# BÁO CÁO KIỂM THỬ: BOUNDARY VALUE ANALYSIS
**Chức năng**: [Mã chức năng: VD FR-09: Mã Giảm Giá / FR-06: Chi tiết Sản phẩm]  
**Người thực hiện**: [Họ và tên - MSSV]  
**Ngày thực hiện**: [YYYY-MM-DD]  

---

## BƯỚC 1: XÁC ĐỊNH CÁC BIẾN CÓ THỨ TỰ (ORDERED VARIABLES)

| STT | Tên Biến | Kiểu Dữ liệu | Miền giá trị hợp lệ danh nghĩa $[LB..UB]$ | Bước nhảy tối thiểu ($\epsilon$) | Giá trị Danh nghĩa Mặc định (Nominal Value - $Nom$) |
| :---: | :--- | :--- | :--- | :---: | :--- |
| 1 | `var_1` | Integer / Currency / Counter | $[min_1 .. max_1]$ | 1 | `[Giá trị số cụ thể ở giữa miền]` |
| 2 | `var_2` | Integer / Float | $[min_2 .. max_2]$ | 1 | `[Giá trị số cụ thể ở giữa miền]` |

---

## BƯỚC 2: BẢNG TRÍCH XUẤT TẬP ĐIỂM BIÊN CHI TIẾT (BOUNDARY POINTS EXTRACTION)

> **Yêu cầu bắt buộc**: Tính toán và điền **giá trị số thực tế** cho từng điểm biên của từng biến theo kỹ thuật 3 Điểm Biên (3-Point BVA) hoặc 2 Điểm Biên (2-Point BVA).

### Bảng Điểm Biên Biến 1: `var_1` (Miền $[LB_1 .. UB_1]$)
| Ký hiệu Điểm | Vị trí Ranh giới | Công thức | Giá trị Số Cụ Thể | Tính Hợp Lệ | Hành vi Hệ thống Kỳ vọng |
| :---: | :--- | :---: | :---: | :---: | :--- |
| **$LB_1 - \epsilon$** | Dưới biên dưới | $LB_1 - \epsilon$ | `[Số cụ thể]` | **Invalid** | Báo lỗi vi phạm biên dưới |
| **$LB_1$** | Ngay tại biên dưới | $LB_1$ | `[Số cụ thể]` | **Valid** | Chấp nhận giá trị nhỏ nhất |
| **$LB_1 + \epsilon$** | Ngay trên biên dưới | $LB_1 + \epsilon$ | `[Số cụ thể]` | **Valid** | Chấp nhận bình thường |
| **$Nom_1$** | Giá trị danh nghĩa | - | `[Số cụ thể]` | **Valid** | Chấp nhận bình thường |
| **$UB_1 - \epsilon$** | Ngay dưới biên trên | $UB_1 - \epsilon$ | `[Số cụ thể]` | **Valid** | Chấp nhận bình thường |
| **$UB_1$** | Ngay tại biên trên | $UB_1$ | `[Số cụ thể]` | **Valid** | Chấp nhận giá trị lớn nhất |
| **$UB_1 + \epsilon$** | Vượt trên biên trên | $UB_1 + \epsilon$ | `[Số cụ thể]` | **Invalid** | Báo lỗi vượt quá biên trên |

### Bảng Điểm Biên Biến 2: `var_2` (Miền $[LB_2 .. UB_2]$)
| Ký hiệu Điểm | Vị trí Ranh giới | Công thức | Giá trị Số Cụ Thể | Tính Hợp Lệ | Hành vi Hệ thống Kỳ vọng |
| :---: | :--- | :---: | :---: | :---: | :--- |
| **$LB_2 - \epsilon$** | Dưới biên dưới | $LB_2 - \epsilon$ | `[Số cụ thể]` | **Invalid** | Báo lỗi vi phạm biên dưới |
| **$LB_2$** | Ngay tại biên dưới | $LB_2$ | `[Số cụ thể]` | **Valid** | Chấp nhận giá trị nhỏ nhất |
| **$LB_2 + \epsilon$** | Ngay trên biên dưới | $LB_2 + \epsilon$ | `[Số cụ thể]` | **Valid** | Chấp nhận bình thường |
| **$Nom_2$** | Giá trị danh nghĩa | - | `[Số cụ thể]` | **Valid** | Chấp nhận bình thường |
| **$UB_2 - \epsilon$** | Ngay dưới biên trên | $UB_2 - \epsilon$ | `[Số cụ thể]` | **Valid** | Chấp nhận bình thường |
| **$UB_2$** | Ngay tại biên trên | $UB_2$ | `[Số cụ thể]` | **Valid** | Chấp nhận giá trị lớn nhất |
| **$UB_2 + \epsilon$** | Vượt trên biên trên | $UB_2 + \epsilon$ | `[Số cụ thể]` | **Invalid** | Báo lỗi vượt quá biên trên |

---

## BƯỚC 3: LỰA CHỌN MÔ HÌNH BVA & CÔNG THỨC TÍNH SỐ LƯỢNG CA KIỂM THỬ

- **Mô hình lựa chọn**: [Standard BVA ($4n+1$) / Robustness Testing ($6n+1$) / Worst-Case Testing ($5^n$)]
- **Số lượng biến có thứ tự ($n$)**: $n = \dots$
- **Công thức xác định số ca kiểm thử**:
  - Nếu Standard BVA: $f = 4n + 1 = \dots$ ca kiểm thử.
  - Nếu Robustness Testing: $f = 6n + 1 = \dots$ ca kiểm thử.
- **Giá trị danh nghĩa (Nominal/Baseline)**:
  - $Nom(var_1) = \dots$
  - $Nom(var_2) = \dots$

---

## BƯỚC 4: BẢNG TỔNG HỢP CA KIỂM THỬ BIÊN TOÀN DIỆN (THEO SLIDE 26 FIT - HCMUS)

> [!IMPORTANT]
> **QUY TẮC THIẾT LẬP BẢNG BVA TOÀN DIỆN (BRUTE-FORCE):**
> 1. Duyệt tuần tự qua từng điểm biên của từng biến.
> 2. **Cô lập lỗi (Fault Isolation)**: Khi một biến đang nhận giá trị biên cần kiểm tra, **TẤT CẢ các biến còn lại BẮT BUỘC nhận giá trị danh nghĩa cụ thể ($Nom$)**.
> 3. Tuyệt đối **KHÔNG** dùng placeholder trừu tượng. Toàn bộ các cột dữ liệu phải ghi **số thực tế cụ thể**!

### Bảng Các Ca Kiểm thử Trên Giá trị Biên (Full Boundary Value Test Suite)
| STT (TC ID) | Biến Kiểm Tra | Điểm Biên Đang Xét | `var_1` (Giá trị cụ thể) | `var_2` (Giá trị cụ thể) | Biến phụ khác (Nếu có) | Output Mong Đợi Cụ Thể (Expected Output) |
| :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **TC01** | `var_1` | $LB_1$ (min) | `[Giá trị LB1]` | `[Nom2]` | `[Giá trị hợp lệ]` | [Kết quả thành công cụ thể] |
| **TC02** | `var_1` | $LB_1 + \epsilon$ (min+) | `[Giá trị LB1 + ϵ]`| `[Nom2]` | `[Giá trị hợp lệ]` | [Kết quả thành công cụ thể] |
| **TC03** | `var_1` | $UB_1 - \epsilon$ (max-) | `[Giá trị UB1 - ϵ]`| `[Nom2]` | `[Giá trị hợp lệ]` | [Kết quả thành công cụ thể] |
| **TC04** | `var_1` | $UB_1$ (max) | `[Giá trị UB1]` | `[Nom2]` | `[Giá trị hợp lệ]` | [Kết quả thành công cụ thể] |
| **TC05** | `var_1` | $LB_1 - \epsilon$ (min-) | `[Giá trị LB1 - ϵ]`| `[Nom2]` | `[Giá trị hợp lệ]` | [Thông báo lỗi vi phạm LB1] |
| **TC06** | `var_1` | $UB_1 + \epsilon$ (max+) | `[Giá trị UB1 + ϵ]`| `[Nom2]` | `[Giá trị hợp lệ]` | [Thông báo lỗi vi phạm UB1] |
| **TC07** | `var_2` | $LB_2$ (min) | `[Nom1]` | `[Giá trị LB2]` | `[Giá trị hợp lệ]` | [Kết quả thành công cụ thể] |
| **TC08** | `var_2` | $LB_2 + \epsilon$ (min+) | `[Nom1]` | `[Giá trị LB2 + ϵ]`| `[Giá trị hợp lệ]` | [Kết quả thành công cụ thể] |
| **TC09** | `var_2` | $UB_2 - \epsilon$ (max-) | `[Nom1]` | `[Giá trị UB2 - ϵ]`| `[Giá trị hợp lệ]` | [Kết quả thành công cụ thể] |
| **TC10** | `var_2` | $UB_2$ (max) | `[Nom1]` | `[Giá trị UB2]` | `[Giá trị hợp lệ]` | [Kết quả thành công cụ thể] |
| **TC11** | `var_2` | $LB_2 - \epsilon$ (min-) | `[Nom1]` | `[Giá trị LB2 - ϵ]`| `[Giá trị hợp lệ]` | [Thông báo lỗi vi phạm LB2] |
| **TC12** | `var_2` | $UB_2 + \epsilon$ (max+) | `[Nom1]` | `[Giá trị UB2 + ϵ]`| `[Giá trị hợp lệ]` | [Thông báo lỗi vi phạm UB2] |
| **TC13** | Baseline | $Nom$ (All nominal) | `[Nom1]` | `[Nom2]` | `[Giá trị hợp lệ]` | [Kết quả thành công tiêu chuẩn] |

---

## BƯỚC 5: KẾT QUẢ THỰC THI & PHÁT HIỆN LỖI BIÊN (DEFECT LOG)

| TC ID | Giá trị Đầu Vào Kiểm Thử | Expected Output (SRS) | Actual Output (SUT) | Kết luận (Pass / Fail) | Mô tả Chi tiết Lỗi (Bug Description) |
| :---: | :--- | :--- | :--- | :---: | :--- |
| `TCxx` | `var_1 = ..., var_2 = ...` | [Kỳ vọng] | [Thực tế] | **FAIL (BUG)** | [Mã nguồn sai điều kiện so sánh `<` vs `<=`, off-by-one] |
