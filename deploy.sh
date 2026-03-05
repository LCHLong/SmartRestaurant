#!/bin/bash

# ==============================================================================
# Script: deploy.sh
# Mô tả: Script tự động build và push Docker image lên Docker Hub cho dự án SmartRestaurant.
# ==============================================================================

# 1. Cấu hình thông tin (Bạn hãy thay đổi DOCKER_USER thành username của bạn)
DOCKER_USER="regon" # Thay bằng tên đăng nhập Docker Hub của bạn
IMAGE_NAME="smart-restaurant"
TAG="latest" # Có thể thay bằng phiên bản cụ thể như v1, v2, v1.0.1...

FULL_IMAGE_NAME="$DOCKER_USER/$IMAGE_NAME:$TAG"

# Màu sắc cho terminal (ANSI color codes)
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Bắt đầu quá trình Build và Push Image ===${NC}"

# 2. Xây dựng Docker Image
echo -e "${GREEN}[1/2] Đang xây dựng Docker Image: ${FULL_IMAGE_NAME}...${NC}"
docker build -t "$FULL_IMAGE_NAME" .

# Kiểm tra nếu build thất bại
if [ $? -ne 0 ]; then
    echo -e "${RED}Lỗi: Quá trình build thất bại. Vui lòng kiểm tra lại Dockerfile.${NC}"
    exit 1
fi

# 3. Đẩy Image lên Docker Hub
echo -e "${GREEN}[2/2] Đang đẩy Image lên Docker Hub...${NC}"
docker push "$FULL_IMAGE_NAME"

# Kiểm tra nếu push thất bại
if [ $? -ne 0 ]; then
    echo -e "${RED}Lỗi: Không thể push image lên Docker Hub. Đảm bảo bạn đã chạy 'docker login'.${NC}"
    exit 1
fi

echo -e "${BLUE}=== Hoàn tất! Image đã sẵn sàng tại: https://hub.docker.com/r/$DOCKER_USER/$IMAGE_NAME ===${NC}"
