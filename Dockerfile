# 1. Node.js 환경 셋팅
FROM node:18-alpine

WORKDIR /app

# 2. 모든 파일 복사 (리액트 소스 + 서버 소스)
COPY . .

# 3. 의존성 설치 (리액트 패키지 + MCP 서버 패키지 합치기)
# 기존 package.json에 있는 리액트 의존성을 설치하고,
# 서버 구동에 필요한 express 등을 추가로 설치합니다.
RUN npm install
RUN npm install express @modelcontextprotocol/sdk zod cors

# 4. 리액트 빌드 (build 폴더 생성됨)
RUN npm run build

# 5. 포트 열기 및 서버 실행
EXPOSE 8080
CMD ["node", "server.mjs"]
