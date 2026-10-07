/* A visual view of the existing radio. This module never starts or changes a stream. */
(function () {
    "use strict";

    const grainKey = "renner:film-grain";
    const defaultArt = "assets/backgrounds/images/midnight-studio.webp";
    const sourceIds = [
        "stationName", "freqValue", "stationMeta", "heroStatusPill", "barThumb",
        "firebaseStatus", "chatItems", "playlistItems", "chatModeHint", "playlistModeHint"
    ];
    let initialized = false;
    let scheduled = false;
    let station = null;
    let chatSignature = "";
    let queueSignature = "";
    let grainEnabled = true;
    let failedArtSource = "";

    const byId = id => document.getElementById(id);
    const textOf = element => element?.textContent?.trim() || "";
    const localized = text => window.RENNER_I18N?.t?.(text) || text;

    function writeText(id, value) {
        const element = byId(id);
        if (element && element.textContent !== value) element.textContent = value;
    }

    function readRadio(method) {
        try { return window.BODWOLF_RADIO?.[method]?.() || null; }
        catch (_) { return null; }
    }

    function pictureURL(value) {
        if (typeof value !== "string") return "";
        const url = value.trim();
        // Uploaded media and existing relative assets are pictures; active URL
        // schemes do not belong in an image mirror.
        return /^(?:https?:\/\/|(?:\.\.?\/|\/)?assets\/)/i.test(url) ? url : "";
    }

    function artworkForPlayback(playback, currentStation) {
        if (playback?.source === "playlist") {
            return /^[a-zA-Z0-9_-]{11}$/.test(playback.videoId || "")
                ? `https://i.ytimg.com/vi/${playback.videoId}/hqdefault.jpg`
                : defaultArt;
        }
        const custom = [currentStation?.thumbnail, currentStation?.image, currentStation?.fallbackImage]
            .map(pictureURL).find(Boolean);
        if (custom) return custom;
        const background = byId("barThumb")?.style?.backgroundImage || "";
        const match = background.match(/^url\(["']?(.*?)["']?\)$/);
        return pictureURL(match?.[1]) || defaultArt;
    }

    function create(tag, className, text) {
        const element = document.createElement(tag);
        element.className = className;
        if (text !== undefined) element.textContent = text;
        return element;
    }

    function emptyPreview(container, key) {
        const placeholder = create("li", "neon-preview-empty", localized(key));
        placeholder.setAttribute("data-i18n", key);
        container.replaceChildren(placeholder);
    }

    function synchronizeChat() {
        const preview = byId("neonChatPreview");
        if (!preview) return;
        const messages = Array.from(byId("chatItems")?.querySelectorAll(".chat-item") || [])
            .slice(-3).map(row => ({
                name: textOf(row.querySelector(".chat-item-identity strong")),
                color: row.querySelector(".chat-item-identity strong")?.style?.color || "",
                time: textOf(row.querySelector(".chat-item-header > span")),
                text: textOf(row.querySelector("p"))
            }));
        const signature = JSON.stringify(messages.length ? messages : [localized("Your next conversation starts here.")]);
        if (signature === chatSignature) return;
        chatSignature = signature;
        if (!messages.length) {
            emptyPreview(preview, "Your next conversation starts here.");
            return;
        }
        preview.replaceChildren(...messages.map(message => {
            const row = create("li", "neon-chat-item");
            const header = create("div", "neon-chat-header");
            const name = create("strong", "neon-chat-name", message.name);
            if (message.color) name.style.color = message.color;
            header.append(name, create("time", "neon-chat-time", message.time));
            row.append(header, create("p", "neon-chat-message", message.text));
            return row;
        }));
    }

    function queueTrackText(label) {
        if (!label) return "";
        const badge = label.querySelector(".track-availability");
        if (!badge) return textOf(label);
        // Availability is owned UI appended to the label. Read its sibling
        // text intact; a user's title may itself contain the word Unavailable.
        const title = Array.from(label.childNodes || []).filter(node => node !== badge)
            .map(node => node.textContent || "").join("").trim();
        return [title, badge.hidden ? "" : textOf(badge)].filter(Boolean).join(" · ");
    }

    function synchronizeQueue() {
        const preview = byId("neonQueuePreview");
        if (!preview) return;
        const channels = Array.from(byId("playlistItems")?.querySelectorAll(".playlist-item") || [])
            .slice(0, 3).map(row => ({
                name: textOf(row.querySelector(".playlist-item-meta > strong")),
                meta: [".playlist-item-id", ".playlist-item-owner", ".playlist-item-countdown"]
                    .map(selector => textOf(row.querySelector(selector))).filter(Boolean).join(" · "),
                track: queueTrackText(row.querySelector(".temporary-track-item > span"))
            }));
        const signature = JSON.stringify(channels.length ? channels : [localized("Build a channel with your favorite tracks.")]);
        if (signature === queueSignature) return;
        queueSignature = signature;
        if (!channels.length) {
            emptyPreview(preview, "Build a channel with your favorite tracks.");
            return;
        }
        preview.replaceChildren(...channels.map(channel => {
            const row = create("li", "neon-queue-item");
            row.append(create("strong", "neon-queue-name", channel.name), create("span", "neon-queue-meta", channel.meta));
            if (channel.track) row.append(create("span", "neon-queue-track", channel.track));
            return row;
        }));
    }

    function synchronize() {
        const currentStation = readRadio("getCurrentStation") || station;
        const playback = readRadio("getCurrentPlayback");
        const name = textOf(byId("stationName"));
        writeText("neonStationName", name);
        writeText("neonFrequency", textOf(byId("freqValue")));
        // The primary title wins for a queued track. A previous station's
        // description must never be attached to the queued track.
        const customDescription = typeof currentStation?.description === "string" ? currentStation.description.trim() : "";
        const category = String(currentStation?.category || "").toUpperCase();
        const seedDescription = category && customDescription.toUpperCase() === `${category} DEFAULT STATION`;
        const description = playback?.source === "playlist" ? textOf(byId("stationMeta"))
            : seedDescription ? localized(category) : customDescription || textOf(byId("stationMeta"));
        writeText("neonDescription", description);
        writeText("neonPlaybackStatus", textOf(byId("heroStatusPill")));
        writeText("neonConnectionStatus", textOf(byId("firebaseStatus")));
        writeText("neonChatStatus", textOf(byId("chatModeHint")));
        writeText("neonQueueStatus", textOf(byId("playlistModeHint")));
        const connection = byId("neonConnectionStatus");
        const originalConnection = byId("firebaseStatus");
        if (connection && originalConnection) {
            for (const className of ["is-ready", "is-error"]) {
                connection.classList.toggle(className, originalConnection.classList.contains(className));
            }
        }
        const artwork = byId("neonNowArt");
        if (artwork) {
            const candidate = artworkForPlayback(playback, currentStation);
            const source = candidate === failedArtSource ? defaultArt : candidate;
            if (artwork.getAttribute("src") !== source) artwork.setAttribute("src", source);
            if (artwork.getAttribute("alt") !== name) artwork.setAttribute("alt", name);
        }
        synchronizeChat();
        synchronizeQueue();
    }

    function schedule() {
        if (scheduled) return;
        scheduled = true;
        (window.requestAnimationFrame || (task => window.setTimeout(task, 0)))(() => {
            scheduled = false;
            synchronize();
        });
    }

    function applyGrain(persist = false) {
        document.body.classList.toggle("film-grain-on", grainEnabled);
        const button = byId("filmGrainBtn");
        if (button) {
            const label = localized(grainEnabled ? "Film grain on" : "Film grain off");
            button.setAttribute("aria-pressed", String(grainEnabled));
            if (button.getAttribute("aria-label") !== label) button.setAttribute("aria-label", label);
            if (button.title !== label) button.title = label;
        }
        if (persist) {
            try { window.localStorage.setItem(grainKey, grainEnabled ? "1" : "0"); }
            catch (_) { /* The appearance remains usable without saved preferences. */ }
        }
    }

    function initialize() {
        if (initialized) return;
        initialized = true;
        try { grainEnabled = window.localStorage.getItem(grainKey) !== "0"; }
        catch (_) { grainEnabled = true; }
        const button = byId("filmGrainBtn");
        button?.addEventListener("click", () => { grainEnabled = !grainEnabled; applyGrain(true); });
        byId("neonNowArt")?.addEventListener("error", event => {
            const source = event.currentTarget.getAttribute("src");
            if (source !== defaultArt) {
                failedArtSource = source;
                event.currentTarget.setAttribute("src", defaultArt);
            }
        });
        applyGrain();
        for (const eventName of ["renner:source-changed", "renner:playback-changed", "renner:catalog-changed", "renner:appearance-changed", "renner:availability-changed"]) window.addEventListener(eventName, schedule);
        window.addEventListener("renner:station-changed", event => { station = event.detail || null; schedule(); });
        window.addEventListener("renner:language-changed", () => { applyGrain(); schedule(); });
        window.addEventListener("storage", event => {
            if (event.key === grainKey) { grainEnabled = event.newValue !== "0"; applyGrain(); }
        });
        if (typeof window.MutationObserver === "function") {
            const observer = new window.MutationObserver(schedule);
            sourceIds.map(byId).filter(Boolean).forEach(element => observer.observe(element, {
                subtree: true, childList: true, characterData: true,
                attributes: true, attributeFilter: ["class", "style", "hidden"]
            }));
        }
        synchronize();
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
    else initialize();
})();
