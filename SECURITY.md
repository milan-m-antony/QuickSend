# Security Policy

## Supported Versions

Currently, we support the latest version of the extension and web client.

| Version | Supported          |
| ------- | ------------------ |
| 2.0.x   | :white_check_mark: |
| 1.0.x   | :x:                |

## Reporting a Vulnerability

QuickSend relies on P2P WebRTC technology for data transfer. If you discover a vulnerability in our signaling flow or data handling:

1.  **Do not create a public GitHub issue.**
2.  Email the core team at [security@quicksend.io] (placeholder) or DM the repository owner.
3.  Include a proof of concept if possible.

## Privacy Note

- **No Data Storage**: QuickSend servers (Supabase) do NOT store file data. They only broker the connection (SDP/ICE signals).
- **Encryption**: All P2P traffic is encrypted by WebRTC standard (DTLS/SRTP).
