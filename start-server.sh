#!/bin/bash

# SLUGGER JWT Testing Widget - Local Development Server
# This script starts a simple HTTP server for local testing

echo "🚀 SLUGGER JWT Testing Widget - Local Server"
echo "=============================================="
echo ""

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    echo "✅ Python 3 found"
    echo "📡 Starting server on http://localhost:8080"
    echo ""
    echo "💡 Tips:"
    echo "   - Open http://localhost:8080 in your browser"
    echo "   - Press Ctrl+C to stop the server"
    echo "   - For mock testing, open http://localhost:8080/mock-shell.html"
    echo ""
    python3 -m http.server 8080
# Check if Python 2 is available
elif command -v python &> /dev/null; then
    echo "✅ Python 2 found"
    echo "📡 Starting server on http://localhost:8080"
    echo ""
    echo "💡 Tips:"
    echo "   - Open http://localhost:8080 in your browser"
    echo "   - Press Ctrl+C to stop the server"
    echo ""
    python -m SimpleHTTPServer 8080
# Check if Node.js is available
elif command -v node &> /dev/null; then
    echo "✅ Node.js found"
    echo "📦 Installing http-server..."
    npx -y http-server -p 8080
# Check if PHP is available
elif command -v php &> /dev/null; then
    echo "✅ PHP found"
    echo "📡 Starting server on http://localhost:8080"
    echo ""
    echo "💡 Tips:"
    echo "   - Open http://localhost:8080 in your browser"
    echo "   - Press Ctrl+C to stop the server"
    echo ""
    php -S localhost:8080
else
    echo "❌ No suitable HTTP server found!"
    echo ""
    echo "Please install one of the following:"
    echo "  - Python 3: brew install python3"
    echo "  - Node.js: brew install node"
    echo "  - PHP: brew install php"
    exit 1
fi
