let currentUnit = 'metric';

function formatDistance(distance, unit) {
  if (unit === 'metric') {
    if (distance < 100) {
      return `${distance.toFixed(2)} cm`;
    } else if (distance < 100000) {
      return `${(distance / 100).toFixed(2)} m`;
    } else {
      return `${(distance / 100000).toFixed(2)} km`;
    }
  } else {
    const inches = distance / 2.54;
    if (inches < 12) {
      return `${inches.toFixed(2)} in`;
    } else if (inches < 63360) {
      return `${(inches / 12).toFixed(2)} ft`;
    } else {
      return `${(inches / 63360).toFixed(2)} mi`;
    }
  }
}

function updateDistance() {
  chrome.storage.local.get(['totalDistance'], (result) => {
    const distance = result.totalDistance || 0;
    document.getElementById('distance').textContent = formatDistance(distance, currentUnit);
  });
}

function getShareMessage() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['totalDistance'], (result) => {
      const distance = result.totalDistance || 0;
      const formattedDistance = formatDistance(distance, currentUnit);
      const message = `I've scrolled ${formattedDistance} today with Digital Scroll Odometer! How far have you scrolled? #ScrollOdometer`;
      resolve(message);
    });
  });
}

function copyToClipboard() {
  getShareMessage().then((message) => {
    navigator.clipboard.writeText(message).then(() => {
      alert('Message copied to clipboard!');
    });
  });
}

function shareOnTwitter() {
  getShareMessage().then((message) => {
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`;
    window.open(shareUrl, '_blank');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const distanceElement = document.getElementById('distance');
  const toggleSwitch = document.getElementById('displayToggle');
  const resetButton = document.getElementById('resetButton');
  const unitSelect = document.getElementById('unitSelect');
  const shareButton = document.getElementById('shareButton');
  const shareOptions = document.getElementById('shareOptions');
  const copyButton = document.getElementById('copyButton');
  const twitterButton = document.getElementById('twitterButton');
  const facebookButton = document.getElementById('facebookButton');
  const linkedinButton = document.getElementById('linkedinButton');

  updateDistance();

  chrome.storage.local.get(['isDisplayVisible', 'unit'], (result) => {
    toggleSwitch.checked = result.isDisplayVisible !== false;
    currentUnit = result.unit || 'metric';
    unitSelect.value = currentUnit;
  });

  toggleSwitch.addEventListener('change', (event) => {
    const isVisible = event.target.checked;
    chrome.storage.local.set({ isDisplayVisible: isVisible });
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "toggleDisplay", isVisible: isVisible });
    });
  });

  resetButton.addEventListener('click', () => {
    chrome.storage.local.set({ totalDistance: 0 });
    chrome.runtime.sendMessage({ action: "updateDistance", distance: 0 });
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "resetDistance" });
    });
    updateDistance();
  });

  unitSelect.addEventListener('change', (event) => {
    currentUnit = event.target.value;
    chrome.storage.local.set({ unit: currentUnit });
    updateDistance();
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { action: "updateUnit", unit: currentUnit });
      });
    });
  });

  shareButton.addEventListener('click', () => {
    if (shareOptions.style.display === 'block') {
      shareOptions.style.display = 'none';
    } else {
      shareOptions.style.display = 'block';
    }
  });

  copyButton.addEventListener('click', copyToClipboard);
  twitterButton.addEventListener('click', shareOnTwitter);
  facebookButton.addEventListener('click', shareOnFacebook);
  linkedinButton.addEventListener('click', shareOnLinkedIn);

  setInterval(updateDistance, 1000);
});