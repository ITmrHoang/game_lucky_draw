# Bước 1: Chọn image Node.js mới nhất (phiên bản LTS Alpine cho nhẹ)
FROM node:20-alpine

# Bước 2: Thiết lập thư mục làm việc bên trong container
WORKDIR /app

# Bước 3: Sao chép package.json và package-lock.json để tận dụng cache của Docker
# Chỉ khi các file này thay đổi thì Docker mới chạy lại 'npm install'
COPY package*.json ./

# Bước 4: Cài đặt các dependencies
RUN npm install

# Bước 5: Sao chép toàn bộ mã nguồn còn lại của dự án vào thư mục làm việc
COPY . .

# Bước 6: Mở port 3000 để có thể truy cập từ bên ngoài
EXPOSE 3000

# Bước 7: Lệnh để khởi chạy ứng dụng Nuxt ở chế độ development
CMD ["npm", "run", "dev"]