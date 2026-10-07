(function () {
    "use strict";
    const PROFILE_KEYS = { name: "bodwolf:chatName", color: "bodwolf:chatColor", createdAt: "bodwolf:chatCreatedAt", updatedAt: "bodwolf:chatUpdatedAt" };
    const COLORS = ["#7dd3fc", "#a78bfa", "#fb7185", "#fbbf24", "#34d399", "#f472b6"];
    const MAX_MESSAGE_LENGTH = 160, MAX_VISIBLE_MESSAGES = 50, RATE_LIMIT_MS = 2000, CHAT_EXPIRY_MS = 86400000;
    const DISPLAY_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9]{3,15}$/;
    const state = {
        mode: "local", loading: true, sending: false, savingName: false, editingName: false,
        messages: [], unsubscribe: null, userId: null, firebaseBridge: null, lastSentAt: 0,
        userColor: loadSavedColor(), profile: loadStoredProfile(), initialized: false,
        expiryTimer: null, cooldownTimer: null, connectionTimer: null, connectionGeneration: 0,
        connectionError: false, unreadCount: 0, renderedOnce: false, lastStatus: null
    };
    const form = document.getElementById("chatForm"), input = document.getElementById("chatInput"), sendButton = document.getElementById("chatSendBtn");
    const messageEl = document.getElementById("chatMessage"), loadingEl = document.getElementById("chatLoading"), emptyEl = document.getElementById("chatEmpty"), itemsEl = document.getElementById("chatItems");
    const modeHintEl = document.getElementById("chatModeHint"), profileNameEl = document.getElementById("chatProfileName"), colorSwatchEl = document.getElementById("chatColorSwatch");
    const nameSetupEl = document.getElementById("chatNameSetup"), nameForm = document.getElementById("chatNameForm"), nameInput = document.getElementById("chatNameInput");
    const nameSaveButton = document.getElementById("chatNameSaveBtn"), nameEditButton = document.getElementById("chatNameEditBtn");
    const countEl = document.getElementById("chatCharacterCount"), latestButton = document.getElementById("chatJumpToLatest"), retryButton = document.getElementById("chatRetryBtn"), expiryHint = document.getElementById("chatExpiryHint");
    window.BODWOLF_CHAT = {
        getProfile: () => state.profile ? { ...state.profile } : null,
        getMessages: () => state.messages.filter(isRenderableMessage).map((message) => ({ ...message })),
        getRetentionMs: () => CHAT_EXPIRY_MS
    };
    document.addEventListener("DOMContentLoaded", initChat);
    window.addEventListener("beforeunload", teardownChat);
    window.addEventListener("renner:language-changed", refreshLanguage);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) pruneExpiredMessages(); });
    function t(key, params = {}) {
        if (window.RENNER_I18N?.t) return window.RENNER_I18N.t(key, params);
        return key.replace(/\{([\w]+)\}/g, (token, name) => Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : token);
    }
    function setText(element, key, params = {}) { if (element) element.textContent = t(key, params); }
    function initChat() {
        if (state.initialized || !form || !input || !sendButton || !itemsEl) return;
        state.initialized = true;
        input.maxLength = MAX_MESSAGE_LENGTH;
        input.setAttribute("aria-describedby", "chatCharacterCount chatExpiryHint");
        itemsEl.setAttribute("role", "log"); itemsEl.setAttribute("aria-live", "polite");
        itemsEl.setAttribute("aria-relevant", "additions text"); itemsEl.setAttribute("tabindex", "0");
        form.addEventListener("submit", handleSubmit); input.addEventListener("keydown", handleInputKeydown);
        input.addEventListener("input", updateComposer); itemsEl.addEventListener("scroll", handleMessageScroll, { passive: true });
        nameForm?.addEventListener("submit", handleNameSubmit); nameEditButton?.addEventListener("click", startEditingName);
        latestButton?.addEventListener("click", jumpToLatest); retryButton?.addEventListener("click", connectChatDataSource);
        state.expiryTimer = window.setInterval(pruneExpiredMessages, 60000);
        updateProfileUi(); refreshLanguage(); connectChatDataSource();
    }
    function connectChatDataSource() {
        const generation = ++state.connectionGeneration;
        cleanupChatListener(); state.connectionError = false;
        if (retryButton) retryButton.hidden = true;
        setLoading(true); setModeHint();
        const bridge = window.BODWOLF_FIREBASE;
        if (bridge?.ready) {
            Promise.resolve(bridge.ready).then((status) => setupFirebaseChat(bridge, status, generation)).catch((error) => {
                if (generation !== state.connectionGeneration) return;
                console.warn("Renner Radio: chat connection unavailable.", error); setupLocalChat();
            });
            return;
        }
        window.addEventListener("bodwolf:firebase-ready", (event) => {
            if (generation === state.connectionGeneration) setupFirebaseChat(window.BODWOLF_FIREBASE, event.detail, generation);
        }, { once: true });
        window.addEventListener("bodwolf:firebase-unavailable", () => {
            if (generation === state.connectionGeneration) setupLocalChat();
        }, { once: true });
        state.connectionTimer = window.setTimeout(() => {
            if (generation === state.connectionGeneration && state.loading) setupLocalChat();
        }, 2800);
    }
    async function setupFirebaseChat(bridge, status, generation = state.connectionGeneration) {
        if (generation !== state.connectionGeneration) return;
        if (!bridge || !status?.ready) { setupLocalChat(); return; }
        try {
            const user = await bridge.signInAnonymousUser();
            if (generation !== state.connectionGeneration) return;
            if (!user?.uid) { setupLocalChat(); return; }
            cleanupChatListener(); state.mode = "firebase"; state.firebaseBridge = bridge; state.userId = user.uid;
            const unsubscribe = bridge.listenToChatMessages((messages) => {
                if (generation === state.connectionGeneration) handleFirebaseMessages(messages);
            }, (error) => {
                if (generation !== state.connectionGeneration) return;
                state.connectionError = true; setLoading(false); setModeHint();
                showMessage("Chat disconnected. Your draft is safe. Reconnect to continue.", "error");
                if (retryButton) retryButton.hidden = false;
                console.warn("Renner Radio: chat listener disconnected.", error);
            });
            if (!unsubscribe) { setupLocalChat(); return; }
            state.unsubscribe = unsubscribe;
            if (hasValidProfile()) persistProfileToFirebase().catch((error) => console.warn("Renner Radio: chat profile remains saved locally.", error));
            updateProfileUi();
        } catch (error) {
            if (generation !== state.connectionGeneration) return;
            console.warn("Renner Radio: chat connection unavailable.", error); setupLocalChat();
        }
    }
    function setupLocalChat() {
        cleanupChatListener(); state.mode = "local"; state.firebaseBridge = null; state.userId = null;
        state.connectionError = false; state.loading = false; renderChat(); updateProfileUi();
    }
    function handleFirebaseMessages(messagesById) {
        state.messages = Object.entries(messagesById || {}).map(([id, message]) => ({ ...message, id }))
            .filter(isRenderableMessage).sort((a, b) => Number(a.createdAt) - Number(b.createdAt)).slice(-MAX_VISIBLE_MESSAGES);
        state.connectionError = false; if (retryButton) retryButton.hidden = true;
        state.loading = false; renderChat(); setModeHint();
    }
    function handleInputKeydown(event) {
        if (event.key !== "Enter" || event.shiftKey || event.isComposing || event.keyCode === 229) return;
        event.preventDefault();
        if (state.loading || state.sending || state.connectionError) return;
        if (typeof form.requestSubmit === "function") form.requestSubmit(sendButton);
        else form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    }
    async function handleNameSubmit(event) {
        event.preventDefault(); if (state.savingName) return; clearMessage();
        const validation = validateDisplayName(nameInput?.value || "");
        if (!validation.ok) { showMessage(validation.message, "error"); nameInput?.focus(); return; }
        const now = Date.now();
        state.profile = { displayName: validation.displayName, userColor: state.userColor, createdAt: state.profile?.createdAt || now, updatedAt: now };
        state.editingName = false; saveProfile(state.profile); state.savingName = true; updateProfileUi();
        try {
            await persistProfileToFirebase(); showMessage("Chat name saved. Your community name stays separate.", "success"); input?.focus();
        } catch (error) {
            console.warn("Renner Radio: chat name saved locally.", error);
            showMessage("Name saved locally. Firebase profile update failed.", "error");
        } finally { state.savingName = false; updateComposer(); }
    }
    async function handleSubmit(event) {
        event.preventDefault(); if (state.loading || state.sending || state.connectionError) return; clearMessage();
        if (!hasValidProfile()) {
            state.editingName = true; updateProfileUi(); showMessage("Choose a name before chatting.", "error"); nameInput?.focus(); return;
        }
        const draft = input.value, validation = validateMessage(draft);
        if (!validation.ok) { showMessage(validation.message, "error"); return; }
        const now = Date.now();
        if (now - state.lastSentAt < RATE_LIMIT_MS) { showMessage("Slow down a little before sending again.", "error"); return; }
        const message = { text: validation.text, displayName: state.profile.displayName, userColor: state.profile.userColor,
            uid: state.userId || "local-preview", createdAt: now, expiresAt: now + CHAT_EXPIRY_MS };
        state.sending = true; updateComposer();
        try {
            if (state.mode === "firebase" && state.firebaseBridge) {
                await state.firebaseBridge.sendChatMessage(message); showMessage("Sent.", "success");
            } else {
                state.messages = [...state.messages.filter(isRenderableMessage), { ...message, id: `local-${now}` }].slice(-MAX_VISIBLE_MESSAGES);
                renderChat(true); showMessage("Sent locally for this session.", "success");
            }
            state.lastSentAt = Date.now();
            if (input.value === draft) input.value = "";
            jumpToLatest();
            if (state.cooldownTimer) window.clearTimeout(state.cooldownTimer);
            state.cooldownTimer = window.setTimeout(() => { state.cooldownTimer = null; updateComposer(); }, RATE_LIMIT_MS);
        } catch (error) {
            console.warn("Renner Radio: chat send failed.", error);
            showMessage("Message not sent. Your draft is saved here; try again.", "error");
        } finally { state.sending = false; updateComposer(); }
    }
    function validateMessage(rawText) {
        const text = typeof rawText === "string" ? rawText.trim() : "";
        if (!text) return { ok: false, message: "Message is empty." };
        if (text.length > MAX_MESSAGE_LENGTH) return { ok: false, message: "Message must be 160 characters or fewer." };
        if (["spamword", "fake-giveaway", "crypto-scam"].some((word) => text.toLowerCase().includes(word))) return { ok: false, message: "This message is blocked by the local filter." };
        return { ok: true, text };
    }
    function validateDisplayName(rawName) {
        const displayName = typeof rawName === "string" ? rawName.trim() : "";
        if (!displayName) return { ok: false, message: "Choose a name before chatting." };
        if (displayName.length < 4) return { ok: false, message: "Name must be at least 4 characters." };
        if (displayName.length > 16) return { ok: false, message: "Name must be 16 characters or fewer." };
        if (!DISPLAY_NAME_PATTERN.test(displayName)) return { ok: false, message: "Use English letters and optional numbers only. No spaces or symbols." };
        return { ok: true, displayName };
    }
    function effectiveExpiry(message) {
        const maximumExpiry = Number(message.createdAt) + CHAT_EXPIRY_MS;
        if (message.expiresAt === undefined) return maximumExpiry;
        const suppliedExpiry = Number(message.expiresAt);
        return Number.isFinite(suppliedExpiry) ? Math.min(suppliedExpiry, maximumExpiry) : 0;
    }
    function isRenderableMessage(message) {
        const estimated = state.firebaseBridge?.getEstimatedServerTime?.();
        const now = Number.isFinite(estimated) ? estimated : Date.now();
        return Boolean(message && typeof message.text === "string" && message.text.trim().length > 0 && message.text.length <= MAX_MESSAGE_LENGTH &&
            isValidDisplayName(message.displayName) && isValidColor(message.userColor) && Number.isFinite(Number(message.createdAt)) &&
            Number(message.createdAt) > 0 && Number(message.createdAt) <= now + 300000 && effectiveExpiry(message) > now);
    }
    function pruneExpiredMessages() {
        const live = state.messages.filter(isRenderableMessage);
        if (live.length !== state.messages.length) { state.messages = live; renderChat(); }
    }
    function isNearLatest() { return itemsEl.scrollHeight - itemsEl.clientHeight - itemsEl.scrollTop <= 64; }
    function messageSignature(message) {
        return JSON.stringify([message.text, message.displayName, message.userColor, message.uid, message.createdAt]);
    }
    function renderChat(forceFollow = false) {
        if (!itemsEl) return;
        setLoading(state.loading);
        const follow = forceFollow || !state.renderedOnce || isNearLatest(), previousTop = itemsEl.scrollTop;
        const currentRows = new Map(Array.from(itemsEl.children || []).map((row) => [row.dataset.messageId, row]));
        const ids = new Set(state.messages.map((message) => message.id));
        let removedHeight = 0, added = 0;
        for (const [id, row] of currentRows) if (!ids.has(id)) {
            if (row.offsetTop < previousTop) removedHeight += row.offsetHeight;
            row.remove();
        }
        state.messages.forEach((message, index) => {
            let row = currentRows.get(message.id);
            const signature = messageSignature(message);
            if (!row) { row = createChatMessageElement(message); added += 1; }
            else if (row.dataset.signature !== signature) {
                const replacement = createChatMessageElement(message); row.replaceWith(replacement); row = replacement;
            }
            if (itemsEl.children[index] !== row) itemsEl.insertBefore(row, itemsEl.children[index] || null);
        });
        emptyEl?.classList.toggle("hidden", state.loading || state.messages.length > 0);
        state.renderedOnce = true;
        if (follow) { state.unreadCount = 0; window.requestAnimationFrame(() => { itemsEl.scrollTop = itemsEl.scrollHeight; }); }
        else { itemsEl.scrollTop = Math.max(0, previousTop - removedHeight); state.unreadCount += added; }
        updateLatestButton();
    }
    function createChatMessageElement(message) {
        const row = document.createElement("li"); row.className = "chat-item"; row.dataset.messageId = message.id;
        row.dataset.signature = messageSignature(message);
        row.classList.toggle("is-own-message", message.uid === state.userId || message.uid === "local-preview");
        const header = document.createElement("div"); header.className = "chat-item-header";
        const identity = document.createElement("div"); identity.className = "chat-item-identity";
        const dot = document.createElement("span"); dot.className = "chat-item-color"; dot.style.backgroundColor = message.userColor; dot.setAttribute("aria-hidden", "true");
        const name = document.createElement("strong"); name.textContent = message.displayName; name.style.color = message.userColor; name.setAttribute("dir", "ltr");
        const time = document.createElement("time"); time.dateTime = new Date(Number(message.createdAt)).toISOString(); time.textContent = formatTime(message.createdAt);
        const text = document.createElement("p"); text.className = "chat-message-text"; text.textContent = message.text; text.setAttribute("dir", "auto");
        identity.append(dot, name); header.append(identity, time); row.append(header, text); return row;
    }
    function handleMessageScroll() { if (isNearLatest()) { state.unreadCount = 0; updateLatestButton(); } }
    function jumpToLatest() { if (itemsEl) itemsEl.scrollTop = itemsEl.scrollHeight; state.unreadCount = 0; updateLatestButton(); }
    function updateLatestButton() {
        if (!latestButton) return; latestButton.hidden = !state.unreadCount;
        setText(latestButton, "{count} new messages · Jump to latest", { count: state.unreadCount });
    }
    function updateComposer() {
        if (!sendButton || !input) return;
        const length = input.value.length;
        if (countEl) {
            countEl.textContent = `${length} / ${MAX_MESSAGE_LENGTH}`;
            countEl.classList.toggle("is-near-limit", length >= MAX_MESSAGE_LENGTH - 20); countEl.classList.toggle("is-over-limit", length > MAX_MESSAGE_LENGTH);
        }
        sendButton.disabled = state.loading || state.sending || state.savingName || state.connectionError ||
            !input.value.trim() || length > MAX_MESSAGE_LENGTH || Date.now() - state.lastSentAt < RATE_LIMIT_MS;
        setText(sendButton, state.sending ? "Sending..." : "Send");
        if (nameSaveButton) { nameSaveButton.disabled = state.savingName; setText(nameSaveButton, state.savingName ? "Saving..." : "Save"); }
        input.setAttribute("aria-invalid", length > MAX_MESSAGE_LENGTH ? "true" : "false");
    }
    function updateProfileUi() {
        const hasProfile = hasValidProfile(), showSetup = !hasProfile || state.editingName;
        nameSetupEl?.classList.toggle("hidden", !showSetup);
        if (nameInput && showSetup && !state.editingName) nameInput.value = hasProfile ? state.profile.displayName : "";
        if (profileNameEl) {
            if (hasProfile) { profileNameEl.removeAttribute("data-i18n"); profileNameEl.textContent = state.profile.displayName; }
            else { profileNameEl.setAttribute("data-i18n", "Choose a name"); setText(profileNameEl, "Choose a name"); }
        }
        if (colorSwatchEl) colorSwatchEl.style.backgroundColor = hasProfile ? state.profile.userColor : state.userColor;
        nameEditButton?.classList.toggle("hidden", !hasProfile || state.editingName); setModeHint(); updateComposer();
    }
    function startEditingName() {
        state.editingName = true; clearMessage(); if (nameInput) nameInput.value = state.profile?.displayName || "";
        updateProfileUi(); nameInput?.focus(); nameInput?.select();
    }
    function setLoading(value) {
        state.loading = value; loadingEl?.classList.toggle("hidden", !value); itemsEl?.setAttribute("aria-busy", value ? "true" : "false"); updateComposer();
    }
    function setModeHint() {
        if (!modeHintEl) return;
        if (state.connectionError) setText(modeHintEl, "Chat connection interrupted.");
        else if (state.loading) setText(modeHintEl, "Connecting chat...");
        else if (state.mode === "firebase") setText(modeHintEl, hasValidProfile() ? "Live chat · You are {name}." : "Live chat · Choose a name to join.", { name: state.profile?.displayName || "" });
        else setText(modeHintEl, "Local preview · Messages stay in this browser session.");
        modeHintEl.classList.toggle("is-ready", state.mode === "firebase" && !state.loading && !state.connectionError);
    }
    function showMessage(key, type) {
        state.lastStatus = { key, type }; setText(messageEl, key);
        messageEl?.classList.toggle("is-error", type === "error"); messageEl?.classList.toggle("is-success", type === "success");
    }
    function clearMessage() {
        state.lastStatus = null; if (messageEl) { messageEl.textContent = ""; messageEl.classList.remove("is-error", "is-success"); }
    }
    function refreshLanguage() {
        setModeHint(); updateComposer(); updateLatestButton(); setText(expiryHint, "Messages disappear after 24 hours.");
        if (!hasValidProfile()) setText(profileNameEl, "Choose a name");
        if (state.lastStatus) showMessage(state.lastStatus.key, state.lastStatus.type);
        for (const row of Array.from(itemsEl?.children || [])) {
            const message = state.messages.find((item) => item.id === row.dataset.messageId), time = row.querySelector("time");
            if (message && time) time.textContent = formatTime(message.createdAt);
        }
    }
    function loadStoredProfile() {
        const name = getStoredValue(PROFILE_KEYS.name), color = getStoredValue(PROFILE_KEYS.color), createdAt = Number(getStoredValue(PROFILE_KEYS.createdAt)), updatedAt = Number(getStoredValue(PROFILE_KEYS.updatedAt));
        return isValidDisplayName(name) && isValidColor(color) && Number.isFinite(createdAt) && createdAt > 0 ? { displayName: name.trim(), userColor: color, createdAt, updatedAt: Number.isFinite(updatedAt) ? updatedAt : createdAt } : null;
    }
    function loadSavedColor() { const saved = getStoredValue(PROFILE_KEYS.color); return isValidColor(saved) ? saved : COLORS[Math.floor(Math.random() * COLORS.length)]; }
    function saveProfile(profile) { for (const [field, key] of Object.entries(PROFILE_KEYS)) setStoredValue(key, field === "name" ? profile.displayName : field === "color" ? profile.userColor : profile[field]); }
    async function persistProfileToFirebase() {
        if (!hasValidProfile() || state.mode !== "firebase" || !state.firebaseBridge) return null;
        return state.firebaseBridge.createOrUpdateUserProfile(state.profile);
    }
    function hasValidProfile() { return Boolean(state.profile && isValidDisplayName(state.profile.displayName) && isValidColor(state.profile.userColor) && Number.isFinite(Number(state.profile.createdAt))); }
    function isValidDisplayName(name) { return typeof name === "string" && DISPLAY_NAME_PATTERN.test(name.trim()); }
    function isValidColor(color) { return typeof color === "string" && /^#[0-9A-Fa-f]{6}$/.test(color); }
    function formatTime(timestamp) { return new Date(Number(timestamp)).toLocaleTimeString(window.RENNER_I18N?.getLanguage?.() === "ar" ? "ar-SA" : "en-US", { hour12: false, hour: "2-digit", minute: "2-digit" }); }
    function getStoredValue(key) { try { return window.localStorage?.getItem(key) || null; } catch (_) { return null; } }
    function setStoredValue(key, value) { try { window.localStorage?.setItem(key, String(value)); } catch (_) { /* Identity remains usable for this session. */ } }
    function cleanupChatListener() {
        if (state.unsubscribe) { state.unsubscribe(); state.unsubscribe = null; }
        if (state.connectionTimer) { window.clearTimeout(state.connectionTimer); state.connectionTimer = null; }
    }
    function teardownChat() {
        ++state.connectionGeneration; cleanupChatListener();
        if (state.expiryTimer) { window.clearInterval(state.expiryTimer); state.expiryTimer = null; }
        if (state.cooldownTimer) { window.clearTimeout(state.cooldownTimer); state.cooldownTimer = null; }
    }
})();
