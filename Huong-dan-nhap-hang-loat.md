# Hướng dẫn sử dụng tính năng Nhập hàng loạt (Bulk Import)

Tính năng **Nhập hàng loạt** giúp bạn thêm mới hoặc cập nhật hàng trăm sản phẩm cùng lúc một cách tự động và chính xác, thay vì phải nhập tay từng sản phẩm một. Tính năng này vô cùng hữu ích khi bạn có sẵn bảng báo giá hoặc danh sách sản phẩm trên Excel.

Dưới đây là hướng dẫn chi tiết từng bước dành cho người mới sử dụng.

---

## 1. Chuẩn bị file dữ liệu (File CSV)

Hệ thống yêu cầu dữ liệu đầu vào phải là file định dạng **CSV** (Comma Separated Values). Nếu bạn đang làm việc trên Excel hoặc Google Sheets, hãy lưu ý:

### Các cột bắt buộc phải có
Tên cột (Header) ở dòng đầu tiên phải ghi chính xác các từ sau (không phân biệt chữ hoa, chữ thường):
- **Tên sản phẩm**: Tên gọi chung của sản phẩm (VD: *Ống nhựa Bình Minh*).
- **Quy cách**: Kích thước, phân loại hoặc đặc điểm kỹ thuật (VD: *Phi 21*, *Dài 4m*, hoặc điền dấu `-` nếu không có).
- **Đơn vị tính**: Đơn vị bán lẻ (VD: *Cái*, *Ống*, *Mét*, *Hộp*).
- **Giá bán**: Giá bạn sẽ bán cho khách (chỉ nhập số, không nhập dấu phẩy hay chữ "VNĐ". VD: `25000` không phải `25,000`).

### Cột tùy chọn (không bắt buộc)
- **Giá nhập**: Giá vốn bạn mua vào (giúp hệ thống quản lý lợi nhuận, người dùng thường không thấy giá này). Tương tự, chỉ nhập số nguyên.

### Cách lưu file từ Excel sang định dạng CSV
1. Trong file Excel của bạn, chọn **File** > **Save As** (hoặc Lưu dưới dạng).
2. Ở phần **Save as type** (Định dạng lưu), hãy chọn **CSV UTF-8 (Comma delimited) (*.csv)**. *Lưu ý: Bắt buộc chọn bản có chữ "UTF-8" để tiếng Việt có dấu không bị lỗi phông chữ.*
3. Nhấn **Save** (Lưu).

---

## 2. Các bước nhập dữ liệu lên hệ thống

### Bước 1: Tải lên file dữ liệu
1. Truy cập vào trang Quản lý danh mục sản phẩm tương ứng.
2. Nhấn nút **Nhập hàng loạt**.
3. Một bảng chức năng (Modal) sẽ hiện ra. Bạn có thể kéo thả file CSV vừa tạo vào khu vực đứt nét, hoặc nhấn trực tiếp vào đó để chọn file từ máy tính.
4. Hệ thống sẽ ngay lập tức kiểm tra xem file của bạn có bị lỗi phông chữ hay thiếu cột bắt buộc nào không. Nếu có lỗi, một danh sách cảnh báo màu đỏ sẽ hiện ra để bạn điều chỉnh lại file Excel.

### Bước 2: Phân tích dữ liệu tự động
1. Sau khi file hợp lệ, hệ thống sẽ tự động so sánh toàn bộ dữ liệu trong file CSV với dữ liệu hiện đang có sẵn trên phần mềm.
2. Màn hình sẽ hiển thị bảng tóm tắt và phân loại từng dòng Excel của bạn thành 5 trường hợp:
   - 📦 **Sản phẩm mới**: Sản phẩm hoàn toàn chưa từng có trên hệ thống.
   - 📋 **Quy cách mới**: Sản phẩm đã có, nhưng bạn thêm kích thước/loại mới.
   - 💰 **Đơn giá mới**: Sản phẩm và kích thước đã có, nhưng bạn nhập thêm một đơn vị bán mới (VD: thêm giá bán theo Thùng).
   - ✏️ **Cập nhật giá**: Sản phẩm hoàn toàn trùng khớp, nhưng giá trên file Excel khác với giá trên hệ thống. (Hệ thống sẽ hiển thị mũi tên so sánh giá cũ -> giá mới để bạn đối chiếu).
   - ✅ **Không đổi**: Dữ liệu khớp 100%, hệ thống sẽ tự động bỏ qua để tiết kiệm thời gian.

*💡 Mẹo: Bạn có thể bỏ dấu tích (check) ở đầu mỗi dòng nếu bạn đổi ý không muốn cập nhật dòng dữ liệu đó.*

### Bước 3: Xác nhận và Hoàn tất
1. Khi đã hài lòng với các thay đổi được đề xuất, hãy cuộn xuống cuối cùng và nhấn nút **Xác nhận nhập dữ liệu** (màu xanh).
2. Tùy vào số lượng dòng, quá trình này có thể mất vài giây. Vui lòng không đóng cửa sổ.
3. Hoàn tất! Một bảng thông báo thành công màu xanh sẽ hiện ra tổng hợp lại chính xác bao nhiêu sản phẩm, quy cách, mức giá vừa được tạo mới hoặc cập nhật thành công.
4. Bạn có thể nhấn **Đóng** và tải lại trang để xem kết quả.

---

## 3. Các lưu ý quan trọng (Dành cho người nhập liệu)

- **Tránh sai lỗi chính tả:** Hệ thống nhận diện "Sản phẩm A" và "Sản phẫm A" là hai món khác nhau. Do đó, hãy giữ tên sản phẩm trên file Excel đồng nhất với tên đang có trên web nếu bạn chỉ muốn cập nhật giá.
- **Giá trị bằng Số:** Cột `Giá bán` và `Giá nhập` tuyệt đối **không chứa khoảng trắng**, dấu chấm phẩy phân cách phần ngàn, hay ký tự chữ. (Đúng: `150000` | Sai: `150.000 vnđ`).
- **Dấu phân cách chuẩn:** File CSV bắt buộc phải dùng **dấu phẩy (`,`)** để phân cách các cột (Comma Separated Values). Tuyệt đối không dùng dấu chấm phẩy (`;`) hay dấu Tab. Nếu dùng Excel tiếng Việt có thể hệ thống lưu mặc định là dấu chấm phẩy, bạn cần lưu ý đổi vùng ngôn ngữ máy tính sang tiếng Anh (US) hoặc dùng Google Sheets tải xuống định dạng CSV để đảm bảo chuẩn dấu phẩy.
- **Giới hạn số dòng:** Để đảm bảo máy tính không bị quá tải, khuyến nghị mỗi file CSV nên chứa tối đa khoảng 1,000 dòng. Nếu báo giá của bạn có 5,000 dòng, hãy cắt ra thành 5 file nhỏ.
- **An toàn dữ liệu:** Tính năng cập nhật giá sẽ tự động ghi đè giá cũ bằng giá mới từ file CSV của bạn mà không thể hoàn tác (undo). Khuyến khích kiểm tra kỹ màn hình "Phân tích dữ liệu" (Bước 2) trước khi nhấn Xác nhận.
