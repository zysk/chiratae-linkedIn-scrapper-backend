# Build stage for transpiling code
FROM node:20 AS builder
WORKDIR /app

# Copy package files and install all dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Transpile code with Babel
RUN npx babel bin/ --out-dir dist/bin/
RUN npx babel Builders/ --out-dir dist/Builders/
RUN npx babel controllers/ --out-dir dist/controllers/
RUN npx babel helpers/ --out-dir dist/helpers/
RUN npx babel middlewares/ --out-dir dist/middlewares/
RUN npx babel models/ --out-dir dist/models/
RUN npx babel routes/ --out-dir dist/routes/
RUN npx babel app.js --out-dir dist/

# Production stage
FROM node:20
WORKDIR /app

# Install Chrome dependencies
RUN apt-get update && apt-get install -y \
	chromium \
	chromium-driver \
	--no-install-recommends \
	&& rm -rf /var/lib/apt/lists/*

# Set Chrome environment variables
ENV CHROME_BIN=/usr/bin/chromium \
	CHROME_PATH=/usr/lib/chromium/ \
	CHROMEDRIVER_PATH=/usr/bin/chromedriver \
	PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Set production environment
ENV NODE_ENV=production

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy transpiled code from builder stage
COPY --from=builder /app/dist ./

# Copy other necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.env.prod ./.env
COPY --from=builder /app/chromedriver* ./

# Make chromedriver executable
RUN chmod +x ./chromedriver*

# Only expose application port
EXPOSE 5500

# Run the application with Node.js
CMD ["node", "bin/www.js"]