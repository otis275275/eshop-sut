# Lý thuyết & Quy tắc Heuristic: Domain Testing (Equivalence Partitioning)

Tài liệu này tổng hợp toàn bộ cơ sở lý thuyết, định nghĩa chuẩn và các quy tắc heuristic từ bài giảng **"KCPM - Bài 4: Phân hoạch tương đương và Giá trị biên"** cùng video bài giảng của ThS. Trần Thị Bích Hạnh (Khoa CNTT - ĐH Khoa học Tự nhiên, ĐHQG-HCM).

---

## 1. Các Khái niệm Cơ bản

### 1.1. Miền giá trị (Domain)
- Trong kiểm thử phần mềm, **miền giá trị (domain)** là tập hợp tất cả các giá trị có thể được đưa vào làm đầu vào hoặc được sinh ra ở đầu ra của một biến hay thuộc tính cụ thể.
- Miền giá trị bao gồm cả **tập giá trị hợp lệ (valid)** và **tập giá trị không hợp lệ (invalid)**.
- Đối với hầu hết các bài toán thực tế, không gian kiểm thử là **vô hạn** hoặc quá lớn để kiểm thử vét cạn (exhaustive testing). Vì vậy cần một kỹ thuật phân chia có tính đại diện cao.

### 1.2. Lớp tương đương (Equivalence Class - EC)
- **Lớp tương đương** là tập con của miền giá trị, tập hợp các phần tử dữ liệu mà ta giả định chương trình sẽ có **cùng hành vi hoặc cùng cách thức xử lý**.
- Khái niệm "giống nhau" ở đây không bắt buộc là kết quả tính toán số học bằng nhau, mà là **đường đi thực thi (code path), logic kiểm tra và phản ứng của hệ thống** là như nhau.
  - *Ví dụ từ bài giảng*: Với chương trình cộng 2 số có 1 chữ số: $1 + 2 = 3$ và $3 + 4 = 7$. Cả hai trường hợp đều là số nguyên dương 1 chữ số và kết quả là số nguyên dương 1 chữ số, nên cách thức xử lý trong mã nguồn là tương đương nhau.
- **Giả định then chốt**:
  - Nếu chọn một giá trị đại diện trong lớp tương đương và nó chạy **đúng**, ta có độ tin cậy cao rằng các giá trị khác trong cùng lớp đó cũng sẽ chạy **đúng**.
  - Nếu giá trị đại diện phát hiện **lỗi**, các giá trị khác trong lớp đó cũng sẽ bộc lộ **cùng một lỗi đó**.

---

## 2. Các Quy tắc Heuristic Xác định Lớp Tương đương

Xác định lớp tương đương là một quá trình **heuristic** dựa vào kinh nghiệm, đặc tả hệ thống và tri thức về miền ứng dụng. Giảng viên đưa ra các chỉ dẫn cụ thể:

### Quy tắc 1: Phạm vi giá trị (Continuous/Sequential Range $[A..B]$)
- Khi điều kiện đầu vào quy định giá trị nằm trong một khoảng $[A, B]$:
  - **1 Lớp tương đương Hợp lệ (Valid EC)**: $A \le x \le B$
  - **2 Lớp tương đương Không hợp lệ (Invalid ECs)**:
    - $x < A$ (dưới ngưỡng tối thiểu)
    - $x > B$ (vượt ngưỡng tối đa)

### Quy tắc 2: Tập giá trị rời rạc hữu hạn (Discrete Set $\{V_1, V_2, \dots, V_m\}$)
- Khi điều kiện đầu vào quy định giá trị phải thuộc một tập hợp hữu hạn (ví dụ: phương tiện giao thông `{Bus, Truck, Taxi, Passenger, Motorcycle}`, hoặc phương thức thanh toán `{COD, Banking, Momo}`):
  - Nếu hệ thống xử lý từng giá trị theo các nghiệp vụ/giao diện khác nhau: **Mỗi giá trị hợp lệ hình thành 1 Lớp tương đương Hợp lệ riêng biệt**.
  - **1 Lớp tương đương Không hợp lệ**: Giá trị không nằm trong tập hợp hợp lệ.

### Quy tắc 3: Điều kiện Bắt buộc ("Must Be" / Định dạng đặc thù)
- Khi điều kiện chỉ rõ một thuộc tính bắt buộc (ví dụ: ký tự đầu của ID phải là chữ cái; chuỗi phải là định dạng email chuẩn; mật khẩu phải chứa ký tự đặc biệt):
  - **1 Lớp tương đương Hợp lệ**: Thỏa mãn điều kiện bắt buộc.
  - **1 Lớp tương đương Không hợp lệ**: Vi phạm điều kiện bắt buộc.

### Quy tắc 4: Phân hoạch bổ sung (Sub-partitioning Heuristic)
- Nếu người kiểm thử có lý do tin rằng bên trong một lớp tương đương hợp lệ có thể tồn tại các nhánh logic rẽ khác nhau:
  - Ví dụ: Khoảng số $[-99..99]$ có thể phân rã thành: số âm $[-99..-1]$, số không $[0]$, và số dương $[1..99]$.
  - Hoặc đối với trường chuỗi: chuỗi rỗng `""`, chuỗi toàn khoảng trắng `"   "`, chuỗi chứa ký tự Unicode tiếng Việt, chuỗi chứa thẻ HTML/script.

---

## 3. Nguyên tắc Thiết kế Ca Kiểm thử & Cô lập Lỗi (Fault Isolation)

Sau khi lập bảng phân hoạch tương đương, bước ghép các biến vào ca kiểm thử phải tuân theo 2 nguyên tắc vàng:

### 3.1. Phủ Tối đa các Lớp Hợp lệ (Maximize Valid EC Coverage)
- Kết hợp đồng thời nhiều giá trị đại diện hợp lệ của các biến khác nhau vào trong một ca kiểm thử.
- Tiếp tục thiết kế các ca kiểm thử cho đến khi **toàn bộ các lớp hợp lệ (Valid ECs)** của tất cả các biến đều xuất hiện ít nhất một lần.
- Rút gọn các ca kiểm thử hợp lệ trùng lặp.

### 3.2. Cô lập Tuyệt đối Lớp Không hợp lệ (Single Invalid Fault Isolation)
- **Quy tắc**: Mỗi ca kiểm thử kiểm tra một giá trị không hợp lệ **CHỈ ĐƯỢC PHÉP CHỨA ĐÚNG 1 LỚP TƯƠNG ĐƯƠNG KHÔNG HỢP LỆ CỦA 1 BIẾN DUY NHẤT**.
- Tất cả các biến còn lại trong ca kiểm thử đó **BẮT BUỘC PHẢI CHỌN GIÁ TRỊ THUỘC MIỀN HỢP LỆ (VALID)**.
- **Lý do khoa học**: 
  - Nếu trong một ca kiểm thử ta đưa vào cùng lúc 2 giá trị không hợp lệ (ví dụ: email sai định dạng AND mật khẩu dưới 8 ký tự), khi hệ thống báo lỗi:
    1. Kiểm thử viên không thể xác định lỗi hiển thị là do email hay do mật khẩu gây ra.
    2. Nếu hệ thống validate tuần tự và dừng ngay ở lỗi đầu tiên (fail-fast), đoạn mã kiểm tra lỗi thứ hai sẽ bị che khuất (masking fault), dẫn đến việc bỏ sót bug nghiêm trọng ở trường thứ hai.
