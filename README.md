# QuickSend 🚀

**Instant, secure file transfer directly in your browser.**
QuickSend works across devices (PC, Mac, iPhone, Android) without installing any apps. Just scan a QR code or share a link.

## 📥 How to Install (Chrome Extension)

Since this is an open-source project, you can install the extension manually for free:

1.  **Download the Code:**
    *   Click the green **Code** button above -> **Download ZIP**.
    *   Extract the ZIP file to a folder on your computer.

2.  **Load into Chrome:**
    *   Open Chrome and go to `chrome://extensions`.
    *   Enable **Developer mode** (toggle in the top-right corner).
    *   Click **Load unpacked**.
    *   Select the folder where you extracted the code.

3.  **Pin It:**
    *   Click the puzzle piece icon in Chrome and pin **QuickSend** for easy access.

---

## 📱 How to Use (Web App)

Don't want to install the extension? Just visit our web app:
👉 **[Launch QuickSend Web](https://quick-send-iota.vercel.app/receive.html)**

### Sending Files:
1.  Open the Extension or Web App.
2.  Click **Send Mode**.
3.  Select files, paste text, or **Drag & Drop** anywhere on the screen (Desktop only).
4.  Scan the QR code with any device (or share the link).
5.  Watch the **Real-time HUD** for speed and ETA stats.

### Receiving Files:
1.  Open the link or scan the QR code.
2.  Or enter the 6-digit session code manually.
3.  Files appear in the **Unified History**.
4.  Tap any Image or Video to **Preview** it instantly.
5.  Click **Download** to save files permanently.

---

## 🛠 For Developers

### Tech Stack
*   **Frontend:** HTML5, CSS3 (Glassmorphism), Vanilla JS
*   **Networking:** WebRTC (P2P), Supabase (Signaling), Metered.ca (TURN Relay)

### Local Setup
1.  Clone the repo: `git clone https://github.com/milan-m-antony/QuickSend.git`
2.  Open `index.html` or load the folder as an extension.
3.  Ensure `config.js` with Supabase credentials is present.

## 📄 License
MIT License - Free to use and modify.
