FROM node:18-bullseye

ENV QT_QPA_PLATFORM=offscreen

# Install OpenSCAD + GUI dependencies
RUN apt-get update && apt-get install -y \
    openscad \
    libgl1-mesa-glx \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /workspace

# Expose the frontend and backend ports
EXPOSE 3000 3001
