# 🚀 QuickSend V2.0

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-2.0-green.svg)
![Status](https://img.shields.io/badge/status-stable-success.svg)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

**QuickSend** is a professional, ultra-fast P2P file transfer tool built as a Chrome Extension. It leverages WebRTC for direct browser-to-browser transfers and Supabase for real-time signaling, ensuring your files never touch a server.

---

## 📚 Table of Contents

- [Screenshots](#-screenshots)
- [Features](#-features)
- [How It Works](#-how-it-works)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation--setup)
- [Contributing](#-contributing)
- [Privacy](#-privacy--security)
- [License](#-license)

---

## 📸 Screenshots

| Extension (Sender) | Web App (Receiver) |
| :---: | :---: |
| ![Sender](assets/sender.png) | ![Receiver](assets/receiver.png) |

---

## 🌟 Features

- **P2P Direct Transfer**: Files move directly between devices. Maximum speed, zero server storage, total privacy.
- **Batch Sharing**: Select multiple files or drag-and-drop folders to send them sequentially in one go.
- **Universal Clipboard**: "Copy" on PC, "Paste" on Phone. Instantly sync text, URLs, and passwords between devices.
- **Mobile PWA**: The receiver is now a full Progressive Web App. Install it on your phone for full-screen, offline-capable sharing.
- **Magic QR Connect**: Scan a QR code with your phone to start a download instantly—no installation required on the receiving device.
- **Bi-Directional Chat**: Communicate with the peer during the transfer through an integrated, glassmorphic chat drawer.
- **Modern UI/UX**: Ultra-modern dark theme with glassmorphism, fluid animations, and a sleek "Outfit" typography.
- **Immersive Audio**: Custom generated sound effects for connection, messages, and transfer success.

---

## � How It Works

QuickSend uses **WebRTC** to create a direct pipe between two browsers.
1.  **Signaling**: Device A generates a session ID. This session ID is sent to Supabase (briefly) to let Device B know how to connect.
2.  **Handshake**: Device B enters the code or scans the QR. They exchange network details (ICE Candidates).
3.  **Direct Pipe**: Once connected, Supabase is disconnected. The two devices are now talking directly. Data flows locally if on the same WiFi, or directly via internet if apart.

---

## �🛠 Tech Stack

- **Frontend**: Vanilla HTML5, CSS3 (Glassmorphism), JavaScript (ES6+).
- **P2P Engine**: WebRTC (RTCPeerConnection & DataChannel).
- **Backend/Signaling**: Supabase (Realtime, PostgREST, RLS).
- **QR Engine**: Local `qrcode.js` (Offline-ready).
- **Audio**: Web Audio API (No separate assets).

---

## 📦 Installation & Setup

### 1. Chrome Extension (Sender/Full Client)
1.  Clone this repository:
    ```bash
    git clone https://github.com/milan-m-antony/QuickSend.git
    ```
2.  Open Chrome and navigate to `chrome://extensions/`.
3.  Enable **Developer mode** (top right toggle).
4.  Click **Load unpacked** and select the `QuickSend` folder from your computer.

### 2. Database Configuration
1.  Create a free project at [Supabase](https://supabase.com).
2.  Go to the **SQL Editor** in Supabase.
3.  Copy and paste the code from `schema.sql` (included in this repo).
4.  Run the query to set up the encrypted tables.
5.  In your code editor, open `config.js` and paste your `SUPABASE_URL` and `SUPABASE_KEY`.

### 3. Mobile Web Receiver (Optional)
To use the QR code feature effectively:
1.  Host `receive.html` (rename it to `index.html`!), `config.js`, `libs/`, and `icons/` on a static host like Vercel, Netlify, or GitHub Pages.
2.  Update the `host` variable in `popup.js` (line ~12) with your new URL.

---

## 🤝 Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) file for details on how to get started, report bugs, or suggest features.

## 🔒 Privacy & Security

QuickSend is designed with privacy as the highest priority:
- **No File Storage**: Files are streamed in chunks directly through a bit-encrypted WebRTC DataChannel.
- **Ephemeral Signaling**: Session data in Supabase contains only metadata (WebRTC Handshakes) and is deleted automatically after 2 minutes or upon successful connection.
- **Direct P2P**: Your data stays on your local network/direct internet route between the two peers.
- See more in [SECURITY.md](SECURITY.md).

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
