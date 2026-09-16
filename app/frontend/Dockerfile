FROM node:20-alpine

WORKDIR /app

COPY app/frontend/package*.json ./
RUN npm ci

COPY app/frontend/ .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
