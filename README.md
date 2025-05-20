# NFT Viewer - Ứng dụng Xem NFT trên BASE Mainnet

Ứng dụng web đơn giản cho phép xem danh sách NFT của một địa chỉ ví trên mạng BASE Mainnet.

## Yêu cầu hệ thống

- Node.js (phiên bản 14.0.0 trở lên)
- Trình duyệt web hiện đại (Chrome, Firefox, Edge,...)

## Hướng dẫn cài đặt

### Bước 1: Cài đặt Node.js

1. Truy cập trang web chính thức của Node.js: https://nodejs.org
2. Tải xuống phiên bản LTS (Long Term Support)
3. Chạy file cài đặt và làm theo các hướng dẫn
4. Để kiểm tra cài đặt thành công, mở Command Prompt và gõ:
   ```
   node --version
   npm --version
   ```

### Bước 2: Tải và chuẩn bị dự án

1. Tải xuống toàn bộ mã nguồn của dự án
2. Mở Command Prompt và di chuyển đến thư mục dự án:
   ```
   cd đường_dẫn_đến_thư_mục_dự_án
   ```

### Bước 3: Cài đặt các thư viện cần thiết

1. Trong Command Prompt, chạy lệnh:
   ```
   npm install
   ```
2. Đợi quá trình cài đặt hoàn tất

### Bước 4: Cấu hình API Key

1. Đăng ký tài khoản miễn phí tại Alchemy: https://alchemy.com
2. Tạo một ứng dụng mới cho mạng BASE Mainnet
3. Sao chép API Key từ Alchemy
4. Tạo file .env trong thư mục dự án (hoặc đổi tên file .env.example thành .env)
5. Cập nhật API Key trong file .env:
   ```
   ALCHEMY_API_KEY=your_api_key_here
   ```

## Hướng dẫn sử dụng

### Bước 1: Khởi động ứng dụng

1. Mở Command Prompt trong thư mục dự án
2. Chạy lệnh:
   ```
   npm start
   ```
3. Đợi cho đến khi thấy thông báo "Server đang chạy tại http://localhost:3000"

### Bước 2: Truy cập ứng dụng

1. Mở trình duyệt web
2. Truy cập địa chỉ: http://localhost:3000
3. Nhập địa chỉ ví Ethereum cần xem NFT
4. Nhấn nút "Xem NFT" và đợi kết quả

## Xử lý lỗi thường gặp

1. **Lỗi "Port 3000 đã được sử dụng"**
   - Dừng các ứng dụng khác đang sử dụng port 3000
   - Hoặc thay đổi port trong file .env: `PORT=3001`

2. **Lỗi "Không thể kết nối với server"**
   - Kiểm tra xem server đã được khởi động chưa
   - Kiểm tra API Key trong file .env
   - Kiểm tra kết nối internet

3. **Không tìm thấy NFT**
   - Kiểm tra lại địa chỉ ví đã nhập
   - Đảm bảo ví có sở hữu NFT trên mạng BASE Mainnet

## Lưu ý

- Ứng dụng chỉ hiển thị NFT từ hợp đồng có địa chỉ: 0x0e381cd73faa421066dc5e2829a973405352168c
- API Key của Alchemy có giới hạn số lượng request miễn phí
- Thời gian tải NFT có thể khác nhau tùy thuộc vào số lượng NFT và tốc độ mạng

## Hỗ trợ

Nếu bạn gặp khó khăn trong quá trình cài đặt hoặc sử dụng, hãy:
1. Kiểm tra lại các bước trong hướng dẫn
2. Tìm kiếm lỗi trên Google
3. Hỏi giáo viên hoặc bạn bè để được giúp đỡ