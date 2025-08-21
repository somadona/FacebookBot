# TikTok Arabic Video Extractor

A comprehensive solution for automatically extracting TikTok videos where the caption contains at least one Arabic letter. This project provides two implementations:

1. **Chrome Extension** - Browser-based solution with a user-friendly interface
2. **Python Script** - Command-line solution using Selenium WebDriver

## 🎯 Features

- **Automatic Scrolling**: Automatically scrolls through TikTok's "For You" page
- **Arabic Text Detection**: Uses Unicode regex to detect Arabic characters in captions
- **Smart Filtering**: Only saves videos with Arabic text in captions
- **Metadata Extraction**: Captures video links, captions, usernames, and engagement metrics
- **Multiple Output Formats**: Export results to JSON and CSV
- **Real-time Monitoring**: Live statistics and progress tracking
- **Cross-platform**: Works on Windows, macOS, and Linux

## 🚀 Quick Start

### Option 1: Chrome Extension (Recommended for most users)

#### Installation
1. **Download the extension files** from the `tiktok-arabic-extractor/` folder
2. **Open Chrome** and go to `chrome://extensions/`
3. **Enable Developer mode** (toggle in top right)
4. **Click "Load unpacked"** and select the `tiktok-arabic-extractor` folder
5. **Navigate to TikTok** (`https://www.tiktok.com`)
6. **Click the extension icon** and start extracting!

#### Usage
1. Go to TikTok's For You page
2. Click the extension icon in your toolbar
3. Click "Start Extraction"
4. Let it automatically scroll and extract videos
5. Click "Stop" when done
6. Export results to CSV

### Option 2: Python Script (For developers and automation)

#### Prerequisites
```bash
# Install Python 3.7+
# Install Chrome browser
# Install chromedriver (or use webdriver-manager)
```

#### Installation
```bash
pip install -r requirements.txt
```

#### Usage
```bash
# Basic usage
python tiktok_arabic_extractor.py

# Run in headless mode with custom settings
python tiktok_arabic_extractor.py --headless --scrolls 100 --pause 2.0

# Custom output filename
python tiktok_arabic_extractor.py --output my_results

# Start from specific TikTok URL
python tiktok_arabic_extractor.py --url "https://www.tiktok.com/foryou"
```

## 📁 Project Structure

```
├── tiktok-arabic-extractor/          # Chrome Extension
│   ├── manifest.json                 # Extension configuration
│   ├── content.js                    # Content script for TikTok pages
│   ├── popup.html                    # Extension popup interface
│   ├── popup.js                      # Popup functionality
│   ├── background.js                 # Background service worker
│   ├── icons/                        # Extension icons
│   ├── install.sh                    # Installation script
│   └── README.md                     # Extension documentation
├── tiktok_arabic_extractor.py        # Python script
├── requirements.txt                   # Python dependencies
└── README_TIKTOK_EXTRACTOR.md        # This file
```

## 🔧 Technical Details

### Arabic Text Detection

Both solutions use comprehensive Unicode regex patterns to detect Arabic text:

```javascript
// JavaScript (Chrome Extension)
const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

# Python
arabic_regex = re.compile(r'[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]')
```

**Coverage includes:**
- Basic Arabic (U+0600-U+06FF)
- Arabic Supplement (U+0750-U+077F)
- Arabic Extended-A (U+08A0-U+08FF)
- Arabic Presentation Forms-A (U+FB50-U+FDFF)
- Arabic Presentation Forms-B (U+FE70-U+FEFF)

### Content Detection Strategy

The extractors use multiple fallback methods to find video content:

1. **Primary selectors**: TikTok's data attributes (`data-e2e`)
2. **CSS patterns**: Common class naming conventions
3. **DOM traversal**: Fallback to parent element searching
4. **Video element detection**: Look for `<video>` tags

### Scrolling Strategy

- **Interval**: Scrolls every 3 seconds (configurable)
- **Wait time**: 1 second pause after each scroll for content loading
- **Direction**: Vertical scrolling to trigger infinite loading
- **Limit**: Configurable maximum scroll count

## 📊 Output Format

### Extracted Data Structure

```json
{
  "link": "https://www.tiktok.com/@username/video/1234567890",
  "caption": "مرحبا بكم في تيك توك - Hello everyone on TikTok",
  "username": "username",
  "likes": "1.2K",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Export Formats

- **JSON**: Structured data with full metadata
- **CSV**: Spreadsheet-friendly format for analysis
- **Auto-naming**: Timestamp-based filenames

## ⚙️ Configuration Options

### Chrome Extension
- **Auto-start**: Automatically detects TikTok pages
- **Real-time updates**: Live statistics and progress
- **Storage**: Local browser storage for persistence
- **Export**: One-click CSV export

### Python Script
```bash
--headless          # Run browser without GUI
--scrolls N         # Maximum number of scrolls
--pause SECONDS     # Pause between scrolls
--output FILENAME   # Custom output filename
--url URL           # Starting TikTok URL
```

## 🛠️ Troubleshooting

### Common Issues

#### Extension Not Working
1. **Refresh the page** after installing
2. **Check console** (F12) for error messages
3. **Verify permissions** in chrome://extensions/
4. **Reinstall** the extension

#### No Videos Found
1. **Wait longer** - TikTok loads content dynamically
2. **Scroll manually** to trigger content loading
3. **Check page** - Ensure you're on For You page
4. **Login required** - Some content needs authentication

#### Python Script Errors
1. **Install dependencies**: `pip install -r requirements.txt`
2. **Chrome driver**: Download chromedriver or use webdriver-manager
3. **Browser version**: Ensure Chrome is up to date
4. **Permissions**: Check if Chrome can access TikTok

### Debug Mode

#### Chrome Extension
1. Open Developer Tools (F12)
2. Check Console tab for extension messages
3. Use Sources tab to debug content scripts

#### Python Script
```bash
# Verbose output
python tiktok_arabic_extractor.py --scrolls 10 --pause 5.0

# Check browser console
# Look for Selenium logs
```

## 🔒 Privacy & Legal

### Data Collection
- **Local only**: All data stays on your device
- **No tracking**: No external data transmission
- **User control**: You control when to start/stop extraction

### Terms of Service
- **Educational use**: Designed for research and learning
- **Respectful scraping**: Follows TikTok's rate limits
- **No bypassing**: Doesn't circumvent security measures

### Recommendations
- Use responsibly and respect TikTok's terms
- Don't overload their servers with excessive requests
- Consider the privacy of content creators

## 🚀 Advanced Usage

### Customization

#### Chrome Extension
- Modify `content.js` for custom extraction logic
- Update `popup.html` for UI changes
- Adjust scrolling parameters in `content.js`

#### Python Script
- Extend the `TikTokArabicExtractor` class
- Add custom filters and processing
- Integrate with databases or APIs

### Automation

#### Scheduled Extraction
```bash
# Using cron (Linux/macOS)
0 */6 * * * cd /path/to/project && python tiktok_arabic_extractor.py --headless

# Using Task Scheduler (Windows)
# Create a scheduled task to run the script
```

#### Batch Processing
```bash
# Process multiple URLs
for url in "https://tiktok.com/foryou" "https://tiktok.com/trending"; do
    python tiktok_arabic_extractor.py --url "$url" --output "results_$(date +%Y%m%d)"
done
```

## 🤝 Contributing

We welcome contributions! Here are some areas for improvement:

- **Better content detection**: More robust selectors
- **Performance optimization**: Faster extraction
- **Additional filters**: More sophisticated text analysis
- **UI improvements**: Better user experience
- **Error handling**: More robust error recovery

### Development Setup

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Test thoroughly**
5. **Submit a pull request**

## 📈 Performance Tips

### Chrome Extension
- **Close other tabs** to free up memory
- **Limit extraction time** to avoid browser slowdown
- **Export regularly** to clear stored data

### Python Script
- **Use headless mode** for better performance
- **Adjust scroll pause** based on your internet speed
- **Monitor memory usage** for long extractions

## 🔮 Future Enhancements

- **Machine learning**: Better Arabic text detection
- **Video analysis**: Extract video metadata
- **Trend analysis**: Identify popular Arabic content
- **API integration**: Connect with other services
- **Real-time alerts**: Notify when new content is found

## 📞 Support

### Getting Help
1. **Check this README** for common solutions
2. **Review error messages** in console/logs
3. **Check GitHub issues** for known problems
4. **Create new issue** with detailed information

### Reporting Bugs
When reporting issues, please include:
- **Operating system** and version
- **Browser/Chrome version** (for extension)
- **Python version** (for script)
- **Error messages** and logs
- **Steps to reproduce**

## 📄 License

This project is provided as-is for educational and research purposes. Please use responsibly and respect TikTok's Terms of Service.

---

**Happy extracting! 🎉**

If you find this tool useful, please consider giving it a star ⭐ on GitHub.