#!/bin/bash
# Script deploy API Gateway - chạy trên VM

cd /opt/flath/backend/api-gateway

echo "=== Build gateway ==="
mvn clean package -DskipTests -q

echo "=== Rebuild & restart gateway container ==="
cd /opt/flath
docker compose up -d --build api-gateway

sleep 8

echo "=== Test login ==="
curl -s http://localhost:8888/api/v1/identity/auth/token -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test4@test.com","password":"Test123!"}'

echo ""
echo "=== Done ==="