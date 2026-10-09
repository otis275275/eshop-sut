# Biểu mẫu Báo cáo: Domain Testing (Equivalence Partitioning)

Tài liệu này cung cấp khung mẫu chuẩn mực (Markdown Template) để áp dụng kỹ thuật Domain Testing cho bất kỳ chức năng nào trong bài tập HW02.

---

# BÁO CÁO KIỂM THỬ: DOMAIN TESTING
**Chức năng**: [Mã chức năng: VD FR-01: Đăng ký tài khoản]  
**Người thực hiện**: [Tên / MSSV]  
**Ngày thực hiện**: [YYYY-MM-DD]  

---

## BƯỚC 1: XÁC ĐỊNH ĐẦU VÀO VÀ ĐẦU RA (INPUTS & OUTPUTS)

### 1.1. Bảng Biến Đầu vào (Inputs)
| Tên Biến / Trường | Kiểu Dữ liệu | Ràng buộc nghiệp vụ (Đặc tả SRS) | Nguồn cung cấp (UI / API Body / Params) |
| :--- | :--- | :--- | :--- |
| `variable_1` | String / Number / Enum | [Mô tả chi tiết các ràng buộc từ SRS] | UI Form input / API JSON field |
| `variable_2` | String / Number / Enum | ... | ... |

### 1.2. Bảng Biến Đầu ra (Outputs)
| Tên Đầu ra | Loại Đầu ra | Kết quả mong đợi (SRS) |
| :--- | :--- | :--- |
| `Output_Success` | Trạng thái / Dữ liệu | HTTP 200/201, Redirect, Bản ghi CSDL được tạo |
| `Output_Error_1` | Thông báo ngoại lệ | HTTP 400/404, Thông báo lỗi cụ thể hiển thị trên UI |

---

## BƯỚC 2: XÁC ĐỊNH LỚP TƯƠNG ĐƯƠNG (EQUIVALENCE CLASSES)

### Bảng Tổng hợp Lớp Tương đương (Equivalence Partitioning Table)
| Biến liên quan | Điều kiện kiểm tra | Mã Lớp (EC ID) | Mô tả Lớp tương đương | Loại (Valid / Invalid) | Giá trị đại diện đề xuất |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `variable_1` | [VD: Độ dài chuỗi] | **EC01** | Chuỗi có độ dài hợp lệ [A..B] | Valid | `"abcxyz"` |
| | | **EC02** | Chuỗi có độ dài < A | Invalid | `"a"` |
| | | **EC03** | Chuỗi có độ dài > B | Invalid | `"a...very_long"` |
| `variable_2` | [VD: Định dạng] | **EC04** | Đúng định dạng quy chuẩn | Valid | `"test@domain.com"` |
| | | **EC05** | Sai định dạng quy chuẩn | Invalid | `"invalid-email"` |
| `Output` | [Kết quả xử lý] | **EC_OUT1** | Thành công (Success / Saved) | Valid | `200 OK` |
| | | **EC_OUT2** | Lỗi vi phạm (Validation Error) | Invalid | `400 Bad Request` |

---

## BƯỚC 3: THIẾT KẾ CA KIỂM THỬ VÀ CÔ LẬP LỖI (FAULT ISOLATION)

### 3.1. Chiến lược Ghép Giá trị
1. **Ca kiểm thử hợp lệ (Positive Test Cases)**: Ghép tối đa các Valid ECs (`EC01`, `EC04`, ...) vào một ca kiểm thử duy nhất để tối ưu số ca kiểm thử.
2. **Ca kiểm thử không hợp lệ (Negative Test Cases)**: Áp dụng nghiêm ngặt nguyên tắc **Single Fault Assumption**: mỗi ca kiểm thử chỉ chứa duy nhất 1 Invalid EC, các biến còn lại mang giá trị hợp lệ danh nghĩa (Nominal/Valid).

### 3.2. Bảng Tổng hợp Ca Kiểm thử Sơ bộ
| STT | Lớp tương đương được test | Input 1 (`var_1`) | Input 2 (`var_2`) | Output mong đợi |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `EC01` (Valid) | Giá trị hợp lệ 1 | Giá trị hợp lệ 2 | Thành công |
| 2 | `EC02` (Invalid) | Giá trị lỗi (quá ngắn) | Giá trị hợp lệ 2 | Thông báo lỗi Input 1 |
| 3 | `EC03` (Invalid) | Giá trị lỗi (quá dài) | Giá trị hợp lệ 2 | Thông báo lỗi Input 1 |
| 4 | `EC04` (Valid) | Giá trị hợp lệ 1 | Giá trị hợp lệ 2 | Thành công (trùng TC1) |
| 5 | `EC05` (Invalid) | Giá trị hợp lệ 1 | Giá trị sai định dạng | Thông báo lỗi Input 2 |

---

## BƯỚC 4: BẢNG RÚT GỌN VÀ ĐẶC TẢ CA KIỂM THỬ CHI TIẾT (FINAL TEST CASES)

### Bảng Rút gọn Ca Kiểm thử (Optimized Test Case Matrix)
| TC ID | Mục tiêu Kiểm thử | Các EC được bao phủ | Giá trị Input cụ thể | Kết quả mong đợi (Expected Output) |
| :--- | :--- | :--- | :--- | :--- |
| `DT_TC01` | Kiểm thử thành công toàn bộ trường hợp hợp lệ | `EC01, EC04, EC_OUT1` | `var_1 = "valid"`, `var_2 = "valid"` | Thành công, CSDL cập nhật, HTTP 200 |
| `DT_TC02` | Kiểm thử Input 1 bị quá ngắn | `EC02, EC_OUT2` | `var_1 = "a"`, `var_2 = "valid"` | Báo lỗi Input 1 quá ngắn, HTTP 400 |
| `DT_TC03` | Kiểm thử Input 1 bị quá dài | `EC03, EC_OUT2` | `var_1 = "very long"`, `var_2 = "valid"` | Báo lỗi Input 1 quá dài, HTTP 400 |
| `DT_TC04` | Kiểm thử Input 2 sai định dạng | `EC05, EC_OUT2` | `var_1 = "valid"`, `var_2 = "bad"` | Báo lỗi Input 2 sai format, HTTP 400 |

### Đánh giá Độ phủ Domain (Coverage Analysis)
- Tổng số Lớp tương đương hợp lệ: $N_{valid}$, số lớp đã phủ: $N_{valid}$ ($100\%$).
- Tổng số Lớp tương đương không hợp lệ: $N_{invalid}$, số lớp đã phủ: $N_{invalid}$ ($100\%$).
- Đảm bảo 100% các lớp tương đương đều có ca kiểm thử độc lập bao phủ.
