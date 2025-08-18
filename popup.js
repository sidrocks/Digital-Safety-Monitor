document.getElementById('registrationPage').addEventListener('click', () => {
  chrome.tabs.create({ url: 'registration.html' });
});

document.getElementById('dashboardPage').addEventListener('click', () => {
  chrome.tabs.create({ url: 'dashboard.html' });
});
