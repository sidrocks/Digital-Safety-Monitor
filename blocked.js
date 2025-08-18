document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const message = urlParams.get('message');
  const blockedMessageElement = document.getElementById('blockedMessage');

  if (message) {
    blockedMessageElement.textContent = decodeURIComponent(message);
  } else {
    blockedMessageElement.textContent = 'This site has been blocked by your parent.';
  }
});
