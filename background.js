console.log('Digital Safety Monitor: Service Worker Starting...');

chrome.runtime.onInstalled.addListener(() => {
  console.log('Digital Safety Monitor extension installed or updated.');
  checkAndApplySettingsOnStart();
});

chrome.runtime.onStartup.addListener(() => {
  console.log('Digital Safety Monitor extension started with Chrome.');
  checkAndApplySettingsOnStart();
});

async function getProfileEmail() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        console.error('Error getting auth token:', chrome.runtime.lastError.message);
        resolve(''); // Resolve with empty string if error
        return;
      }
      if (token) {
        fetch('https://www.googleapis.com/oauth2/v2/userinfo?alt=json', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        .then(response => response.json())
        .then(data => {
          resolve(data.email || '');
        })
        .catch(error => {
          console.error('Error fetching user info:', error);
          resolve(''); // Resolve with empty string if error
        });
      } else {
        resolve(''); // No token available
      }
    });
  });
}

async function checkAndApplySettingsOnStart() {
  const currentUserEmail = await getProfileEmail();
  console.log(`Extension started for user: ${currentUserEmail}`);

  chrome.storage.sync.get(['parentEmail', 'childEmails', 'restrictedUrls', 'blockedMessage'], (result) => {
    const parentEmail = result.parentEmail || '';
    const childEmails = result.childEmails || [];
    const restrictedUrls = result.restrictedUrls || [];
    const blockedMessage = result.blockedMessage || 'This site is blocked by your parent.';
  });
  chrome.storage.local.get(['browsingHistory'], (result) => {
    browsingHistory = result.browsingHistory || [];
  });
}

let browsingHistory = [];

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    try {
      const currentUserEmail = await getProfileEmail();
      console.log(`onUpdated: Current user email: ${currentUserEmail}`);

      const settings = await chrome.storage.sync.get(['parentEmail', 'childEmails', 'restrictedUrls', 'blockedMessage']);
      const parentEmail = settings.parentEmail || '';
      const childEmails = settings.childEmails || [];
      const restrictedUrls = settings.restrictedUrls || [];
      const blockedMessage = settings.blockedMessage || 'This site is blocked by your parent.';

      console.log(`onUpdated: Parent Email: ${parentEmail}, Child Emails: ${childEmails}, Restricted URLs: ${restrictedUrls}`);

      let currentBrowsingHistoryResult = await chrome.storage.local.get(['browsingHistory']);
      let currentBrowsingHistory = currentBrowsingHistoryResult.browsingHistory || [];

      const url = new URL(tab.url);
      const hostname = url.hostname;
      console.log(`onUpdated: Checking URL: ${tab.url}, Hostname: ${hostname}`);

      if (childEmails.includes(currentUserEmail)) {
        console.log(`onUpdated: User ${currentUserEmail} is a registered child.`);
        const isRestricted = restrictedUrls.some(restrictedUrl => {
          const matches = hostname.includes(restrictedUrl);
          console.log(`  - Comparing ${hostname} with ${restrictedUrl}: ${matches}`);
          return matches;
        });

        if (isRestricted) {
          console.log(`Blocked: ${tab.url} for child ${currentUserEmail}`);
          currentBrowsingHistory.push({ url: tab.url, timestamp: Date.now(), status: 'blocked', user: currentUserEmail });
          await chrome.storage.local.set({ browsingHistory: currentBrowsingHistory });

          sendBlockedEmail(parentEmail, currentUserEmail, tab.url, blockedMessage);

          const blockedPageUrl = chrome.runtime.getURL(`blocked.html?message=${encodeURIComponent(blockedMessage)}`);
          console.log(`Redirecting to blocked page: ${blockedPageUrl}`);
          chrome.tabs.update(tabId, { url: blockedPageUrl });
        } else {
          console.log(`Allowed: ${tab.url} for child ${currentUserEmail}`);
          currentBrowsingHistory.push({ url: tab.url, timestamp: Date.now(), status: 'allowed', user: currentUserEmail });
          await chrome.storage.local.set({ browsingHistory: currentBrowsingHistory });
        }
      } else {
        console.log(`onUpdated: User ${currentUserEmail} is neither parent nor registered child. Allowing access.`);
      }
    } catch (error) {
      console.error('Error in onUpdated listener:', error);
    }
  }
});

function sendBlockedEmail(parent, child, url, message) {
  console.log(`Sending email to ${parent}: Child ${child} tried to access ${url}. Message: ${message}`);
}

// Placeholder for icons
// These are referenced in manifest.json
