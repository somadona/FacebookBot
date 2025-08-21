// Content script for TikTok Arabic Video Extractor
class TikTokArabicExtractor {
  constructor() {
    this.extractedVideos = [];
    this.isRunning = false;
    this.scrollInterval = null;
    this.arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    this.init();
  }

  init() {
    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'startExtraction') {
        this.startExtraction();
        sendResponse({status: 'started'});
      } else if (request.action === 'stopExtraction') {
        this.stopExtraction();
        sendResponse({status: 'stopped'});
      } else if (request.action === 'getResults') {
        sendResponse({videos: this.extractedVideos});
      }
    });

    // Auto-start if we're on TikTok For You page
    if (this.isTikTokForYouPage()) {
      console.log('TikTok Arabic Extractor: For You page detected');
    }
  }

  isTikTokForYouPage() {
    return window.location.href.includes('tiktok.com') && 
           (window.location.href.includes('/foryou') || 
            window.location.href.includes('/trending') ||
            window.location.href === 'https://www.tiktok.com/' ||
            window.location.href === 'https://www.tiktok.com');
  }

  startExtraction() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('Starting TikTok Arabic video extraction...');
    
    // Start scrolling and extracting
    this.scrollAndExtract();
    
    // Set up continuous scrolling
    this.scrollInterval = setInterval(() => {
      if (this.isRunning) {
        this.scrollAndExtract();
      }
    }, 3000); // Scroll every 3 seconds
  }

  stopExtraction() {
    this.isRunning = false;
    if (this.scrollInterval) {
      clearInterval(this.scrollInterval);
      this.scrollInterval = null;
    }
    console.log('Stopped TikTok Arabic video extraction');
  }

  async scrollAndExtract() {
    try {
      // Scroll down to load more content
      window.scrollBy(0, 1000);
      
      // Wait for content to load
      await this.sleep(1000);
      
      // Extract videos from current view
      this.extractVideosFromCurrentView();
      
    } catch (error) {
      console.error('Error during scroll and extract:', error);
    }
  }

  extractVideosFromCurrentView() {
    try {
      // Look for video containers - TikTok uses various selectors
      const videoSelectors = [
        '[data-e2e="feed-item"]',
        '[data-e2e="browse-feed-item"]',
        'div[class*="DivItemContainer"]',
        'div[class*="DivVideoFeedV2"]',
        'div[class*="DivItemContainer"]',
        'div[class*="DivVideoFeed"]'
      ];

      let videoContainers = [];
      for (const selector of videoSelectors) {
        const containers = document.querySelectorAll(selector);
        if (containers.length > 0) {
          videoContainers = Array.from(containers);
          break;
        }
      }

      if (videoContainers.length === 0) {
        // Fallback: look for any div that might contain video content
        videoContainers = Array.from(document.querySelectorAll('div')).filter(div => {
          return div.querySelector('video') || div.querySelector('a[href*="/video/"]');
        });
      }

      videoContainers.forEach(container => {
        this.processVideoContainer(container);
      });

    } catch (error) {
      console.error('Error extracting videos:', error);
    }
  }

  processVideoContainer(container) {
    try {
      // Extract video link
      const videoLink = this.extractVideoLink(container);
      if (!videoLink) return;

      // Extract caption text
      const caption = this.extractCaption(container);
      if (!caption) return;

      // Check if caption contains Arabic text
      if (!this.arabicRegex.test(caption)) return;

      // Check if we already have this video
      if (this.extractedVideos.some(v => v.link === videoLink)) return;

      // Extract additional metadata
      const metadata = this.extractMetadata(container);

      const videoData = {
        link: videoLink,
        caption: caption,
        timestamp: new Date().toISOString(),
        ...metadata
      };

      this.extractedVideos.push(videoData);
      console.log('Extracted Arabic video:', videoData);

      // Store in chrome storage
      chrome.storage.local.set({extractedVideos: this.extractedVideos});

    } catch (error) {
      console.error('Error processing video container:', error);
    }
  }

  extractVideoLink(container) {
    try {
      // Look for video links in various formats
      const linkSelectors = [
        'a[href*="/video/"]',
        'a[href*="/@"]',
        'a[href*="tiktok.com"]'
      ];

      for (const selector of linkSelectors) {
        const link = container.querySelector(selector);
        if (link && link.href) {
          return link.href;
        }
      }

      // Look for video elements and try to find parent links
      const video = container.querySelector('video');
      if (video) {
        let parent = video.parentElement;
        for (let i = 0; i < 5; i++) { // Check up to 5 levels up
          if (parent) {
            const link = parent.querySelector('a[href*="/video/"]');
            if (link && link.href) {
              return link.href;
            }
            parent = parent.parentElement;
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error extracting video link:', error);
      return null;
    }
  }

  extractCaption(container) {
    try {
      // Look for caption text in various selectors
      const captionSelectors = [
        '[data-e2e="browse-video-desc"]',
        '[data-e2e="video-desc"]',
        'div[class*="DivVideoDesc"]',
        'div[class*="DivVideoCaption"]',
        'span[class*="SpanText"]',
        'p[class*="PText"]'
      ];

      for (const selector of captionSelectors) {
        const captionElement = container.querySelector(selector);
        if (captionElement && captionElement.textContent) {
          return captionElement.textContent.trim();
        }
      }

      // Fallback: look for any text content that might be a caption
      const textElements = container.querySelectorAll('span, p, div');
      for (const element of textElements) {
        if (element.textContent && element.textContent.length > 10 && element.textContent.length < 500) {
          const text = element.textContent.trim();
          // Check if it looks like a caption (not just UI text)
          if (text.includes(' ') && !text.includes('@') && !text.includes('#')) {
            return text;
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error extracting caption:', error);
      return null;
    }
  }

  extractMetadata(container) {
    try {
      const metadata = {};

      // Try to extract username
      const usernameSelectors = [
        '[data-e2e="browse-username"]',
        '[data-e2e="video-author-uniqueId"]',
        'a[href*="/@"]'
      ];

      for (const selector of usernameSelectors) {
        const usernameElement = container.querySelector(selector);
        if (usernameElement && usernameElement.textContent) {
          metadata.username = usernameElement.textContent.trim();
          break;
        }
      }

      // Try to extract like count
      const likeSelectors = [
        '[data-e2e="like-count"]',
        '[data-e2e="browse-like-count"]'
      ];

      for (const selector of likeSelectors) {
        const likeElement = container.querySelector(selector);
        if (likeElement && likeElement.textContent) {
          metadata.likes = likeElement.textContent.trim();
          break;
        }
      }

      return metadata;
    } catch (error) {
      console.error('Error extracting metadata:', error);
      return {};
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Initialize the extractor when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new TikTokArabicExtractor();
  });
} else {
  new TikTokArabicExtractor();
}