FROM node:slim AS builder

WORKDIR /src

# 의존성 파일만 먼저 복사하여 캐시를 활용
COPY package.json yarn.lock ./

# 의존성 설치 (개발 의존성 포함)
RUN yarn install

# 모든 소스 코드 복사
COPY . .

FROM node:slim

WORKDIR /src

RUN ["yarn", "install"]

# 필요 파일만 복사 (src 디렉토리의 내용을 /src로 복사)
COPY --from=builder /src ./

EXPOSE 3334

# 서버 실행
CMD ["node", "apiLoginServer.js"]
