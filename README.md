# 📱 MobileCity Pro Filter - Svelte Edition

Hệ thống crawl và lọc dữ liệu điện thoại từ MobileCity, được xây dựng với hiệu năng cực cao và giao diện hiện đại.

## 🚀 Tính năng nổi bật
- **Crawler Tự động**: Tự động lấy dữ liệu sản phẩm, thông số kỹ thuật, giá cả và tình trạng kho hàng từ MobileCity.
- **Bộ lọc Thông minh**: Lọc theo tên, khoảng giá, RAM, bộ nhớ trong, loại chip, màn hình, cổng sạc, và nhiều tiêu chí khác.
- **Giao diện Premium**: Thiết kế Dark Mode hiện đại, hiệu ứng mượt mà, hỗ trợ tốt trên mọi thiết bị.
- **Modal Chi tiết**: Xem đầy đủ cấu hình máy ngay trong ứng dụng mà không cần chuyển trang.
- **Tự động cập nhật**: Tích hợp GitHub Actions để tự động crawl dữ liệu mới và deploy mỗi ngày vào lúc 0h.

## 🛠 Công nghệ sử dụng
- **Runtime**: [Bun](https://bun.sh) (Nhanh và mạnh mẽ)
- **Frontend**: [Svelte 5](https://svelte.dev) (Reactive framework hiện đại nhất)
- **Bundler**: [Vite](https://vitejs.dev)
- **Crawler**: [Axios](https://axios-http.com) & [Cheerio](https://cheerio.js.org)
- **Styling**: Vanilla CSS (Custom Variable & Modern CSS)

## 📦 Cài đặt và Chạy local

### 1. Cài đặt dependencies
```bash
bun install
```

### 2. Chạy môi trường phát triển (Dev Mode)
```bash
bun run dev
```

### 3. Chạy Crawler thủ công
```bash
bun run crawl
```

### 4. Build dự án
```bash
bun run build
```

## 🤖 Tự động hóa (Automation)
Dự án được cấu hình GitHub Actions (`.github/workflows/crawl.yml`) để thực hiện các công việc sau mỗi ngày:
1. Chạy script crawl để cập nhật file `products.json`.
2. Build lại ứng dụng Svelte với dữ liệu mới nhất.
3. Deploy bản build mới lên branch `gh-pages`.
4. Dọn dẹp lịch sử deploy và workflow rác.

## 📄 Giấy phép
Dự án này được tạo ra cho mục đích học tập và tham khảo.
