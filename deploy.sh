#!/bin/bash

# AWS Lightsail 설정
SERVER_IP="54.116.9.70"
USERNAME="ubuntu" # Lightsail 기본 유저 (Node.js/Ubuntu 이미지 기준)
KEY_PATH="/path/to/your/key.pem" # ⚠️ 여기에 실제 키 파일 경로를 입력하세요!

# 1. 파일 업로드 (node_modules, .git 제외)
echo "📂 파일을 서버로 업로드 중..."
scp -i "$KEY_PATH" -r \
    --exclude "node_modules" \
    --exclude ".git" \
    --exclude ".DS_Store" \
    ./* $USERNAME@$SERVER_IP:~/app/

# 2. 서버에서 패키지 설치 및 재시작
echo "🚀 서버에서 애플리케이션 재시작 중..."
ssh -i "$KEY_PATH" $USERNAME@$SERVER_IP << EOF
    # 앱 디렉토리 생성 (없으면)
    mkdir -p ~/app
    cd ~/app

    # 의존성 설치
    npm install

    # 기존 프로세스 종료 (있다면)
    pkill -f "node server.js" || true

    # 백그라운드에서 서버 시작 (로그는 app.log에 저장)
    nohup node server.js > app.log 2>&1 &
    
    echo "✅ 배포 완료! 서버가 실행되었습니다."
EOF
