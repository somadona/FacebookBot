// Content script for TikTok Arabic Video Extractor - Fixed Version
class TikTokArabicExtractor {
  constructor() {
    this.extractedVideos = [];
    this.isRunning = false;
    this.scrollInterval = null;
    this.lastScrollPosition = 0;
    this.scrollAttempts = 0;
    this.maxScrollAttempts = 100;
    
    // Arabic text detection regex - comprehensive coverage
    this.arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    
    this.init();
  }

  init() {
    console.log('TikTok Arabic Extractor: Initializing...');
    
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
      // Wait a bit for page to fully load
      setTimeout(() => {
        this.detectPageType();
      }, 2000);
    }
  }

  isTikTokForYouPage() {
    const url = window.location.href;
    return url.includes('tiktok.com') && (
      url.includes('/foryou') || 
      url.includes('/trending') ||
      url === 'https://www.tiktok.com/' ||
      url === 'https://www.tiktok.com' ||
      url.includes('/explore')
    );
  }

  detectPageType() {
    // Check if we're on a video feed page
    const videoElements = document.querySelectorAll('video');
    const feedItems = document.querySelectorAll('[data-e2e="feed-item"], [data-e2e="browse-feed-item"]');
    
    console.log(`Found ${videoElements.length} video elements and ${feedItems.length} feed items`);
    
    if (videoElements.length > 0 || feedItems.length > 0) {
      console.log('Video feed page detected - ready for extraction');
    } else {
      console.log('Not a video feed page - extraction may not work properly');
    }
  }

  startExtraction() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.scrollAttempts = 0;
    console.log('Starting TikTok Arabic video extraction...');
    
    // Start scrolling and extracting
    this.scrollAndExtract();
    
    // Set up continuous scrolling
    this.scrollInterval = setInterval(() => {
      if (this.isRunning && this.scrollAttempts < this.maxScrollAttempts) {
        this.scrollAndExtract();
      } else if (this.scrollAttempts >= this.maxScrollAttempts) {
        console.log('Maximum scroll attempts reached, stopping extraction');
        this.stopExtraction();
      }
    }, 2000); // Scroll every 2 seconds
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
      // Check if we can scroll
      if (this.canScroll()) {
        // Scroll down to load more content
        this.scrollDown();
        this.scrollAttempts++;
        
        // Wait for content to load
        await this.sleep(1500);
        
        // Extract videos from current view
        this.extractVideosFromCurrentView();
        
        console.log(`Scroll ${this.scrollAttempts} - Found ${this.extractedVideos.length} videos with Arabic captions`);
      } else {
        console.log('Cannot scroll further, content may be fully loaded');
        this.scrollAttempts++;
      }
      
    } catch (error) {
      console.error('Error during scroll and extract:', error);
      this.scrollAttempts++;
    }
  }

  canScroll() {
    const currentPosition = window.pageYOffset;
    const documentHeight = document.documentElement.scrollHeight;
    const windowHeight = window.innerHeight;
    
    // Check if we're near the bottom
    const isNearBottom = currentPosition + windowHeight >= documentHeight - 100;
    
    // Check if scroll position changed
    const hasScrolled = currentPosition > this.lastScrollPosition;
    
    this.lastScrollPosition = currentPosition;
    
    return !isNearBottom || hasScrolled;
  }

  scrollDown() {
    // Try different scrolling methods
    try {
      // Method 1: Smooth scroll
      window.scrollBy({
        top: 800,
        behavior: 'smooth'
      });
    } catch (e) {
      try {
        // Method 2: Direct scroll
        window.scrollBy(0, 800);
      } catch (e2) {
        // Method 3: Scroll to specific position
        const currentPos = window.pageYOffset;
        window.scrollTo(0, currentPos + 800);
      }
    }
  }

  extractVideosFromCurrentView() {
    try {
      // Multiple strategies to find video content
      let videoContainers = [];
      
      // Strategy 1: Look for TikTok's specific data attributes
      const dataE2ESelectors = [
        '[data-e2e="feed-item"]',
        '[data-e2e="browse-feed-item"]',
        '[data-e2e="video-feed-item"]',
        '[data-e2e="trending-item"]'
      ];
      
      for (const selector of dataE2ESelectors) {
        const containers = document.querySelectorAll(selector);
        if (containers.length > 0) {
          videoContainers = Array.from(containers);
          console.log(`Found ${containers.length} containers using selector: ${selector}`);
          break;
        }
      }
      
      // Strategy 2: Look for video elements and their containers
      if (videoContainers.length === 0) {
        const videoElements = document.querySelectorAll('video');
        if (videoElements.length > 0) {
          videoContainers = Array.from(videoElements).map(video => {
            // Find the closest container div
            let container = video.closest('div[class*="Div"], div[class*="div"], div[class*="Item"], div[class*="item"]');
            return container || video.parentElement;
          });
          console.log(`Found ${videoElements.length} video elements`);
        }
      }
      
      // Strategy 3: Look for links that contain video URLs
      if (videoContainers.length === 0) {
        const videoLinks = document.querySelectorAll('a[href*="/video/"], a[href*="/@"]');
        if (videoLinks.length > 0) {
          videoContainers = Array.from(videoLinks).map(link => {
            // Find the closest container
            let container = link.closest('div[class*="Div"], div[class*="div"], div[class*="Item"], div[class*="item"]');
            return container || link.parentElement;
          });
          console.log(`Found ${videoLinks.length} video links`);
        }
      }
      
      // Strategy 4: Fallback - look for any div that might contain content
      if (videoContainers.length === 0) {
        const allDivs = Array.from(document.querySelectorAll('div'));
        videoContainers = allDivs.filter(div => {
          // Check if div contains video, links, or substantial text
          const hasVideo = div.querySelector('video');
          const hasVideoLink = div.querySelector('a[href*="/video/"]');
          const hasSubstantialText = div.textContent && div.textContent.length > 20;
          
          return hasVideo || hasVideoLink || hasSubstantialText;
        }).slice(0, 50); // Limit to first 50 to avoid processing too many
        console.log(`Fallback: Found ${videoContainers.length} potential containers`);
      }
      
      // Process each container
      videoContainers.forEach((container, index) => {
        if (index < 20) { // Process only first 20 to avoid overwhelming
          this.processVideoContainer(container);
        }
      });
      
    } catch (error) {
      console.error('Error extracting videos from current view:', error);
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
      console.log('✓ Found Arabic video:', videoData.link);
      
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
          const href = link.href;
          // Clean up the URL
          if (href.includes('/video/')) {
            return href.split('?')[0]; // Remove query parameters
          }
          return href;
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
              return link.href.split('?')[0];
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
        '[data-e2e="feed-video-desc"]',
        'div[class*="DivVideoDesc"]',
        'div[class*="DivVideoCaption"]',
        'div[class*="DivCaption"]',
        'span[class*="SpanText"]',
        'p[class*="PText"]',
        'div[class*="text"]',
        'div[class*="caption"]'
      ];
      
      for (const selector of captionSelectors) {
        const captionElement = container.querySelector(selector);
        if (captionElement && captionElement.textContent) {
          const text = captionElement.textContent.trim();
          if (text.length > 5) { // Ensure it's substantial text
            return text;
          }
        }
      }
      
      // Fallback: look for any text content that might be a caption
      const textElements = container.querySelectorAll('span, p, div, a');
      for (const element of textElements) {
        if (element.textContent && element.textContent.length > 10 && element.textContent.length < 1000) {
          const text = element.textContent.trim();
          // Check if it looks like a caption (not just UI text)
          if (text.includes(' ') && 
              !text.includes('@') && 
              !text.includes('#') && 
              !text.includes('Follow') &&
              !text.includes('Like') &&
              !text.includes('Comment') &&
              !text.includes('Share')) {
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
    const metadata = {};
    
    try {
      // Try to extract username
      const usernameSelectors = [
        '[data-e2e="browse-username"]',
        '[data-e2e="video-author-uniqueId"]',
        '[data-e2e="feed-username"]',
        'a[href*="/@"]',
        'span[class*="username"]',
        'div[class*="username"]'
      ];
      
      for (const selector of usernameSelectors) {
        const usernameElement = container.querySelector(selector);
        if (usernameElement && usernameElement.textContent) {
          const username = usernameElement.textContent.trim();
          if (username && username.length > 0 && !username.includes('@')) {
            metadata.username = username.replace('@', '');
            break;
          }
        }
      }
      
      // Try to extract like count
      const likeSelectors = [
        '[data-e2e="like-count"]',
        '[data-e2e="browse-like-count"]',
        '[data-e2e="feed-like-count"]',
        'span[class*="like"]',
        'div[class*="like"]'
      ];
      
      for (const selector of likeSelectors) {
        const likeElement = container.querySelector(selector);
        if (likeElement && likeElement.textContent) {
          const likes = likeElement.textContent.trim();
          if (likes && likes.length > 0) {
            metadata.likes = likes;
            break;
          }
        }
      }
      
    } catch (error) {
      console.error('Error extracting metadata:', error);
    }
    
    return metadata;
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