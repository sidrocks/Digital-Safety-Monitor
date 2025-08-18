# Digital Safety Monitor Chrome Extension

This Chrome extension is designed to provide digital safety monitoring for children, allowing parents to restrict access to certain websites and monitor browsing history.

## Features

*   **Parental Registration:** Secure registration page accessible only to parents, authenticated via their Gmail ID. Requires a PIN for access to settings.
*   **PIN Protection:** Secure access to parent registration and child browsing dashboard with a configurable 4-digit PIN.
*   **Child Profile Management:** Parents can add child's Gmail IDs and specify restricted URLs. *Note: Settings are applied per Chrome user profile, meaning a parent must configure restrictions within each child's Chrome profile.*
*   **Customizable Block Message:** Parents can set a custom message displayed to children when a restricted site is accessed.
*   **Email Notifications:** (Placeholder) Parents receive email notifications when a child attempts to access a restricted site. Requires backend service for full functionality.
*   **Browsing History Dashboard:** A dedicated dashboard for parents to view their child's browsing history. Requires PIN for access.
*   **History Management:** Options to clear and save browsing history from the dashboard.
*   **User-Based Access Control:** The extension differentiates between parent and child logins, applying restrictions only for registered children in *that specific Chrome profile*.

## Getting Started

### Installation

1.  Clone this repository:
    ```bash
    git clone https://github.com/your-username/digital-safety-monitor.git
    ```
2.  Open Chrome and navigate to `chrome://extensions`.
3.  Enable "Developer mode" by toggling the switch in the top right corner.
4.  Click "Load unpacked" and select the `digital-safety-monitor` directory.

### Configuration

1.  **Google API Console Project:**
    *   Go to the [Google API Console](https://console.developers.google.com/).
    *   Create a new project.
    *   Navigate to "APIs & Services" > "Credentials".
    *   Create "OAuth client ID" of type "Chrome App".
    *   Enter your extension ID (found on `chrome://extensions` page for your loaded extension) in the "Application ID" field.
    *   Copy the generated "Client ID" and paste it into `manifest.json` under `oauth2.client_id`.
    *   **Ensure the OAuth Consent Screen is configured correctly (published or test users added).**

2.  **Email Sending (Future Development):**
    *   To enable actual email notifications, you will need to set up a backend service (e.g., a serverless function, a custom server) to integrate with an email API (like SendGrid, Mailgun, or Gmail API). This will involve obtaining API keys and configuring the background script to send requests to your backend.

## Project Structure

*   `manifest.json`: The manifest file for the Chrome extension.
*   `popup.html`: The HTML file for the extension's popup.
*   `popup.js`: The JavaScript file for the extension's popup logic.
*   `background.js`: The service worker script for background tasks, such as listening for web requests and handling authentication.
*   `content.js`: The content script injected into web pages to potentially display block messages.
*   `registration.html`: The HTML file for the parent registration page.
*   `registration.js`: The JavaScript file for the parent registration page logic.
*   `dashboard.html`: The HTML file for the child browsing history dashboard.
*   `dashboard.js`: The JavaScript file for the child browsing history dashboard logic.
*   `images/`: Directory for extension icons.

## Usage

### Parent Configuration (Per Child Profile)

To configure the digital safety settings for a child:

1.  **Log into the child's Chrome browser profile** using the child's Google Account (Gmail ID).
2.  Open the Digital Safety Monitor extension popup and click "Parent Registration."
3.  **Sign in with your parent Google Account.** If it's the first time setting up for this child's profile, you will be prompted to set a 4-digit PIN. This PIN is crucial for accessing settings and history on *this specific child's profile*.
4.  Once signed in and the PIN is verified (or set), you can:
    *   Add the child's Gmail ID to the "Child's Gmail ID" list (it should typically be the same as the currently logged-in Chrome user).
    *   Specify restricted URLs (e.g., `youtube.com`, `facebook.com`).
    *   Set a custom message to be displayed when a restricted site is blocked.
5.  Click "Save Settings" to apply these restrictions to this child's profile.

### Child Browsing

When a child logs into their Chrome browser profile (where the extension has been configured by the parent):

*   The extension will monitor their browsing in the background.
*   If a restricted URL is accessed, the page will be immediately blocked and redirected to a custom page displaying the message set by the parent.
*   Browsing activity (both allowed and blocked attempts) will be logged locally within that child's Chrome profile for parent review.

### Child Browsing Dashboard

To view the browsing history for a child:

1.  **Log into the child's Chrome browser profile** (or the parent's profile if that's where the dashboard is being accessed, but remember history is logged per child profile).
2.  Open the Digital Safety Monitor extension popup and click "Child Browsing Dashboard."
3.  **Enter the PIN** you set during parent configuration for this profile to access the dashboard.
4.  On the dashboard, you can view the browsing history, clear it, or save it as a CSV file.

## Development

Instructions for development and debugging will be added here.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)
