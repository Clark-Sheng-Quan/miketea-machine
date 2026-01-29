# Dockerfile for Frontend - Development Mode

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN rm -rf node_modules && npm install

COPY . .

EXPOSE 3001

CMD ["npm", "run", "dev", "--", "--host"]
