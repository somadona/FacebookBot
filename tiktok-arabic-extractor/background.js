// Background service worker for TikTok Arabic Video Extractor
chrome.runtime.onInstalled.addListener(() => {
  console.log('TikTok Arabic Video Extractor installed');
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getTabInfo') {
    // Get information about the current tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        sendResponse({
          url: tabs[0].url,
          isTikTok: tabs[0].url.includes('tiktok.com')
        });
      }
    });
    return true; // Keep message channel open for async response
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  if (tab.url && tab.url.includes('tiktok.com')) {
    // Open popup when icon is clicked on TikTok
    chrome.action.setPopup({ tabId: tab.id, popup: 'popup.html' });
  }
});

// Note: We no longer inject content scripts from here.
// The content script is declared in manifest.json under content_scripts.