/* Listening appearance is independent of the stream, scene and playback state. */
(function () {
    "use strict";

    const keys = {
        mode: "renner:listening-mode",
        color: "renner:display-color",
        immersive: "renner:immersive"
    };
    const modes = ["neon", "retro", "lofi"];
    const colors = ["mint", "ice", "amber", "violet", "rose"];
    let initialized = false;
    let lastImmersive = null;

    function localized(text) {
        return window.RENNER_I18N?.translateOwnedText?.(text) || text;
    }

    function read(key, allowed, fallback) {
        try {
            const value = window.localStorage.getItem(key);
            return allowed.includes(value) ? value : fallback;
        } catch (_) {
            return fallback;
        }
    }

    function save(key, value) {
        try { window.localStorage.setItem(key, value); }
        catch (_) { /* Appearance still works when browser storage is unavailable. */ }
    }

    function synchronizeButtons(selector, attribute, selected) {
        document.querySelectorAll(selector).forEach(button => {
            button.setAttribute("aria-pressed", String(button.getAttribute(attribute) === selected));
        });
    }

    function applyMode(value, persist = true) {
        if (!modes.includes(value)) return;
        const changed = document.body.dataset.listeningMode !== value;
        document.body.dataset.listeningMode = value;
        synchronizeButtons("button[data-listening-mode]", "data-listening-mode", value);
        if (persist) save(keys.mode, value);
        if (changed && typeof window.CustomEvent === "function") {
            window.dispatchEvent(new window.CustomEvent("renner:appearance-changed", { detail: { mode: value } }));
        }
    }

    function applyColor(value, persist = true) {
        if (!colors.includes(value)) return;
        document.body.dataset.displayColor = value;
        synchronizeButtons("button[data-display-color]", "data-display-color", value);
        if (persist) save(keys.color, value);
    }

    function synchronizeImmersive(persist = true) {
        const active = document.body.classList.contains("focus-mode");
        const mobileFocus = document.getElementById("mobileFocusModeBtn");
        if (mobileFocus) {
            const label = localized(active ? "Exit focus mode" : "Enter focus mode");
            mobileFocus.setAttribute("aria-label", label);
            mobileFocus.setAttribute("aria-pressed", String(active));
            const icon = mobileFocus.querySelector("i");
            if (icon) icon.className = active ? "fas fa-compress" : "fas fa-expand";
            for (const node of Array.from(mobileFocus.childNodes || [])) {
                if (node.nodeType === 3 && node.nodeValue.trim()) node.nodeValue = " " + label;
            }
        }
        const button = document.getElementById("headerFocusBtn");
        if (button) {
            const label = localized(active ? "Exit full screen" : "Enter full screen");
            button.setAttribute("aria-pressed", String(active));
            button.setAttribute("aria-label", label);
            button.title = label;
            const icon = button.querySelector("i");
            if (icon) icon.className = active ? "fas fa-compress" : "fas fa-expand";
            const text = button.querySelector("[data-focus-label]");
            if (text) text.textContent = localized(active ? "Exit full screen" : "Full screen");
        }
        if (persist && lastImmersive !== active) save(keys.immersive, active ? "1" : "0");
        lastImmersive = active;
    }

    function initialize() {
        if (initialized) return;
        initialized = true;
        const minimize = document.getElementById("minimizeBtn");
        const headerFocus = document.getElementById("headerFocusBtn");
        const browse = document.getElementById("browseChannelsBtn");
        const search = document.getElementById("stationSearch");

        applyMode(read(keys.mode, modes, "neon"), false);
        applyColor(read(keys.color, colors, "mint"), false);
        document.querySelectorAll("button[data-listening-mode]").forEach(button => {
            button.addEventListener("click", () => applyMode(button.dataset.listeningMode));
        });
        document.querySelectorAll("button[data-display-color]").forEach(button => {
            button.addEventListener("click", () => applyColor(button.dataset.displayColor));
        });

        // This listener follows the core radio's handler. All focus-mode controls
        // (including Escape and the search shortcut) use that existing action.
        minimize?.addEventListener("click", () => synchronizeImmersive());
        window.addEventListener?.("renner:language-changed", () => synchronizeImmersive(false));
        headerFocus?.addEventListener("click", () => {
            window.RENNER_UI?.closePanel();
            minimize?.click();
            synchronizeImmersive();
        });
        browse?.addEventListener("click", () => {
            window.RENNER_UI?.closePanel();
            window.RENNER_PANELS?.showChannels(false);
            // Each listening space can browse its frequency shelf in place.
            synchronizeImmersive();
            if (search) {
                const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
                search.focus({ preventScroll: true });
                search.scrollIntoView({ block: "center", behavior: reduced ? "instant" : "smooth" });
            }
        });

        // Full screen here fills the page. Native browser fullscreen requires a
        // user gesture and is deliberately not requested while loading the site.
        const immersive = read(keys.immersive, ["0", "1"], "1") === "1";
        if (minimize && document.body.classList.contains("focus-mode") !== immersive) minimize.click();
        synchronizeImmersive(false);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialize, { once: true });
    } else {
        initialize();
    }
})();
