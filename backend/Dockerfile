# Dockerfile for Backend

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

RUN npm run db:migrate

EXPOSE 3000

CMD ["npm", "start"]
