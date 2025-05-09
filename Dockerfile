FROM node:18-bullseye

ENV QT_QPA_PLATFORM=offscreen

# Install OpenSCAD and dependencies
RUN apt-get update && apt-get install -y \
    openscad \
    libgl1-mesa-glx \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the files
COPY . .

# Build React frontend
RUN npm run build

# Expose the backend port
EXPOSE 3001

# Start the Express server
CMD ["node", "server.js"]
