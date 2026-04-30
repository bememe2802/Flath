# Hướng dẫn Deploy Flath lên Google Cloud Free Tier

## 📋 Mục lục

1. [Đăng ký Google Cloud](#1-đăng-ký-google-cloud)
2. [Cài đặt gcloud CLI trên máy tính](#2-cài-đặt-gcloud-cli-trên-máy-tính)
3. [Tạo VM trên Google Cloud](#3-tạo-vm-trên-google-cloud)
4. [Kết nối SSH vào VM](#4-kết-nối-ssh-vào-vm)
5. [Cài đặt môi trường trên VM](#5-cài-đặt-môi-trường-trên-vm)
6. [Clone code Flath và build](#6-clone-code-flath-và-build)
7. [Cấu hình .env và Dockerfile](#7-cấu-hình-env-và-dockerfile)
8. [Chạy toàn bộ hệ thống](#8-chạy-toàn-bộ-hệ-thống)
9. [Kiểm tra và truy cập](#9-kiểm-tra-và-truy-cập)
10. [Xóa VM khi không dùng nữa](#10-xóa-vm-khi-không-dùng-nữa)

---

## 1. Đăng ký Google Cloud

### Bước 1: Truy cập trang Free Tier

Mở trình duyệt, vào: **https://cloud.google.com/free**

### Bước 2: Click "Get started for free"

![GCP Free Tier](https://cloud.google.com/free/images/free-tier-hero.svg)

### Bước 3: Đăng nhập Google Account

- Dùng Gmail cá nhân của bạn
- Nếu chưa có → tạo mới

### Bước 4: Nhập thông tin thanh toán

Google yêu cầu thẻ để xác thực bạn là người thật:

| Thông tin | Ghi chú |
|-----------|---------|
| **Loại thẻ** | Visa hoặc Mastercard (Debit/Credit đều được) |
| **Số dư** | Không cần, chỉ giữ $1 rồi trả lại |
| **Quốc gia** | Vietnam |
| **Rủi ro** | **$0** — không bị trừ tiền nếu không nâng cấp |

> ⚠️ **Quan trọng**: Sau khi nhập thẻ, bạn sẽ thấy thông báo:
> *"You won't be charged unless you manually upgrade to a paid account"*
> → Nghĩa là: **Sẽ không bị tính phí trừ khi bạn tự nâng cấp**

### Bước 5: Nhận $300 credit

Sau khi đăng ký thành công, bạn sẽ thấy:

```
🎉 You now have $300 in free credits
   Valid for 90 days
```

---

## 2. Cài đặt gcloud CLI trên máy tính

> **Bước này làm trên máy tính Windows của bạn, không phải trên cloud**

### Cách 1: Dùng PowerShell (nhanh nhất)

Mở **PowerShell** (Run as Administrator) và chạy:

```powershell
# Tải và cài gcloud CLI
(New-Object Net.WebClient).DownloadFile("https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe", "$env:TEMP\gcloud.exe")
Start-Process "$env:TEMP\gcloud.exe" -ArgumentList "/S" -Wait

# Khởi động lại PowerShell, sau đó đăng nhập
gcloud auth login
```

Trình duyệt sẽ mở ra → đăng nhập Google Account vừa đăng ký.

### Cách 2: Tải thủ công

1. Vào: https://cloud.google.com/sdk/docs/install
2. Click **Windows (64-bit)**
3. Chạy file `.exe` vừa tải
4. Mở CMD/PowerShell mới, chạy:
```bash
gcloud auth login
```

### Kiểm tra cài đặt thành công

```bash
gcloud --version
# Output mẫu: Google Cloud SDK 480.0.0
```

---

## 3. Tạo VM trên Google Cloud

### Cách 1: Dùng gcloud CLI (nhanh, khuyến nghị)

Mở **CMD** hoặc **PowerShell** trên máy bạn, chạy từng lệnh:

```bash
# Bước 1: Tạo project
gcloud projects create flath-project --name="Flath"

# Bước 2: Set project mặc định
gcloud config set project flath-project

# Bước 3: Bật Compute Engine API
gcloud services enable compute.googleapis.com

# Bước 4: Tạo VM e2-standard-2 (2 vCPU, 8GB RAM)
gcloud compute instances create flath-vm ^
  --zone=asia-southeast1-a ^
  --machine-type=e2-standard-2 ^
  --image-family=ubuntu-2204-lts ^
  --image-project=ubuntu-os-cloud ^
  --boot-disk-size=50GB ^
  --boot-disk-type=pd-ssd ^
  --tags=flath-server

# Bước 5: Mở port 3000 (frontend) và 8888 (API gateway)
gcloud compute firewall-rules create allow-flath ^
  --allow tcp:3000,tcp:8888 ^
  --source-ranges 0.0.0.0/0 ^
  --target-tags=flath-server
```

> ⏳ Đợi 2-3 phút để VM được tạo.

### Cách 2: Dùng Web Console (thủ công)

Nếu không muốn dùng CLI, làm trên web:

1. Vào: https://console.cloud.google.com/
2. Chọn project **flath-project**
3. Vào menu ☰ → **Compute Engine** → **VM instances**
4. Click **Create Instance**
5. Điền thông tin:

| Trường | Giá trị |
|--------|---------|
| **Name** | flath-vm |
| **Region** | asia-southeast1 (Singapore) |
| **Zone** | asia-southeast1-a |
| **Machine type** | e2-standard-2 (2 vCPU, 8GB RAM) |
| **Boot disk** | Ubuntu 22.04 LTS, 50GB SSD |
| **Firewall** | ☑ Allow HTTP traffic (port 80) |
| | ☑ Allow HTTPS traffic (port 443) |

6. Click **Create**

Sau đó mở thêm port 3000 và 8888:
- Vào **VPC network** → **Firewall**
- Click **Create Firewall Rule**
- Name: `allow-flath`
- Targets: `flath-server`
- Source IP: `0.0.0.0/0`
- Protocols: ☑ TCP → ports: `3000,8888`
- Click **Create**

### Lấy IP của VM

```bash
gcloud compute instances describe flath-vm ^
  --zone=asia-southeast1-a ^
  --format="get(networkInterfaces[0].accessConfigs[0].natIP)"
```

Ghi lại IP này, ví dụ: **34.123.45.67**

---

## 4. Kết nối SSH vào VM

### Cách 1: Dùng gcloud (dễ nhất)

```bash
gcloud compute ssh flath-vm --zone=asia-southeast1-a
```

Lần đầu sẽ tạo SSH key tự động. Sau đó bạn sẽ vào được terminal của VM.

### Cách 2: Dùng SSH client (PuTTY)

Nếu bạn muốn dùng PuTTY:

```bash
# Tạo SSH key trên máy bạn
ssh-keygen -t rsa -b 4096 -f ~/.ssh/flath-key -C "ubuntu"

# Thêm public key vào VM
gcloud compute instances add-metadata flath-vm ^
  --zone=asia-southeast1-a ^
  --metadata=ssh-keys="ubuntu:$(cat ~/.ssh/flath-key.pub)"

# SSH vào
ssh -i ~/.ssh/flath-key ubuntu@<VM_IP>
```

### Cách 3: Dùng Web SSH (không cần cài gì)

1. Vào: https://console.cloud.google.com/
2. Menu ☰ → **Compute Engine** → **VM instances**
3. Click **SSH** bên cạnh VM `flath-vm`
4. Trình duyệt sẽ mở terminal

---

## 5. Cài đặt môi trường trên VM

Sau khi SSH vào VM, chạy các lệnh sau:

### 5.1 Cập nhật hệ thống

```bash
sudo apt update && sudo apt upgrade -y
```

### 5.2 Cài Docker

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

### 5.3 Cài Docker Compose plugin

```bash
sudo apt install docker-compose-plugin -y
```

### 5.4 Thêm user vào docker group (để không cần sudo)

```bash
sudo usermod -aG docker $USER
```

### 5.5 Áp dụng group mới

```bash
newgrp docker
```

### 5.6 Kiểm tra

```bash
docker --version
# Output: Docker version 27.x.x

docker compose version
# Output: Docker Compose version v2.x.x
```

### 5.7 Cài Maven (để build Java)

```bash
sudo apt install maven -y
mvn --version
# Output: Apache Maven 3.8.x
```

### 5.8 Cài Node.js 22 (để build frontend)

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install nodejs -y
node --version
# Output: v22.x.x
npm --version
# Output: 10.x.x
```

---

## 6. Clone code Flath và build

### 6.1 Clone repository

```bash
cd /opt
sudo mkdir -p flath
sudo chown ubuntu:ubuntu flath
git clone https://github.com/bememe2802/Flath.git /opt/flath
cd /opt/flath
```

### 6.2 Build backend (tất cả services)

```bash
cd /opt/flath/backend

# Build toàn bộ project (dùng -T 4 để build song song 4 luồng)
mvn clean package -DskipTests -T 4
```

> ⏳ Quá trình này mất **5-10 phút** tùy tốc độ VM.
>
> Nếu thành công, bạn sẽ thấy: `BUILD SUCCESS`
>
> File JAR sẽ nằm ở:
> ```
> backend/api-gateway/target/*.jar
> backend/identity-service/target/*.jar
> backend/profile-service/target/*.jar
> backend/post-service/target/*.jar
> backend/chat-service/target/*.jar
> backend/notification-service/target/*.jar
> backend/file-service/target/*.jar
> backend/study-service/target/*.jar
> backend/newsfeed-service/target/*.jar
> ```

### 6.3 Build frontend

```bash
cd /opt/flath/frontend
npm ci
npm run build
```

> ⏳ Quá trình này mất **2-3 phút**.

---

## 7. Cấu hình .env và Dockerfile

### 7.1 Lấy IP của VM

```bash
# Trong VM, chạy:
curl -s ifconfig.me
# Output: 34.123.45.67 (IP của bạn)
```

### 7.2 Tạo file .env

```bash
cd /opt/flath

# Thay 34.123.45.67 bằng IP thật của bạn
cat > .env << 'EOF'
DOMAIN=34.123.45.67
MYSQL_ROOT_PASSWORD=Flath@2024!
MYSQL_DATABASE=backend_identity
MONGO_ROOT_USERNAME=root
MONGO_ROOT_PASSWORD=Flath@2024!
NEO4J_AUTH=neo4j/Flath@2024!
KAFKA_BROKER=kafka:9092
REDIS_HOST=redis
JWT_SECRET=flath-jwt-secret-key-2024-very-strong
JWT_EXPIRATION=3600
NEXT_PUBLIC_API_ENDPOINT=http://34.123.45.67:8888
NEXT_PUBLIC_URL=http://34.123.45.67:3000
EOF
```

### 7.3 Tạo Dockerfile cho từng service

```bash
cd /opt/flath

# Tạo Dockerfile cho tất cả services
for service in api-gateway identity-service profile-service post-service chat-service notification-service file-service study-service newsfeed-service; do
  cat > /opt/flath/backend/$service/Dockerfile << 'DOCKERFILE'
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
DOCKERFILE
done
```

### 7.4 Tạo Dockerfile cho frontend

```bash
cat > /opt/flath/frontend/Dockerfile << 'DOCKERFILE'
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/next.config.ts ./next.config.ts
EXPOSE 3000
CMD ["npm", "start"]
DOCKERFILE
```

---

## 8. Chạy toàn bộ hệ thống

### 8.1 Tạo docker-compose.yml

```bash
cat > /opt/flath/docker-compose.yml << 'COMPOSE'
name: flath
services:
  # === INFRASTRUCTURE ===
  mysql:
    image: mysql:8.0.40-debian
    container_name: mysql
    hostname: mysql
    restart: always
    ports:
      - '3306:3306'
    volumes:
      - mysql_data:/var/lib/mysql
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 20s
      retries: 10
    networks:
      - flath-net

  mongodb:
    image: mongo:8.0.1-noble
    container_name: mongodb
    hostname: mongodb
    restart: always
    ports:
      - '27017:27017'
    volumes:
      - mongo_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USERNAME}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
    networks:
      - flath-net

  neo4j:
    image: neo4j:5.24.2
    container_name: neo4j
    hostname: neo4j
    restart: always
    ports:
      - '7474:7474'
      - '7687:7687'
    volumes:
      - neo4j_data:/data
    environment:
      - NEO4J_AUTH=${NEO4J_AUTH}
    networks:
      - flath-net

  redis:
    image: redis:7.4-alpine
    container_name: redis
    hostname: redis
    restart: always
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    networks:
      - flath-net

  kafka:
    image: apache/kafka:3.7.0
    container_name: kafka
    hostname: kafka
    restart: always
    ports:
      - '9092:9092'
    environment:
      KAFKA_NODE_ID: 0
      KAFKA_PROCESS_ROLES: controller,broker
      KAFKA_CONTROLLER_QUORUM_VOTERS: 0@kafka:9093
      KAFKA_LISTENERS: PLAINTEXT://:9092,CONTROLLER://:9093
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT
      KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER
    volumes:
      - kafka_data:/var/lib/kafka/data
    networks:
      - flath-net

  # === BACKEND SERVICES ===
  identity-service:
    build: ./backend/identity-service
    container_name: identity-service
    hostname: identity-service
    restart: always
    environment:
      - server.port=8080
      - spring.datasource.url=jdbc:mysql://mysql:3306/${MYSQL_DATABASE}
      - spring.datasource.password=${MYSQL_ROOT_PASSWORD}
      - jwk.rsa-private-key=${JWT_SECRET}
    depends_on:
      mysql:
        condition: service_healthy
    networks:
      - flath-net

  profile-service:
    build: ./backend/profile-service
    container_name: profile-service
    hostname: profile-service
    restart: always
    environment:
      - server.port=8081
      - spring.neo4j.uri=bolt://neo4j:7687
      - spring.neo4j.authentication.password=${NEO4J_AUTH#neo4j/}
      - kafka.bootstrap-servers=${KAFKA_BROKER}
    depends_on:
      - neo4j
      - kafka
    networks:
      - flath-net

  post-service:
    build: ./backend/post-service
    container_name: post-service
    hostname: post-service
    restart: always
    environment:
      - server.port=8083
      - spring.data.mongodb.uri=mongodb://${MONGO_ROOT_USERNAME}:${MONGO_ROOT_PASSWORD}@mongodb:27017
      - kafka.bootstrap-servers=${KAFKA_BROKER}
    depends_on:
      - mongodb
      - kafka
    networks:
      - flath-net

  chat-service:
    build: ./backend/chat-service
    container_name: chat-service
    hostname: chat-service
    restart: always
    environment:
      - server.port=8085
      - spring.data.mongodb.uri=mongodb://${MONGO_ROOT_USERNAME}:${MONGO_ROOT_PASSWORD}@mongodb:27017
    depends_on:
      - mongodb
    networks:
      - flath-net

  notification-service:
    build: ./backend/notification-service
    container_name: notification-service
    hostname: notification-service
    restart: always
    environment:
      - server.port=8082
      - spring.data.mongodb.uri=mongodb://${MONGO_ROOT_USERNAME}:${MONGO_ROOT_PASSWORD}@mongodb:27017
      - kafka.bootstrap-servers=${KAFKA_BROKER}
    depends_on:
      - mongodb
      - kafka
    networks:
      - flath-net

  file-service:
    build: ./backend/file-service
    container_name: file-service
    hostname: file-service
    restart: always
    environment:
      - server.port=8084
      - spring.data.mongodb.uri=mongodb://${MONGO_ROOT_USERNAME}:${MONGO_ROOT_PASSWORD}@mongodb:27017
    depends_on:
      - mongodb
    networks:
      - flath-net

  study-service:
    build: ./backend/study-service
    container_name: study-service
    hostname: study-service
    restart: always
    environment:
      - server.port=8086
      - spring.datasource.url=jdbc:mysql://mysql:3306/study_db
      - spring.datasource.password=${MYSQL_ROOT_PASSWORD}
    depends_on:
      mysql:
        condition: service_healthy
    networks:
      - flath-net

  newsfeed-service:
    build: ./backend/newsfeed-service
    container_name: newsfeed-service
    hostname: newsfeed-service
    restart: always
    environment:
      - server.port=8087
      - spring.data.redis.host=${REDIS_HOST}
      - kafka.bootstrap-servers=${KAFKA_BROKER}
    depends_on:
      - redis
      - kafka
    networks:
      - flath-net

  api-gateway:
    build: ./backend/api-gateway
    container_name: api-gateway
    hostname: api-gateway
    restart: always
    ports:
      - "8888:8888"
    environment:
      - server.port=8888
      - identity.url=http://identity-service:8080
    depends_on:
      - identity-service
    networks:
      - flath-net

  # === FRONTEND ===
  frontend:
    build: ./frontend
    container_name: frontend
    hostname: frontend
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_ENDPOINT=${NEXT_PUBLIC_API_ENDPOINT}
      - NEXT_PUBLIC_URL=${NEXT_PUBLIC_URL}
    depends_on:
      - api-gateway
    networks:
      - flath-net

volumes:
  mysql_data:
  mongo_data:
  neo4j_data:
  redis_data:
  kafka_data:

networks:
  flath-net:
    driver: bridge
COMPOSE
```

### 8.2 Khởi động toàn bộ hệ thống

```bash
cd /opt/flath

# Khởi động tất cả containers
docker compose up -d
```

> ⏳ Lần đầu chạy sẽ mất **5-10 phút** để:
> - Pull images (MySQL, MongoDB, Neo4j, Redis, Kafka)
> - Build Docker images cho services
> - Khởi động databases
> - Chạy migrations

### 8.3 Kiểm tra trạng thái

```bash
# Xem danh sách containers
docker compose ps

# Output mẫu:
# NAME                 STATUS              PORTS
# mysql                Up 2 minutes        3306/tcp
# mongodb              Up 2 minutes        27017/tcp
# neo4j                Up 2 minutes        7474/tcp, 7687/tcp
# redis                Up 2 minutes        6379/tcp
# kafka                Up 2 minutes        9092/tcp
# identity-service     Up 1 minute         8080/tcp
# profile-service      Up 1 minute         8081/tcp
# post-service         Up 1 minute         8083/tcp
# chat-service         Up 1 minute         8085/tcp
# notification-service Up 1 minute         8082/tcp
# file-service         Up 1 minute         8084/tcp
# study-service        Up 1 minute         8086/tcp
# newsfeed-service     Up 1 minute         8087/tcp
# api-gateway          Up 1 minute         0.0.0.0:8888->8888/tcp
# frontend             Up 1 minute         0.0.0.0:3000->3000/tcp
```

Nếu service nào bị crash, xem log:

```bash
# Xem log của service cụ thể
docker compose logs identity-service

# Xem log realtime
docker compose logs -f api-gateway
```

---

## 9. Kiểm tra và truy cập

### 9.1 Kiểm tra API

```bash
# Trong VM, chạy:
curl http://localhost:8888/api/v1/identity/auth/welcome

# Output mẫu: {"message": "Welcome to Flath Identity Service"}
```

### 9.2 Kiểm tra frontend

```bash
curl http://localhost:3000
# Output: HTML của trang chủ
```

### 9.3 Truy cập từ trình duyệt

Mở trình duyệt trên máy bạn:

```
Frontend: http://34.123.45.67:3000
API:      http://34.123.45.67:8888/api/v1/...
```

> Thay `34.123.45.67` bằng IP thật của VM bạn.

### 9.4 Các lệnh hữu ích

```bash
# Xem log realtime của tất cả services
docker compose logs -f

# Xem log của 1 service
docker compose logs -f api-gateway

# Restart 1 service
docker compose restart identity-service

# Dừng tất cả
docker compose down

# Dừng và xóa data (cẩn thận!)
docker compose down -v

# Xem tài nguyên sử dụng
docker stats

# SSH vào container
docker exec -it identity-service sh
```

---

## 10. Xóa VM khi không dùng nữa

### ⚠️ QUAN TRỌNG: Làm bước này trước khi hết 90 ngày

Khi bạn không dùng nữa, hoặc sắp hết $300 credit:

### Cách 1: Xóa VM (không mất phí)

```bash
# Trên máy tính của bạn
gcloud compute instances delete flath-vm --zone=asia-southeast1-a
```

### Cách 2: Xóa toàn bộ project

```bash
gcloud projects delete flath-project
```

### Cách 3: Dừng VM (giữ lại dữ liệu, tốn phí disk ~$2/tháng)

```bash
gcloud compute instances stop flath-vm --zone=asia-southeast1-a

# Khi muốn dùng lại:
gcloud compute instances start flath-vm --zone=asia-southeast1-a
```

### Kiểm tra billing

```bash
# Xem chi phí đã dùng
gcloud billing accounts list
gcloud billing projects describe flath-project
```

Hoặc vào web: https://console.cloud.google.com/billing

---

## 📋 Checklist tóm tắt

### Ngày 1: Setup
- [ ] Đăng ký Google Cloud → nhận $300
- [ ] Cài gcloud CLI trên máy
- [ ] Tạo VM e2-standard-2 (Singapore)
- [ ] Mở port 3000, 8888
- [ ] SSH vào VM

### Ngày 1: Deploy
- [ ] Cài Docker, Maven, Node.js trên VM
- [ ] Clone code Flath
- [ ] Build backend (`mvn clean package -DskipTests -T 4`)
- [ ] Build frontend (`npm ci && npm run build`)
- [ ] Tạo .env, Dockerfiles
- [ ] Chạy `docker compose up -d`
- [ ] Kiểm tra frontend + API

### Ngày 90: Cleanup
- [ ] Xóa VM (`gcloud compute instances delete flath-vm`)
- [ ] Hoặc chuyển sang Oracle Cloud FREE

---

## 💰 Tổng kết chi phí

| Khoản mục | Chi phí |
|-----------|:-------:|
| Đăng ký GCP | **$0** |
| VM e2-standard-2 (2 vCPU, 8GB RAM) | ~$50/tháng (trừ từ $300 credit) |
| 50GB SSD | ~$5/tháng (trừ từ $300 credit) |
| **Tổng 90 ngày** | **$0** (dùng $300 credit) |
| **Sau 90 ngày nếu quên xóa** | ~$55/tháng |

> **Mẹo**: Đặt budget alert để không bị quên:
> ```bash
> gcloud billing budgets create --billing-account=YOUR_BILLING_ACCOUNT \
>   --project=flath-project \
>   --display-name="Flath Budget" \
>   --budget-amount=300 \
>   --threshold-rules=percent=50,percent=90,percent=100