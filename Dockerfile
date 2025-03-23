FROM node:18-alpine AS dependencies

# Install only the dependencies we need for building
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy only package files for better caching
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

FROM node:18-slim AS runtime

# Install minimal Puppeteer dependencies in one layer
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    ca-certificates \
    curl \
    # Only the essential fonts
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Set working directory
WORKDIR /app

# Copy only necessary files from the dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy only needed app files
COPY package*.json ./
COPY cmd ./cmd
COPY .env ./.env

# Set environment variables
ENV NODE_ENV=production
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV OPEN_CHROME=false

# Start the application
CMD ["node", "cmd/index.js"] 