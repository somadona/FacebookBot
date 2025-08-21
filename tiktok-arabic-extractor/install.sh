#!/bin/bash

echo "TikTok Arabic Video Extractor - Installation Script"
echo "=================================================="
echo ""

# Check if we're in the right directory
if [ ! -f "manifest.json" ]; then
    echo "Error: Please run this script from the tiktok-arabic-extractor directory"
    echo "Current directory: $(pwd)"
    exit 1
fi

echo "✓ Extension files found"
echo ""

# Check if Chrome is installed
if command -v google-chrome &> /dev/null; then
    CHROME_PATH="google-chrome"
elif command -v chromium-browser &> /dev/null; then
    CHROME_PATH="chromium-browser"
elif command -v chrome &> /dev/null; then
    CHROME_PATH="chrome"
else
    echo "⚠️  Chrome/Chromium not found in PATH"
    echo "   Please install Chrome or Chromium first"
    echo ""
    echo "   Ubuntu/Debian: sudo apt install chromium-browser"
    echo "   CentOS/RHEL: sudo yum install chromium"
    echo "   macOS: Download from https://www.google.com/chrome/"
    echo "   Windows: Download from https://www.google.com/chrome/"
    exit 1
fi

echo "✓ Chrome/Chromium found: $CHROME_PATH"
echo ""

# Create icons if they don't exist
if [ ! -f "icons/icon16.png" ] || [ ! -f "icons/icon48.png" ] || [ ! -f "icons/icon128.png" ]; then
    echo "⚠️  Icon files are missing or are placeholders"
    echo "   Please replace the placeholder icon files with actual PNG images:"
    echo "   - icons/icon16.png (16x16 pixels)"
    echo "   - icons/icon48.png (48x48 pixels)"
    echo "   - icons/icon128.png (128x128 pixels)"
    echo ""
    echo "   You can create simple icons using any image editor or online icon generator"
    echo ""
fi

echo "Installation Steps:"
echo "==================="
echo ""
echo "1. Open Chrome/Chromium and navigate to: chrome://extensions/"
echo "2. Enable 'Developer mode' in the top right corner"
echo "3. Click 'Load unpacked'"
echo "4. Select this directory: $(pwd)"
echo "5. The extension should now appear in your extensions list"
echo ""
echo "Usage:"
echo "======"
echo "1. Navigate to TikTok (https://www.tiktok.com)"
echo "2. Click the extension icon in your toolbar"
echo "3. Click 'Start Extraction' to begin"
echo "4. Let it scroll and extract videos with Arabic captions"
echo "5. Click 'Stop' when done"
echo "6. Export results to CSV"
echo ""
echo "Troubleshooting:"
echo "==============="
echo "• If the extension doesn't work, refresh the TikTok page"
echo "• Check the browser console (F12) for error messages"
echo "• Make sure you're logged into TikTok"
echo "• Ensure you're on the For You page or main feed"
echo ""
echo "✓ Installation script completed successfully!"
echo "   Follow the steps above to complete the installation"