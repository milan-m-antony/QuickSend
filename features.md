# 💎 QuickSend: Premium Features & UI Highlights

QuickSend isn't just a file transfer tool; it's a high-performance experience designed for modern users.

## 🚀 Advanced Connectivity
- **WebRTC Data Channels**: Utilizes low-latency protocols for chunked file streaming with built-in backpressure handling.
- **Zero-Handshake QR**: Encodes a full pairing URL into a local QR code, enabling "Scan-to-Download" for mobile devices without any app installation.
- **STUN/ICE Integration**: Uses industry-standard Google STUN servers to bypass NAT and Firewalls for reliable global connectivity.

## 🎨 Design Excellence
- **Vibrant Aesthetics**: A curated color palette (Cyan & Royal Purple) that matches our custom high-resolution logo.
- **Glassmorphism 2.0**: Sophisticated use of `backdrop-filter`, transparency, and subtle borders to create a premium, depth-rich interface.
- **Dynamic Header Transitions**: The UI reactively adjusts (e.g., "Compact Mode") based on the active view, maximizing usable space.
- **Micro-Animations**: Shimmer effects on loading states, bounce transitions between views, and pulsing notification dots.

## 💬 Integrated Communication
- **P2P Chat Drawer**: A sliding bottom-up drawer allows users to send instructions or notes along with their files.
- **Unread Indicators**: Real-time notification dots ensure you never miss a message while managing files.
- **Adaptive UI**: Sent/Received message bubbles are color-mapped to the QuickSend brand for a seamless look.

## 🛡️ Backend Stability (The Janitor System)
- **Real-Time Presence**: Uses Supabase Realtime to track peer "Presence" for instant connection status updates (Connected/Disconnected).
- **Auto-Cleanup (Distributed Janitor)**: Every active client helps "sweep" the database of stale signaling records older than 2 minutes, ensuring the system stays lightning-fast even on free-tier database plans.
- **Row Level Security (RLS)**: Protects signaling data at the database level, ensuring peers only interact with the sessions they are authorized for.

---
*QuickSend: Faster than an email, safer than a cloud.*
