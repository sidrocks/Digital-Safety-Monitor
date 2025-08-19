document.addEventListener('DOMContentLoaded', () => {
  const signInButton = document.getElementById('signInButton');
  const pinSetup = document.getElementById('pinSetup');
  const newPinInput = document.getElementById('newPin');
  const confirmPinInput = document.getElementById('confirmPin');
  const setPinButton = document.getElementById('setPinButton');
  const pinStatusMessage = document.getElementById('pinStatusMessage');
  const pinVerification = document.getElementById('pinVerification');
  const verifyPinInput = document.getElementById('verifyPin');
  const verifyPinButton = document.getElementById('verifyPinButton');
  const verifyPinStatusMessage = document.getElementById('verifyPinStatusMessage');
  const registrationForm = document.getElementById('registrationForm');
  const parentEmailSpan = document.getElementById('parentEmail');
  const currentUserEmailDisplay = document.getElementById('currentUserEmailDisplay');
  const restrictedUrlInput = document.getElementById('restrictedUrl');
  const addUrlButton = document.getElementById('addUrlButton');
  const urlList = document.getElementById('urlList');
  const blockedMessageInput = document.getElementById('blockedMessage');
  const saveSettingsButton = document.getElementById('saveSettingsButton');
  const statusMessage = document.getElementById('statusMessage');
  const exportUrlsButton = document.getElementById('exportUrlsButton');
  const importUrlsButton = document.getElementById('importUrlsButton');
  const importUrlsFile = document.getElementById('importUrlsFile');

  let registeredParentEmail = '';
  let currentUserEmail = '';
  let hashedPin = '';
  let restrictedUrls = [];
  let blockedMessage = '';

  // Simple hashing function for PIN (for client-side deterrence)
  function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }
    return hash.toString();
  }

  async function getProfileEmail() {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
          console.error('Error getting auth token:', chrome.runtime.lastError.message);
          resolve('');
          return;
        }
        if (token) {
          fetch('https://www.googleapis.com/oauth2/v2/userinfo?alt=json', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          .then(response => response.json())
          .then(data => { resolve(data.email || ''); })
          .catch(error => { console.error('Error fetching user info:', error); resolve(''); });
        } else {
          resolve('');
        }
      });
    });
  }

  // Check if parent is already signed in or PIN is set
  chrome.storage.sync.get(['parentEmail', 'hashedPin', 'restrictedUrls', 'blockedMessage'], async (result) => {
    registeredParentEmail = result.parentEmail || '';
    hashedPin = result.hashedPin || '';
    restrictedUrls = result.restrictedUrls || [];
    blockedMessage = result.blockedMessage || 'This site is blocked by your parent.';

    currentUserEmail = await getProfileEmail(); // Get the current user's email

    if (registeredParentEmail && hashedPin) {
      // Parent registered and PIN set, show PIN verification
      pinVerification.style.display = 'block';
      // Hide PIN setup if PIN already exists
      pinSetup.style.display = 'none';
      // Explicitly hide sign-in button if already registered and PIN set
      signInButton.style.display = 'none';

    } else if (currentUserEmail) {
      // No PIN or parent not registered, but user is logged in, show setup or form
      registeredParentEmail = currentUserEmail; // Auto-set parent email to current user
      parentEmailSpan.textContent = registeredParentEmail;
      currentUserEmailDisplay.textContent = currentUserEmail; // Display current user's email
      signInButton.style.display = 'none'; // Hide sign-in button if a user is logged in

      if (!hashedPin) {
        pinSetup.style.display = 'block';
      } else {
        registrationForm.style.display = 'block';
        renderRestrictedUrls();
        blockedMessageInput.value = blockedMessage;
      }
    } else {
      // No user logged in to Chrome, prompt to sign in
      signInButton.style.display = 'block';
    }
  });

  signInButton.addEventListener('click', async () => {
    chrome.identity.getAuthToken({ interactive: true }, async (token) => {
      if (token) {
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo?alt=json', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const userInfo = await userInfoResponse.json();
        if (userInfo.email) {
          registeredParentEmail = userInfo.email;
          parentEmailSpan.textContent = registeredParentEmail;
          currentUserEmail = userInfo.email; // Set current user email
          currentUserEmailDisplay.textContent = currentUserEmail; // Display current user's email
          signInButton.style.display = 'none';
          pinSetup.style.display = 'block'; // Proceed to PIN setup
          statusMessage.textContent = 'Signed in successfully. Please set a PIN.';
          statusMessage.style.color = 'green';
        } else {
          statusMessage.textContent = 'Could not retrieve email. Please try again.';
          statusMessage.style.color = 'red';
        }
      } else if (chrome.runtime.lastError) {
        statusMessage.textContent = 'Sign-in failed: ' + chrome.runtime.lastError.message;
        statusMessage.style.color = 'red';
      }
    });
  });

  setPinButton.addEventListener('click', () => {
    const newPin = newPinInput.value;
    const confirmPin = confirmPinInput.value;

    if (newPin.length !== 4 || !/^[0-9]{4}$/.test(newPin)) {
      pinStatusMessage.textContent = 'PIN must be a 4-digit number.';
      pinStatusMessage.style.color = 'red';
      return;
    }

    if (newPin !== confirmPin) {
      pinStatusMessage.textContent = 'PINs do not match.';
      pinStatusMessage.style.color = 'red';
      return;
    }

    hashedPin = simpleHash(newPin);
    chrome.storage.sync.set({ hashedPin: hashedPin }, () => {
      pinStatusMessage.textContent = 'PIN set successfully! You can now access settings.';
      pinStatusMessage.style.color = 'green';
      pinSetup.style.display = 'none'; // Hide PIN setup after setting
      registrationForm.style.display = 'block';
      renderRestrictedUrls();
      blockedMessageInput.value = blockedMessage;
    });
  });

  verifyPinButton.addEventListener('click', () => {
    const enteredPin = verifyPinInput.value;
    if (simpleHash(enteredPin) === hashedPin) {
      verifyPinStatusMessage.textContent = 'PIN verified. Access granted.';
      verifyPinStatusMessage.style.color = 'green';
      pinVerification.style.display = 'none'; // Hide PIN verification section
      registrationForm.style.display = 'block';
      parentEmailSpan.textContent = registeredParentEmail; // Ensure parent email is displayed
      currentUserEmailDisplay.textContent = currentUserEmail; // Ensure current user email is displayed
      renderRestrictedUrls();
      blockedMessageInput.value = blockedMessage;
    } else {
      verifyPinStatusMessage.textContent = 'Incorrect PIN. Please try again.';
      verifyPinStatusMessage.style.color = 'red';
    }
  });

  addUrlButton.addEventListener('click', () => {
    const url = restrictedUrlInput.value.trim();
    if (url && !restrictedUrls.includes(url)) {
      restrictedUrls.push(url);
      renderRestrictedUrls();
      restrictedUrlInput.value = '';
    }
  });

  exportUrlsButton.addEventListener('click', () => {
    if (restrictedUrls.length === 0) {
      statusMessage.textContent = 'No URLs to export.';
      statusMessage.style.color = 'orange';
      return;
    }
    const urlsText = restrictedUrls.join('\n');
    const blob = new Blob([urlsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'restricted_urls.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    statusMessage.textContent = 'URLs exported successfully!';
    statusMessage.style.color = 'green';
  });

  importUrlsButton.addEventListener('click', () => {
    importUrlsFile.click(); // Trigger the hidden file input click
  });

  importUrlsFile.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        const importedUrls = content.split(/\r?\n/).map(line => line.trim()).filter(line => line !== '');
        const newUrls = [...new Set([...restrictedUrls, ...importedUrls])]; // Merge and deduplicate

        if (newUrls.length > restrictedUrls.length) {
          restrictedUrls = newUrls;
          renderRestrictedUrls();
          statusMessage.textContent = `Imported ${importedUrls.length} URLs. Total: ${restrictedUrls.length} (duplicates removed).`;
          statusMessage.style.color = 'green';
          // Automatically save after import
          const newBlockedMessage = blockedMessageInput.value.trim();
          const settingsToSave = {
            parentEmail: registeredParentEmail,
            childEmails: [currentUserEmail],
            restrictedUrls: restrictedUrls,
            blockedMessage: newBlockedMessage
          };
          chrome.storage.sync.set(settingsToSave);
        } else {
          statusMessage.textContent = 'No new URLs found in the imported file.';
          statusMessage.style.color = 'orange';
        }
      };
      reader.readAsText(file);
    } else {
      statusMessage.textContent = 'No file selected for import.';
      statusMessage.style.color = 'orange';
    }
  });

  saveSettingsButton.addEventListener('click', () => {
    const newBlockedMessage = blockedMessageInput.value.trim();
    // Save the current user's email as the childEmail for this profile
    const settingsToSave = {
      parentEmail: registeredParentEmail,
      childEmails: [currentUserEmail], // Save current user's email as the child
      restrictedUrls: restrictedUrls,
      blockedMessage: newBlockedMessage
    };
    chrome.storage.sync.set(settingsToSave, () => {
      statusMessage.textContent = 'Settings saved successfully!';
      statusMessage.style.color = 'green';
    });
  });

  function renderRestrictedUrls() {
    urlList.innerHTML = '';
    if (restrictedUrls.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'No restricted URLs added yet.';
      urlList.appendChild(li);
      return;
    }
    restrictedUrls.forEach(url => {
      const li = document.createElement('li');
      li.textContent = url;
      const removeButton = document.createElement('button');
      removeButton.textContent = 'Remove';
      removeButton.addEventListener('click', () => {
        restrictedUrls = restrictedUrls.filter(item => item !== url);
        renderRestrictedUrls();
      });
      li.appendChild(removeButton);
      urlList.appendChild(li);
    });
  }

  // Listen for changes in storage (e.g., if settings are cleared from dashboard)
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes.restrictedUrls) {
      restrictedUrls = changes.restrictedUrls.newValue || [];
      renderRestrictedUrls();
    }
    if (namespace === 'sync' && changes.blockedMessage) {
      blockedMessage = changes.blockedMessage.newValue || 'This site is blocked by your parent.';
      blockedMessageInput.value = blockedMessage;
    }
    if (namespace === 'sync' && changes.hashedPin) {
      hashedPin = changes.hashedPin.newValue || '';
      // Re-evaluate PIN setup display if PIN changes (e.g., cleared)
      if (hashedPin) {
        pinSetup.style.display = 'none';
      } else if (currentUserEmail) {
        pinSetup.style.display = 'block';
      }
    }
  });
});
