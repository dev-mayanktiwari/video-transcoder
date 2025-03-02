FROM node:20-slim

# Install FFmpeg
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    apt-get clean

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Compile TypeScript
RUN npm run build

# Create temporary directory
RUN mkdir -p temp

# Set entry point
CMD ["node", "dist/index.js"]