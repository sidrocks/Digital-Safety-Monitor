# Digital Safety Monitor Chrome Extension

This Chrome extension is designed to provide digital safety monitoring for children, allowing parents to restrict access to certain websites and monitor browsing history.

## Features

-   **Parent Registration Page**:
    -   **Parent Gmail Authentication**: Secure login for parents using their Google account.
    -   **PIN Protection**: Set and verify a 4-digit PIN to secure access to settings. The PIN setup option is hidden once a PIN is set, and the Google Sign-in button is hidden if a parent is already registered with a PIN.
    -   **Per-Child-Profile Configuration**: Restricted URLs and custom messages are configured for the *currently logged-in Chrome user's Gmail ID (the child's profile)*. The child's Gmail ID is displayed as non-editable text.
    -   **Restricted URLs Management**: Parents can add, view, and remove URLs to be blocked for the registered child. The list of restricted URLs is now scrollable.
    -   **URL Export/Import**: Easily export your list of restricted URLs to a `.txt` or `.csv` file, and import URLs from such files, allowing for backup and quick setup across profiles.
    -   **Custom Block Message**: Set a personalized message to be displayed to the child when a restricted site is accessed.

-   **Child Browsing Monitoring**:
    -   **Site Blocking**: Automatically blocks access to URLs specified by the parent if the logged-in user is a registered child.
    -   **Enhanced Blocked Page**: When a site is blocked, a dedicated `blocked.html` page is displayed with the parent's custom message, a randomly selected fun message, and a visually engaging, professional yet fun dark theme. Includes a placeholder for a funny image (`images/funny_blocked.png` - *requires the user to add this image file*).

-   **Child Browsing Dashboard**:
    -   **PIN Protected Access**: Dashboard access is protected by the same PIN set on the registration page.
    -   **Comprehensive History**: Displays the browsing history (allowed and blocked sites) of the child user in a clear, fixed-width, scrollable table.
    -   **Dynamic Grouping**: Logs are grouped by customizable time periods (e.g., Today, Last 7 Days, This Month, All Time), with group headers only appearing if there is data for that group. "Last 7 Days" is the default view.
    -   **Search Functionality**: Search for specific URLs or keywords within the browsing history.
    -   **Clickable URLs**: URLs in the history table are clickable and open in a new tab.
    -   **URL Copy Option**: Truncated long URLs can be fully copied to the clipboard.
    -   **Clear History**: Option to clear all browsing history data stored by the extension.
    -   **Save History**: Option to save browsing history to a CSV file for external review.

-   **User-Based Access Control**:
    -   The extension intelligently identifies the logged-in Chrome user. If the user is a registered child, restrictions apply. If it's the parent, they can browse freely without restrictions (within their own profile) and access settings/dashboard.

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

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)
