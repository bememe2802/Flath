#!/bin/bash
set -e

echo "============================================"
echo "  Flath - Deploy Script"
echo "============================================"

# === CONFIG ===
VM_IP="34.143.149.89"
PROJECT_DIR="/opt/flath"

# === 1. Start databases with Docker ===
echo "[1/5] Starting databases (MySQL, MongoDB, Neo4j, Kafka, Redis)..."
cd $PROJECT_DIR/backend
docker compose up -d

# Wait for databases to be ready
echo "Waiting for databases to be ready..."
sleep 30

# === 2. Build all backend services ===
echo "[2/5] Building backend services..."
cd $PROJECT_DIR/backend

SERVICES=(
  "identity-service"
  "profile-service"
  "post-service"
  "chat-service"
  "file-service"
  "notification-service"
  "newsfeed-service"
  "study-service"
  "api-gateway"
)

for service in "${SERVICES[@]}"; do
  echo "  -> Building $service..."
  cd $PROJECT_DIR/backend/$service
  mvn clean package -DskipTests -q &
done

# Wait for all builds to finish
wait
echo "  All services built successfully!"

# === 3. Start backend services ===
echo "[3/5] Starting backend services..."

# Identity service
cd $PROJECT_DIR/backend/identity-service
nohup java -jar target/identity-service-*.jar > /var/log/flath/identity.log 2>&1 &
echo "  -> identity-service started (PID: $!)"

sleep 15

# Profile service
cd $PROJECT_DIR/backend/profile-service
nohup java -jar target/profile-service-*.jar > /var/log/flath/profile.log 2>&1 &
echo "  -> profile-service started (PID: $!)"

sleep 10

# Post service
cd $PROJECT_DIR/backend/post-service
nohup java -jar target/post-service-*.jar > /var/log/flath/post.log 2>&1 &
echo "  -> post-service started (PID: $!)"

sleep 10

# Notification service
cd $PROJECT_DIR/backend/notification-service
nohup java -jar target/notification-service-*.jar > /var/log/flath/notification.log 2>&1 &
echo "  -> notification-service started (PID: $!)"

sleep 10

# Chat service
cd $PROJECT_DIR/backend/chat-service
nohup java -jar target/chat-service-*.jar > /var/log/flath/chat.log 2>&1 &
echo "  -> chat-service started (PID: $!)"

sleep 10

# File service
cd $PROJECT_DIR/backend/file-service
nohup java -jar target/file-service-*.jar > /var/log/flath/file.log 2>&1 &
echo "  -> file-service started (PID: $!)"

sleep 10

# Newsfeed service
cd $PROJECT_DIR/backend/newsfeed-service
nohup java -jar target/newsfeed-service-*.jar > /var/log/flath/newsfeed.log 2>&1 &
echo "  -> newsfeed-service started (PID: $!)"

sleep 10

# Study service
cd $PROJECT_DIR/backend/study-service
nohup java -jar target/study-service-*.jar > /var/log/flath/study.log 2>&1 &
echo "  -> study-service started (PID: $!)"

sleep 10

# API Gateway (last)
cd $PROJECT_DIR/backend/api-gateway
nohup java -jar target/api-gateway-*.jar > /var/log/flath/gateway.log 2>&1 &
echo "  -> api-gateway started (PID: $!)"

sleep 15

# === 4. Build and start frontend ===
echo "[4/5] Building frontend..."
cd $PROJECT_DIR/frontend
export NEXT_PUBLIC_API_ENDPOINT=http://$VM_IP:8888/api/v1
export NEXT_PUBLIC_URL=http://$VM_IP:3000
npm ci
npm run build

echo "Starting frontend..."
nohup npm start > /var/log/flath/frontend.log 2>&1 &
echo "  -> frontend started (PID: $!)"

# === 5. Verify ===
echo "[5/5] Verifying services..."
sleep 10

echo ""
echo "============================================"
echo "  Flath Deployment Complete!"
echo "============================================"
echo "  Frontend: http://$VM_IP:3000"
echo "  API Gateway: http://$VM_IP:8888"
echo "  Neo4j Browser: http://$VM_IP:7474"
echo ""
echo "  Logs: /var/log/flath/"
echo "============================================"