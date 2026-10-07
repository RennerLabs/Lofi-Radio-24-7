/* Live counts use Firebase sessions, never a random or locally estimated audience. */
(function (global) {
    "use strict";
    const SESSION_TTL_MS = 90000;
    const HEARTBEAT_MS = 25000;
    const SESSION_KEY = "renner:listener-session";
    const keyPattern = /^(fallback:[A-Za-z0-9_-]{11}|(?:admin|community):[A-Za-z0-9_-]{1,120})$/;
    let mode = "connecting", tree = {}, isPlaying = false, pageActive = true;
    let session = null, desiredKey = "", joinVersion = 0, joining = false;
    let stopWatch = null, watchVersion = 0, retryTimer = null, retryDelay = 1000, renderQueued = false;
    const tabId = createTabId();

    function record(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
    function countListeners(snapshot, stationKey, now) {
        const owners = record(snapshot) ? snapshot[stationKey] : null;
        if (!record(owners) || !keyPattern.test(stationKey) || !Number.isFinite(now)) return 0;
        let count = 0;
        Object.entries(owners).forEach(([uid, sessions]) => {
            if (!uid || /[.#$\[\]/]/.test(uid) || !record(sessions)) return;
            const live = Object.entries(sessions).some(([id, row]) => /^[A-Za-z0-9_-]{8,80}$/.test(id) && record(row) &&
                row.uid === uid && row.stationKey === stationKey && Number.isFinite(row.updatedAt) && Number.isFinite(row.expiresAt) &&
                row.updatedAt <= now + 15000 && row.expiresAt === row.updatedAt + SESSION_TTL_MS && row.expiresAt > now);
            if (live) count += 1;
        });
        return count;
    }
    function now() { return global.BODWOLF_FIREBASE?.getEstimatedServerTime?.() ?? Date.now(); }
    function translate(key, params) { return global.RENNER_I18N?.t?.(key, params) || key.replace(/\{(\w+)\}/g, (_, name) => String(params?.[name] ?? "")); }
    function countFor(key) { return mode === "ready" ? countListeners(tree, key, now()) : null; }
    function setAttribute(node, key, value) { if (node.getAttribute(key) !== value) node.setAttribute(key, value); }
    function queueRender() {
        if (renderQueued) return;
        renderQueued = true;
        global.requestAnimationFrame(() => { renderQueued = false; render(); });
    }
    function render() {
        global.document.querySelectorAll(".station-card").forEach(card => {
            const key = card.dataset.stationKey || card.querySelector(".channel-item")?.dataset.stationKey || "";
            let badge = card.querySelector(".station-listeners");
            if (!badge) {
                badge = global.document.createElement("span");
                badge.className = "station-listeners";
                const icon = global.document.createElement("i");
                icon.className = "fas fa-headphones";
                icon.setAttribute("aria-hidden", "true");
                const value = global.document.createElement("span");
                value.className = "station-listeners-value";
                badge.append(icon, value);
                (card.querySelector(".ch-meta") || card).appendChild(badge);
            }
            const count = countFor(key), text = count === null ? "—" : String(count);
            const label = count === null ? translate("Live listener counts are unavailable. They need a connection and the updated database rules.") : translate("{count} listeners on this channel", {count});
            const value = badge.querySelector(".station-listeners-value");
            if (value.textContent !== text) value.textContent = text;
            badge.classList.toggle("listeners-unavailable", count === null);
            setAttribute(badge, "title", label);
            setAttribute(badge, "aria-label", label);
        });
        global.dispatchEvent(new CustomEvent("renner:listeners-changed", {detail: {available: mode === "ready"}}));
    }
    function retireSession() {
        joinVersion += 1;
        joining = false;
        const previous = session;
        session = null;
        if (previous) previous.stop().catch(() => {}); // onDisconnect and the 90s expiry remain the fallback.
    }
    function sourceKey() {
        const radio = global.BODWOLF_RADIO;
        if (!isPlaying || !pageActive || radio?.getCurrentPlayback?.().source !== "station") return "";
        const key = radio.getStationKey?.(radio.getCurrentStation?.()) || "";
        return keyPattern.test(key) ? key : "";
    }
    function reconcile() {
        const nextKey = sourceKey();
        if (nextKey !== desiredKey) { desiredKey = nextKey; retireSession(); }
        if (!desiredKey || session || joining || mode !== "ready") return;
        const bridge = global.BODWOLF_FIREBASE;
        if (!bridge?.trackCurrentListenerSession) return unavailable();
        const version = ++joinVersion, key = desiredKey;
        joining = true;
        bridge.trackCurrentListenerSession({stationKey: key, sessionId: `${tabId}-${version}`}).then(controller => {
            if (version !== joinVersion || key !== sourceKey() || mode !== "ready") { controller.stop().catch(() => {}); return; }
            joining = false;
            session = controller;
        }).catch(() => { if (version === joinVersion) { joining = false; unavailable(); } });
    }
    function unavailable() {
        mode = "unavailable";
        retireSession();
        watchVersion += 1;
        stopWatch?.();
        stopWatch = null;
        queueRender();
        scheduleRetry();
    }
    function scheduleRetry() {
        if (!pageActive || retryTimer !== null) return;
        retryTimer = global.setTimeout(() => { retryTimer = null; startWatch(); }, retryDelay);
        retryDelay = Math.min(retryDelay * 2, 60000);
    }
    function startWatch() {
        if (!pageActive || stopWatch) return;
        const bridge = global.BODWOLF_FIREBASE;
        if (!bridge?.getState?.().ready || !bridge.watchListenerPresence) return unavailable();
        mode = "connecting";
        queueRender();
        const version = ++watchVersion;
        // The SDK may deliver an immediate cached callback before this assignment.
        const unsubscribe = bridge.watchListenerPresence(snapshot => {
            if (version !== watchVersion || !pageActive) return;
            tree = record(snapshot) ? snapshot : {};
            mode = "ready";
            retryDelay = 1000;
            if (retryTimer !== null) {global.clearTimeout(retryTimer); retryTimer = null;}
            queueRender();
            reconcile();
        }, () => { if (version === watchVersion) unavailable(); });
        if (version !== watchVersion) unsubscribe?.();
        else if (typeof unsubscribe === "function") stopWatch = unsubscribe;
        else unavailable();
    }
    function createTabId() {
        // A fresh session per document avoids duplicated sessionStorage in a cloned tab.
        const bytes = new Uint8Array(16);
        global.crypto.getRandomValues(bytes);
        const value = "tab-" + Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
        try {global.sessionStorage.setItem(SESSION_KEY, value);} catch (_) {}
        return value;
    }
    function init() {
        const container = global.document.getElementById("channelsListContainer");
        if (container) new MutationObserver(queueRender).observe(container, {childList: true, subtree: true});
        queueRender();
        const bridge = global.BODWOLF_FIREBASE;
        if (bridge?.ready) Promise.resolve(bridge.ready).then(startWatch, unavailable);
        else unavailable();
    }
    global.addEventListener("renner:playback-changed", event => {isPlaying = event.detail?.isPlaying === true; reconcile();});
    ["renner:station-changed", "renner:source-changed", "renner:catalog-changed"].forEach(name => global.addEventListener(name, () => {reconcile(); queueRender();}));
    global.addEventListener("renner:language-changed", queueRender);
    global.addEventListener("bodwolf:firebase-ready", startWatch);
    global.addEventListener("bodwolf:firebase-unavailable", unavailable);
    global.addEventListener("renner:presence-error", unavailable);
    global.addEventListener("online", () => {retryDelay = 1000; if (retryTimer !== null) {global.clearTimeout(retryTimer); retryTimer = null;} startWatch();});
    global.addEventListener("offline", unavailable);
    global.addEventListener("pagehide", () => {pageActive = false; retireSession(); watchVersion += 1; stopWatch?.(); stopWatch = null; if (retryTimer !== null) {global.clearTimeout(retryTimer); retryTimer = null;}});
    global.addEventListener("pageshow", event => {if (event.persisted) {pageActive = true; startWatch();}});
    global.setInterval(() => {
        if (!pageActive || !session) return;
        const current = session;
        current.heartbeat().then(connected => {if (!connected && current === session) unavailable();}).catch(() => {if (current === session) unavailable();});
    }, HEARTBEAT_MS);
    global.setInterval(() => {if (pageActive && mode === "ready") queueRender();}, 5000);
    global.RENNER_LISTENERS = Object.freeze({getCount: countFor, getStatus: () => mode, countListeners});
    if (global.document.readyState === "loading") global.document.addEventListener("DOMContentLoaded", init, {once: true});
    else init();
})(window);
