// Initialize Supabase Client
// SUPABASE_URL and SUPABASE_KEY are defined in config.js
const supabase = window.createClient(SUPABASE_URL, SUPABASE_KEY);

// WebRTC Configuration (Public STUN servers)
// WebRTC Configuration
let rtcConfig = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
    ]
};

// Metered.ca TURN Server Integration
const METERED_API_KEY = "7901977ec1ad39f11335a956e16f677d8cb7";
const METERED_DOMAIN = "milanmantony.metered.live";

// Fetch TURN credentials immediately
(async function fetchTurnCredentials() {
    try {
        const response = await fetch(`https://${METERED_DOMAIN}/api/v1/turn/credentials?apiKey=${METERED_API_KEY}`);
        const iceServers = await response.json();
        // Merge with defaults (Metered usually returns STUN+TURN, but keeping Google as backup is safe)
        rtcConfig.iceServers = [...rtcConfig.iceServers, ...iceServers];
        console.log("Details: TURN servers loaded successfully");
    } catch (e) {
        console.warn("Using default STUN servers (TURN fetch failed):", e);
    }
})();

// Global State
let peerConnection = null;
let dataChannel = null;
let sessionCode = null;
let heartbeatInterval = null;
let currentFile = null;
let filesQueue = []; // Queue for multi-file sending
let receivedChunks = [];
let receivedBytes = 0;
let fileSize = 0;
let fileName = '';
let startTime = 0;
let role = ''; // 'sender' or 'receiver'
let iceCandidateQueue = [];
let iceUpdateTimer = null;

// DOM Elements
const views = {
    mode: document.getElementById('mode-selection'),
    sender: document.getElementById('sender-view'),
    receiver: document.getElementById('receiver-view'),
    transfer: document.getElementById('transfer-view')
};

const ui = {
    btnSendMode: document.getElementById('btn-send-mode'),
    btnReceiveMode: document.getElementById('btn-receive-mode'),
    fileInput: document.getElementById('file-input'),
    dropArea: document.getElementById('drop-area'),
    fileName: document.getElementById('file-name-display'),
    codeDisplay: document.getElementById('code-display-area'),
    sessionCode: document.getElementById('session-code'),
    btnCancelSend: document.getElementById('btn-cancel-send'),
    codeInput: document.getElementById('code-input'),
    btnConnect: document.getElementById('btn-connect'),
    btnCancelReceive: document.getElementById('btn-cancel-receive'),
    status: document.getElementById('connection-status'),
    progressBar: document.getElementById('progress-bar'),
    progressText: document.getElementById('transfer-percentage'),
    speedText: document.getElementById('transfer-speed'),
    transferTitle: document.getElementById('transfer-title'),
    transferFilename: document.getElementById('transfer-filename'),
    btnFinish: document.getElementById('btn-finish'),
    btnCopy: document.getElementById('btn-copy'),
    btnSendMore: document.getElementById('btn-send-more'),
    chatDrawer: document.getElementById('chat-drawer'),
    chatToggle: document.getElementById('chat-toggle'),
    chatUnread: document.getElementById('chat-unread'),
    chatMessages: document.getElementById('chat-messages'),
    chatInput: document.getElementById('chat-input'),
    btnSendChat: document.getElementById('btn-send-chat'),
    btnPaste: document.getElementById('btn-paste'),
    receivedFilesContainer: document.getElementById('received-files-container'),
    notification: document.getElementById('notification'),
    codeBox: document.querySelector('.code-box'),
    qrCodeContainer: document.getElementById('qrcode-container'), // Restored
    qrcode: document.getElementById('qrcode'),
    infoToggle: document.getElementById('info-toggle'),
    infoOverlay: document.getElementById('info-overlay'),
    infoClose: document.getElementById('info-close'),
    soundToggle: document.getElementById('sound-toggle')
};


// Auto-Wakeup Server
(async function wakeUpServer() {
    ui.status.textContent = 'Connecting...';
    try {
        // Lightweight ping to wake up Supabase free tier
        // Using a non-existent ID just to trigger a network request is enough
        await supabase.from('sessions').select('id').limit(1).maybeSingle();
        ui.status.textContent = 'Ready';
        ui.status.style.opacity = '1';
    } catch (e) {
        console.warn('Wakeup failed', e); // Silent fail, might be offline
        ui.status.textContent = 'Ready'; // Fallback
    }
})();


// Init Audio
AudioEngine.init();
ui.soundToggle.textContent = AudioEngine.enabled ? '🔊' : '🔇';
undoMute = () => { ui.soundToggle.textContent = AudioEngine.enabled ? '🔊' : '🔇'; };

let receivedBlobUrls = []; // Track all URLs for cleanup

// --- Event Listeners ---

// Mode Selection
ui.btnSendMode.onclick = () => { AudioEngine.play('nav'); showView('sender'); };
ui.btnReceiveMode.onclick = () => { AudioEngine.play('nav'); showView('receiver'); };
ui.btnCancelSend.onclick = () => { AudioEngine.play('nav'); resetApp(); };
ui.btnCancelReceive.onclick = () => { AudioEngine.play('nav'); resetApp(); };
ui.btnFinish.onclick = () => { AudioEngine.play('nav'); resetApp(); };

// ui.btnDownloadReceived is removed in favor of multi-file list

ui.btnSendMore.onclick = () => {
    ui.fileInput.click();
};

// Chat Toggle
ui.chatToggle.onclick = () => {
    ui.chatDrawer.classList.toggle('open');
    if (ui.chatDrawer.classList.contains('open')) {
        ui.chatUnread.classList.add('hidden');
        ui.chatMessages.scrollTop = ui.chatMessages.scrollHeight;
    }
};

// Send Chat
ui.btnSendChat.onclick = sendChatMessage;
ui.chatInput.onkeydown = (e) => {
    if (e.key === 'Enter') sendChatMessage();
};

// Sound Toggle
ui.soundToggle.onclick = () => {
    const isOn = AudioEngine.toggle();
    ui.soundToggle.textContent = isOn ? '🔊' : '🔇';
    if (isOn) AudioEngine.play('nav');
};

// Paste Button
// Paste Button
ui.btnPaste.onclick = async () => {
    try {
        // Try direct read (works if permission is granted)
        let text = '';
        try {
            text = await navigator.clipboard.readText();
        } catch (permErr) {
            // Fallback: Prompt user (older browsers or strict permissions)
            console.warn('Clipboard read failed, trying legacy/prompt:', permErr);
            text = prompt("Paste text to share:");
        }

        if (!text) {
            if (text !== null) showNotification('Clipboard/Input is empty', 'info');
            return;
        }

        if (dataChannel && dataChannel.readyState === 'open') {
            dataChannel.send(JSON.stringify({ type: 'clipboard', text: text }));
            showNotification('Text sent!', 'success');
        } else {
            showNotification('Not connected yet', 'error');
        }
    } catch (err) {
        console.error('Paste Error:', err);
        showNotification('Clipboard access denied. Try Ctrl+V manual send.', 'error');
    }
};

// Info Overlay
ui.infoToggle.onclick = () => ui.infoOverlay.classList.remove('hidden');
ui.infoClose.onclick = () => ui.infoOverlay.classList.add('hidden');
ui.infoOverlay.onclick = (e) => {
    if (e.target === ui.infoOverlay) ui.infoOverlay.classList.add('hidden');
};

function sendChatMessage() {
    const text = ui.chatInput.value.trim();
    if (!text || !dataChannel || dataChannel.readyState !== 'open') return;

    const msg = { type: 'chat', text: text };
    dataChannel.send(JSON.stringify(msg));

    addChatMessage('sent', text);
    AudioEngine.play('message');
    ui.chatInput.value = '';
}

function addChatMessage(dir, text) {
    const div = document.createElement('div');
    div.className = `message ${dir}`;
    div.textContent = text;
    ui.chatMessages.appendChild(div);
    ui.chatMessages.scrollTop = ui.chatMessages.scrollHeight;

    if (dir === 'received') {
        AudioEngine.play('message');
        if (!ui.chatDrawer.classList.contains('open')) {
            ui.chatUnread.classList.remove('hidden');
        }
        // Always show toast for received messages to ensure user sees them
        showNotification(`💬 Message: ${text.substring(0, 40)}${text.length > 40 ? '...' : ''}`, 'info', 3000);
    }
}

function showNotification(text, type = 'info', duration = 3000) {
    if (type === 'error') AudioEngine.play('error');
    else if (type === 'success') { } // Handled elsewhere or could play notify
    else AudioEngine.play('notify');

    ui.notification.textContent = text;
    ui.notification.className = `notification ${type}`;
    ui.notification.classList.remove('hidden');
    setTimeout(() => {
        ui.notification.classList.add('hidden');
    }, duration);
}

// Copy Code
ui.btnCopy.onclick = () => {
    navigator.clipboard.writeText(sessionCode).then(() => {
        AudioEngine.play('copied');
        ui.btnCopy.classList.add('copied');
        showNotification('Code copied to clipboard!', 'info', 2000);
        setTimeout(() => {
            ui.btnCopy.classList.remove('copied');
        }, 2000);
    });
};

// Helper to switch views
function showView(viewName) {
    Object.values(views).forEach(el => {
        el.classList.remove('active');
        el.classList.add('hidden');
    });
    views[viewName].classList.remove('hidden');
    // Small delay to allow display:block to apply before opacity transition
    setTimeout(() => {
        views[viewName].classList.add('active');
    }, 10);

    if (viewName === 'sender') role = 'sender';
    if (viewName === 'receiver') {
        role = 'receiver';
        document.body.classList.add('compact-header');
    }
}

function resetApp() {
    // Close connections
    if (peerConnection) peerConnection.close();
    if (dataChannel) dataChannel.close();

    // Cleanup DB (best effort)
    if (sessionCode) {
        supabase.from('sessions').delete().eq('code', sessionCode)
            .then(({ error }) => { if (error) console.error('Cleanup Err:', error); })
            .catch(err => console.error('Cleanup Catch:', err));
    }

    if (receivedBlobUrls.length > 0) {
        receivedBlobUrls.forEach(url => URL.revokeObjectURL(url));
        receivedBlobUrls = [];
    }
    receivedBlobUrl = null;

    // Reset state
    peerConnection = null;
    dataChannel = null;
    sessionCode = null;
    currentFile = null;
    receivedChunks = [];
    receivedBytes = 0;
    fileSize = 0;
    role = '';
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }

    // Reset UI
    ui.codeInput.value = '';
    ui.fileName.textContent = 'Click to select a file';
    ui.codeDisplay.classList.add('hidden');
    ui.status.textContent = 'Disconnected';
    ui.status.className = 'status-badge disconnected';
    document.body.classList.remove('compact-header'); // Restore spacious header
    ui.dropArea.classList.remove('file-selected'); // Reset drop area layout
    ui.btnCopy.classList.add('hidden'); // Hide copy button on reset
    ui.qrCodeContainer.classList.add('hidden');
    ui.qrcode.innerHTML = '';
    ui.btnFinish.classList.add('hidden');
    ui.receivedFilesContainer.innerHTML = '';
    ui.fileInput.value = '';
    ui.chatMessages.innerHTML = '';
    ui.chatDrawer.classList.remove('open');
    ui.chatUnread.classList.add('hidden');
    showView('mode');
}

// --- Sender Logic ---

// File Handling
// ui.dropArea.onclick is not needed because the <label> automatically triggers the input
// ui.dropArea.onclick = () => ui.fileInput.click(); 

ui.fileInput.onchange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Add to queue
    filesQueue.push(...files);

    // Update UI
    updateTransferQueueUI();
    document.body.classList.add('compact-header');
    ui.dropArea.classList.add('file-selected');

    // Start if connected
    if (peerConnection && peerConnection.connectionState === 'connected') {
        processQueue(); // Start sending
    } else {
        await startSenderSession();
    }
};

function updateTransferQueueUI() {
    if (filesQueue.length === 0 && !currentFile) {
        ui.fileName.textContent = 'Click to select files';
        return;
    }
    const count = filesQueue.length + (currentFile ? 1 : 0);
    const firstName = currentFile ? currentFile.name : filesQueue[0].name;
    ui.fileName.textContent = count > 1 ? `${count} files selected` : `${firstName} (${formatSize((currentFile || filesQueue[0]).size)})`;
}

async function processQueue() {
    if (currentFile || filesQueue.length === 0) return; // Busy or Empty

    currentFile = filesQueue.shift();
    updateTransferQueueUI();
    await startFileTransfer();
}

async function startSenderSession() {
    // Close any existing connection properly before starting a new one
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    if (dataChannel) {
        dataChannel.close();
        dataChannel = null;
    }

    showView('sender');
    // Distributed Janitor: Delete any sessions older than 2 minutes to keep table clean for free tier
    const twoMinsAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    supabase.from('sessions').delete().lt('created_at', twoMinsAgo)
        .then(({ error }) => { if (error) console.error('Janitor Error:', error); });

    // Cleanup any existing active session for this specific client
    if (sessionCode) {
        supabase.from('sessions').delete().eq('code', sessionCode)
            .then(({ error }) => { if (error) console.error('Self Cleanup Error:', error); });
    }

    ui.status.textContent = 'Preparing...';
    ui.codeDisplay.classList.remove('hidden');
    ui.sessionCode.textContent = 'GENERATING';
    ui.sessionCode.classList.add('loading');
    ui.codeBox.classList.add('loading');
    ui.btnCopy.classList.add('hidden'); // Hide copy button while generating

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    sessionCode = code;

    // Create Peer Connection
    createPeerConnection();

    // Create Data Channel
    dataChannel = peerConnection.createDataChannel("fileTransfer");
    setupDataChannel(dataChannel);

    // Create Offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    const { error } = await supabase
        .from('sessions')
        .insert({
            code: code,
            offer: offer,
            sender_ice: []
        });

    if (error) {
        console.error('Error creating session:', error);
        showNotification('Failed to create session: ' + (error.message || 'Unknown error'), 'error');
        resetApp();
        return;
    }

    // Update UI
    ui.sessionCode.textContent = code;
    ui.sessionCode.classList.remove('loading');
    ui.codeBox.classList.remove('loading');
    ui.btnCopy.classList.remove('hidden'); // Show copy button once code is ready

    // Generate QR Code
    ui.qrCodeContainer.classList.remove('hidden');

    // Clear any existing QR code first to prevent stacking
    ui.qrcode.innerHTML = '';

    // For local testing, QR will just contain the 6-digit code.
    // Replace 'YOUR_HOSTED_URL' below with your real domain (e.g. quicksend.vercel.app)
    const host = 'quick-send-iota.vercel.app';
    const qrData = (host === 'YOUR_HOSTED_URL') ? code : `https://${host}/receive.html?code=${code}`;

    new QRCode(ui.qrcode, {
        text: qrData,
        width: 128,
        height: 128,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M,
        typeNumber: 0
    });

    ui.status.textContent = 'Waiting for Peer...';

    // Listen for Answer
    listenToSessionChanges(code);
}

function listenToSessionChanges(code) {
    supabase.channel(`session-${code}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `code=eq.${code}` }, async (payload) => {
            const data = payload.new;

            // Handle answer from receiver
            if (data.answer && peerConnection.signalingState !== 'stable') {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
                ui.status.textContent = 'Connected';
                showView('transfer');
                AudioEngine.play('connect');
            }

            // Handle receiver ICE candidates
            if (data.receiver_ice && data.receiver_ice.length > 0) {
                data.receiver_ice.forEach(candidate => {
                    peerConnection.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => { });
                });
            }
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'sessions', filter: `code=eq.${code}` }, () => {
            showNotification('Peer Disconnected', 'error');
            ui.status.textContent = 'Peer Disconnected';
            // Disable file selection
            if (ui.fileInput) ui.fileInput.disabled = true;
            if (ui.btnPaste) ui.btnPaste.classList.add('disabled');
        })
        .subscribe();
}

// --- Receiver Logic ---

ui.btnConnect.onclick = async () => {
    // Distributed Janitor: Help clean up the table
    const twoMinsAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    supabase.from('sessions').delete().lt('created_at', twoMinsAgo)
        .then(({ error }) => { if (error) console.error('Janitor (Receiver) Error:', error); });

    const code = ui.codeInput.value;
    if (code.length !== 6) {
        showNotification('Please enter a 6-digit code', 'info');
        return;
    }
    sessionCode = code;
    ui.status.textContent = 'Connecting...';

    await joinSession(code);
};

async function joinSession(code) {
    // Fetch session
    const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('code', code)
        .maybeSingle()


    if (error || !data) {
        showNotification('Session not found or expired.', 'error');
        ui.status.textContent = 'Disconnected';
        return;
    }

    createPeerConnection();

    // Receive Data Channel (via event)
    peerConnection.ondatachannel = (e) => {
        dataChannel = e.channel;
        setupDataChannel(dataChannel);
    };

    // Set Remote Description (Offer)
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));

    // Add Sender ICE candidates if any exist already
    if (data.sender_ice && data.sender_ice.length > 0) {
        data.sender_ice.forEach(candidate => {
            peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        });
    }

    // Create Answer
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    // Update Session with Answer
    await supabase
        .from('sessions')
        .update({
            answer: answer,
            receiver_ice: []
        })
        .eq('code', code);

    // Listen for changes (sender ICE candidates)
    listenToSessionChanges(code);
}

// --- WebRTC Core ---

function createPeerConnection() {
    peerConnection = new RTCPeerConnection(rtcConfig);

    // ICE Candidate Handling with Batching (reduces DB calls)
    peerConnection.onicecandidate = async (e) => {
        if (e.candidate && sessionCode) {
            // Add to queue
            iceCandidateQueue.push(e.candidate.toJSON());

            // Clear existing timer
            if (iceUpdateTimer) clearTimeout(iceUpdateTimer);

            // Batch send after 100ms or when we have 3+ candidates
            if (iceCandidateQueue.length >= 3) {
                flushIceCandidates();
            } else {
                iceUpdateTimer = setTimeout(flushIceCandidates, 100);
            }
        }
    };

    async function flushIceCandidates() {
        if (iceCandidateQueue.length === 0 || !sessionCode) return;

        const candidatesToSend = [...iceCandidateQueue];
        iceCandidateQueue = [];

        try {
            const iceField = role === 'sender' ? 'sender_ice' : 'receiver_ice';
            const { data } = await supabase.from('sessions').select('*').eq('code', sessionCode).maybeSingle();
            if (!data) return;

            const currentIce = data[iceField] || [];
            currentIce.push(...candidatesToSend);

            await supabase
                .from('sessions')
                .update({ [iceField]: currentIce })
                .eq('code', sessionCode);
        } catch (err) {
            console.warn('ICE batch update skipped:', err);
        }
    }

    peerConnection.onconnectionstatechange = () => {
        const state = peerConnection.connectionState;
        console.log('Connection State:', state);

        switch (state) {
            case 'connected':
                ui.status.textContent = 'Connected';
                ui.status.classList.remove('disconnected');
                ui.status.classList.add('connected');
                showNotification('Connection successful!', 'success');
                AudioEngine.play('connect');
                break;

            case 'disconnected':
            case 'failed':
            case 'closed':
                ui.status.textContent = 'Disconnected';
                ui.status.classList.remove('connected');
                ui.status.classList.add('disconnected');

                if (role === 'sender' && views.transfer.classList.contains('active')) {
                    showNotification('Connection lost.', 'error');
                } else if (role === 'receiver') {
                    showNotification('Connection lost.', 'error');
                }
                setTimeout(resetApp, 2000);
                break;
        }
    };
}

function setupDataChannel(channel) {
    channel.binaryType = 'arraybuffer';

    channel.onopen = () => {
        console.log('Data Channel Open');
        showView('transfer');
        ui.transferTitle.textContent = 'Connected';
        ui.transferFilename.textContent = 'Ready to transfer';
        ui.btnFinish.classList.remove('hidden');
        ui.btnSendMore.classList.remove('hidden');
        resetProgressUI();

        // Start heartbeat to detect silent drops
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        heartbeatInterval = setInterval(() => {
            if (channel.readyState === 'open') {
                try {
                    channel.send(JSON.stringify({ type: 'ping' }));
                } catch (e) {
                    clearInterval(heartbeatInterval);
                }
            } else {
                clearInterval(heartbeatInterval);
            }
        }, 2000);

        if (role === 'sender' && (currentFile || filesQueue.length > 0)) {
            processQueue();
        }
    };

    channel.onclose = () => {
        console.log('Data Channel Closed');
        ui.status.textContent = 'Disconnected';
        ui.status.classList.remove('connected');
        ui.status.classList.add('disconnected');
    };

    channel.onmessage = handleMessage;
}

// Faster Exit Signaling
window.addEventListener('beforeunload', () => {
    if (dataChannel) dataChannel.close();
    if (peerConnection) peerConnection.close();
    if (sessionCode) {
        // We use a beacon-like approach or a quick fetch if possible
        // but simple delete is okay as browsers often allow one last request
        supabase.from('sessions').delete().eq('code', sessionCode);
    }
});

// --- Signaling Listener (Realtime) ---

function listenToSessionChanges(code) {
    const channel = supabase
        .channel(`session-${code}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions', filter: `code=eq.${code}` },
            async (payload) => {
                if (payload.eventType === 'DELETE') {
                    // Session was deleted (likely by sender canceling)
                    showNotification('Session ended by peer.', 'info');
                    resetApp();
                    return;
                }

                const data = payload.new;
                if (!data) return; // For safety with other events

                if (role === 'sender') {
                    // Only apply answer if we don't have a remote description yet
                    if (data.answer && !peerConnection.remoteDescription && peerConnection.signalingState === 'have-local-offer') {
                        try {
                            // Immediately set a temporary flag or just check remoteDescription
                            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
                            console.log('Remote description (answer) set successfully');
                        } catch (err) {
                            if (peerConnection.signalingState !== 'stable') {
                                console.error('Failed to set remote description:', err);
                            }
                        }
                    }

                    // Check for new receiver ICE candidates
                    if (data.receiver_ice && peerConnection.remoteDescription) {
                        data.receiver_ice.forEach(c => {
                            peerConnection.addIceCandidate(new RTCIceCandidate(c)).catch(e => {
                                // Silent fail if candidate is repeated or connection closed
                            });
                        });
                    }

                } else {
                    // Receiver waits for Sender ICE
                    if (data.sender_ice && peerConnection.remoteDescription) {
                        data.sender_ice.forEach(c => {
                            peerConnection.addIceCandidate(new RTCIceCandidate(c)).catch(e => {
                                // Silent fail
                            });
                        });
                    }
                }
            })
        .subscribe();
}

// --- File Transfer Logic ---

const CHUNK_SIZE = 64 * 1024; // 64KB - Safer for mobile/TURN

async function startFileTransfer() {
    if (!currentFile || !dataChannel) return;

    ui.transferTitle.textContent = 'Sending...';
    ui.transferFilename.textContent = currentFile.name;
    ui.btnFinish.classList.add('hidden');
    ui.btnSendMore.classList.add('hidden');
    resetProgressUI();
    startTime = Date.now();
    AudioEngine.play('send');

    // 1. Send Meta Data
    const meta = {
        type: 'meta',
        name: currentFile.name,
        size: currentFile.size,
        mime: currentFile.type
    };
    console.log("Sending Meta:", meta);
    dataChannel.send(JSON.stringify(meta));

    // 2. Send Chunks
    const fileReader = new FileReader();
    let offset = 0;
    let lastUIUpdate = 0;

    // Set very low buffer threshold for event-based backpressure with large chunks
    dataChannel.bufferedAmountLowThreshold = 64 * 1024;

    function readSlice() {
        if (offset >= currentFile.size) return;
        const slice = currentFile.slice(offset, offset + CHUNK_SIZE);
        fileReader.readAsArrayBuffer(slice);
    }

    fileReader.onload = async (e) => {
        const buffer = e.target.result;
        if (!buffer) return;

        try {
            // Efficient Backpressure: Wait if buffer is full (MAX 8MB)
            if (dataChannel.bufferedAmount > 8 * 1024 * 1024) {
                await new Promise(resolve => {
                    dataChannel.onbufferedamountlow = () => {
                        dataChannel.onbufferedamountlow = null;
                        resolve();
                    };
                });
            }

            dataChannel.send(buffer);
            offset += buffer.byteLength;

            // Throttle UI updates to every 100ms
            const now = Date.now();
            if (now - lastUIUpdate > 100 || offset >= currentFile.size) {
                updateProgress(offset, currentFile.size);
                lastUIUpdate = now;
            }

            if (offset < currentFile.size) {
                readSlice();
            } else {
                console.log('Transfer Complete');
                updateProgress(currentFile.size, currentFile.size); // Ensure 100%

                // Done with this file
                currentFile = null;

                // Check Queue
                if (filesQueue.length > 0) {
                    ui.transferTitle.textContent = `Sending next (${filesQueue.length} left)...`;
                    setTimeout(processQueue, 500); // Small delay
                } else {
                    ui.transferTitle.textContent = 'All Files Sent!';
                    showNotification('Batch transfer complete!', 'success');
                    AudioEngine.play('success');
                    ui.btnFinish.classList.remove('hidden');
                    ui.btnSendMore.classList.remove('hidden');
                }
            }
        } catch (err) {
            console.error('Transfer Error:', err);
            showNotification('Transfer failed: ' + err.message, 'error');
            ui.btnFinish.classList.remove('hidden');
            ui.btnSendMore.classList.remove('hidden');
        }
    };

    fileReader.onerror = (err) => {
        console.error('FileReader Error:', err);
        showNotification('Failed to read file for transfer.', 'error');
    };

    console.log('Starting transfer of:', currentFile.name, 'Size:', currentFile.size);
    readSlice();
}

// Remove polled waitForBuffer - redundant with event listener
function waitForBuffer() {
    // Legacy placeholder - removed
}

// Receiver Handling
function handleMessage(event) {
    const data = event.data;

    if (typeof data === 'string') {
        // Meta Data or Chat
        const msg = JSON.parse(data);
        if (msg.type === 'ping') return;
        if (msg.type === 'meta') {
            fileName = msg.name;
            fileSize = msg.size;
            receivedBytes = 0;
            receivedChunks = [];
            ui.transferFilename.textContent = fileName;
            ui.transferTitle.textContent = 'Receiving...';
            ui.btnFinish.classList.add('hidden');
            ui.btnSendMore.classList.add('hidden');
            resetProgressUI();
            startTime = Date.now();
            AudioEngine.play('receive');
        } else if (msg.type === 'chat') {
            addChatMessage('received', msg.text);
        } else if (msg.type === 'clipboard') {
            navigator.clipboard.writeText(msg.text).then(() => {
                showNotification('📋 Text copied from peer!', 'success');
            });
        }
    } else {
        // Binary Data (Chunk)
        if (receivedBytes === 0) console.log('Started receiving binary data...');
        receivedChunks.push(data);
        receivedBytes += data.byteLength;
        // If meta was somehow missed, use current received size as total (not ideal but avoids 0/0)
        updateProgress(receivedBytes, fileSize || receivedBytes);

        if (receivedBytes >= fileSize) {
            const blob = new Blob(receivedChunks);
            const blobUrl = URL.createObjectURL(blob);
            receivedBlobUrls.push(blobUrl);

            // Create File Item UI
            const name = fileName; // Capture current name
            const size = formatSize(fileSize);

            // Media Preview
            let previewHtml = '';
            const mime = blob.type;
            if (mime.startsWith('image/')) {
                previewHtml = `<img src="${blobUrl}" style="width: 40px; height: 40px; border-radius: 8px; object-fit: cover; margin-right: 12px; border: 1px solid rgba(255,255,255,0.1);">`;
            } else if (mime.startsWith('video/')) {
                previewHtml = `<div style="width: 40px; height: 40px; background: rgba(0,0,0,0.3); border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 12px; border: 1px solid rgba(255,255,255,0.1);">▶️</div>`;
            } else {
                previewHtml = `<div style="width: 40px; height: 40px; background: rgba(255,255,255,0.05); border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 12px;">📄</div>`;
            }

            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <div style="display:flex; align-items:center; overflow:hidden; flex:1;">
                    ${previewHtml}
                    <div class="file-item-info" style="min-width:0;">
                        <div class="file-item-name" title="${name}">${name}</div>
                        <div class="file-item-size">${size}</div>
                    </div>
                </div>
                <button class="download-link-btn">Download</button>
            `;

            fileItem.querySelector('.download-link-btn').onclick = () => {
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = name;
                a.click();
            };

            ui.receivedFilesContainer.appendChild(fileItem);
            ui.receivedFilesContainer.scrollTop = ui.receivedFilesContainer.scrollHeight;

            ui.transferTitle.textContent = 'Transfer Complete!';
            AudioEngine.play('success');
            ui.btnFinish.classList.remove('hidden');
            ui.btnSendMore.classList.remove('hidden');
            showNotification(`Finished receiving ${name}`, 'success');
        }
    }
}

function updateProgress(current, total) {
    if (total === 0) return;
    const percent = Math.floor((current / total) * 100);
    ui.progressBar.style.width = `${percent}%`;
    ui.progressText.textContent = `${percent}%`;

    // Calculate speed
    const now = Date.now();
    const duration = (now - startTime) / 1000;
    if (duration > 0) {
        const speed = (current / 1024 / 1024) / duration;
        ui.speedText.textContent = `${speed.toFixed(2)} MB/s`;
    }
}

// Utility
function resetProgressUI() {
    ui.progressBar.style.width = '0%';
    ui.progressText.textContent = '0%';
    ui.speedText.textContent = '0 MB/s';
}

function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
}
// Cleanup on window close
window.addEventListener('beforeunload', () => {
    if (sessionCode) {
        // Best effort cleanup - note: fire-and-forget
        supabase.from('sessions').delete().eq('code', sessionCode).then(() => { });
    }
});
