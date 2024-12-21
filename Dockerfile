# 빌드 단계
FROM node:20 AS builder

WORKDIR /src

# 의존성 파일만 먼저 복사하여 캐시를 활용
COPY package.json yarn.lock ./

# 의존성 설치 (개발 의존성 포함)
RUN yarn install

# 모든 소스 코드 복사
COPY . .

# 최종 이미지 단계
FROM node:20-alpine

WORKDIR /src

# 빌드 단계에서 필요한 파일만 복사
COPY --from=builder /src ./

# 프로덕션 의존성만 설치 (개발 의존성 제외)
RUN yarn install --production

EXPOSE 3333

# 서버 실행
CMD ["node", "server.js"]
