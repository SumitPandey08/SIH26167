# SatQuery AI — Node.js Gateway Backend Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production

CMD ["node", "dist/server.js"]
