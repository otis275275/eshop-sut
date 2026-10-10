# BÁO CÁO THIẾT KẾ & THỰC THI KIỂM THỬ: FR-07 GIỎ HÀNG (SHOPPING CART)

- **Mã chức năng**: **FR-07** (Thuộc Pool B — Shopping Cart and Checkout)
- **Hệ thống kiểm thử (SUT)**: EShop Platform
  - **Tầng Frontend**: React + Vite + Tailwind CSS (`http://localhost:5173/cart`)
  - **Tầng Backend**: Node.js + Express + SQLite API (`GET /api/cart`, `POST /api/cart`)
- **Phạm vi kiểm thử Đa tầng (Full-Stack Scope)**:
  - **Kiểm thử Giao diện & State Client (FE)**: Render bảng 5 cột, gộp số lượng khi thêm trùng, nút tăng giảm `+/-`, dialog xác nhận khi xóa, nhãn "Tổng cộng", trạng thái Empty State có hình minh họa.
  - **Kiểm thử API & Tính toàn vẹn Dữ liệu (BE)**: Kiểm tra payload API `POST /api/cart`, validate `product_id` tồn tại trong CSDL, validate số lượng dương ($q \ge 1$), từ chối ID/số lượng không hợp lệ hoặc số âm.
- **Kỹ thuật áp dụng**:
  1. **Domain Testing (Phân hoạch tương đương — Equivalence Partitioning)** theo chuẩn 4 bước FIT - HCMUS (Slide 16, 17, 18).
  2. **Boundary Value Analysis (Phân tích giá trị biên)** theo mô hình chuẩn hóa duy nhất **Robustness Testing ($f = 6n + 1$)** (Slide 23, 26).
- **Dữ liệu mẫu kiểm thử định danh**:
  - Người dùng test: `test@eshop.com` / Mật khẩu: `Test1234!`
  - **SP1** (ID: 1): `iPhone 15 Pro Max` — Đơn giá: **$30,000,000$ ₫**
  - **SP2** (ID: 2): `Samsung Galaxy S24 Ultra` — Đơn giá: **$28,000,000$ ₫**
  - **SP3** (ID: 3): `MacBook Pro M3` — Đơn giá: **$45,000,000$ ₫**
  - **SP4** (ID: 4): `Tai nghe AirPods Pro 2` — Đơn giá: **$6,000,000$ ₫**
  - **SP5** (ID: 5): `Bàn phím cơ Keychron Q1` — Đơn giá: **$4,000,000$ ₫**

---

## 1. ĐẶC TẢ NGHIỆP VỤ (REQUIREMENT SPECIFICATION)

Căn cứ theo [README.md](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/README.md) (Mục 4 - FR-07) và [api_specification.md](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/api_specification.md) (Mục 4.1, 4.2):

1. **Hiển thị danh sách sản phẩm trong giỏ**:
   - Bảng giỏ hàng phải hiển thị đầy đủ 5 cột: **Sản phẩm**, **Đơn giá**, **Số lượng** (có nút `+` / `-` để tăng giảm), **Thành tiền** ($Thành\ tiền = Đơn\ giá \times Số\ lượng$), **Thao tác** (nút Xóa).
2. **Cơ chế thêm sản phẩm trùng lặp**:
   - Khi thêm một sản phẩm đã tồn tại sẵn trong giỏ, hệ thống phải **tăng số lượng của sản phẩm đó**, **tuyệt đối không tạo dòng mới** trong danh sách giỏ hàng.
3. **Cơ chế xác nhận khi xóa**:
   - Nút **Xóa sản phẩm** phải bật **hộp thoại xác nhận (Confirmation Dialog)** trước khi thực hiện xóa khỏi giỏ hàng. Nếu người dùng chọn Hủy, sản phẩm vẫn được giữ nguyên.
4. **Điều hướng tiếp tục mua sắm**:
   - Giao diện phải có nút/liên kết với nhãn chính xác **"Tiếp tục mua sắm"** để điều hướng người dùng quay về trang chủ (`/`).
5. **Độ chính xác của nhãn Tổng tiền**:
   - Nhãn hiển thị tổng tiền thanh toán bắt buộc phải là **"Tổng cộng"** (không được ghi là "Tổng tạm tính").
6. **Trạng thái giỏ hàng trống (Empty State)**:
   - Khi giỏ hàng không có sản phẩm nào (`cart.length = 0`), giao diện phải hiển thị **hình minh họa** (illustration) cùng **thông báo rõ ràng** và nút "Tiếp tục mua sắm".
7. **Ràng buộc số lượng & Điều chỉnh số lượng**:
   - Số lượng sản phẩm hợp lệ là số nguyên dương $q \in [1 \dots 99]$.
   - Khi bấm nút `-` ở mức $q = 1$, hệ thống phải giữ nguyên ở mức 1 hoặc hiển thị xác nhận xóa, không cho phép số lượng tụt về $\le 0$.
8. **Ràng buộc toàn vẹn dữ liệu Backend API (`POST /api/cart`)**:
   - `product_id` phải là số nguyên dương và **phải tồn tại trong CSDL**.
   - `quantity` phải là số nguyên dương $\ge 1$. Từ chối mọi giá trị $\le 0$, số thực, hoặc chuỗi không hợp lệ với mã HTTP 400.

---

# PHẦN A: THIẾT KẾ KIỂM THỬ VỚI DOMAIN TESTING (EQUIVALENCE PARTITIONING)

---

### BƯỚC 1: XÁC ĐỊNH ĐẦU VÀO VÀ ĐẦU RA (INPUTS & OUTPUTS)

#### 1.1. Bảng Biến Đầu vào (FE Inputs, API Payloads & Database State Fixtures)
| Tên Biến / Thuộc tính | Phân loại | Kiểu Dữ liệu | Ràng buộc nghiệp vụ (SRS & API) | Giá trị Hợp lệ Mặc định ($Nom$) |
| :--- | :--- | :--- | :--- | :--- |
| `cart_items_count` | State Input (Giỏ hàng) | Integer | Số lượng loại sản phẩm trong giỏ ($\ge 0$) | `2` loại sản phẩm (`SP1 x 1, SP2 x 2`) |
| `product_id` | Direct Input (API/PDP) | Integer | ID sản phẩm cần thêm vào giỏ (phải tồn tại trong CSDL `products`) | `1` (iPhone 15 Pro Max) |
| `is_duplicate_item` | State Input (Kiểm tra trùng)| Boolean | Mặt hàng thêm vào đã có sẵn trong giỏ chưa | `false` (Mặt hàng mới) |
| `add_quantity` | Direct Input (API/PDP) | Integer | Số lượng thêm vào giỏ (phải là số nguyên $\ge 1$) | `1` sản phẩm |
| `quantity_delta_action`| Direct Input (Nút +/-) | Enum | Thao tác điều chỉnh số lượng: `INC` (+), `DEC` (-) | `INC` (+1) |
| `current_item_qty` | State Input (Số lượng hiện tại)| Integer | Số lượng hiện tại của sản phẩm trước khi chỉnh ($1 \dots 99$) | `2` sản phẩm |
| `delete_confirmed` | Direct Input (Dialog Xóa) | Boolean | Người dùng xác nhận xóa trên Confirmation Dialog | `true` (Xác nhận đồng ý) |
| `remove_index` | Direct Input (API/State) | Integer | Vị trí phần tử cần xóa ($0 \le index < length$) | `0` (Phần tử đầu tiên) |

#### 1.2. Bảng Biến Đầu ra (Outputs)
| Tên Đầu ra | Phân loại | Kết quả & Giao diện mong đợi theo SRS / API |
| :--- | :---: | :--- |
| `OUT_DISPLAY_ITEMS` | UI Display | Hiển thị bảng 5 cột: Sản phẩm, Đơn giá, Số lượng (có nút +/-), Thành tiền, Thao tác |
| `OUT_DISPLAY_EMPTY` | UI Display | Hiển thị giỏ trống có **hình minh họa** + thông báo "Giỏ hàng của bạn đang trống" + nút "Tiếp tục mua sắm" |
| `OUT_MERGE_INCREMENT` | Business Logic | Tăng số lượng của dòng sản phẩm hiện có, **không tạo thêm dòng mới** |
| `OUT_ADD_NEW_ROW` | Business Logic | Thêm 1 dòng mới vào bảng giỏ hàng với số lượng được chỉ định |
| `OUT_UPDATE_TOTAL` | Business Logic | Cập nhật Thành tiền $= Đơn\ giá \times Số\ lượng$, cập nhật nhãn **"Tổng cộng"** $= \sum (Thành\ tiền)$ |
| `OUT_SHOW_CONFIRM` | UI Dialog | Hiển thị hộp thoại xác nhận: "Bạn có chắc chắn muốn xóa sản phẩm này?" |
| `OUT_ITEM_DELETED` | State Update | Sản phẩm bị loại bỏ khỏi giỏ hàng sau khi xác nhận xóa |
| `OUT_ITEM_KEPT` | State Update | Sản phẩm được giữ nguyên trong giỏ hàng khi người dùng hủy xác nhận xóa |
| `OUT_NAV_HOME` | Navigation | Chuyển hướng người dùng về trang chủ (`/`) khi bấm nút "Tiếp tục mua sắm" |
| `OUT_ERR_NOT_FOUND` | API Response | Trả về HTTP 404 / 400: "Sản phẩm không tồn tại trong hệ thống" |
| `OUT_ERR_INVALID_QTY` | API/Client Error | Trả về HTTP 400 / Client Validation: "Số lượng sản phẩm không hợp lệ (phải $\ge 1$)" |
| `OUT_ERR_INVALID_INDEX`| API/Client Error | Trả về HTTP 400 / Không crash state: "Chỉ mục sản phẩm không tồn tại" |

---

### BƯỚC 2: XÁC ĐỊNH LỚP TƯƠNG ĐƯƠNG VÀ GIÁ TRỊ ĐẠI DIỆN

> **Quy định**: Phân tích toàn bộ các nhánh điều kiện **ĐẦU VÀO (Inputs)** và **KẾT QUẢ ĐẦU RA (Outputs)** cho cả Frontend lẫn Backend, gán sẵn **Giá trị đại diện cụ thể ($Val_{rep}$)** cho từng lớp tương đương (theo Slide 16 FIT - HCMUS).

### Bảng Tổng hợp Lớp Tương đương (Equivalence Partitioning Table)
| STT | Biến / Điều kiện liên quan | Mã Lớp (EC ID) | Mô tả Lớp tương đương | Loại | Giá trị Đại diện Cụ thể ($Val_{rep}$) |
| :---: | :--- | :---: | :--- | :---: | :--- |
| **I** | **CÁC LỚP ĐẦU VÀO & TRẠNG THÁI (INPUT & STATE ECs)** | | | | |
| 1 | `cart_state` (Trạng thái giỏ) | **EC01** | Giỏ hàng đang có ít nhất 1 sản phẩm | **Valid** | Giỏ có 2 SP: SP1 ($30tr \times 1$) + SP2 ($28tr \times 2$) $= 86,000,000$ ₫ |
| 2 | | **EC02** | Giỏ hàng đang hoàn toàn trống (`cart = []`) | **Valid** | Giỏ hàng rỗng: `cart = []` |
| 3 | `product_id` (Tồn tại trong DB)| **EC03** | `product_id` hợp lệ và tồn tại trong CSDL | **Valid** | `product_id = 1` (iPhone 15 Pro Max) |
| 4 | | **EC04** | `product_id` KHÔNG tồn tại trong CSDL | **Invalid** | `product_id = 9999` (Không có trong DB) |
| 5 | | **EC05** | `product_id` sai định dạng / số âm | **Invalid** | `product_id = -1` (Số âm không hợp lệ) |
| 6 | `is_duplicate_item` | **EC06** | Thêm sản phẩm MỚI chưa có trong giỏ hàng | **Valid** | Thêm SP4 (AirPods Pro 2, ID: 4, SL: 1) |
| 7 | (Trùng lặp sản phẩm) | **EC07** | Thêm sản phẩm ĐÃ CÓ trong giỏ hàng | **Valid** | Thêm tiếp SP1 (iPhone 15, ID: 1, SL: 1) |
| 8 | `add_quantity` (Số lượng thêm) | **EC08** | Số lượng thêm là số nguyên dương ($q \ge 1$) | **Valid** | `add_quantity = 2` |
| 9 | | **EC09** | Số lượng thêm bằng 0 hoặc số âm ($q \le 0$) | **Invalid** | `add_quantity = 0` (hoặc `-1`) |
| 10 | | **EC10** | Số lượng thêm không phải số nguyên | **Invalid** | `add_quantity = 1.5` (Số thực / text) |
| 11 | `quantity_action` (Nút +/-) | **EC11** | Bấm nút `+` để tăng số lượng (khi $q < 99$) | **Valid** | Đang có SP2 $q = 2$, bấm `+` $\rightarrow$ $q = 3$ |
| 12 | (Điều chỉnh số lượng) | **EC12** | Bấm nút `-` để giảm số lượng khi $q > 1$ | **Valid** | Đang có SP2 $q = 2$, bấm `-` $\rightarrow$ $q = 1$ |
| 13 | | **EC13** | Bấm nút `-` để giảm số lượng khi đang ở mức tối thiểu $q = 1$ | **Invalid / Boundary** | Đang có SP1 $q = 1$, bấm `-` $\rightarrow$ giữ 1 hoặc hỏi xóa |
| 14 | `delete_dialog_action` | **EC14** | Bấm Xóa $\rightarrow$ Chọn Đồng ý xóa trên Dialog xác nhận | **Valid** | Bấm nút Xóa SP1 $\rightarrow$ Click "Đồng ý" trên Dialog |
| 15 | (Xác nhận xóa sản phẩm)| **EC15** | Bấm Xóa $\rightarrow$ Chọn Hủy bỏ trên Dialog xác nhận | **Valid** | Bấm nút Xóa SP1 $\rightarrow$ Click "Hủy" trên Dialog |
| 16 | `remove_index` (Vị trí xóa) | **EC16** | Vị trí xóa nằm ngoài phạm vi mảng giỏ hàng | **Invalid** | `remove_index = 99` (Vượt quá số lượng mặt hàng) |
| 17 | `continue_shopping` | **EC17** | Bấm nút "Tiếp tục mua sắm" trên trang giỏ hàng | **Valid** | Click liên kết/nút "Tiếp tục mua sắm" |
| **II**| **CÁC LỚP ĐẦU RA MONG ĐỢI (OUTPUT ECs)** | | | | |
| 18 | `Output: Hiển thị giỏ có hàng` | **EC18** | Hiển thị bảng 5 cột có sản phẩm, tính đúng thành tiền và nhãn **"Tổng cộng"** | **Valid** | Giao diện bảng 5 cột, nhãn `Tổng cộng: 86,000,000 ₫` |
| 19 | `Output: Hiển thị giỏ rỗng` | **EC19** | Hiển thị Empty State có **hình ảnh minh họa**, thông báo và nút quay về | **Valid** | Có thẻ `<img>` minh họa + thông báo giỏ rỗng |
| 20 | `Output: Cập nhật số lượng` | **EC20** | Tăng/giảm số lượng thành công hoặc gộp số lượng khi thêm trùng, cập nhật lại tổng tiền | **Valid** | Số lượng cập nhật chính xác, không sinh dòng trùng |
| 21 | `Output: Quy trình xóa món` | **EC21** | Hiển thị hộp thoại xác nhận; xóa khi Đồng ý, giữ nguyên khi Hủy | **Valid** | Bật dialog; xóa hoặc giữ sản phẩm theo lựa chọn |
| 22 | `Output: Điều hướng trang chủ` | **EC22** | Điều hướng trình duyệt quay về trang chủ (`/`) | **Valid** | Trình duyệt chuyển hướng về `http://localhost:5173/` |
| 23 | `Output: Lỗi SP không tồn tại` | **EC23** | Trả về mã lỗi từ chối khi mã sản phẩm không có trong CSDL | **Invalid** | HTTP 404 / 400: "Sản phẩm không tồn tại trong CSDL" |
| 24 | `Output: Lỗi số lượng sai` | **EC24** | Trả về mã lỗi từ chối khi số lượng $\le 0$ hoặc không phải số nguyên | **Invalid** | HTTP 400 / Client chặn: "Số lượng không hợp lệ" |
| 25 | `Output: Xử lý an toàn index` | **EC25** | Báo lỗi hoặc không làm crash ứng dụng khi xóa index ngoài mảng | **Invalid** | HTTP 400 / Giao diện an toàn, không bị crash trắng trang |

---

### BƯỚC 3: XÁC ĐỊNH CA KIỂM THỬ SƠ BỘ (DUYỆT TOÀN BỘ 25 ECs - SLIDE 17)

> [!IMPORTANT]
> **QUY TẮC DUYỆT BRUTE-FORCE TOÀN DIỆN (SLIDE 17 BÀI GIẢNG FIT - HCMUS):**
> 1. Duyệt tuần tự qua **100% tất cả 25 lớp tương đương** ($EC01 \rightarrow EC25$).
> 2. Điền **giá trị cụ thể** cho từng cột dữ liệu (cả tham số API lẫn hành động UI).
> 3. **Cô lập lỗi (Fault Isolation / Single Fault Assumption)**: Khi dòng đó kiểm tra một Invalid EC, tất cả các tham số/trạng thái còn lại **bắt buộc mang giá trị danh nghĩa hợp lệ cụ thể** (`cart = [SP1 x 1, SP2 x 2]`, `product_id = 1`, `quantity = 1`, `dialog = true`).

### Bảng Tổng hợp Ca Kiểm thử Sơ bộ (Full Preliminary Test Cases Table)
| STT | Lớp Tương Đương Được Test | Trạng thái giỏ ban đầu (`cart`) | Thao tác / Phương thức | `product_id` | `quantity` | Hành động Dialog (`confirm`) | Output mong đợi cụ thể (Expected Output) |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **1** | **EC01** (Giỏ có sản phẩm) | `[SP1 x 1, SP2 x 2]` | GET `/cart` (UI/API) | N/A | N/A | N/A | Hiển thị bảng 5 cột có 2 sản phẩm: SP1 ($30tr \times 1$), SP2 ($28tr \times 2$), nhãn **"Tổng cộng: 86,000,000 ₫"** |
| **2** | **EC02** (Giỏ hàng trống) | `[]` (Rỗng) | GET `/cart` (UI/API) | N/A | N/A | N/A | Hiển thị hình minh họa giỏ trống + "Giỏ hàng của bạn đang trống" + nút "Tiếp tục mua sắm" |
| **3** | **EC03** (`product_id` tồn tại DB)| `[SP1 x 1, SP2 x 2]` | POST `/api/cart` / UI PDP | `1` (iPhone 15) | `1` | N/A | Chấp nhận thêm sản phẩm hợp lệ vào giỏ hàng |
| **4** | **EC04** (`product_id` không có DB)| `[SP1 x 1, SP2 x 2]` | POST `/api/cart` (API) | `9999` | `1` | N/A | **HTTP 404 / 400**: Báo lỗi "Sản phẩm không tồn tại", không thêm vào giỏ |
| **5** | **EC05** (`product_id` số âm/lỗi) | `[SP1 x 1, SP2 x 2]` | POST `/api/cart` (API) | `-1` | `1` | N/A | **HTTP 400**: Báo lỗi "Mã sản phẩm không hợp lệ", từ chối request |
| **6** | **EC06** (Thêm SP mới) | `[SP1 x 1, SP2 x 2]` | Thêm vào giỏ từ PDP | `4` (AirPods Pro) | `1` | N/A | Tạo thêm dòng mới cho SP4 ($6,000,000$ ₫), giỏ có 3 dòng, Tổng cộng tăng thành **$92,000,000$ ₫** |
| **7** | **EC07** (Thêm SP trùng lặp) | `[SP1 x 1, SP2 x 2]` | Thêm vào giỏ từ PDP | `1` (iPhone 15) | `1` | N/A | **Tăng số lượng SP1 từ 1 lên 2** ($60tr$), SP2 ($56tr$), không tạo dòng mới, Tổng cộng thành **$116,000,000$ ₫** |
| **8** | **EC08** (`quantity` $\ge 1$) | `[SP1 x 1, SP2 x 2]` | POST `/api/cart` / UI PDP | `4` (AirPods Pro) | `2` | N/A | Chấp nhận số lượng hợp lệ, thêm 2 sản phẩm vào giỏ ($12tr$), Tổng cộng thành **$98,000,000$ ₫** |
| **9** | **EC09** (`quantity` $\le 0$) | `[SP1 x 1, SP2 x 2]` | POST `/api/cart` (API) | `1` (iPhone 15) | `0` | N/A | **HTTP 400**: Báo lỗi "Số lượng phải lớn hơn hoặc bằng 1", từ chối request |
| **10** | **EC10** (`quantity` không nguyên)| `[SP1 x 1, SP2 x 2]` | POST `/api/cart` (API) | `1` (iPhone 15) | `1.5` | N/A | **HTTP 400**: Báo lỗi "Số lượng phải là số nguyên", từ chối request |
| **11** | **EC11** (Tăng SL bằng nút `+`)| `[SP1 x 1, SP2 x 2]` | Bấm nút `+` tại dòng SP2 | Dòng SP2 | $+1$ | N/A | Số lượng SP2 tăng lên `3` ($84,000,000$ ₫), SP1 giữ nguyên ($30tr$), Tổng cộng thành **$114,000,000$ ₫** |
| **12** | **EC12** (Giảm SL bằng nút `-`)| `[SP1 x 1, SP2 x 2]` | Bấm nút `-` tại dòng SP2 | Dòng SP2 | $-1$ | N/A | Số lượng SP2 giảm xuống `1` ($28,000,000$ ₫), SP1 giữ nguyên ($30tr$), Tổng cộng thành **$58,000,000$ ₫** |
| **13** | **EC13** (Giảm SL khi $q=1$) | `[SP1 x 1, SP2 x 2]` | Bấm nút `-` tại dòng SP1 | Dòng SP1 | $-1$ | N/A | Chặn không giảm dưới 1 (vẫn giữ $q=1$) hoặc bật dialog xác nhận xóa sản phẩm, giữ nguyên **$86,000,000$ ₫** |
| **14** | **EC14** (Xóa & Xác nhận) | `[SP1 x 1, SP2 x 2]` | Bấm nút Xóa tại dòng SP1 | Dòng SP1 | N/A | `Chọn Đồng ý` | SP1 bị xóa khỏi giỏ, danh sách còn lại 1 dòng (SP2 x 2), Tổng cộng thành **$56,000,000$ ₫** |
| **15** | **EC15** (Xóa & Hủy bỏ) | `[SP1 x 1, SP2 x 2]` | Bấm nút Xóa tại dòng SP1 | Dòng SP1 | N/A | `Chọn Hủy` | Hủy thao tác xóa, SP1 vẫn còn trong giỏ, giữ nguyên 2 dòng và Tổng cộng **$86,000,000$ ₫** |
| **16** | **EC16** (Xóa index ngoài biên)| `[SP1 x 1, SP2 x 2]` | Gửi lệnh xóa `index=99` | Index 99 | N/A | N/A | **HTTP 400 / No crash**: Báo lỗi chỉ mục không hợp lệ, không gây lỗi trắng trang |
| **17** | **EC17** (Nút Tiếp tục mua) | `[SP1 x 1, SP2 x 2]` | Bấm nút "Tiếp tục mua sắm" | URL `/cart` | N/A | N/A | Điều hướng trình duyệt chuyển về trang chủ (`http://localhost:5173/`) |
| **18** | **EC18** (Output: Bảng có hàng) | `[SP1 x 1, SP2 x 2]` | GET `/cart` (UI) | URL `/cart` | N/A | N/A | Render bảng 5 cột, tổng cộng `= 86,000,000 ₫` với nhãn **"Tổng cộng"** |
| **19** | **EC19** (Output: Empty state) | `[]` (Rỗng) | GET `/cart` (UI) | URL `/cart` | N/A | N/A | Render giao diện giỏ rỗng có **hình minh họa** + thông báo + nút quay về |
| **20** | **EC20** (Output: Cập nhật SL) | `[SP1 x 1, SP2 x 2]` | Thêm trùng / Bấm `+/-`| `SP1` (ID: 1) | $+1$ | N/A | Cập nhật số lượng sản phẩm chính xác, tính lại tổng tiền tương ứng |
| **21** | **EC21** (Output: Luồng xóa món)| `[SP1 x 1, SP2 x 2]` | Bấm Xóa $\rightarrow$ Chọn popup | Dòng SP1 | N/A | `Chọn Đồng ý` | Bật popup xác nhận; xóa sản phẩm khỏi giỏ khi xác nhận |
| **22** | **EC22** (Output: Điều hướng) | `[SP1 x 1, SP2 x 2]` | Click "Tiếp tục mua sắm" | URL `/cart` | N/A | N/A | Trình duyệt chuyển hướng thành công về trang chủ (`/`) |
| **23** | **EC23** (Output: Lỗi mã SP) | `[SP1 x 1, SP2 x 2]` | POST `/api/cart` (API) | `9999` | `1` | N/A | **HTTP 404 / 400**: Báo lỗi "Sản phẩm không tồn tại trong CSDL" |
| **24** | **EC24** (Output: Lỗi số lượng)| `[SP1 x 1, SP2 x 2]` | POST `/api/cart` (API) | `1` | `0` | N/A | **HTTP 400**: Báo lỗi "Số lượng sản phẩm không hợp lệ" |
| **25** | **EC25** (Output: Lỗi index) | `[SP1 x 1, SP2 x 2]` | Gửi xóa `index=99` | Index 99 | N/A | N/A | **HTTP 400 / An toàn**: Không gây crash trắng trang |

---

### BƯỚC 4: BẢNG RÚT GỌN CÁC CA KIỂM THỬ (SLIDE 18 FIT - HCMUS)

#### 4.1. Phân tích Rút gọn Trùng lặp (Test Case Reduction Analysis)
Theo nguyên tắc tối ưu hóa ca kiểm thử (Slide 18 bài giảng FIT - HCMUS), các dòng kiểm tra lớp tương đương hợp lệ ở Bước 3 có cùng toàn bộ giá trị đầu vào và cùng kết quả mong đợi được gộp thành 1 ca kiểm thử tổng hợp, đồng thời các Lớp tương đương Đầu ra (Output ECs) được ánh xạ trực tiếp vào từng ca kiểm thử tương ứng để bao phủ toàn bộ 25 ECs:

1. **Gộp ca kiểm thử hiển thị giỏ có hàng**: Dòng 1 ($EC01$) và Dòng 18 ($EC18$) có cùng đầu vào `[SP1 x 1, SP2 x 2]` và cùng kết quả hiển thị bảng 5 cột kèm nhãn "Tổng cộng: 86,000,000 ₫" $\rightarrow$ Gộp thành **DT_FR07_TC01** (Phủ `EC01, EC18`).
2. **Gộp ca kiểm thử hiển thị giỏ rỗng**: Dòng 2 ($EC02$) và Dòng 19 ($EC19$) có cùng đầu vào giỏ rỗng `[]` và cùng kết quả hiển thị giao diện Empty State có hình ảnh minh họa $\rightarrow$ Gộp thành **DT_FR07_TC02** (Phủ `EC02, EC19`).
3. **Gộp ca kiểm thử thêm sản phẩm mới hợp lệ**: Dòng 3 ($EC03$), Dòng 6 ($EC06$), Dòng 8 ($EC08$) và Dòng 20 ($EC20$) cùng kiểm tra luồng thêm một sản phẩm mới hợp lệ vào giỏ ($product\_id \in DB, quantity \ge 1$) $\rightarrow$ Gộp thành **DT_FR07_TC03** (Phủ `EC03, EC06, EC08, EC20`).
4. **Gộp ca kiểm thử thêm sản phẩm trùng lặp**: Dòng 7 ($EC07$) kết hợp cùng Dòng 20 ($EC20$) kiểm tra luồng thêm sản phẩm đã có sẵn trong giỏ $\rightarrow$ Tăng số lượng và không tạo dòng mới $\rightarrow$ **DT_FR07_TC04** (Phủ `EC07, EC20`).
5. **Ca kiểm thử mã SP không tồn tại trong DB**: Dòng 4 ($EC04$) kết hợp cùng Dòng 23 ($EC23$) kiểm tra API từ chối khi `product_id = 9999` $\rightarrow$ **DT_FR07_TC05** (Phủ `EC04, EC23`).
6. **Ca kiểm thử mã SP số âm / sai định dạng**: Dòng 5 ($EC05$) kết hợp cùng Dòng 23 ($EC23$) kiểm tra API từ chối khi `product_id = -1` $\rightarrow$ **DT_FR07_TC06** (Phủ `EC05, EC23`).
7. **Ca kiểm thử số lượng thêm bằng 0 hoặc số âm**: Dòng 9 ($EC09$) kết hợp cùng Dòng 24 ($EC24$) kiểm tra API từ chối khi `quantity = 0` $\rightarrow$ **DT_FR07_TC07** (Phủ `EC09, EC24`).
8. **Ca kiểm thử số lượng thêm không phải số nguyên**: Dòng 10 ($EC10$) kết hợp cùng Dòng 24 ($EC24$) kiểm tra API từ chối khi `quantity = 1.5` $\rightarrow$ **DT_FR07_TC08** (Phủ `EC10, EC24`).
9. **Ca kiểm thử tăng số lượng bằng nút `+`**: Dòng 11 ($EC11$) kết hợp cùng Dòng 20 ($EC20$) kiểm tra việc tăng số lượng trên giao diện giỏ hàng $\rightarrow$ **DT_FR07_TC09** (Phủ `EC11, EC20`).
10. **Ca kiểm thử giảm số lượng bằng nút `-`**: Dòng 12 ($EC12$) kết hợp cùng Dòng 20 ($EC20$) kiểm tra việc giảm số lượng khi $q > 1$ $\rightarrow$ **DT_FR07_TC10** (Phủ `EC12, EC20`).
11. **Ca kiểm thử giảm số lượng khi đang ở mức $q = 1$**: Dòng 13 ($EC13$) kết hợp cùng Dòng 24 ($EC24$) kiểm tra việc chặn không giảm dưới 1 $\rightarrow$ **DT_FR07_TC11** (Phủ `EC13, EC24`).
12. **Ca kiểm thử xóa sản phẩm và chọn Đồng ý**: Dòng 14 ($EC14$) kết hợp cùng Dòng 21 ($EC21$) kiểm tra quy trình bật popup và xóa sản phẩm khi xác nhận $\rightarrow$ **DT_FR07_TC12** (Phủ `EC14, EC21`).
13. **Ca kiểm thử xóa sản phẩm và chọn Hủy bỏ**: Dòng 15 ($EC15$) kết hợp cùng Dòng 21 ($EC21$) kiểm tra quy trình bật popup và giữ nguyên sản phẩm khi hủy $\rightarrow$ **DT_FR07_TC13** (Phủ `EC15, EC21`).
14. **Ca kiểm thử xóa index ngoài phạm vi**: Dòng 16 ($EC16$) kết hợp cùng Dòng 25 ($EC25$) kiểm tra xử lý an toàn khi chỉ mục xóa không hợp lệ $\rightarrow$ **DT_FR07_TC14** (Phủ `EC16, EC25`).
15. **Ca kiểm thử điều hướng tiếp tục mua sắm**: Dòng 17 ($EC17$) kết hợp cùng Dòng 22 ($EC22$) kiểm tra click nút "Tiếp tục mua sắm" quay về trang chủ $\rightarrow$ **DT_FR07_TC15** (Phủ `EC17, EC22`).

#### 4.2. Bảng Rút gọn các Ca Kiểm thử Hoàn chỉnh (Optimized Test Suite)
| TC ID | Lớp Tương Đương Được Phủ (Covered ECs) | Tầng Kiểm Thử | Trạng thái ban đầu | Thao tác thực hiện | Dữ liệu đầu vào cụ thể | Output mong đợi (Expected Output) |
| :---: | :--- | :---: | :---: | :--- | :--- | :--- |
| **DT_FR07_TC01** | **EC01, EC18** | Frontend UI | `[SP1 x 1, SP2 x 2]` | Truy cập `/cart` | URL `/cart` | **Bảng 5 cột**: Sản phẩm, Đơn giá, Số lượng (+/-), Thành tiền, Thao tác; nhãn hiển thị: **"Tổng cộng: 86,000,000 ₫"** |
| **DT_FR07_TC02** | **EC02, EC19** | Frontend UI | `[]` (Rỗng) | Truy cập `/cart` | URL `/cart` | **Empty State**: Có **hình ảnh minh họa**, thông báo "Giỏ hàng của bạn đang trống" và nút "Tiếp tục mua sắm" |
| **DT_FR07_TC03** | **EC03, EC06, EC08, EC20** | FE + BE API | `[SP1 x 1, SP2 x 2]` | Thêm SP mới | `SP4` (ID: 4), `quantity: 1` | Thêm dòng mới thứ 3 cho SP4 ($6,000,000$ ₫), Tổng cộng $= \mathbf{92,000,000 \text{ ₫}}$ |
| **DT_FR07_TC04** | **EC07, EC20** | FE + BE API | `[SP1 x 1, SP2 x 2]` | Thêm SP trùng | `SP1` (ID: 1), `quantity: 1` | **Không tạo dòng mới**, tăng số lượng SP1 từ 1 lên 2 ($60tr$), Tổng cộng $= \mathbf{116,000,000 \text{ ₫}}$ |
| **DT_FR07_TC05** | **EC04, EC23** | Backend API | `[SP1 x 1, SP2 x 2]` | POST `/api/cart` | `product_id: 9999`, `quantity: 1` | **HTTP 404 / 400**: Báo lỗi "Sản phẩm không tồn tại trong CSDL", từ chối thêm vào giỏ |
| **DT_FR07_TC06** | **EC05, EC23** | Backend API | `[SP1 x 1, SP2 x 2]` | POST `/api/cart` | `product_id: -1`, `quantity: 1` | **HTTP 400**: Báo lỗi "Mã sản phẩm không hợp lệ", từ chối request |
| **DT_FR07_TC07** | **EC09, EC24** | Backend API | `[SP1 x 1, SP2 x 2]` | POST `/api/cart` | `product_id: 1`, `quantity: 0` | **HTTP 400**: Báo lỗi "Số lượng phải lớn hơn hoặc bằng 1", từ chối request |
| **DT_FR07_TC08** | **EC10, EC24** | Backend API | `[SP1 x 1, SP2 x 2]` | POST `/api/cart` | `product_id: 1`, `quantity: 1.5` | **HTTP 400**: Báo lỗi "Số lượng phải là số nguyên hợp lệ", từ chối request |
| **DT_FR07_TC09** | **EC11, EC20** | Frontend UI | `[SP1 x 1, SP2 x 2]` | Bấm nút `+` | Dòng SP2 ($q=2 \rightarrow 3$) | Số lượng SP2 tăng thành 3 ($84,000,000$ ₫), Tổng cộng $= \mathbf{114,000,000 \text{ ₫}}$ |
| **DT_FR07_TC10** | **EC12, EC20** | Frontend UI | `[SP1 x 1, SP2 x 2]` | Bấm nút `-` | Dòng SP2 ($q=2 \rightarrow 1$) | Số lượng SP2 giảm xuống 1 ($28,000,000$ ₫), Tổng cộng $= \mathbf{58,000,000 \text{ ₫}}$ |
| **DT_FR07_TC11** | **EC13, EC24** | Frontend UI | `[SP1 x 1, SP2 x 2]` | Bấm nút `-` khi $q=1$ | Dòng SP1 ($q=1$) | Không giảm số lượng xuống 0 (giữ $q=1$ hoặc hiển thị xác nhận xóa), giỏ giữ nguyên **$86,000,000$ ₫** |
| **DT_FR07_TC12** | **EC14, EC21** | Frontend UI | `[SP1 x 1, SP2 x 2]` | Xóa & Xác nhận | Bấm Xóa SP1 $\rightarrow$ Click Đồng ý | **Bật Confirmation Dialog**, sau khi đồng ý thì SP1 bị xóa, giỏ còn 1 dòng SP2 ($2 \times 28tr = \mathbf{56,000,000 \text{ ₫}}$) |
| **DT_FR07_TC13** | **EC15, EC21** | Frontend UI | `[SP1 x 1, SP2 x 2]` | Xóa & Hủy | Bấm Xóa SP1 $\rightarrow$ Click Hủy | Bật Dialog, sau khi hủy thì SP1 vẫn còn trong giỏ, Tổng cộng giữ nguyên $\mathbf{86,000,000 \text{ ₫}}$ |
| **DT_FR07_TC14** | **EC16, EC25** | Frontend State | `[SP1 x 1, SP2 x 2]` | Xóa index sai | Gọi hàm xóa với `index = 99` | Không gây crash màn hình (trắng trang), giữ nguyên dữ liệu giỏ |
| **DT_FR07_TC15** | **EC17, EC22** | Frontend UI | `[SP1 x 1, SP2 x 2]` | Tiếp tục mua sắm | Click nút "Tiếp tục mua sắm" | Điều hướng về trang chủ (`http://localhost:5173/`) |

---

# PHẦN B: THIẾT KẾ KIỂM THỬ VỚI BOUNDARY VALUE ANALYSIS (ROBUSTNESS TESTING)

---

### BƯỚC 1: XÁC ĐỊNH CÁC BIẾN CÓ THỨ TỰ & GIÁ TRỊ DANH NGHĨA ($Nom$)

Chức năng FR-07 có **$n = 2$ biến có thứ tự (ordered variables)**:
1. **Biến $x_1$**: `item_quantity` (Số lượng của một mặt hàng trong giỏ hàng)
   - Miền giá trị hợp lệ: $[1 \dots 99]$ sản phẩm (theo chuẩn UI bán lẻ 2 chữ số).
   - Ngưỡng biên dưới: $LB_1 = 1$ cái (số lượng tối thiểu để tồn tại 1 mặt hàng trong giỏ).
   - Ngưỡng biên trên: $UB_1 = 99$ cái (giới hạn đặt hàng tối đa của một món bán lẻ).
   - Bước nhảy: $\epsilon_1 = 1$ cái.
   - Giá trị danh nghĩa ($Nom_1$): **$2$ cái**.
2. **Biến $x_2$**: `cart_distinct_items_count` (Số loại mặt hàng khác nhau trong giỏ hàng)
   - Do tài liệu đặc tả SRS không giới hạn số loại mặt hàng tối đa trong giỏ ($UB_2$ không quy định cụ thể, miền giá trị $[1 \dots +\infty)$), biến $x_2$ được kiểm thử theo mô hình **Biên đơn (Single Lower Bound)** quanh ngưỡng biên dưới $LB_2 = 1$ loại.
   - Ngưỡng biên dưới: $LB_2 = 1$ loại (giỏ có ít nhất 1 loại hàng).
   - Bước nhảy: $\epsilon_2 = 1$ loại.
   - Giá trị danh nghĩa ($Nom_2$): **$3$ loại mặt hàng** (gồm SP1: iPhone 15 Pro Max, SP2: Samsung S24 Ultra, SP3: MacBook Pro M3).

- **Công thức tính số ca kiểm thử BVA**:
  $$\mathbf{f = 6 \text{ (điểm } x_1) + 3 \text{ (điểm } x_2) + 1 \text{ (Baseline)} = 10 \text{ ca kiểm thử}}$$

---

### BƯỚC 2: BẢNG CÁC ĐIỂM BIÊN CHI TIẾT CHO TỪNG BIẾN (BOUNDARY POINTS)

#### Bảng Điểm Biên Biến 1: `item_quantity` ($x_1$) — Miền có 2 biên $[1 \dots 99]$
| STT | Ký hiệu Điểm | Vị trí Ranh giới | Công thức | Giá trị Số Cụ Thể | Tính Hợp Lệ | Hành vi Kỳ vọng (SRS & API) |
| :---: | :---: | :--- | :---: | :---: | :---: | :--- |
| 1 | **$min_1^-$** | Dưới biên dưới | $LB_1 - \epsilon_1$ | **$0$ cái** | **Invalid** | Không chấp nhận $q = 0$; từ chối API với HTTP 400 hoặc xóa khỏi giỏ |
| 2 | **$min_1$** | Ngay biên dưới | $LB_1$ | **$1$ cái** | **Valid** | Mức tối thiểu hợp lệ của 1 dòng sản phẩm |
| 3 | **$min_1^+$** | Ngay trên biên dưới | $LB_1 + \epsilon_1$ | **$2$ cái** | **Valid** | Số lượng bình thường, Thành tiền $= 2 \times Đơn\ giá$ |
| 4 | **$max_1^-$** | Ngay dưới biên trên | $UB_1 - \epsilon_1$ | **$98$ cái** | **Valid** | Số lượng lớn hợp lệ, Thành tiền $= 98 \times Đơn\ giá$ |
| 5 | **$max_1$** | Ngay tại biên trên | $UB_1$ | **$99$ cái** | **Valid** | Số lượng tối đa cho phép của 1 mặt hàng |
| 6 | **$max_1^+$** | Vượt trên biên trên | $UB_1 + \epsilon_1$ | **$100$ cái** | **Invalid** | Vượt quá giới hạn tối đa, hệ thống chặn không cho tăng tiếp / từ chối API |
| - | **$Nom_1$** | Giá trị danh nghĩa | Baseline | **$2$ cái** | **Valid** | Mức danh nghĩa an toàn |

#### Bảng Điểm Biên Biến 2: `cart_distinct_items_count` ($x_2$) — Miền biên dưới $LB_2 = 1$
| STT | Ký hiệu Điểm | Vị trí Ranh giới | Công thức | Giá trị Số Cụ Thể | Tính Hợp Lệ | Hành vi Kỳ vọng (SRS) |
| :---: | :---: | :--- | :---: | :---: | :---: | :--- |
| 1 | **$min_2^-$** | Dưới biên dưới | $LB_2 - \epsilon_2$ | **$0$ loại** | **Invalid / Empty** | Giỏ hàng rỗng: Hiển thị Empty state có ảnh minh họa + nút Tiếp tục |
| 2 | **$min_2$** | Ngay biên dưới | $LB_2$ | **$1$ loại** | **Valid** | Giỏ hiển thị đúng 1 dòng sản phẩm, tổng cộng tính đúng |
| 3 | **$min_2^+$** | Ngay trên biên dưới | $LB_2 + \epsilon_2$ | **$2$ loại** | **Valid** | Giỏ hiển thị đúng 2 dòng sản phẩm, tổng cộng tính đúng |
| - | **$Nom_2$** | Giá trị danh nghĩa | Baseline | **$3$ loại** | **Valid** | Trạng thái danh nghĩa an toàn (giỏ có 3 mặt hàng SP1, SP2, SP3) |

---

### BƯỚC 3 & 4: BẢNG CA KIỂM THỬ BOUNDARY TOÀN DIỆN ($f = 10$ DÒNG)

> [!IMPORTANT]
> **QUY TẮC CÔ LẬP LỖI (SINGLE FAULT ASSUMPTION) & TÍNH TOÁN GIÁ TIỀN**:
> - **Khi kiểm tra biến $x_1$ (`item_quantity`)**: Giỏ giữ cố định ở $Nom_2 = 3$ loại mặt hàng:
>   - SP1 (iPhone 15 Pro Max): Đơn giá $30,000,000$ ₫ (số lượng thay đổi theo điểm biên của $x_1$).
>   - SP2 (Samsung Galaxy S24 Ultra): Đơn giá $28,000,000$ ₫ ($Nom_1 = 2$ cái $\rightarrow 56,000,000$ ₫).
>   - SP3 (MacBook Pro M3): Đơn giá $45,000,000$ ₫ ($Nom_1 = 2$ cái $\rightarrow 90,000,000$ ₫).
>   - $\rightarrow$ Tổng tiền cố định của SP2 + SP3 là: $56,000,000 + 90,000,000 = \mathbf{146,000,000 \text{ ₫}}$.
> - **Khi kiểm tra biến $x_2$ (`cart_distinct_items_count`)**: Số lượng mỗi món giữ cố định ở $Nom_1 = 2$ cái.
> - **Điểm Baseline**: Cả 3 mặt hàng ở $Nom_1 = 2$ cái: Tổng cộng $= 60tr + 56tr + 90tr = \mathbf{206,000,000 \text{ ₫}}$.

### Bảng Ca Kiểm thử Boundary Value Analysis ($f = 10$)
| STT (TC ID) | Biến Kiểm Tra | Điểm Biên | `item_quantity` ($x_1$) | `items_count` ($x_2$) | Chi tiết Dữ liệu Kiểm thử | Output Mong Đợi Cụ Thể (Theo SRS & API) | Actual Output (Chạy thực tế trên SUT) | Kết luận |
| :---: | :---: | :---: | :---: | :---: | :--- | :--- | :--- | :---: |
| **BVA_FR07_TC01** | $x_1$ | $min_1$ ($1$) | **$1$ cái** | $Nom_2$ ($3$) | 3 mặt hàng: SP1 ($q=1$), SP2 ($q=2$), SP3 ($q=2$) | Thành tiền SP1 $= 30,000,000$ ₫; Tổng cộng $= \mathbf{176,000,000 \text{ ₫}}$ | Không có nút +/- để chỉnh số lượng; Nhãn hiển thị là "Tổng tạm tính" | **FAIL (BUG #2, #4)** |
| **BVA_FR07_TC02** | $x_1$ | $min_1^+$ ($2$) | **$2$ cái** | $Nom_2$ ($3$) | 3 mặt hàng: SP1 ($q=2$), SP2 ($q=2$), SP3 ($q=2$) | Thành tiền SP1 $= 60,000,000$ ₫; Tổng cộng $= \mathbf{206,000,000 \text{ ₫}}$ | Không có nút +/- để chỉnh số lượng; Nhãn hiển thị là "Tổng tạm tính" | **FAIL (BUG #2, #4)** |
| **BVA_FR07_TC03** | $x_1$ | $max_1^-$ ($98$) | **$98$ cái** | $Nom_2$ ($3$) | 3 mặt hàng: SP1 ($q=98$), SP2 ($q=2$), SP3 ($q=2$) | Thành tiền SP1 $= 2,940,000,000$ ₫; Tổng cộng $= \mathbf{3,086,000,000 \text{ ₫}}$ | Không có nút +/- để chỉnh số lượng; Nhãn hiển thị là "Tổng tạm tính" | **FAIL (BUG #2, #4)** |
| **BVA_FR07_TC04** | $x_1$ | $max_1$ ($99$) | **$99$ cái** | $Nom_2$ ($3$) | 3 mặt hàng: SP1 ($q=99$), SP2 ($q=2$), SP3 ($q=2$) | Thành tiền SP1 $= 2,970,000,000$ ₫; Tổng cộng $= \mathbf{3,116,000,000 \text{ ₫}}$ | Không có nút +/- để chỉnh số lượng; Nhãn hiển thị là "Tổng tạm tính" | **FAIL (BUG #2, #4)** |
| **BVA_FR07_TC05** | $x_1$ | $min_1^-$ ($0$) | **$0$ cái** | $Nom_2$ ($3$) | Gửi `POST /api/cart` với payload `quantity: 0` | Hệ thống chặn, từ chối số lượng 0 với HTTP 400 | API `POST /api/cart` chấp nhận `quantity: 0`, không hề kiểm tra | **FAIL (BUG #7)** |
| **BVA_FR07_TC06** | $x_1$ | $max_1^+$ ($100$) | **$100$ cái** | $Nom_2$ ($3$) | Thử đặt $q=100$ hoặc gửi API `quantity: 100` | Hệ thống báo vượt quá số lượng tối đa 99 cho phép | Không có cơ chế kiểm soát ngưỡng tối đa trên cả UI và API | **FAIL (BUG #7)** |
| **BVA_FR07_TC07** | $x_2$ | $min_2^-$ ($0$) | $Nom_1$ ($2$) | **$0$ loại** | Giỏ hoàn toàn trống (`cart = []`) | Hiển thị **hình ảnh minh họa** + thông báo + nút Tiếp tục | Có thông báo text nhưng **KHÔNG CÓ hình minh họa** | **FAIL (BUG #6)** |
| **BVA_FR07_TC08** | $x_2$ | $min_2$ ($1$) | $Nom_1$ ($2$) | **$1$ loại** | Giỏ chỉ có 1 mặt hàng: SP1 ($q=2$) | Hiển thị đúng 1 dòng, Tổng cộng $= \mathbf{60,000,000 \text{ ₫}}$ | Hiển thị 1 dòng, nhãn hiển thị là "Tổng tạm tính" | **FAIL (BUG #4)** |
| **BVA_FR07_TC09** | $x_2$ | $min_2^+$ ($2$) | $Nom_1$ ($2$) | **$2$ loại** | Giỏ có 2 mặt hàng: SP1 ($q=2$), SP2 ($q=2$) | Hiển thị đúng 2 dòng, Tổng cộng $= \mathbf{116,000,000 \text{ ₫}}$ | Hiển thị 2 dòng, nhãn hiển thị là "Tổng tạm tính" | **FAIL (BUG #4)** |
| **BVA_FR07_TC10** | Baseline | All Nominal | $Nom_1$ ($2$) | $Nom_2$ ($3$) | 3 mặt hàng: SP1 ($q=2$), SP2 ($q=2$), SP3 ($q=2$) | Bảng 5 cột (+/-), Tổng cộng $= \mathbf{206,000,000 \text{ ₫}}$, nút Tiếp tục mua sắm | Thiếu nút +/-, nút Mua tiếp sai nhãn, tổng tạm tính | **FAIL (BUG #2, #4, #5)**|

---

# PHẦN C: TỔNG HỢP BUG PHÁT HIỆN TRÊN FR-07 (DEFECT AUDIT & ROOT CAUSE)

Qua quá trình thực thi toàn diện bộ ca kiểm thử thiết kế bởi Domain Testing và Boundary Value Analysis trên cả hai tầng **Frontend UI & Backend API**, chúng ta phát hiện **7 lỗi sai nghiêm trọng** so với tài liệu đặc tả SRS:

---

### NHÓM 1: CÁC LỖI TẦNG FRONTEND (UI & CLIENT STATE)

#### BUG 1: Thêm cùng một sản phẩm vào giỏ không tăng số lượng mà tạo dòng mới
- **Mức độ nghiêm trọng**: **Cao (High / Critical Logic Bug)**
- **Ca kiểm thử phát hiện**: `DT_FR07_TC04`
- **Vị trí mã nguồn**: [frontend-web/src/context/CartContext.jsx: dòng 8-10](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/frontend-web/src/context/CartContext.jsx#L8-L10).
- **Mã nguồn lỗi**:
  ```javascript
  const addToCart = (product, quantity) => {
    setCart([...cart, { ...product, quantity }]); // LỖI: Luôn append phần tử mới vào mảng
  };
  ```
- **Hệ quả thực tế**: Khi người dùng đã có `iPhone 15 Pro Max` trong giỏ hàng và quay lại thêm tiếp 1 chiếc nữa, giỏ hàng sinh ra **2 dòng riêng biệt** cùng tên `iPhone 15 Pro Max` thay vì gộp thành 1 dòng với số lượng là 2. Điều này vi phạm trực tiếp yêu cầu SRS: *"Thêm cùng một sản phẩm vào giỏ sẽ tăng số lượng, không tạo dòng mới"*.

---

#### BUG 2: Bảng giỏ hàng không có nút `+` và `-` để điều chỉnh số lượng
- **Mức độ nghiêm trọng**: **Cao (High / UI Feature Missing)**
- **Ca kiểm thử phát hiện**: `DT_FR07_TC01`, `DT_FR07_TC09`, `DT_FR07_TC10`, `DT_FR07_TC11`, `BVA_FR07_TC01` $\rightarrow$ `BVA_FR07_TC04`, `BVA_FR07_TC10`.
- **Vị trí mã nguồn**: [frontend-web/src/pages/Cart.jsx: dòng 47](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/frontend-web/src/pages/Cart.jsx#L47).
- **Mã nguồn lỗi**:
  ```jsx
  <td className="py-2">Số lượng</td>
  ...
  <td>{item.quantity}</td> {/* LỖI: Chỉ render text tĩnh, hoàn toàn không có nút + / - hay input */}
  ```
- **Hệ quả thực tế**: Người dùng hoàn toàn bị tước đoạt khả năng tăng giảm số lượng sản phẩm trực tiếp trong giỏ hàng. Muốn đổi số lượng, người dùng buộc phải xóa sản phẩm đi và quay lại trang chi tiết sản phẩm để thêm lại từ đầu. Vi phạm yêu cầu SRS: *"Số lượng (có nút +/- để chỉnh)"*.

---

#### BUG 3: Nút Xóa sản phẩm xóa ngay lập tức mà không có Dialog xác nhận
- **Mức độ nghiêm trọng**: **Trung bình (Medium / UX Data Loss Risk)**
- **Ca kiểm thử phát hiện**: `DT_FR07_TC12`, `DT_FR07_TC13`.
- **Vị trí mã nguồn**: [frontend-web/src/pages/Cart.jsx: dòng 50-56](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/frontend-web/src/pages/Cart.jsx#L50-L56).
- **Mã nguồn lỗi**:
  ```jsx
  <button
    onClick={() => removeFromCart(index)} // LỖI: Gọi trực tiếp hàm xóa, không có window.confirm hay Modal Dialog
    className="text-red-500 hover:text-red-700"
  >
    Xóa
  </button>
  ```
- **Hệ quả thực tế**: Nếu người dùng bấm nhầm nút "Xóa", sản phẩm lập tức biến mất khỏi giỏ hàng mà không có bất kỳ cơ hội xác nhận hay hoàn tác nào. Vi phạm trực tiếp yêu cầu SRS: *"Nút Xóa sản phẩm phải có dialog xác nhận trước khi thực hiện"*.

---

#### BUG 4: Nhãn hiển thị Tổng tiền sai thành "Tổng tạm tính" thay vì "Tổng cộng"
- **Mức độ nghiêm trọng**: **Thấp (Low / UI Wording Defect)**
- **Ca kiểm thử phát hiện**: `DT_FR07_TC01`, `BVA_FR07_TC01`, `BVA_FR07_TC08`, `BVA_FR07_TC09`, `BVA_FR07_TC10`.
- **Vị trí mã nguồn**: [frontend-web/src/pages/Cart.jsx: dòng 62-64](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/frontend-web/src/pages/Cart.jsx#L62-L64).
- **Mã nguồn lỗi**:
  ```jsx
  <div className="text-xl font-bold">
    Tổng tạm tính: <span className="text-red-600">{cartTotal.toLocaleString()} ₫</span>
  </div>
  ```
- **Hệ quả thực tế**: Giao diện hiển thị nhãn "Tổng tạm tính:" gây nhầm lẫn cho người dùng về việc có phát sinh thêm thuế/phí ẩn hay không. Vi phạm đặc tả SRS ghi rõ: *"Tổng tiền hiển thị nhãn chính xác: 'Tổng cộng' (không phải 'Tổng tạm tính')"*.

---

#### BUG 5: Nút quay về hiển thị nhãn "← Mua tiếp" thay vì "Tiếp tục mua sắm"
- **Mức độ nghiêm trọng**: **Thấp (Low / UI Inconsistency)**
- **Ca kiểm thử phát hiện**: `DT_FR07_TC15`, `BVA_FR07_TC10`.
- **Vị trí mã nguồn**: [frontend-web/src/pages/Cart.jsx: dòng 66-68](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/frontend-web/src/pages/Cart.jsx#L66-L68).
- **Mã nguồn lỗi**:
  ```jsx
  <Link to="/" className="border px-4 py-2 rounded text-gray-600 hover:bg-gray-50">
    ← Mua tiếp
  </Link>
  ```
- **Hệ quả thực tế**: Không đồng bộ với nhãn "Tiếp tục mua sắm" trên màn hình Empty State và vi phạm yêu cầu chuẩn hóa nhãn của SRS: *"Có nút Tiếp tục mua sắm để quay về trang chủ"*.

---

#### BUG 6: Giao diện Giỏ hàng trống không có Hình ảnh minh họa
- **Mức độ nghiêm trọng**: **Thấp (Low / UI Visual Missing)**
- **Ca kiểm thử phát hiện**: `DT_FR07_TC02`, `BVA_FR07_TC07`.
- **Vị trí mã nguồn**: [frontend-web/src/pages/Cart.jsx: dòng 20-27](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/frontend-web/src/pages/Cart.jsx#L20-L27).
- **Mã nguồn lỗi**:
  ```jsx
  if (cart.length === 0) {
    return (
      <div className="text-center mt-10">
        {/* LỖI: Thiếu thẻ <img> minh họa hình giỏ hàng trống */}
        <h2 className="text-2xl mb-4">Giỏ hàng của bạn đang trống</h2>
        <Link to="/" className="text-blue-600 hover:underline">Tiếp tục mua sắm</Link>
      </div>
    );
  }
  ```
- **Hệ quả thực tế**: Màn hình giỏ hàng trống chỉ có text đơn điệu, thiếu hình minh họa trực quan sinh động theo quy định trong SRS: *"Giỏ hàng trống phải có hình minh họa và thông báo rõ ràng"*.

---

### NHÓM 2: CÁC LỖI TẦNG BACKEND API (`POST /api/cart`)

#### BUG 7: Backend API `POST /api/cart` cho phép thêm sản phẩm rác, không kiểm tra `product_id` và `quantity`
- **Mức độ nghiêm trọng**: **Nghiêm trọng (Critical / Backend Data Integrity & Security Bug)**
- **Ca kiểm thử phát hiện**: `DT_FR07_TC05`, `DT_FR07_TC06`, `DT_FR07_TC07`, `DT_FR07_TC08`, `BVA_FR07_TC05`, `BVA_FR07_TC06`.
- **Vị trí mã nguồn**: [backend/server.js: dòng 290-295](file:///d:/ALL_SOURCE_CODE/Learning/Testing/eshop-sut/backend/server.js#L290-L295).
- **Mã nguồn lỗi**:
  ```javascript
  app.post("/api/cart", authenticateToken, (req, res) => {
    const userId = req.user.id;
    if (!userCarts[userId]) userCarts[userId] = [];
    userCarts[userId].push(req.body); // LỖI: Push trực tiếp toàn bộ req.body không qua bất kỳ khâu validate nào
    res.json({ message: "Added to cart" });
  });
  ```
- **Hệ quả thực tế**:
  1. API chấp nhận `product_id: 9999` hoặc `product_id: -1` mà sản phẩm đó hoàn toàn không tồn tại trong CSDL `products`.
  2. API chấp nhận `quantity: 0`, `quantity: -10` hoặc `quantity: "abc"`, dẫn đến lưu trữ dữ liệu rác và làm sai lệch nghiêm trọng tính toán tổng tiền đơn hàng.
  3. API không kiểm tra trùng lặp để gộp số lượng mà luôn append phần tử mới vào mảng `userCarts`.
