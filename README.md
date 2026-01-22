# 🚀 QuickSend

**QuickSend** is a professional, ultra-fast P2P file transfer tool built as a Chrome Extension. It leverages WebRTC for direct browser-to-browser transfers and Supabase for real-time signaling, ensuring your files never touch a server.

---

## 🌟 Key Features

- **P2P Direct Transfer**: Files move directly between devices. Maximum speed, zero server storage, total privacy.
- **Magic QR Connect**: Scan a QR code with your phone to start a download instantly—no installation required on the receiving device.
- **6-Digit Secure Pairing**: Simple, memorable codes for manual device linking.
- **Bi-Directional Chat**: Communicate with the peer during the transfer through an integrated, glassmorphic chat drawer.
- **Modern UI/UX**: Ultra-modern dark theme with glassmorphism, fluid animations, and a sleek "Outfit" typography.
- **Distributed Janitor**: Automatic signaling session cleanup to keep the backend lean and fast.

---

## 🛠 Tech Stack

- **Frontend**: Vanilla HTML5, CSS3 (Glassmorphism), JavaScript (ES6+).
- **P2P Engine**: WebRTC (RTCPeerConnection & DataChannel).
- **Backend/Signaling**: Supabase (Realtime, PostgREST, RLS).
- **QR Engine**: Local `qrcode.js` (Offline-ready).

---

## 📦 Installation & Setup

### 1. Chrome Extension (Sender/Full Client)
1. Clone this repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select the `QuickSend` folder.

### 2. Database Configuration
1. Create a project at [Supabase](https://supabase.com).
2. Run the SQL provided in `schema.sql` in the Supabase SQL Editor.
3. Copy your `SUPABASE_URL` and `SUPABASE_KEY` into `config.js`.

### 3. Mobile Web Receiver (Optional)
1. Host `receive.html` (renamed to `index.html` for a cleaner link), `config.js`, `libs/`, and `icons/` on Vercel or GitHub Pages.
2. Update the `host` variable in `popup.js` with your active domain.

---

## 🔒 Privacy & Security

QuickSend is designed with privacy as the highest priority:
- **No File Storage**: Files are streamed in chunks directly through a bit-encrypted WebRTC DataChannel.
- **Ephemeral Signaling**: Session data in Supabase contains only metadata (WebRTC Handshakes) and is deleted automatically after 2 minutes or upon successful connection.
- **Direct P2P**: Your data stays on your local network/direct internet route between the two peers.

---

## 📄 License
MIT License. Created with ❤️ for fast, secure sharing.
