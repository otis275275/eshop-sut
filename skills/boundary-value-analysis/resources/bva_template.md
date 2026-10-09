# Biểu mẫu Báo cáo: Boundary Value Analysis (BVA)

Tài liệu này cung cấp khung mẫu chuẩn mực (Markdown Template) để áp dụng kỹ thuật Boundary Value Analysis cho bất kỳ chức năng nào trong bài tập HW02.

---

# BÁO CÁO KIỂM THỬ: BOUNDARY VALUE ANALYSIS
**Chức năng**: [Mã chức năng: VD FR-09: Mã Giảm Giá]  
**Người thực hiện**: [Tên / MSSV]  
**Ngày thực hiện**: [YYYY-MM-DD]  

---

## BƯỚC 1: XÁC ĐỊNH CÁC BIẾN CÓ THỨ TỰ (ORDERED VARIABLES)

| Tên Biến | Kiểu Dữ liệu | Miền giá trị hợp lệ danh nghĩa $[LB..UB]$ | Bước nhảy tối thiểu ($\epsilon$) | Lý do xác định biên |
| :--- | :--- | :--- | :--- | :--- |
| `var_1` | Integer | $[min_1 .. max_1]$ | 1 | Ràng buộc số lượng/đếm |
| `var_2` | Currency / Float | $[min_2 .. max_2]$ | 1 (hoặc 1,000) | Ngưỡng giá trị hóa đơn |

---

## BƯỚC 2: BẢNG XÁC ĐỊNH TẬP ĐIỂM BIÊN (BOUNDARY POINTS EXTRACTION)

### Bảng Điểm Biên theo Kỹ thuật 3 Điểm (3-Point BVA)
| Biến | Điểm Biên | Ký hiệu | Giá trị cụ thể | Tính hợp lệ | Hành vi hệ thống kỳ vọng |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `var_1` | Dưới biên dưới | $LB - \epsilon$ | [Giá trị] | Invalid | Báo lỗi vi phạm biên dưới |
| | Ngay biên dưới | $LB$ | [Giá trị] | Valid | Chấp nhận giá trị nhỏ nhất |
| | Trên biên dưới | $LB + \epsilon$ | [Giá trị] | Valid | Chấp nhận bình thường |
| | Giá trị định danh | $Nom$ | [Giá trị ở giữa] | Valid | Chấp nhận bình thường |
| | Dưới biên trên | $UB - \epsilon$ | [Giá trị] | Valid | Chấp nhận bình thường |
| | Ngay biên trên | $UB$ | [Giá trị] | Valid | Chấp nhận giá trị lớn nhất |
| | Trên biên trên | $UB + \epsilon$ | [Giá trị] | Invalid | Báo lỗi vượt quá biên trên |

---

## BƯỚC 3: MÔ HÌNH VÀ CHIẾN LƯỢC KẾT HỢP BIẾN (MODEL SELECTION)
- **Mô hình lựa chọn**: [Standard BVA ($4n+1$) / Robustness ($6n+1$) / Worst-Case ($5^n$)]
- **Số biến có thứ tự ($n$)**: [Số lượng]
- **Số ca kiểm thử dự kiến**: [Theo công thức mô hình đã chọn]
- **Quy tắc cô lập biến**: Khi kiểm tra điểm biên của 1 biến, các biến còn lại giữ ở giá trị Nominal:
  - $Nom(var_1) = \dots$
  - $Nom(var_2) = \dots$

---

## BƯỚC 4: BẢNG ĐẶC TẢ CA KIỂM THỬ BIÊN CHI TIẾT (BVA TEST SUITE)

| TC ID | Biến & Điểm Biên Được Kiểm Tra | Loại Điểm | Giá trị Input cụ thể | Kết quả mong đợi (Expected Output) |
| :--- | :--- | :--- | :--- | :--- |
| `BVA_TC01` | Baseline (Tất cả biến Nominal) | $Nom$ | `var_1 = nom1, var_2 = nom2` | Thành công bình thường (200 OK) |
| `BVA_TC02` | `var_1` tại $LB - \epsilon$ | Invalid | `var_1 = lb1 - 1, var_2 = nom2` | Lỗi vi phạm `var_1` (400 Bad Request) |
| `BVA_TC03` | `var_1` tại $LB$ | Valid | `var_1 = lb1, var_2 = nom2` | Chấp nhận thành công (200 OK) |
| `BVA_TC04` | `var_1` tại $LB + \epsilon$ | Valid | `var_1 = lb1 + 1, var_2 = nom2` | Chấp nhận thành công (200 OK) |
| `BVA_TC05` | `var_1` tại $UB - \epsilon$ | Valid | `var_1 = ub1 - 1, var_2 = nom2` | Chấp nhận thành công (200 OK) |
| `BVA_TC06` | `var_1` tại $UB$ | Valid | `var_1 = ub1, var_2 = nom2` | Chấp nhận thành công (200 OK) |
| `BVA_TC07` | `var_1` tại $UB + \epsilon$ | Invalid | `var_1 = ub1 + 1, var_2 = nom2` | Lỗi vượt quá `var_1` (400 Bad Request) |
| `BVA_TC08` | `var_2` tại $LB - \epsilon$ | Invalid | `var_1 = nom1, var_2 = lb2 - 1` | Lỗi vi phạm `var_2` (400 Bad Request) |
| `BVA_TC09` | `var_2` tại $LB$ | Valid | `var_1 = nom1, var_2 = lb2` | Chấp nhận thành công (200 OK) |
| ... | ... | ... | ... | ... |

---

## KẾT QUẢ THỰC THI & LỖI BIÊN PHÁT HIỆN ĐƯỢC (DEFECT SUMMARY)
| TC ID | Actual Output | So khớp Expected vs Actual | Kết luận (Pass / Fail / Bug) |
| :--- | :--- | :--- | :--- |
| `BVA_TCxx` | ... | Lệch điều kiện `<` vs `<=` | **BUG**: Mô tả chi tiết lỗi phát hiện |
