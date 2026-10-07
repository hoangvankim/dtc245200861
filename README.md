# ĐỒ ÁN MÔN HỌC: TRIỂN KHAI VÀ QUẢN TRỊ HỆ THỐNG PHẦN MỀM
## ĐỀ TÀI SỐ 33: WEBSITE TUYỂN DỤNG / JOB BOARD
- **Sinh viên thực hiện:** dtc245200861
- **Công nghệ triển khai:** Node.js (Express), MySQL 8.0, phpMyAdmin, Nginx (Reverse Proxy & HTTPS), Prometheus, Grafana, Loki, Promtail, Docker Compose.

---

## 📌 I. KIẾN TRÚC HỆ THỐNG

Hệ thống được thiết kế theo mô hình Microservices chạy trên môi trường Docker Compose gồm các thành phần:
1. **Web Application (`web-app`):** Website tuyển dụng và nộp CV xây dựng bằng Node.js / Express, chạy dưới quyền user non-root `node`.
2. **Database (`mysql-db`):** Cơ sở dữ liệu quan hệ MySQL 8.0 lưu trữ thông tin việc làm và hồ sơ ứng viên.
3. **Quản trị DB (`phpmyadmin`):** Giao diện web quản lý cơ sở dữ liệu MySQL trực quan.
4. **Reverse Proxy (`nginx-proxy`):** Điều hướng truy cập, tự động chuyển hướng HTTP sang HTTPS với chứng chỉ SSL tự ký và các Security Headers bảo mật.
5. **Giám sát (`prometheus` + `grafana` + `mysqld-exporter` + `nginx-exporter`):** Thu thập metrics phần cứng, container, database và web server hiển thị trực quan trên Grafana Dashboard.
6. **Log tập trung (`loki` + `promtail`):** Thu thập toàn bộ log hệ thống Nginx và App tập trung về Loki, hỗ trợ truy vấn LogQL linh hoạt.

---

## 🚀 II. HƯỚNG DẪN CÀI ĐẶT VÀ KHỞI CHẠY

### 1. Yêu cầu môi trường
- Máy tính đã cài đặt **Docker Desktop** và đã kích hoạt **WSL 2**.
- Git installed.

### 2. Các bước khởi chạy
1. Clone hoặc mở thư mục dự án:
   ```bash
   git clone <URL_REPOSITORY_CUA_BAN>
   cd dtc245200861
   ```

2. Khởi chạy toàn bộ hệ thống bằng Docker Compose:
   ```bash
   docker compose up -d
   ```

3. Kiểm tra trạng thái các container:
   ```bash
   docker compose ps
   ```

---

## 🌐 III. DANH SÁCH DỊCH VỤ VÀ ĐƯỜNG DẪN TRUY CẬP

| Dịch vụ | Địa chỉ truy cập | Tài khoản / Mật khẩu | Chức năng |
|---|---|---|---|
| **Website Tuyển Dụng (HTTPS)** | [https://localhost](https://localhost) | Không yêu cầu | Xem tin, đăng tin, nộp CV (được proxy qua Nginx) |
| **Website Tuyển Dụng (Direct)** | [http://localhost:3000](http://localhost:3000) | Không yêu cầu | Truy cập trực tiếp cổng ứng dụng |
| **phpMyAdmin** | [http://localhost:8080](http://localhost:8080) | User: `root` / Pass: `rootpassword` | Quản trị CSDL MySQL |
| **Prometheus** | [http://localhost:9090](http://localhost:9090) | Không yêu cầu | Thu thập và cảnh báo Metrics |
| **Grafana Dashboard** | [http://localhost:3001](http://localhost:3001) | User: `admin` / Pass: `admin` | Trực quan hóa dữ liệu giám sát và logs |
| **Loki Log Server** | [http://localhost:3100](http://localhost:3100) | Không yêu cầu | Máy chủ nhận và lưu trữ log tập trung |

---

## 📊 IV. TRUY VẤN LOGQL MẪU (LOKI + GRAFANA)

Truy cập Grafana tại `http://localhost:3001`, chọn **Explore**, chọn datasource **Loki** và sử dụng các câu truy vấn LogQL sau:

1. **Truy vấn toàn bộ log của Nginx:**
   ```logql
   {service="nginx"}
   ```
2. **Lọc log các yêu cầu có mã phản hồi thành công (HTTP 200):**
   ```logql
   {service="nginx"} |= " 200 "
   ```
3. **Lọc log truy cập vào các API hệ thống (/api/status, /api/jobs):**
   ```logql
   {service="nginx"} |= "/api/"
   ```
4. **Đếm tần suất request theo thời gian (Metric Query):**
   ```logql
   rate({service="nginx"}[1m])
   ```

---

## 🔒 V. CÁC BIỆN PHÁP HARDENING ĐÃ ÁP DỤNG

Hệ thống tuân thủ nghiêm ngặt các tiêu chuẩn bảo mật hệ thống:
1. **Chạy Container dưới quyền Non-root User (`USER node`):** Container ứng dụng web không chạy với quyền `root`, giúp ngăn chặn tấn công leo thang đặc quyền (Privilege Escalation).
2. **Network Isolation (Phân tách mạng độc lập):**
   - `frontend-net`: Chỉ gồm Nginx, Web App và phpMyAdmin.
   - `backend-net`: Dành riêng cho giao tiếp nội bộ giữa Web App, phpMyAdmin và Database MySQL. Cơ sở dữ liệu hoàn toàn không mở cổng ra ngoài Internet.
   - `monitoring-net`: Dành riêng cho hệ sinh thái giám sát (Prometheus, Grafana, Loki, Exporters).
3. **Nginx Security Headers & SSL/TLS:**
   - Cấu hình HTTPS tự ký với mã hóa TLSv1.2 & TLSv1.3.
   - Tự động chuyển hướng toàn bộ traffic HTTP (port 80) sang HTTPS (port 443).
   - Tích hợp các Header bảo mật chuẩn OWASP: `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`, `Strict-Transport-Security`, `Content-Security-Policy`.
4. **Mật khẩu cơ sở dữ liệu mạnh và kiểm soát biến môi trường:** Bảo mật dữ liệu nhạy cảm qua Docker environment.

---

## 📂 VI. CẤU TRÚC THƯ MỤC DỰ ÁN

```text
├── Dockerfile                  # Đóng gói Node.js Web App với user non-root
├── docker-compose.yml          # Quản lý 10 dịch vụ và phân tách 3 subnet mạng
├── package.json                # Dependencies ứng dụng
├── server.js                   # Mã nguồn Backend API & kết nối MySQL
├── public/                     # Giao diện Website Tuyển dụng
│   └── index.html
├── nginx/                      # Cấu hình Reverse Proxy & SSL
│   ├── nginx.conf
│   └── ssl/
│       ├── server.crt
│       └── server.key
├── monitoring/                 # Cấu hình Giám sát Prometheus & Grafana
│   ├── prometheus/
│   │   └── prometheus.yml
│   └── grafana/
│       └── provisioning/
│           ├── dashboards/
│           └── datasources/
└── logging/                    # Cấu hình Quản lý Log tập trung
    ├── loki/
    │   └── loki-config.yml
    └── promtail/
        └── promtail-config.yml
```
