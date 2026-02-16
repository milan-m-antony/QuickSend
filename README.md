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
3.  Configure your own **Supabase** project and **Metered.ca** TURN servers in `config.js`.

---

## 🔒 Backend & Security Setup (Required for Mobile)
To keep your API keys safe from the public, QuickSend uses a **Supabase Edge Function** as a gatekeeper for TURN credentials.

### 1. Set Supabase Secrets
In your Supabase Dashboard (or CLI), set your Metered.ca credentials:
```bash
supabase secrets set METERED_API_KEY=your_actual_key
supabase secrets set METERED_DOMAIN=your_metered_domain
```

### 2. Deploy the Gatekeeper Function
Create a function named `get-turn-credentials` and use the following logic in your `index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })
  try {
    const apiKey = Deno.env.get('METERED_API_KEY')
    const domain = Deno.env.get('METERED_DOMAIN')
    const response = await fetch(`https://${domain}/api/v1/turn/credentials?apiKey=${apiKey}`)
    const credentials = await response.json()
    return new Response(JSON.stringify(credentials), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
```
Deploy it using: `supabase functions deploy get-turn-credentials`

---

## 📄 License
MIT License - Free to use and modify.
