FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY .env.prod ./.env
ENV NODE_ENV=production
RUN npm cache clean --force
RUN --mount=type=cache,target=/root/.npm npm install
COPY . .
RUN npm prune --production
EXPOSE 5500
CMD ["npm", "start"]
