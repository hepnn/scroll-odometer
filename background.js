let totalDistance = 0;

function formatBadge(distance) {
  if (distance < 100) {
    return Math.round(distance) + "cm";
  } else if (distance < 100000) {
    return (distance / 100).toFixed(1) + "m";
  } else {
    return (distance / 100000).toFixed(1) + "km";
  }
}

function updateBadgeAndStorage(distance) {
  totalDistance = distance;
  chrome.action.setBadgeText({ text: formatBadge(totalDistance) });
  chrome.storage.local.set({ totalDistance: totalDistance });
  
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, { 
        action: "updateTotalDistance", 
        distance: totalDistance 
      });
    });
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateDistance") {
    updateBadgeAndStorage(request.distance);
  } else if (request.action === "getTotalDistance") {
    chrome.tabs.sendMessage(sender.tab.id, { 
      action: "updateTotalDistance", 
      distance: totalDistance 
    });
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['totalDistance'], (result) => {
    totalDistance = result.totalDistance || 0;
    updateBadgeAndStorage(totalDistance);
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    chrome.tabs.sendMessage(tabId, { 
      action: "updateTotalDistance", 
      distance: totalDistance 
    });
  }
});