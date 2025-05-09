# PRODUCTION
FROM node:18-bullseye

ENV QT_QPA_PLATFORM=offscreen

# Install OpenSCAD
RUN apt-get update && apt-get install -y \
    openscad \
    libgl1-mesa-glx \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy files and install dependencies
COPY . .

RUN npm install

# Build React frontend
RUN npm run build

# Assume Express serves from 'build/' already
ENV PORT=3001
EXPOSE 3001

# Start only the server (it will serve the frontend build too)
CMD ["node", "server.js"]
