#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "🚀 HOMECRAFT 3D CAD - Automated Production Deployment"
echo "=========================================================="

# 1. Update packages and install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "📦 Docker not detected. Installing Docker Engine..."
    sudo apt-get update -y
    sudo apt-get install -y ca-certificates curl gnupg lsb-release
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg --yes
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    sudo systemctl enable docker
    sudo systemctl start docker
    echo "✅ Docker successfully installed."
fi

# Ensure user is in docker group
sudo usermod -aG docker $USER || true

# 2. Prepare persistent data directories
echo "📁 Setting up persistent database & CAD upload directories..."
mkdir -p data public/uploads/models
chmod -R 775 data public/uploads

# 3. Stop existing container if running
echo "🛑 Stopping existing application containers if any..."
docker compose down --remove-orphans || true

# 4. Clean unused docker build caches to save disk space
echo "🧹 Cleaning previous unused docker images and cache..."
docker image prune -f || true

# 5. Build and launch container
echo "🏗️ Building and deploying Next.js 3D CAD application..."
docker compose up -d --build

# 6. Verify status
echo "🔍 Checking container health status..."
sleep 5
docker compose ps

echo "=========================================================="
echo "✨ DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "🌐 Your 3D CAD Web application is live on port 80!"
echo "💾 Database: Persistent at ./data"
echo "📦 CAD Files: Persistent at ./public/uploads"
echo "=========================================================="
