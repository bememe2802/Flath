#!/bin/bash
set -e

echo "============================================"
echo "  Flath - Deploy Script (Docker Compose)"
echo "============================================"

VM_IP="34.143.149.89"
PROJECT_DIR="/opt/flath"

# === 1. Build all backend services ===
echo "[1/4] Building backend services..."
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

wait
echo "  All backend services built successfully!"

# === 2. Build frontend ===
echo "[2/4] Building frontend..."
cd $PROJECT_DIR/frontend
npm ci
npm run build
echo "  Frontend built successfully!"

# === 3. Start everything with Docker Compose ===
echo "[3/4] Starting all services with Docker Compose..."
cd $PROJECT_DIR
docker compose up -d --build
echo "  All services started!"

# === 4. Verify ===
echo "[4/4] Verifying services..."
sleep 15

echo ""
echo "============================================"
echo "  Flath Deployment Complete!"
echo "============================================"
echo "  Frontend: http://$VM_IP:3000"
echo "  API Gateway: http://$VM_IP:8888"
echo "  Neo4j Browser: http://$VM_IP:7474"
echo ""
echo "  Run 'docker compose ps' to check status"
echo "  Run 'docker compose logs -f' to view logs"
echo "============================================"