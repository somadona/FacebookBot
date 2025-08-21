// Popup script for TikTok Arabic Video Extractor
class PopupController {
  constructor() {
    this.isExtracting = false;
    this.extractedVideos = [];
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadStoredData();
    this.updateUI();
  }

  bindEvents() {
    document.getElementById('startBtn').addEventListener('click', () => {
      this.startExtraction();
    });

    document.getElementById('stopBtn').addEventListener('click', () => {
      this.stopExtraction();
    });

    document.getElementById('exportBtn').addEventListener('click', () => {
      this.exportResults();
    });

    // Update stats every 2 seconds when extracting
    setInterval(() => {
      if (this.isExtracting) {
        this.updateStats();
      }
    }, 2000);
  }

  async startExtraction() {
    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url.includes('tiktok.com')) {
        alert('Please navigate to TikTok first!');
        return;
      }

      // Send message to content script to start extraction
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'startExtraction' });
      
      if (response && response.status === 'started') {
        this.isExtracting = true;
        this.updateUI();
        this.updateStatus('Extracting videos...', true);
        
        // Start polling for results
        this.startPolling();
      }
    } catch (error) {
      console.error('Error starting extraction:', error);
      alert('Error starting extraction. Make sure you are on TikTok and refresh the page.');
    }
  }

  async stopExtraction() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab.url.includes('tiktok.com')) {
        await chrome.tabs.sendMessage(tab.id, { action: 'stopExtraction' });
      }
      
      this.isExtracting = false;
      this.updateUI();
      this.updateStatus('Extraction stopped', false);
      this.stopPolling();
    } catch (error) {
      console.error('Error stopping extraction:', error);
    }
  }

  startPolling() {
    this.pollInterval = setInterval(async () => {
      if (this.isExtracting) {
        await this.fetchResults();
      }
    }, 3000); // Poll every 3 seconds
  }

  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  async fetchResults() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab.url.includes('tiktok.com')) {
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'getResults' });
        
        if (response && response.videos) {
          this.extractedVideos = response.videos;
          this.updateUI();
          this.updateStats();
        }
      }
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  }

  async loadStoredData() {
    try {
      const result = await chrome.storage.local.get(['extractedVideos']);
      if (result.extractedVideos) {
        this.extractedVideos = result.extractedVideos;
      }
    } catch (error) {
      console.error('Error loading stored data:', error);
    }
  }

  updateUI() {
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const exportBtn = document.getElementById('exportBtn');

    if (this.isExtracting) {
      startBtn.disabled = true;
      stopBtn.disabled = false;
      exportBtn.disabled = true;
    } else {
      startBtn.disabled = false;
      stopBtn.disabled = true;
      exportBtn.disabled = this.extractedVideos.length === 0;
    }

    this.updateVideoList();
  }

  updateStatus(text, isActive) {
    const statusText = document.getElementById('statusText');
    const statusIndicator = document.getElementById('statusIndicator');
    
    statusText.textContent = text;
    
    if (isActive) {
      statusIndicator.classList.add('active');
    } else {
      statusIndicator.classList.remove('active');
    }
  }

  updateStats() {
    const totalVideos = document.getElementById('totalVideos');
    const arabicVideos = document.getElementById('arabicVideos');
    
    totalVideos.textContent = this.extractedVideos.length;
    arabicVideos.textContent = this.extractedVideos.length;
  }

  updateVideoList() {
    const videoList = document.getElementById('videoList');
    
    if (this.extractedVideos.length === 0) {
      videoList.innerHTML = `
        <div style="text-align: center; opacity: 0.6; font-size: 12px;">
          No videos extracted yet
        </div>
      `;
      return;
    }

    // Show only the last 5 videos to keep the popup manageable
    const recentVideos = this.extractedVideos.slice(-5);
    
    videoList.innerHTML = recentVideos.map(video => `
      <div class="video-item">
        <a href="${video.link}" target="_blank" class="video-link">${video.link}</a>
        <div class="video-caption">${this.truncateText(video.caption, 100)}</div>
        <div class="video-meta">
          ${video.username ? `@${video.username} • ` : ''}
          ${video.likes ? `${video.likes} likes • ` : ''}
          ${new Date(video.timestamp).toLocaleTimeString()}
        </div>
      </div>
    `).join('');
  }

  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  exportResults() {
    if (this.extractedVideos.length === 0) {
      alert('No videos to export!');
      return;
    }

    try {
      // Create CSV content
      const headers = ['Link', 'Caption', 'Username', 'Likes', 'Timestamp'];
      const csvContent = [
        headers.join(','),
        ...this.extractedVideos.map(video => [
          `"${video.link}"`,
          `"${video.caption.replace(/"/g, '""')}"`,
          `"${video.username || ''}"`,
          `"${video.likes || ''}"`,
          `"${video.timestamp}"`
        ].join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `tiktok_arabic_videos_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error exporting results:', error);
      alert('Error exporting results. Please try again.');
    }
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});