
#!/bin/bash
# Muza: Aura OS Installation Script for Linux/Mac

echo "🌀 Muza: Aura OS - Installation Script"
echo "======================================"
echo

# Check for Node.js
if ! command -v node &> /dev/null
then
    echo "❌ Node.js not found. Please install it from https://nodejs.org/"
    exit 1
fi
echo "✅ Node.js $(node -v) found"
echo

# Check for npm
if ! command -v npm &> /dev/null
then
    echo "❌ npm not found. It should be installed with Node.js."
    exit 1
fi
echo "✅ npm $(npm -v) found"
echo

# Install root dependencies
echo "📦 Installing main application dependencies..."
npm install --legacy-peer-deps
if [ $? -ne 0 ]; then
    echo "❌ Failed to install main dependencies."
    exit 1
fi
echo "✅ Main dependencies installed"
echo

# Install Electron dependencies
if [ -d "electron" ]; then
    echo "📦 Installing Electron dependencies..."
    (cd electron && npm install)
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install Electron dependencies."
        exit 1
    fi
    echo "✅ Electron dependencies installed"
else
    echo "⚠️  Electron directory not found. Skipping Electron setup."
fi
echo

echo "🎉 Installation complete!"
echo
echo "To start the web development server, run:"
echo "  npm run dev"
echo
echo "To start the desktop development app, run:"
echo "  npm run electron:dev"
echo
echo "To build the desktop app for production, run:"
echo "  npm run electron:build:mac  # or :linux"
echo
