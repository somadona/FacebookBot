#!/usr/bin/env python3
"""
Debug script for TikTok Arabic Video Extractor
This script helps diagnose issues with TikTok page structure and content detection.
"""

import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

def setup_driver(headless=False):
    """Set up Chrome WebDriver for debugging."""
    chrome_options = Options()
    
    if headless:
        chrome_options.add_argument("--headless")
    
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
    
    try:
        driver = webdriver.Chrome(options=chrome_options)
        driver.implicitly_wait(10)
        return driver
    except Exception as e:
        print(f"Error setting up Chrome WebDriver: {e}")
        return None

def debug_tiktok_page(url="https://www.tiktok.com", headless=False):
    """Debug TikTok page structure and content."""
    driver = setup_driver(headless)
    if not driver:
        return
    
    try:
        print(f"Navigating to {url}...")
        driver.get(url)
        
        # Wait for page to load
        WebDriverWait(driver, 20).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
        
        # Wait a bit more for dynamic content
        time.sleep(5)
        
        print("\n=== TikTok Page Debug Report ===")
        print(f"Current URL: {driver.current_url}")
        print(f"Page Title: {driver.title}")
        
        # Check for video elements
        print("\n--- Video Elements ---")
        video_elements = driver.find_elements(By.TAG_NAME, "video")
        print(f"Found {len(video_elements)} video elements")
        
        for i, video in enumerate(video_elements[:5]):  # Show first 5
            try:
                src = video.get_attribute('src')
                print(f"  Video {i+1}: src='{src}'")
            except:
                print(f"  Video {i+1}: [error getting src]")
        
        # Check for feed items
        print("\n--- Feed Items ---")
        feed_selectors = [
            '[data-e2e="feed-item"]',
            '[data-e2e="browse-feed-item"]',
            '[data-e2e="video-feed-item"]',
            '[data-e2e="trending-item"]'
        ]
        
        for selector in feed_selectors:
            elements = driver.find_elements(By.CSS_SELECTOR, selector)
            print(f"  {selector}: {len(elements)} elements")
        
        # Check for video links
        print("\n--- Video Links ---")
        video_links = driver.find_elements(By.CSS_SELECTOR, 'a[href*="/video/"]')
        print(f"Found {len(video_links)} video links")
        
        for i, link in enumerate(video_links[:5]):  # Show first 5
            try:
                href = link.get_attribute('href')
                text = link.text.strip()
                print(f"  Link {i+1}: {href} (text: '{text}')")
            except:
                print(f"  Link {i+1}: [error getting details]")
        
        # Check for captions
        print("\n--- Caption Elements ---")
        caption_selectors = [
            '[data-e2e="browse-video-desc"]',
            '[data-e2e="video-desc"]',
            '[data-e2e="feed-video-desc"]',
            'div[class*="DivVideoDesc"]',
            'div[class*="DivVideoCaption"]',
            'div[class*="DivCaption"]'
        ]
        
        for selector in caption_selectors:
            elements = driver.find_elements(By.CSS_SELECTOR, selector)
            print(f"  {selector}: {len(elements)} elements")
            
            # Show sample text from first few
            for i, element in enumerate(elements[:3]):
                try:
                    text = element.text.strip()
                    if text:
                        print(f"    Sample {i+1}: '{text[:100]}...'")
                except:
                    pass
        
        # Check for usernames
        print("\n--- Username Elements ---")
        username_selectors = [
            '[data-e2e="browse-username"]',
            '[data-e2e="video-author-uniqueId"]',
            '[data-e2e="feed-username"]',
            'a[href*="/@"]'
        ]
        
        for selector in username_selectors:
            elements = driver.find_elements(By.CSS_SELECTOR, selector)
            print(f"  {selector}: {len(elements)} elements")
            
            # Show sample usernames
            for i, element in enumerate(elements[:3]):
                try:
                    text = element.text.strip()
                    if text:
                        print(f"    Sample {i+1}: '{text}'")
                except:
                    pass
        
        # Check page structure
        print("\n--- Page Structure ---")
        all_divs = driver.find_elements(By.TAG_NAME, "div")
        print(f"Total div elements: {len(all_divs)}")
        
        # Look for divs with specific class patterns
        div_patterns = ['Div', 'div', 'Item', 'item', 'Video', 'video', 'Feed', 'feed']
        for pattern in div_patterns:
            elements = driver.find_elements(By.CSS_SELECTOR, f'div[class*="{pattern}"]')
            if elements:
                print(f"  div[class*='{pattern}']: {len(elements)} elements")
        
        # Check scroll position
        print("\n--- Scroll Information ---")
        current_position = driver.execute_script("return window.pageYOffset;")
        document_height = driver.execute_script("return document.documentElement.scrollHeight;")
        window_height = driver.execute_script("return window.innerHeight;")
        
        print(f"Current scroll position: {current_position}")
        print(f"Document height: {document_height}")
        print(f"Window height: {window_height}")
        print(f"Can scroll down: {current_position + window_height < document_height}")
        
        # Try to scroll and see what happens
        print("\n--- Testing Scrolling ---")
        try:
            driver.execute_script("window.scrollBy(0, 500);")
            time.sleep(2)
            
            new_position = driver.execute_script("return window.pageYOffset;")
            new_document_height = driver.execute_script("return document.documentElement.scrollHeight;")
            
            print(f"After scroll - Position: {new_position}, Document height: {new_document_height}")
            print(f"Scroll worked: {new_position > current_position}")
            print(f"Content loaded: {new_document_height > document_height}")
            
        except Exception as e:
            print(f"Error during scroll test: {e}")
        
        # Look for Arabic text
        print("\n--- Arabic Text Detection ---")
        import re
        arabic_regex = re.compile(r'[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]')
        
        # Check page source for Arabic text
        page_source = driver.page_source
        arabic_matches = arabic_regex.findall(page_source)
        
        if arabic_matches:
            print(f"Found {len(arabic_matches)} Arabic characters in page source")
            unique_arabic = set(arabic_matches)
            print(f"Unique Arabic characters: {''.join(sorted(unique_arabic))}")
        else:
            print("No Arabic text found in page source")
        
        # Check visible text for Arabic
        visible_text = driver.find_element(By.TAG_NAME, "body").text
        arabic_in_visible = arabic_regex.findall(visible_text)
        
        if arabic_in_visible:
            print(f"Found {len(arabic_in_visible)} Arabic characters in visible text")
        else:
            print("No Arabic text found in visible text")
        
        print("\n=== Debug Report Complete ===")
        
    except Exception as e:
        print(f"Error during debugging: {e}")
    finally:
        driver.quit()

def main():
    print("TikTok Debug Script")
    print("==================")
    
    # Test different TikTok URLs
    test_urls = [
        "https://www.tiktok.com",
        "https://www.tiktok.com/foryou",
        "https://www.tiktok.com/trending"
    ]
    
    for url in test_urls:
        print(f"\n{'='*50}")
        print(f"Testing URL: {url}")
        print(f"{'='*50}")
        
        try:
            debug_tiktok_page(url, headless=False)  # Set to True for headless mode
        except Exception as e:
            print(f"Error testing {url}: {e}")
        
        time.sleep(2)  # Pause between tests

if __name__ == "__main__":
    main()