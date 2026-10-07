FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

# Hardening: Chạy ứng dụng dưới quyền user non-root 'node' (bảo mật container)
USER node

EXPOSE 3000

CMD [ "npm", "start" ]
