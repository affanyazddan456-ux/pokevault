#!/bin/bash
# ============================================================
#  PokéVault — Linux Deployment (port 80 direct)
# ============================================================

echo "🃏 PokéVault Deployment Starting..."

# Install Node.js 20 if missing
if ! command -v node &> /dev/null; then
  echo "Installing Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
echo "Node: $(node --version)"

# Go to app folder
cd /home/eleea/pokevault

# Install dependencies
npm install --production

# Create required folders
mkdir -p data uploads/cards uploads/avatars public/audio

# Stop any process on port 80
sudo fuser -k 80/tcp 2>/dev/null || true

# Install PM2
if ! command -v pm2 &> /dev/null; then
  sudo npm install -g pm2
fi

# Stop old instance
pm2 stop pokevault 2>/dev/null || true
pm2 delete pokevault 2>/dev/null || true

# Start on port 80 (needs sudo for port 80)
sudo pm2 start server.js --name pokevault
sudo pm2 save
sudo pm2 startup

echo ""
echo "✅ PokéVault running on port 80!"
echo "   http://pokevault.eleea.online"
pm2 status
