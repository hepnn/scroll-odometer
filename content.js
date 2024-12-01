let totalScrollDistance = 0;
const PIXEL_TO_CM = 0.002645833; // (1 inch = 96 pixels, 1 inch = 2.54 cm)
let isDisplayVisible = true;
let lastScrollPosition = 0;
let isUserScrolling = false;
let scrollTimeout;
let currentUnit = 'metric';

function createDisplayElement() {
  const display = document.createElement('div');
  display.id = 'scroll-pedometer-display';
  display.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: rgba(255, 255, 255, 0.8);
    color: #333;
    padding: 8px 12px;
    border-radius: 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
    font-size: 14px;
    font-weight: 500;
    z-index: 9999;
    transition: opacity 0.3s ease, transform 0.3s ease;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(5px);
  `;
  document.body.appendChild(display);
  return display;
}

const displayElement = createDisplayElement();

function updateScrollDistance() {
  if (!isUserScrolling) return;

  const currentScrollPosition = window.scrollY;
  const scrollDifference = Math.abs(currentScrollPosition - lastScrollPosition);
  const scrollDistanceCm = scrollDifference * PIXEL_TO_CM;
  
  totalScrollDistance += scrollDistanceCm;
  lastScrollPosition = currentScrollPosition;
  
  updateDisplay(totalScrollDistance);
  
  chrome.runtime.sendMessage({
    action: "updateDistance",
    distance: totalScrollDistance
  });
}

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

function updateDisplay(distance) {
  const formattedDistance = formatDistance(distance, currentUnit);
  displayElement.textContent = formattedDistance;
  displayElement.style.opacity = isDisplayVisible ? '1' : '0';
  displayElement.style.transform = isDisplayVisible ? 'translateY(0)' : 'translateY(-20px)';
}

function onScrollStart() {
  isUserScrolling = true;
  clearTimeout(scrollTimeout);
}

function onScrollEnd() {
  scrollTimeout = setTimeout(() => {
    isUserScrolling = false;
  }, 150); 
}

window.addEventListener('scroll', () => {
  onScrollStart();
  updateScrollDistance();
  onScrollEnd();
});

window.addEventListener('mousedown', onScrollStart);
window.addEventListener('mouseup', onScrollEnd);
window.addEventListener('touchstart', onScrollStart);
window.addEventListener('touchend', onScrollEnd);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggleDisplay") {
    isDisplayVisible = request.isVisible;
    updateDisplay(totalScrollDistance);
  } else if (request.action === "resetDistance") {
    totalScrollDistance = 0;
    updateDisplay(totalScrollDistance);
    chrome.runtime.sendMessage({ action: "updateDistance", distance: 0 });
  } else if (request.action === "updateTotalDistance") {
    totalScrollDistance = request.distance;
    updateDisplay(totalScrollDistance);
  } else if (request.action === "updateUnit") {
    currentUnit = request.unit;
    updateDisplay(totalScrollDistance);
  }
});

chrome.storage.local.get(['isDisplayVisible', 'totalDistance', 'unit'], (result) => {
  isDisplayVisible = result.isDisplayVisible !== false;
  totalScrollDistance = result.totalDistance || 0;
  currentUnit = result.unit || 'metric';
  lastScrollPosition = window.scrollY;
  updateDisplay(totalScrollDistance);
});

chrome.runtime.sendMessage({ action: "getTotalDistance" });

window.addEventListener('load', () => {
  lastScrollPosition = window.scrollY;
});