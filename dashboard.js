document.addEventListener('DOMContentLoaded', () => {
  const signInButton = document.getElementById('signInButton');
  const authSection = document.getElementById('authSection');
  const pinVerificationDashboard = document.getElementById('pinVerificationDashboard');
  const verifyPinDashboardInput = document.getElementById('verifyPinDashboard');
  const verifyPinButtonDashboard = document.getElementById('verifyPinButtonDashboard');
  const verifyPinStatusMessageDashboard = document.getElementById('verifyPinStatusMessageDashboard');
  const dashboardContent = document.getElementById('dashboardContent');
  const currentParentEmailSpan = document.getElementById('currentParentEmail');
  const historyList = document.getElementById('historyList');
  const clearHistoryButton = document.getElementById('clearHistoryButton');
  const saveHistoryButton = document.getElementById('saveHistoryButton');
  const statusMessage = document.getElementById('statusMessage');

  let registeredParentEmail = '';
  let browsingHistory = [];
  let hashedPin = '';

  // Simple hashing function (must match the one in registration.js)
  function simpleHash(input) {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }
    return hash.toString();
  }

  // Load registered parent email and hashed PIN
  chrome.storage.sync.get(['parentEmail', 'hashedPin'], (result) => {
    registeredParentEmail = result.parentEmail || '';
    hashedPin = result.hashedPin || '';
    checkAuthAndLoadHistory();
  });

  signInButton.addEventListener('click', () => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        statusMessage.textContent = 'Error signing in. Please try again.';
        statusMessage.style.color = 'red';
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
          const currentUserEmail = data.email;
          if (currentUserEmail === registeredParentEmail) {
            // Parent authenticated, now check PIN
            authSection.style.display = 'none';
            if (hashedPin) {
              pinVerificationDashboard.style.display = 'block';
            } else {
              // No PIN set, allow direct access (though this should be rare if registration worked)
              dashboardContent.style.display = 'block';
              currentParentEmailSpan.textContent = currentUserEmail;
              loadBrowsingHistory();
            }
          } else {
            statusMessage.textContent = 'You are not the registered parent. Access denied.';
            statusMessage.style.color = 'red';
          }
        })
        .catch(error => {
          console.error('Error fetching user info:', error);
          statusMessage.textContent = 'Error fetching user info. Please try again.';
          statusMessage.style.color = 'red';
        });
      }
    });
  });

  verifyPinButtonDashboard.addEventListener('click', () => {
    const enteredPin = verifyPinDashboardInput.value;
    if (simpleHash(enteredPin) === hashedPin) {
      verifyPinStatusMessageDashboard.textContent = 'PIN verified!';
      verifyPinStatusMessageDashboard.style.color = 'green';
      pinVerificationDashboard.style.display = 'none';
      dashboardContent.style.display = 'block';
      currentParentEmailSpan.textContent = registeredParentEmail;
      loadBrowsingHistory();
    } else {
      verifyPinStatusMessageDashboard.textContent = 'Incorrect PIN.';
      verifyPinStatusMessageDashboard.style.color = 'red';
    }
  });

  clearHistoryButton.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear the browsing history?')) {
      browsingHistory = [];
      chrome.storage.local.set({ browsingHistory: [] }, () => {
        updateHistoryList();
        statusMessage.textContent = 'History cleared!';
        statusMessage.style.color = 'green';
        setTimeout(() => { statusMessage.textContent = ''; }, 3000);
      });
    }
  });

  saveHistoryButton.addEventListener('click', () => {
    if (browsingHistory.length === 0) {
      statusMessage.textContent = 'No history to save.';
      statusMessage.style.color = 'orange';
      setTimeout(() => { statusMessage.textContent = ''; }, 3000);
      return;
    }

    const csvContent = "data:text/csv;charset=utf-8," + browsingHistory.map(e => `${e.url},${new Date(e.timestamp).toLocaleString()},${e.status},${e.user}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "browsing_history.csv");
    document.body.appendChild(link); // Required for Firefox
    link.click();
    link.remove(); // Clean up

    statusMessage.textContent = 'History saved as browsing_history.csv!';
    statusMessage.style.color = 'green';
    setTimeout(() => { statusMessage.textContent = ''; }, 3000);
  });

  function checkAuthAndLoadHistory() {
    chrome.identity.getProfileUserInfo(async function(userInfo) {
      const currentUserEmail = userInfo.email;
      if (currentUserEmail === registeredParentEmail) {
        authSection.style.display = 'none';
        if (hashedPin) {
          pinVerificationDashboard.style.display = 'block';
        } else {
          dashboardContent.style.display = 'block';
          currentParentEmailSpan.textContent = currentUserEmail;
          loadBrowsingHistory();
        }
      } else if (registeredParentEmail) {
        statusMessage.textContent = 'Please sign in with the registered parent account to view the dashboard.';
        statusMessage.style.color = 'orange';
      }
    });
  }

  function loadBrowsingHistory() {
    chrome.storage.local.get(['browsingHistory'], (result) => {
      browsingHistory = result.browsingHistory || [];
      updateHistoryList();
    });
  }

  function updateHistoryList() {
    historyList.innerHTML = '';
    if (browsingHistory.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'No browsing history available.';
      historyList.appendChild(li);
      return;
    }
    browsingHistory.forEach(item => {
      const li = document.createElement('li');
      const date = new Date(item.timestamp).toLocaleString();
      li.innerHTML = `
        <div class="history-item-info">
          <strong>URL:</strong> ${item.url}<br/>
          <strong>User:</strong> ${item.user}<br/>
          <strong>Time:</strong> ${date}
        </div>
        <span class="history-item-status ${item.status}">${item.status.toUpperCase()}</span>
      `;
      historyList.appendChild(li);
    });
  }

  // Listen for history changes from background script
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.browsingHistory) {
      browsingHistory = changes.browsingHistory.newValue || [];
      updateHistoryList();
    }
  });
});
