// Content script for TikTok Arabic Video Extractor - Fixed Version
(function() {
  if (window.__TT_ARABIC_EXTRACTOR_LOADED__) {
    console.log('TikTok Arabic Extractor: already loaded, skipping initialization');
    return;
  }
  window.__TT_ARABIC_EXTRACTOR_LOADED__ = true;

  class TikTokArabicExtractor {
    constructor() {
      this.extractedVideos = [];
      this.isRunning = false;
      this.scrollInterval = null;
      this.lastScrollPosition = 0;
      this.scrollAttempts = 0;
      this.maxScrollAttempts = 100;
      this.arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
      this.init();
    }

    init() {
      console.log('TikTok Arabic Extractor: Initializing...');

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

      if (this.isTikTokForYouPage()) {
        console.log('TikTok Arabic Extractor: For You page detected');
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
      this.scrollAndExtract();
      this.scrollInterval = setInterval(() => {
        if (this.isRunning && this.scrollAttempts < this.maxScrollAttempts) {
          this.scrollAndExtract();
        } else if (this.scrollAttempts >= this.maxScrollAttempts) {
          console.log('Maximum scroll attempts reached, stopping extraction');
          this.stopExtraction();
        }
      }, 2000);
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
        if (this.canScroll()) {
          this.scrollDown();
          this.scrollAttempts++;
          await this.sleep(1500);
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
      const isNearBottom = currentPosition + windowHeight >= documentHeight - 100;
      const hasScrolled = currentPosition > this.lastScrollPosition;
      this.lastScrollPosition = currentPosition;
      return !isNearBottom || hasScrolled;
    }

    scrollDown() {
      try {
        window.scrollBy({ top: 800, behavior: 'smooth' });
      } catch (e) {
        try {
          window.scrollBy(0, 800);
        } catch (e2) {
          const currentPos = window.pageYOffset;
          window.scrollTo(0, currentPos + 800);
        }
      }
    }

    extractVideosFromCurrentView() {
      try {
        let videoContainers = [];
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
            break;
          }
        }
        if (videoContainers.length === 0) {
          const videoElements = document.querySelectorAll('video');
          if (videoElements.length > 0) {
            videoContainers = Array.from(videoElements).map(video => {
              let container = video.closest('div[class*="Div"], div[class*="div"], div[class*="Item"], div[class*="item"]');
              return container || video.parentElement;
            });
          }
        }
        if (videoContainers.length === 0) {
          const videoLinks = document.querySelectorAll('a[href*="/video/"], a[href*="/@"]');
          if (videoLinks.length > 0) {
            videoContainers = Array.from(videoLinks).map(link => {
              let container = link.closest('div[class*="Div"], div[class*="div"], div[class*="Item"], div[class*="item"]');
              return container || link.parentElement;
            });
          }
        }
        if (videoContainers.length === 0) {
          const allDivs = Array.from(document.querySelectorAll('div'));
          videoContainers = allDivs.filter(div => {
            const hasVideo = div.querySelector('video');
            const hasVideoLink = div.querySelector('a[href*="/video/"]');
            const hasSubstantialText = div.textContent && div.textContent.length > 20;
            return hasVideo || hasVideoLink || hasSubstantialText;
          }).slice(0, 50);
        }
        videoContainers.forEach((container, index) => {
          if (index < 20) {
            this.processVideoContainer(container);
          }
        });
      } catch (error) {
        console.error('Error extracting videos from current view:', error);
      }
    }

    processVideoContainer(container) {
      try {
        const videoLink = this.extractVideoLink(container);
        if (!videoLink) return;
        const caption = this.extractCaption(container);
        if (!caption) return;
        if (!this.arabicRegex.test(caption)) return;
        if (this.extractedVideos.some(v => v.link === videoLink)) return;
        const metadata = this.extractMetadata(container);
        const videoData = { link: videoLink, caption: caption, timestamp: new Date().toISOString(), ...metadata };
        this.extractedVideos.push(videoData);
        chrome.storage.local.set({extractedVideos: this.extractedVideos});
      } catch (error) {
        console.error('Error processing video container:', error);
      }
    }

    extractVideoLink(container) {
      try {
        const linkSelectors = [
          'a[href*="/video/"]',
          'a[href*="/@"]',
          'a[href*="tiktok.com"]'
        ];
        for (const selector of linkSelectors) {
          const link = container.querySelector(selector);
          if (link && link.href) {
            const href = link.href;
            if (href.includes('/video/')) return href.split('?')[0];
            return href;
          }
        }
        const video = container.querySelector('video');
        if (video) {
          let parent = video.parentElement;
          for (let i = 0; i < 5; i++) {
            if (parent) {
              const link = parent.querySelector('a[href*="/video/"]');
              if (link && link.href) return link.href.split('?')[0];
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
            if (text.length > 5) return text;
          }
        }
        const textElements = container.querySelectorAll('span, p, div, a');
        for (const element of textElements) {
          if (element.textContent && element.textContent.length > 10 && element.textContent.length < 1000) {
            const text = element.textContent.trim();
            if (text.includes(' ') && !text.includes('@') && !text.includes('#') && !text.includes('Follow') && !text.includes('Like') && !text.includes('Comment') && !text.includes('Share')) {
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      new TikTokArabicExtractor();
    });
  } else {
    new TikTokArabicExtractor();
  }
})();