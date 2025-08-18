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
  const childEmailInput = document.getElementById('childEmail');
  const addChildButton = document.getElementById('addChildButton');
  const childList = document.getElementById('childList');
  const restrictedUrlInput = document.getElementById('restrictedUrl');
  const addUrlButton = document.getElementById('addUrlButton');
  const urlList = document.getElementById('urlList');
  const blockedMessageTextarea = document.getElementById('blockedMessage');
  const saveSettingsButton = document.getElementById('saveSettingsButton');
  const statusMessage = document.getElementById('statusMessage');

  let parentEmail = '';
  let childEmails = [];
  let restrictedUrls = [];
  let hashedPin = '';

  // Simple hashing function (for client-side deterrence only, not cryptographic security)
  function simpleHash(input) {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }
    return hash.toString();
  }

  // Load settings from storage
  chrome.storage.sync.get(['parentEmail', 'childEmails', 'restrictedUrls', 'blockedMessage', 'hashedPin'], (result) => {
    if (result.parentEmail) {
      parentEmail = result.parentEmail;
      parentEmailSpan.textContent = parentEmail;
      signInButton.style.display = 'none';

      if (result.hashedPin) {
        hashedPin = result.hashedPin;
        pinVerification.style.display = 'block';
      } else {
        pinSetup.style.display = 'block';
      }
    }
    if (result.childEmails) {
      childEmails = result.childEmails;
      updateChildList();
    }
    if (result.restrictedUrls) {
      restrictedUrls = result.restrictedUrls;
      updateUrlList();
    }
    if (result.blockedMessage) {
      blockedMessageTextarea.value = result.blockedMessage;
    }
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
          parentEmail = data.email;
          parentEmailSpan.textContent = parentEmail;
          signInButton.style.display = 'none';

          chrome.storage.sync.get(['hashedPin'], (result) => {
            if (result.hashedPin) {
              hashedPin = result.hashedPin;
              pinVerification.style.display = 'block';
            } else {
              pinSetup.style.display = 'block';
            }
          });
          saveSettings();
        })
        .catch(error => {
          console.error('Error fetching user info:', error);
          statusMessage.textContent = 'Error fetching user info. Please try again.';
          statusMessage.style.color = 'red';
        });
      }
    });
  });

  setPinButton.addEventListener('click', () => {
    const newPin = newPinInput.value;
    const confirmPin = confirmPinInput.value;

    if (!/^[0-9]{4}$/.test(newPin)) {
      pinStatusMessage.textContent = 'PIN must be a 4-digit number.';
      return;
    }

    if (newPin !== confirmPin) {
      pinStatusMessage.textContent = 'PINs do not match.';
      return;
    }

    hashedPin = simpleHash(newPin);
    saveSettings();
    pinStatusMessage.textContent = 'PIN set successfully!';
    pinStatusMessage.style.color = 'green';
    pinSetup.style.display = 'none';
    registrationForm.style.display = 'block';
  });

  verifyPinButton.addEventListener('click', () => {
    const enteredPin = verifyPinInput.value;
    if (simpleHash(enteredPin) === hashedPin) {
      verifyPinStatusMessage.textContent = 'PIN verified!';
      verifyPinStatusMessage.style.color = 'green';
      pinVerification.style.display = 'none';
      registrationForm.style.display = 'block';
    } else {
      verifyPinStatusMessage.textContent = 'Incorrect PIN.';
      verifyPinStatusMessage.style.color = 'red';
    }
  });

  addChildButton.addEventListener('click', () => {
    const email = childEmailInput.value.trim();
    if (email && !childEmails.includes(email)) {
      childEmails.push(email);
      childEmailInput.value = '';
      updateChildList();
      saveSettings();
    }
  });

  addUrlButton.addEventListener('click', () => {
    const url = restrictedUrlInput.value.trim();
    if (url && !restrictedUrls.includes(url)) {
      restrictedUrls.push(url);
      restrictedUrlInput.value = '';
      updateUrlList();
      saveSettings();
    }
  });

  saveSettingsButton.addEventListener('click', saveSettings);
  blockedMessageTextarea.addEventListener('input', saveSettings); // Save on input change

  function updateChildList() {
    childList.innerHTML = '';
    childEmails.forEach((email, index) => {
      const li = document.createElement('li');
      li.textContent = email;
      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete';
      deleteButton.addEventListener('click', () => {
        childEmails.splice(index, 1);
        updateChildList();
        saveSettings();
      });
      li.appendChild(deleteButton);
      childList.appendChild(li);
    });
  }

  function updateUrlList() {
    urlList.innerHTML = '';
    restrictedUrls.forEach((url, index) => {
      const li = document.createElement('li');
      li.textContent = url;
      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete';
      deleteButton.addEventListener('click', () => {
        restrictedUrls.splice(index, 1);
        updateUrlList();
        saveSettings();
      });
      li.appendChild(deleteButton);
      urlList.appendChild(li);
    });
  }

  function saveSettings() {
    const settings = {
      parentEmail: parentEmail,
      childEmails: childEmails,
      restrictedUrls: restrictedUrls,
      blockedMessage: blockedMessageTextarea.value.trim(),
      hashedPin: hashedPin
    };
    chrome.storage.sync.set(settings, () => {
      statusMessage.textContent = 'Settings saved!';
      statusMessage.style.color = 'green';
      setTimeout(() => {
        statusMessage.textContent = '';
      }, 3000);
    });
  }
});
