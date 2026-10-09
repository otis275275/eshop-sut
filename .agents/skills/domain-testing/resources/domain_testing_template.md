# Biểu mẫu Báo cáo: Domain Testing (Equivalence Partitioning)

Tài liệu này cung cấp khung mẫu chuẩn mực (Markdown Template) để áp dụng kỹ thuật Domain Testing cho bất kỳ chức năng nào trong bài tập HW02. Biểu mẫu tuân thủ nghiêm ngặt chuẩn bài giảng FIT - HCMUS (Slide 16, 17, 18), yêu cầu **liệt kê đầy đủ (brute-force) toàn bộ các ca kiểm thử sơ bộ cho từng EC** với giá trị cụ thể, không được dùng placeholder chung chung.

---

# BÁO CÁO KIỂM THỬ: DOMAIN TESTING
**Chức năng**: [Mã chức năng: VD FR-09: Áp dụng mã giảm giá]  
**Người thực hiện**: [Họ và tên - MSSV]  
**Ngày thực hiện**: [YYYY-MM-DD]  

---

## BƯỚC 1: XÁC ĐỊNH ĐẦU VÀO VÀ ĐẦU RA (INPUTS & OUTPUTS)

### 1.1. Bảng Biến Đầu vào (Inputs)
| Tên Biến / Thuộc tính | Kiểu Dữ liệu | Ràng buộc nghiệp vụ (Đặc tả SRS) | Giá trị Hợp lệ Mặc định (Nominal Value) |
| :--- | :--- | :--- | :--- |
| `input_1` | [Kiểu DL] | [Mô tả chi tiết ràng buộc theo SRS] | `[Giá trị hợp lệ cụ thể để dùng làm chuẩn]` |
| `input_2` | [Kiểu DL] | [Mô tả chi tiết ràng buộc theo SRS] | `[Giá trị hợp lệ cụ thể để dùng làm chuẩn]` |
| `state_db` | [Trạng thái] | [Ràng buộc trạng thái CSDL / Phiên đăng nhập] | `[Trạng thái hợp lệ chuẩn]` |

### 1.2. Bảng Biến Đầu ra (Outputs)
| Tên Đầu ra | Loại Đầu ra | Kết quả mong đợi (SRS) |
| :--- | :--- | :--- |
| `Output_Success` | Trạng thái / Dữ liệu trả về | HTTP 200/201, Dữ liệu phản hồi, CSDL cập nhật thành công |
| `Output_Error_1` | Thông báo ngoại lệ | HTTP 400 Bad Request, Thông báo lỗi cụ thể |
| `Output_Error_2` | Thông báo ngoại lệ | HTTP 404 Not Found, Thông báo lỗi cụ thể |

---

## BƯỚC 2: XÁC ĐỊNH LỚP TƯƠNG ĐƯƠNG VÀ GIÁ TRỊ ĐẠI DIỆN

> **Quy định bắt buộc**: Mỗi lớp tương đương (cả Valid và Invalid) **BẮT BUỘC PHẢI ĐƯỢC CHỌN SẴN 1 GIÁ TRỊ ĐẠI DIỆN CỤ THỂ** ngay tại bảng này để sử dụng xuyên suốt ở Bước 3 và Bước 4.

### Bảng Tổng hợp Lớp Tương đương (Equivalence Partitioning Table)
| STT | Biến / Điều kiện liên quan | Mã Lớp (EC ID) | Mô tả Lớp tương đương | Loại (Valid / Invalid) | Giá trị đại diện cụ thể ($Val_{rep}$) |
| :---: | :--- | :---: | :--- | :---: | :--- |
| 1 | `input_1` | **EC01** | [Mô tả miền hợp lệ của input_1] | **Valid** | `[Ví dụ: 10, "SAVE10", ...]` |
| 2 | | **EC02** | [Mô tả miền không hợp lệ thứ nhất của input_1] | **Invalid** | `[Ví dụ: -5, "FAKECODE", ...]` |
| 3 | | **EC03** | [Mô tả miền không hợp lệ thứ hai của input_1] | **Invalid** | `[Ví dụ: 999, "", ...]` |
| 4 | `input_2` | **EC04** | [Mô tả miền hợp lệ của input_2] | **Valid** | `[Ví dụ: 400000, "user@test.com"]` |
| 5 | | **EC05** | [Mô tả miền không hợp lệ của input_2] | **Invalid** | `[Ví dụ: 50000, "invalid-email"]` |
| 6 | `Output` | **EC06** | Xử lý thành công theo nghiệp vụ | **Valid** | Trả về kết quả đúng / HTTP 200 |
| 7 | | **EC07** | Thông báo lỗi khi vi phạm ràng buộc | **Invalid** | Thông báo lỗi tương ứng / HTTP 4xx |

---

## BƯỚC 3: XÁC ĐỊNH CÁC CA KIỂM THỬ SƠ BỘ (BẢNG DUYỆT ĐẦY ĐỦ TẤT CẢ ECs)

> [!IMPORTANT]
> **QUY TẮC THIẾT LẬP BẢNG SƠ BỘ (THEO SLIDE 17 BÀI GIẢNG FIT - HCMUS):**
> 1. Bảng này phải duyệt **TUẦN TỰ VÀ ĐẦY ĐỦ 100% CÁC LỚP TƯƠNG ĐƯƠNG** từ $EC01, EC02, \dots$ đến lớp cuối cùng. Không được bỏ qua bất kỳ EC nào.
> 2. Với mỗi dòng kiểm thử lớp tương đương $EC_k$:
>    - Biến thuộc $EC_k$ nhận đúng **giá trị đại diện cụ thể** đã xác định ở Bước 2.
>    - **Tất cả các biến còn lại BẮT BUỘC nhận giá trị đại diện HỢP LỆ CỤ THỂ** (Nominal Valid Value) đã chốt ở Bước 2 để đảm bảo nguyên tắc **Cô lập lỗi (Fault Isolation)**. Tuyệt đối KHÔNG viết chung chung "giá trị hợp lệ", phải ghi rõ giá trị số/chuỗi thực tế!
>    - Cột kết quả mong đợi ghi rõ giá trị hoặc thông báo lỗi cụ thể.

### Bảng Tổng hợp Ca Kiểm thử Sơ bộ (Full Preliminary Test Cases)
| STT | Lớp Tương Đương Được Test | `input_1` (Giá trị cụ thể) | `input_2` (Giá trị cụ thể) | `state_db` (Giá trị cụ thể) | Output mong đợi cụ thể (Expected Output) |
| :---: | :---: | :--- | :--- | :--- | :--- |
| **1** | **EC01** (input_1: Valid) | `[Giá trị rep của EC01]` | `[Giá trị rep HỢP LỆ của input_2]` | `[Trạng thái HỢP LỆ chuẩn]` | `[Kết quả thành công cụ thể]` |
| **2** | **EC02** (input_1: Invalid 1) | `[Giá trị rep của EC02]` | `[Giá trị rep HỢP LỆ của input_2]` | `[Trạng thái HỢP LỆ chuẩn]` | `[Thông báo lỗi cụ thể cho EC02]` |
| **3** | **EC03** (input_1: Invalid 2) | `[Giá trị rep của EC03]` | `[Giá trị rep HỢP LỆ của input_2]` | `[Trạng thái HỢP LỆ chuẩn]` | `[Thông báo lỗi cụ thể cho EC03]` |
| **4** | **EC04** (input_2: Valid) | `[Giá trị rep HỢP LỆ của input_1]` | `[Giá trị rep của EC04]` | `[Trạng thái HỢP LỆ chuẩn]` | `[Kết quả thành công cụ thể]` |
| **5** | **EC05** (input_2: Invalid) | `[Giá trị rep HỢP LỆ của input_1]` | `[Giá trị rep của EC05]` | `[Trạng thái HỢP LỆ chuẩn]` | `[Thông báo lỗi cụ thể cho EC05]` |
| **6** | **EC06** (Output: Thành công)| `[Giá trị rep HỢP LỆ của input_1]` | `[Giá trị rep HỢP LỆ của input_2]` | `[Trạng thái HỢP LỆ chuẩn]` | `[Kết quả thành công cụ thể]` |
| **7** | **EC07** (Output: Lỗi vi phạm)| `[Giá trị đại diện vi phạm]` | `[Giá trị rep HỢP LỆ của input_2]` | `[Trạng thái HỢP LỆ chuẩn]` | `[Thông báo lỗi cụ thể]` |

*(Số lượng dòng ở bảng này bằng chính xác tổng số lớp tương đương đã liệt kê ở Bước 2)*

---

## BƯỚC 4: BẢNG RÚT GỌN CÁC CA KIỂM THỬ (OPTIMIZED TEST CASES)

### 4.1. Phân tích Rút gọn (Test Case Reduction Analysis)
- Chỉ ra các dòng ở Bước 3 có bộ dữ liệu đầu vào và kết quả mong đợi hoàn toàn trùng nhau (ví dụ: dòng 1 test `EC01`, dòng 4 test `EC04`, dòng 6 test `EC06` cùng sử dụng chung bộ giá trị hợp lệ).
- Gom các dòng trùng này lại thành **1 Ca Kiểm thử Hợp lệ duy nhất** bao phủ đồng thời các lớp tương đương hợp lệ đó (`EC01, EC04, EC06`).
- Các ca kiểm thử không hợp lệ (mỗi ca cô lập 1 Invalid EC duy nhất) được giữ nguyên độc lập để đảm bảo khả năng cô lập lỗi.

### 4.2. Bảng Rút gọn các Ca Kiểm thử (Theo Slide 18 FIT - HCMUS)
| STT (TC ID) | Lớp Tương Đương Phủ (Covered ECs) | `input_1` (Cụ thể) | `input_2` (Cụ thể) | `state_db` (Cụ thể) | Output Mong Đợi Cụ Thể |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **TC01** | **EC01, EC04, EC06** | `[Giá trị cụ thể]` | `[Giá trị cụ thể]` | `[Giá trị cụ thể]` | `[Kết quả thành công cụ thể]` |
| **TC02** | **EC02, EC07** | `[Giá trị cụ thể]` | `[Giá trị cụ thể]` | `[Giá trị cụ thể]` | `[Thông báo lỗi cụ thể]` |
| **TC03** | **EC03, EC07** | `[Giá trị cụ thể]` | `[Giá trị cụ thể]` | `[Giá trị cụ thể]` | `[Thông báo lỗi cụ thể]` |
| **TC04** | **EC05, EC07** | `[Giá trị cụ thể]` | `[Giá trị cụ thể]` | `[Giá trị cụ thể]` | `[Thông báo lỗi cụ thể]` |

### 4.3. Bảng Đặc tả Chi tiết Thực thi (Test Execution Specification)
| TC ID | Tiền điều kiện (Preconditions) | Các bước thực hiện (Steps) | Dữ liệu Test (Payload / UI Data) | Kết quả mong đợi (Expected) | Trạng thái thực tế (Actual / Status) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `TC01` | [Mô tả] | 1. ...<br>2. ... | `{ ... }` | [Chi tiết] | [Pass / Fail / Bug #] |
