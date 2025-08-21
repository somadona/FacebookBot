#!/usr/bin/env python3
"""
TikTok Arabic Video Extractor - Python Version (Fixed)
A Python script that uses Selenium to extract TikTok videos with Arabic text in captions.
"""

import time
import json
import csv
import re
import argparse
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional

try:
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.chrome.options import Options
    from selenium.common.exceptions import TimeoutException, NoSuchElementException
    from selenium.webdriver.common.action_chains import ActionChains
except ImportError:
    print("Error: Selenium is not installed. Please install it first:")
    print("pip install selenium")
    exit(1)

class TikTokArabicExtractor:
    def __init__(self, headless: bool = False, scroll_pause: float = 3.0):
        """
        Initialize the TikTok Arabic Video Extractor.
        
        Args:
            headless: Whether to run browser in headless mode
            scroll_pause: Pause between scrolls in seconds
        """
        self.scroll_pause = scroll_pause
        self.extracted_videos = []
        self.is_running = False
        self.last_scroll_position = 0
        self.scroll_attempts = 0
        self.max_scroll_attempts = 100
        
        # Arabic text detection regex
        self.arabic_regex = re.compile(r'[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]')
        
        # Initialize WebDriver
        self.driver = self._setup_driver(headless)
        
    def _setup_driver(self, headless: bool) -> webdriver.Chrome:
        """Set up Chrome WebDriver with appropriate options."""
        chrome_options = Options()
        
        if headless:
            chrome_options.add_argument("--headless")
        
        # Add other useful options
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
        
        try:
            driver = webdriver.Chrome(options=chrome_options)
            driver.implicitly_wait(10)
            return driver
        except Exception as e:
            print(f"Error setting up Chrome WebDriver: {e}")
            print("\nPlease make sure you have Chrome installed and chromedriver in your PATH.")
            print("You can download chromedriver from: https://chromedriver.chromium.org/")
            exit(1)
    
    def navigate_to_tiktok(self, url: str = "https://www.tiktok.com") -> bool:
        """
        Navigate to TikTok and wait for page to load.
        
        Args:
            url: TikTok URL to navigate to
            
        Returns:
            True if successful, False otherwise
        """
        try:
            print(f"Navigating to {url}...")
            self.driver.get(url)
            
            # Wait for page to load
            WebDriverWait(self.driver, 20).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            
            # Wait a bit more for dynamic content
            time.sleep(3)
            
            print("✓ TikTok page loaded successfully")
            
            # Detect page type
            self._detect_page_type()
            
            return True
            
        except TimeoutException:
            print("✗ Timeout waiting for TikTok page to load")
            return False
        except Exception as e:
            print(f"✗ Error navigating to TikTok: {e}")
            return False
    
    def _detect_page_type(self):
        """Detect what type of TikTok page we're on."""
        try:
            # Check for video elements
            video_elements = self.driver.find_elements(By.TAG_NAME, "video")
            feed_items = self.driver.find_elements(By.CSS_SELECTOR, '[data-e2e="feed-item"], [data-e2e="browse-feed-item"]')
            
            print(f"Found {len(video_elements)} video elements and {len(feed_items)} feed items")
            
            if video_elements.length > 0 or feed_items.length > 0:
                print("✓ Video feed page detected - ready for extraction")
            else:
                print("⚠️  Not a video feed page - extraction may not work properly")
                print("Please navigate to TikTok's For You page or main feed")
                
        except Exception as e:
            print(f"Error detecting page type: {e}")
    
    def start_extraction(self, max_scrolls: int = 50) -> None:
        """
        Start the extraction process.
        
        Args:
            max_scrolls: Maximum number of scrolls to perform
        """
        if self.is_running:
            print("Extraction is already running!")
            return
        
        self.is_running = True
        self.scroll_attempts = 0
        print(f"Starting extraction with max {max_scrolls} scrolls...")
        print("Press Ctrl+C to stop early")
        
        try:
            scroll_count = 0
            while self.is_running and scroll_count < max_scrolls and self.scroll_attempts < self.max_scroll_attempts:
                # Extract videos from current view
                self._extract_videos_from_current_view()
                
                # Check if we can scroll
                if self._can_scroll():
                    # Scroll down
                    self._scroll_down()
                    scroll_count += 1
                    self.scroll_attempts += 1
                    
                    print(f"Scroll {scroll_count}/{max_scrolls} - Found {len(self.extracted_videos)} videos with Arabic captions")
                    
                    # Wait before next scroll
                    time.sleep(self.scroll_pause)
                else:
                    print("Cannot scroll further, content may be fully loaded")
                    self.scroll_attempts += 1
                    time.sleep(2)
                
        except KeyboardInterrupt:
            print("\nExtraction stopped by user")
        except Exception as e:
            print(f"Error during extraction: {e}")
        finally:
            self.is_running = False
            print(f"\nExtraction completed. Total videos found: {len(self.extracted_videos)}")
    
    def _can_scroll(self) -> bool:
        """Check if we can scroll further."""
        try:
            current_position = self.driver.execute_script("return window.pageYOffset;")
            document_height = self.driver.execute_script("return document.documentElement.scrollHeight;")
            window_height = self.driver.execute_script("return window.innerHeight;")
            
            # Check if we're near the bottom
            is_near_bottom = current_position + window_height >= document_height - 100
            
            # Check if scroll position changed
            has_scrolled = current_position > self.last_scroll_position
            
            self.last_scroll_position = current_position
            
            return not is_near_bottom or has_scrolled
            
        except Exception as e:
            print(f"Error checking scroll position: {e}")
            return True
    
    def _scroll_down(self) -> None:
        """Scroll down the page to load more content."""
        try:
            # Try smooth scrolling first
            self.driver.execute_script("window.scrollBy({top: 800, behavior: 'smooth'});")
        except Exception as e:
            try:
                # Fallback to direct scrolling
                self.driver.execute_script("window.scrollBy(0, 800);")
            except Exception as e2:
                # Last resort: scroll to specific position
                current_pos = self.driver.execute_script("return window.pageYOffset;")
                self.driver.execute_script(f"window.scrollTo(0, {current_pos + 800});")
    
    def _extract_videos_from_current_view(self) -> None:
        """Extract videos from the currently visible area."""
        try:
            # Multiple strategies to find video content
            video_containers = []
            
            # Strategy 1: Look for TikTok's specific data attributes
            data_e2e_selectors = [
                '[data-e2e="feed-item"]',
                '[data-e2e="browse-feed-item"]',
                '[data-e2e="video-feed-item"]',
                '[data-e2e="trending-item"]'
            ]
            
            for selector in data_e2e_selectors:
                try:
                    containers = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    if containers:
                        video_containers = containers
                        print(f"Found {len(containers)} containers using selector: {selector}")
                        break
                except:
                    continue
            
            # Strategy 2: Look for video elements and their containers
            if not video_containers:
                try:
                    video_elements = self.driver.find_elements(By.TAG_NAME, "video")
                    if video_elements:
                        video_containers = []
                        for video in video_elements:
                            # Find the closest container div
                            try:
                                container = video.find_element(By.XPATH, "./ancestor::div[contains(@class, 'Div') or contains(@class, 'div') or contains(@class, 'Item') or contains(@class, 'item')][1]")
                                video_containers.append(container)
                            except:
                                video_containers.append(video.find_element(By.XPATH, "./.."))
                        print(f"Found {len(video_elements)} video elements")
                except Exception as e:
                    print(f"Error finding video elements: {e}")
            
            # Strategy 3: Look for links that contain video URLs
            if not video_containers:
                try:
                    video_links = self.driver.find_elements(By.CSS_SELECTOR, 'a[href*="/video/"], a[href*="/@"]')
                    if video_links:
                        video_containers = []
                        for link in video_links:
                            try:
                                container = link.find_element(By.XPATH, "./ancestor::div[contains(@class, 'Div') or contains(@class, 'div') or contains(@class, 'Item') or contains(@class, 'item')][1]")
                                video_containers.append(container)
                            except:
                                video_containers.append(link.find_element(By.XPATH, "./.."))
                        print(f"Found {len(video_links)} video links")
                except Exception as e:
                    print(f"Error finding video links: {e}")
            
            # Strategy 4: Fallback - look for any div that might contain content
            if not video_containers:
                try:
                    all_divs = self.driver.find_elements(By.TAG_NAME, "div")
                    potential_containers = []
                    for div in all_divs[:100]:  # Limit to first 100
                        try:
                            has_video = div.find_elements(By.TAG_NAME, "video")
                            has_video_link = div.find_elements(By.CSS_SELECTOR, 'a[href*="/video/"]')
                            has_substantial_text = div.text and len(div.text) > 20
                            
                            if has_video or has_video_link or has_substantial_text:
                                potential_containers.append(div)
                        except:
                            continue
                    
                    video_containers = potential_containers[:20]  # Limit to first 20
                    print(f"Fallback: Found {len(video_containers)} potential containers")
                except Exception as e:
                    print(f"Error in fallback strategy: {e}")
            
            # Process each container
            for i, container in enumerate(video_containers):
                if i < 20:  # Process only first 20 to avoid overwhelming
                    self._process_video_container(container)
                    
        except Exception as e:
            print(f"Error extracting videos from current view: {e}")
    
    def _process_video_container(self, container) -> None:
        """Process a single video container to extract information."""
        try:
            # Extract video link
            video_link = self._extract_video_link(container)
            if not video_link:
                return
            
            # Extract caption text
            caption = self._extract_caption(container)
            if not caption:
                return
            
            # Check if caption contains Arabic text
            if not self.arabic_regex.search(caption):
                return
            
            # Check if we already have this video
            if any(v['link'] == video_link for v in self.extracted_videos):
                return
            
            # Extract additional metadata
            metadata = self._extract_metadata(container)
            
            video_data = {
                'link': video_link,
                'caption': caption,
                'timestamp': datetime.now().isoformat(),
                **metadata
            }
            
            self.extracted_videos.append(video_data)
            print(f"✓ Found Arabic video: {video_link[:50]}...")
            
        except Exception as e:
            print(f"Error processing video container: {e}")
    
    def _extract_video_link(self, container) -> Optional[str]:
        """Extract video link from a container."""
        try:
            # Look for video links in various formats
            link_selectors = [
                'a[href*="/video/"]',
                'a[href*="/@"]',
                'a[href*="tiktok.com"]'
            ]
            
            for selector in link_selectors:
                try:
                    link = container.find_element(By.CSS_SELECTOR, selector)
                    if link.get_attribute('href'):
                        href = link.get_attribute('href')
                        # Clean up the URL
                        if '/video/' in href:
                            return href.split('?')[0]  # Remove query parameters
                        return href
                except:
                    continue
            
            # Look for video elements and try to find parent links
            try:
                video = container.find_element(By.TAG_NAME, "video")
                parent = video.find_element(By.XPATH, "./..")
                for _ in range(5):  # Check up to 5 levels up
                    try:
                        link = parent.find_element(By.CSS_SELECTOR, 'a[href*="/video/"]')
                        if link.get_attribute('href'):
                            href = link.get_attribute('href')
                            return href.split('?')[0]
                    except:
                        pass
                    try:
                        parent = parent.find_element(By.XPATH, "./..")
                    except:
                        break
            except:
                pass
            
            return None
            
        except Exception as e:
            print(f"Error extracting video link: {e}")
            return None
    
    def _extract_caption(self, container) -> Optional[str]:
        """Extract caption text from a container."""
        try:
            # Look for caption text in various selectors
            caption_selectors = [
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
            ]
            
            for selector in caption_selectors:
                try:
                    caption_element = container.find_element(By.CSS_SELECTOR, selector)
                    if caption_element.text:
                        text = caption_element.text.strip()
                        if len(text) > 5:  # Ensure it's substantial text
                            return text
                except:
                    continue
            
            # Fallback: look for any text content that might be a caption
            try:
                text_elements = container.find_elements(By.CSS_SELECTOR, "span, p, div, a")
                for element in text_elements:
                    if element.text and 10 < len(element.text) < 1000:
                        text = element.text.strip()
                        # Check if it looks like a caption (not just UI text)
                        if (' ' in text and 
                            '@' not in text and 
                            '#' not in text and
                            'Follow' not in text and
                            'Like' not in text and
                            'Comment' not in text and
                            'Share' not in text):
                            return text
            except:
                pass
            
            return None
            
        except Exception as e:
            print(f"Error extracting caption: {e}")
            return None
    
    def _extract_metadata(self, container) -> Dict:
        """Extract additional metadata from a container."""
        metadata = {}
        
        try:
            # Try to extract username
            username_selectors = [
                '[data-e2e="browse-username"]',
                '[data-e2e="video-author-uniqueId"]',
                '[data-e2e="feed-username"]',
                'a[href*="/@"]',
                'span[class*="username"]',
                'div[class*="username"]'
            ]
            
            for selector in username_selectors:
                try:
                    username_element = container.find_element(By.CSS_SELECTOR, selector)
                    if username_element.text:
                        username = username_element.text.strip()
                        if username and len(username) > 0 and '@' not in username:
                            metadata['username'] = username.replace('@', '')
                            break
                except:
                    continue
            
            # Try to extract like count
            like_selectors = [
                '[data-e2e="like-count"]',
                '[data-e2e="browse-like-count"]',
                '[data-e2e="feed-like-count"]',
                'span[class*="like"]',
                'div[class*="like"]'
            ]
            
            for selector in like_selectors:
                try:
                    like_element = container.find_element(By.CSS_SELECTOR, selector)
                    if like_element.text:
                        likes = like_element.text.strip()
                        if likes and len(likes) > 0:
                            metadata['likes'] = likes
                            break
                except:
                    continue
                    
        except Exception as e:
            print(f"Error extracting metadata: {e}")
        
        return metadata
    
    def stop_extraction(self) -> None:
        """Stop the extraction process."""
        self.is_running = False
        print("Stopping extraction...")
    
    def save_results(self, filename: str = None) -> None:
        """
        Save extracted results to file.
        
        Args:
            filename: Output filename (auto-generated if None)
        """
        if not self.extracted_videos:
            print("No videos to save!")
            return
        
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"tiktok_arabic_videos_{timestamp}"
        
        # Save as JSON
        json_filename = filename if filename.endswith('.json') else f"{filename}.json"
        try:
            with open(json_filename, 'w', encoding='utf-8') as f:
                json.dump(self.extracted_videos, f, indent=2, ensure_ascii=False)
            print(f"✓ Results saved to {json_filename}")
        except Exception as e:
            print(f"Error saving JSON: {e}")
        
        # Save as CSV
        csv_filename = filename if filename.endswith('.csv') else f"{filename}.csv"
        try:
            with open(csv_filename, 'w', newline='', encoding='utf-8') as f:
                if self.extracted_videos:
                    fieldnames = self.extracted_videos[0].keys()
                    writer = csv.DictWriter(f, fieldnames=fieldnames)
                    writer.writeheader()
                    writer.writerows(self.extracted_videos)
            print(f"✓ Results saved to {csv_filename}")
        except Exception as e:
            print(f"Error saving CSV: {e}")
    
    def print_summary(self) -> None:
        """Print a summary of extracted videos."""
        if not self.extracted_videos:
            print("No videos were extracted.")
            return
        
        print(f"\nExtraction Summary:")
        print(f"===================")
        print(f"Total videos found: {len(self.extracted_videos)}")
        print(f"Unique links: {len(set(v['link'] for v in self.extracted_videos))}")
        
        if self.extracted_videos:
            print(f"\nSample videos:")
            for i, video in enumerate(self.extracted_videos[:3], 1):
                print(f"{i}. {video['link']}")
                print(f"   Caption: {video['caption'][:100]}...")
                if video.get('username'):
                    print(f"   Username: {video['username']}")
                print()
    
    def cleanup(self) -> None:
        """Clean up resources."""
        if hasattr(self, 'driver'):
            self.driver.quit()
            print("Browser closed")

def main():
    parser = argparse.ArgumentParser(description='Extract TikTok videos with Arabic captions')
    parser.add_argument('--headless', action='store_true', help='Run browser in headless mode')
    parser.add_argument('--scrolls', type=int, default=50, help='Maximum number of scrolls (default: 50)')
    parser.add_argument('--pause', type=float, default=3.0, help='Pause between scrolls in seconds (default: 3.0)')
    parser.add_argument('--output', type=str, help='Output filename (without extension)')
    parser.add_argument('--url', type=str, default='https://www.tiktok.com', help='TikTok URL to start from')
    
    args = parser.parse_args()
    
    print("TikTok Arabic Video Extractor - Python Version (Fixed)")
    print("=" * 60)
    
    extractor = None
    try:
        # Initialize extractor
        extractor = TikTokArabicExtractor(headless=args.headless, scroll_pause=args.pause)
        
        # Navigate to TikTok
        if not extractor.navigate_to_tiktok(args.url):
            print("Failed to navigate to TikTok. Exiting.")
            return
        
        # Start extraction
        extractor.start_extraction(max_scrolls=args.scrolls)
        
        # Print summary
        extractor.print_summary()
        
        # Save results
        if args.output:
            extractor.save_results(args.output)
        else:
            extractor.save_results()
            
    except KeyboardInterrupt:
        print("\nExtraction interrupted by user")
        if extractor:
            extractor.stop_extraction()
    except Exception as e:
        print(f"Unexpected error: {e}")
    finally:
        if extractor:
            extractor.cleanup()

if __name__ == "__main__":
    main()