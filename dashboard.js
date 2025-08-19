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

  // Filter and Search Elements
  const filtersAndSearchDiv = document.querySelector('.filters-and-search');
  const timeFilter = document.getElementById('timeFilter');
  const searchUrlInput = document.getElementById('searchUrl');
  const applyFiltersButton = document.getElementById('applyFiltersButton');
  const resetFiltersButton = document.getElementById('resetFiltersButton');

  let registeredParentEmail = '';
  let browsingHistory = []; // Raw history from storage, always sorted latest first
  let filteredHistory = []; // History after applying filters and search
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

    if (hashedPin) {
      pinVerificationDashboard.style.display = 'block';
    } else if (registeredParentEmail) {
      // No PIN set, but parent email exists. This implies direct access after authentication.
      dashboardContent.style.display = 'block';
      currentParentEmailSpan.textContent = registeredParentEmail;
      loadBrowsingHistory();
      filtersAndSearchDiv.style.display = 'flex'; // Show filters if no PIN and authenticated
    } else {
      // No parent email or PIN. Display message to register.
      statusMessage.textContent = 'Please register as a parent first on the registration page.';
      statusMessage.style.color = 'orange';
    }
  });

  // Removed signInButton event listener as authSection is removed
  if (signInButton) { // Check if element exists before adding listener
    signInButton.style.display = 'none'; // Ensure it's hidden if somehow it was not removed from HTML
  }

  verifyPinButtonDashboard.addEventListener('click', () => {
    const enteredPin = verifyPinDashboardInput.value;
    if (simpleHash(enteredPin) === hashedPin) {
      verifyPinStatusMessageDashboard.textContent = 'PIN verified!';
      verifyPinStatusMessageDashboard.style.color = 'green';
      pinVerificationDashboard.style.display = 'none';
      dashboardContent.style.display = 'block';
      currentParentEmailSpan.textContent = registeredParentEmail;
      loadBrowsingHistory();
      filtersAndSearchDiv.style.display = 'flex'; // Show filters after successful PIN verification
    } else {
      verifyPinStatusMessageDashboard.textContent = 'Incorrect PIN.';
      verifyPinStatusMessageDashboard.style.color = 'red';
    }
  });

  clearHistoryButton.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear the browsing history?')) {
      browsingHistory = [];
      filteredHistory = [];
      chrome.storage.local.set({ browsingHistory: [] }, () => {
        updateHistoryList(true); // Pass true to reset filters after clear
        statusMessage.textContent = 'History cleared!';
        statusMessage.style.color = 'green';
        setTimeout(() => { statusMessage.textContent = ''; }, 3000);
      });
    }
  });

  saveHistoryButton.addEventListener('click', () => {
    if (filteredHistory.length === 0) { // Save filtered history
      statusMessage.textContent = 'No history to save.';
      statusMessage.style.color = 'orange';
      setTimeout(() => { statusMessage.textContent = ''; }, 3000);
      return;
    }

    const csvContent = "data:text/csv;charset=utf-8," + filteredHistory.map(e => `${e.url},${new Date(e.timestamp).toLocaleString()},${e.status}`).join("\n");
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

  function loadBrowsingHistory() {
    chrome.storage.local.get(['browsingHistory'], (result) => {
      // Always sort raw history by timestamp descending (latest first)
      browsingHistory = (result.browsingHistory || []).sort((a, b) => b.timestamp - a.timestamp);
      populateFilterOptions();
      timeFilter.value = 'last7days'; // Set default to Last 7 Days
      applyFilters(); // Apply filters immediately after loading
    });
  }

  function populateFilterOptions() {
    // Fixed time period options
    timeFilter.innerHTML = '';
    const options = [
      { value: 'all', text: 'All Time' },
      { value: 'today', text: 'Today' },
      { value: 'yesterday', text: 'Yesterday' },
      { value: 'last7days', text: 'Last 7 Days' },
      { value: 'thismonth', text: 'This Month' },
      { value: 'lastmonth', text: 'Last Month' },
      { value: 'thisyear', text: 'This Year' },
      { value: 'lastyear', text: 'Last Year' },
    ];

    options.forEach(optionData => {
      const option = document.createElement('option');
      option.value = optionData.value;
      option.textContent = optionData.text;
      timeFilter.appendChild(option);
    });
  }

  applyFiltersButton.addEventListener('click', applyFilters);
  resetFiltersButton.addEventListener('click', () => updateHistoryList(true));

  function applyFilters() {
    let tempHistory = [...browsingHistory];

    const selectedTime = timeFilter.value;
    const searchText = searchUrlInput.value.toLowerCase().trim();

    const now = new Date();
    let startDate = null;
    let endDate = now;

    switch (selectedTime) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'yesterday':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // End of yesterday
        break;
      case 'last7days':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6); // Today + 6 previous days
        startDate.setHours(0, 0, 0, 0); // Start of the day
        break;
      case 'thismonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'lastmonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0); // Last day of last month
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'thisyear':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'lastyear':
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        endDate = new Date(now.getFullYear(), 0, 0); // Last day of last year
        endDate.setHours(23, 59, 59, 999);
        break;
    }

    if (startDate) {
      tempHistory = tempHistory.filter(item => {
        const itemTime = new Date(item.timestamp).getTime();
        return itemTime >= startDate.getTime() && itemTime <= endDate.getTime();
      });
    }

    if (searchText) {
      tempHistory = tempHistory.filter(item => item.url.toLowerCase().includes(searchText));
    }

    filteredHistory = tempHistory;
    updateHistoryList();
  }

  function updateHistoryList(resetFilters = false) {
    if (resetFilters) {
      timeFilter.value = 'all';
      searchUrlInput.value = '';
      filteredHistory = [...browsingHistory]; // Reset filtered history to raw history
    }

    historyList.innerHTML = '';

    if (filteredHistory.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'No browsing history available for the current filters.';
      historyList.appendChild(li);
      return;
    }

    let lastDay = '';
    let lastWeek = '';
    let lastMonth = '';
    let lastYear = '';

    const selectedTimeFilter = timeFilter.value; // Get the currently selected filter value

    filteredHistory.forEach(item => {
      const itemDate = new Date(item.timestamp);

      const currentYear = itemDate.getFullYear();
      const currentMonth = itemDate.toLocaleString('en-us', { month: 'long', year: 'numeric' });
      const currentWeek = `Week ${getWeekNumber(itemDate)} ${currentYear}`;
      const currentDayOfWeek = itemDate.toLocaleString('en-us', { weekday: 'long' });
      const currentDay = itemDate.toLocaleString('en-us', { day: 'numeric', month: 'long', year: 'numeric' });

      // Grouping by Month
      if (selectedTimeFilter === 'all' || selectedTimeFilter.endsWith('year') || selectedTimeFilter.endsWith('month')) {
        if (currentMonth !== lastMonth) {
          appendGroupHeader(`Month: ${currentMonth}`, 'month-header');
          lastMonth = currentMonth;
          lastWeek = '';
          lastDay = '';
        }
      }

      // Grouping by Week (only if not 'last7days' filter)
      if (selectedTimeFilter !== 'last7days' && (selectedTimeFilter === 'all' || selectedTimeFilter.endsWith('year') || selectedTimeFilter.endsWith('month'))) {
        if (currentWeek !== lastWeek) {
          appendGroupHeader(`Week: ${currentWeek}`, 'week-header');
          lastWeek = currentWeek;
          lastDay = '';
        }
      }

      // Always group by day unless filtering by a single specific day (Today, Yesterday, or only one day in Last 7 Days)
      if (selectedTimeFilter !== 'today' && selectedTimeFilter !== 'yesterday') {
        if (currentDay !== lastDay) {
          appendGroupHeader(`Day: ${currentDay} (${currentDayOfWeek})`, 'day-header');
          lastDay = currentDay;
        }
      } else if (lastDay === '') { // For 'today'/'yesterday' or 'last7days', only show day header once if there's data
         appendGroupHeader(`Day: ${currentDay} (${currentDayOfWeek})`, 'day-header');
         lastDay = currentDay;
      }

      const li = document.createElement('li');
      const time = itemDate.toLocaleString('en-us', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true });

      const displayUrl = item.url.length > 70 ? item.url.substring(0, 67) + '...' : item.url;

      li.innerHTML = `
        <div class="history-item-info">
          <span class="history-item-time">${time}</span>
          <span class="history-item-url-wrapper">
            <a href="${item.url}" target="_blank" class="history-item-url" title="${item.url}">${displayUrl}</a>
            <button class="copy-url-button" data-url="${item.url}">Copy</button>
          </span>
          <span class="history-item-status ${item.status}">${item.status.toUpperCase()}</span>
        </div>
      `;

      historyList.appendChild(li);
    });

    // Add event listeners for copy buttons
    document.querySelectorAll('.copy-url-button').forEach(button => {
      button.addEventListener('click', (event) => {
        const urlToCopy = event.target.dataset.url;
        navigator.clipboard.writeText(urlToCopy).then(() => {
          // Optional: Provide visual feedback
          const originalText = event.target.textContent;
          event.target.textContent = 'Copied!';
          setTimeout(() => { event.target.textContent = originalText; }, 1500);
        }).catch(err => {
          console.error('Could not copy text: ', err);
        });
      });
    });
  }

  function appendGroupHeader(text, className) {
    const headerLi = document.createElement('li');
    headerLi.classList.add('group-header', className);
    headerLi.textContent = text;
    historyList.appendChild(headerLi);
  }

  // Helper function to get week number (ISO week date system)
  function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
  }

  // Listen for history changes from background script
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.browsingHistory) {
      // Re-sort and update when history changes
      browsingHistory = (changes.browsingHistory.newValue || []).sort((a, b) => b.timestamp - a.timestamp);
      populateFilterOptions();
      applyFilters(); // Re-apply filters after history change
    }
  });
});
