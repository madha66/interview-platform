# Use a base image that has both Node.js and Python preloaded
FROM nikolaik/python-nodejs:python3.11-nodejs20-slim

# Install system dependencies required by OpenCV
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files and install Node.js dependencies
COPY package*.json ./
RUN npm install --production

# Install Python dependencies
# We use opencv-python-headless because headless servers do not have GUI interfaces
RUN pip install --no-cache-dir ultralytics opencv-python-headless numpy

# Copy the rest of the backend files
COPY . .

# Expose the backend port
EXPOSE 3000

# Start the Node.js server
CMD ["node", "server.js"]
