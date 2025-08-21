# TikTok Arabic Video Extractor

A Chrome extension that automatically scrolls through TikTok's "For You" page and extracts video links where the caption contains at least one Arabic letter.

## Features

- **Automatic Scrolling**: Automatically scrolls through TikTok's For You page to load more content
- **Arabic Text Detection**: Uses Unicode regex to detect Arabic characters in video captions
- **Video Link Extraction**: Extracts direct video links, usernames, and metadata
- **Real-time Monitoring**: Shows live statistics and recent extractions
- **CSV Export**: Export all extracted data to CSV format
- **Smart Filtering**: Only saves videos with Arabic text in captions
- **User-friendly Interface**: Clean, modern popup interface with real-time updates

## Installation

### Method 1: Load Unpacked Extension (Recommended for Development)

1. Download or clone this repository to your local machine
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the `tiktok-arabic-extractor` folder
5. The extension should now appear in your extensions list

### Method 2: Install from Chrome Web Store (When Available)

1. Visit the Chrome Web Store (when the extension is published)
2. Search for "TikTok Arabic Video Extractor"
3. Click "Add to Chrome"
4. Confirm the installation

## Usage

### Prerequisites

- Make sure you're logged into TikTok in your browser
- Navigate to TikTok's "For You" page (`https://www.tiktok.com/foryou` or just `https://www.tiktok.com`)

### Steps

1. **Click the extension icon** in your Chrome toolbar
2. **Click "Start Extraction"** to begin the automated process
3. **Let it run**: The extension will automatically:
   - Scroll through the page to load more content
   - Extract video information from each post
   - Filter for videos with Arabic text in captions
   - Store the results locally
4. **Monitor progress** through the real-time statistics
5. **Click "Stop"** when you're satisfied with the results
6. **Export results** by clicking "Export Results (CSV)"

### What Gets Extracted

For each video with Arabic text in the caption, the extension extracts:
- **Video Link**: Direct link to the TikTok video
- **Caption**: Full caption text (including the Arabic text)
- **Username**: Creator's username (when available)
- **Likes**: Like count (when available)
- **Timestamp**: When the video was extracted

## Technical Details

### Arabic Text Detection

The extension uses Unicode regex patterns to detect Arabic characters:
- Basic Arabic: `\u0600-\u06FF`
- Arabic Supplement: `\u0750-\u077F`
- Arabic Extended-A: `\u08A0-\u08FF`
- Arabic Presentation Forms-A: `\uFB50-\uFDFF`
- Arabic Presentation Forms-B: `\uFE70-\uFEFF`

### Content Detection

The extension intelligently searches for video content using multiple selectors:
- TikTok's data attributes (`data-e2e`)
- CSS class patterns
- Fallback DOM traversal methods

### Scrolling Strategy

- Scrolls every 3 seconds to load new content
- Waits 1 second after each scroll for content to load
- Automatically stops when the user clicks "Stop"

## File Structure

```
tiktok-arabic-extractor/
├── manifest.json          # Extension manifest
├── content.js            # Content script (runs on TikTok pages)
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── background.js         # Background service worker
├── icons/                # Extension icons
│   ├── icon16.png       # 16x16 icon
│   ├── icon48.png       # 48x48 icon
│   └── icon128.png      # 128x128 icon
└── README.md            # This file
```

## Permissions

The extension requires the following permissions:
- **activeTab**: To access the current TikTok tab
- **storage**: To save extracted video data locally
- **scripting**: To inject content scripts into TikTok pages
- **host_permissions**: To access TikTok.com domains

## Troubleshooting

### Extension Not Working

1. **Refresh the page**: Make sure you're on TikTok and refresh the page
2. **Check console**: Open Developer Tools (F12) and check for error messages
3. **Reinstall**: Try removing and re-adding the extension
4. **Check permissions**: Ensure the extension has permission to access TikTok

### No Videos Found

1. **Wait longer**: TikTok loads content dynamically, give it time
2. **Scroll manually**: Try scrolling down manually to trigger content loading
3. **Check page**: Ensure you're on the For You page or main TikTok feed
4. **Login required**: Make sure you're logged into TikTok

### Arabic Text Not Detected

1. **Verify text**: Check if the caption actually contains Arabic characters
2. **Refresh**: Try refreshing the page and starting extraction again
3. **Check encoding**: Ensure the page is properly loaded

## Limitations

- **Rate limiting**: TikTok may limit content loading if scrolling too fast
- **Dynamic content**: TikTok's page structure may change, requiring updates
- **Login required**: Some content may require being logged in
- **Geographic restrictions**: Some content may be region-locked

## Development

### Making Changes

1. Edit the source files in the `tiktok-arabic-extractor` folder
2. Go to `chrome://extensions/`
3. Click the refresh icon on your extension
4. Test the changes on TikTok

### Debugging

1. Open Developer Tools (F12) on TikTok
2. Check the Console tab for extension messages
3. Use the Sources tab to debug content script issues
4. Check the Extensions tab for background script errors

## Contributing

Feel free to contribute improvements:
- Bug fixes
- Feature enhancements
- Better Arabic text detection
- Improved content extraction
- UI/UX improvements

## Legal Notice

This extension is for educational and research purposes only. Please respect TikTok's Terms of Service and use responsibly. The extension does not bypass any security measures or violate TikTok's policies.

## Support

If you encounter issues or have questions:
1. Check the troubleshooting section above
2. Review the console for error messages
3. Ensure you're using the latest version
4. Check if TikTok has changed their page structure

## Version History

- **v1.0**: Initial release with basic Arabic text detection and video extraction

---

**Note**: This extension is designed to work with TikTok's current web interface. If TikTok changes their page structure, the extension may need updates to continue working properly.