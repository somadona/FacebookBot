#!/usr/bin/env python3
"""
Demo script for TikTok Arabic Video Extractor
This script demonstrates different ways to use the extractor.
"""

import time
from tiktok_arabic_extractor import TikTokArabicExtractor

def demo_basic_usage():
    """Demonstrate basic usage of the extractor."""
    print("=== Basic Usage Demo ===")
    
    extractor = TikTokArabicExtractor(headless=True, scroll_pause=2.0)
    
    try:
        # Navigate to TikTok
        if extractor.navigate_to_tiktok():
            print("✓ Successfully navigated to TikTok")
            
            # Start extraction with limited scrolls for demo
            print("Starting extraction (limited to 5 scrolls for demo)...")
            extractor.start_extraction(max_scrolls=5)
            
            # Print summary
            extractor.print_summary()
            
            # Save results
            extractor.save_results("demo_basic_results")
            
        else:
            print("✗ Failed to navigate to TikTok")
            
    except Exception as e:
        print(f"Error during demo: {e}")
    finally:
        extractor.cleanup()

def demo_custom_settings():
    """Demonstrate custom settings and configuration."""
    print("\n=== Custom Settings Demo ===")
    
    # Custom configuration
    config = {
        'headless': True,
        'scroll_pause': 1.5,  # Faster scrolling
    }
    
    extractor = TikTokArabicExtractor(**config)
    
    try:
        if extractor.navigate_to_tiktok():
            print("✓ TikTok loaded with custom settings")
            
            # Custom extraction parameters
            print("Starting extraction with custom parameters...")
            extractor.start_extraction(max_scrolls=3)
            
            # Show results
            if extractor.extracted_videos:
                print(f"\nFound {len(extractor.extracted_videos)} videos with Arabic captions:")
                for i, video in enumerate(extractor.extracted_videos, 1):
                    print(f"{i}. {video['link'][:60]}...")
                    print(f"   Caption: {video['caption'][:80]}...")
                    print()
            
            # Save with custom filename
            extractor.save_results("custom_demo_results")
            
        else:
            print("✗ Failed to load TikTok")
            
    except Exception as e:
        print(f"Error during custom demo: {e}")
    finally:
        extractor.cleanup()

def demo_error_handling():
    """Demonstrate error handling and recovery."""
    print("\n=== Error Handling Demo ===")
    
    try:
        # This will fail if Chrome/chromedriver is not available
        extractor = TikTokArabicExtractor(headless=True)
        print("✓ WebDriver initialized successfully")
        extractor.cleanup()
        
    except Exception as e:
        print(f"✗ WebDriver initialization failed: {e}")
        print("This is expected if Chrome/chromedriver is not installed")
        print("Please install the required dependencies first")

def demo_arabic_detection():
    """Demonstrate Arabic text detection capabilities."""
    print("\n=== Arabic Text Detection Demo ===")
    
    # Test the Arabic regex pattern
    import re
    arabic_regex = re.compile(r'[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]')
    
    test_texts = [
        "Hello world",  # No Arabic
        "مرحبا بكم",    # Arabic only
        "Hello مرحبا",  # Mixed
        "こんにちは",    # Japanese (not Arabic)
        "Привет",       # Russian (not Arabic)
        "السلام عليكم", # Arabic greeting
    ]
    
    print("Testing Arabic text detection:")
    for text in test_texts:
        has_arabic = bool(arabic_regex.search(text))
        status = "✓" if has_arabic else "✗"
        print(f"{status} '{text}' -> {'Arabic detected' if has_arabic else 'No Arabic'}")

def main():
    """Run all demo functions."""
    print("TikTok Arabic Video Extractor - Demo Script")
    print("=" * 50)
    print()
    
    # Check if we can import the required modules
    try:
        import re
        print("✓ All required modules imported successfully")
    except ImportError as e:
        print(f"✗ Import error: {e}")
        print("Please install required dependencies: pip install -r requirements.txt")
        return
    
    # Run demos
    try:
        demo_arabic_detection()
        
        print("\n" + "="*50)
        print("Note: The following demos require Chrome and chromedriver to be installed.")
        print("If you don't have them, the demos will show appropriate error messages.")
        print("="*50 + "\n")
        
        demo_error_handling()
        
        # Only run these if we can initialize WebDriver
        try:
            test_extractor = TikTokArabicExtractor(headless=True)
            test_extractor.cleanup()
            
            print("\nChrome WebDriver is available. Running full demos...")
            demo_basic_usage()
            demo_custom_settings()
            
        except Exception as e:
            print(f"\nChrome WebDriver not available: {e}")
            print("Skipping browser-based demos")
        
    except KeyboardInterrupt:
        print("\nDemo interrupted by user")
    except Exception as e:
        print(f"Unexpected error during demo: {e}")
    
    print("\n=== Demo Completed ===")
    print("Check the generated files for results!")

if __name__ == "__main__":
    main()