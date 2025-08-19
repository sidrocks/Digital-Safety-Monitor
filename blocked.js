document.addEventListener('DOMContentLoaded', () => {
  const blockedMessageDisplay = document.getElementById('blockedMessageDisplay');
  const funMessageDisplay = document.getElementById('funMessage');

  const urlParams = new URLSearchParams(window.location.search);
  const message = urlParams.get('message') || 'This page has been blocked.';

  const funMessages = [
    "Oopsie! Looks like you've hit a digital roadblock!",
    "Whoa there, partner! This trail is closed.",
    "Access denied! Time to explore another corner of the internet.",
    "Uh-oh! This isn't the magical kingdom you're looking for.",
    "Woof! Blocked by the digital watchdog!",
    "BEEP BOOP! Restricted area. Please turn around!",
    "Hold your horses! This site is taking a nap.",
    "You've reached a blocked zone. Maybe try building a fort instead?",
    "This site is on a secret mission and can't be disturbed right now.",
    "Warning! You've entered a NO-GO zone. Try a different adventure!"
  ];

  const randomFunMessage = funMessages[Math.floor(Math.random() * funMessages.length)];

  blockedMessageDisplay.textContent = message;
  funMessageDisplay.textContent = randomFunMessage;
});
