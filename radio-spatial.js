/* Physical listening layout: one persistent dial and two independent shelves. */
(function () {
    "use strict";
    const STORAGE_KEY = "renner:panel-side";
    let initialized = false, side = "left", choices = [], header, main, player, playerHome, playerBookmark;
    const read = () => {
        try { return window.localStorage.getItem(STORAGE_KEY) === "right" ? "right" : "left"; }
        catch (_) { return "left"; }
    };
    function setSide(value, persist = true) {
        if (!["left", "right"].includes(value)) return;
        side = value;
        document.body.dataset.radioPanelSide = side;
        choices.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.panelSide === side)));
        if (persist) { try { window.localStorage.setItem(STORAGE_KEY, side); } catch (_) { /* Placement works without storage. */ } }
        window.dispatchEvent(new CustomEvent("renner:panel-side-changed", { detail: { side } }));
    }
    function measureHeader() {
        const rect = header?.getBoundingClientRect?.();
        if (rect && Number.isFinite(rect.bottom)) document.body.style.setProperty("--radio-spatial-top", `${Math.max(76, Math.ceil(rect.bottom + 14))}px`);
    }
    function syncPlayerLayer() {
        if (!player || !playerHome) return;
        const docked = document.body.classList.contains("focus-mode") || document.body.dataset.listeningMode === "neon";
        const target = docked ? main : playerHome;
        if (player.parentElement === target) return;
        const focused = player.contains(document.activeElement) ? document.activeElement : null;
        if (docked) main.appendChild(player);
        else if (playerBookmark?.parentElement === playerHome) playerHome.insertBefore(player, playerBookmark.nextSibling);
        else playerHome.appendChild(player);
        focused?.focus?.({ preventScroll: true });
    }
    function initialize() {
        if (initialized) return;
        main = document.getElementById("mainContent");
        const tuner = document.getElementById("stationTuner");
        const channels = document.getElementById("channelMenu"), community = document.getElementById("neonCommunityPanel");
        const channelToggle = document.getElementById("toggleChannelsBtn"), communityToggle = document.getElementById("toggleCommunityBtn");
        if (!main || !tuner || !channels || !community || !channelToggle || !communityToggle) return;
        initialized = true;
        const dock = document.createElement("div"); dock.id = "radioTunerDock"; dock.className = "radio-tuner-dock";
        dock.appendChild(tuner);
        main.appendChild(dock);
        const stack = document.createElement("div"); stack.id = "radioDrawerStack"; stack.className = "radio-drawer-stack";
        stack.appendChild(channels); stack.appendChild(community); main.appendChild(stack);
        const rail = document.createElement("nav"); rail.id = "radioSideRail"; rail.className = "radio-side-rail";
        rail.setAttribute("aria-label", "Listening shelves"); rail.setAttribute("data-i18n-aria-label", "Listening shelves");
        [channelToggle, communityToggle].forEach((button, index) => {
            button.classList.add("spatial-rail-arrow"); button.dataset.spatialPanel = index ? "community" : "channels";
            const label = document.createElement("span"); label.className = "spatial-rail-label";
            const key = index ? "Community" : "Channels"; label.textContent = key; label.setAttribute("data-i18n", key);
            button.appendChild(label); rail.appendChild(button);
        });
        main.appendChild(rail);
        const picker = document.createElement("div"); picker.className = "radio-side-picker"; picker.setAttribute("role", "group");
        picker.hidden = true;
        picker.inert = true;
        picker.setAttribute("aria-hidden", "true");
        picker.setAttribute("aria-label", "Panel side"); picker.setAttribute("data-i18n-aria-label", "Panel side");
        for (const value of ["left", "right"]) {
            const button = document.createElement("button"); button.type = "button"; button.setAttribute("data-panel-side", value);
            button.textContent = value === "left" ? "←" : "→";
            const key = value === "left" ? "Place panels on the left" : "Place panels on the right";
            button.setAttribute("aria-label", key); button.setAttribute("data-i18n-aria-label", key); button.title = key;
            button.setAttribute("data-i18n-title", key); button.addEventListener("click", () => setSide(value));
            picker.appendChild(button); choices.push(button);
        }
        rail.appendChild(picker);
        document.body.classList.add("radio-spatial-ready");
        [channels, community].forEach(panel => {
            const collapsed = panel.classList.contains("panel-collapsed");
            panel.inert = collapsed;
            panel.setAttribute("aria-hidden", String(collapsed));
        });
        setSide(read(), false);
        player = document.querySelector(".player-bar");
        playerHome = player?.parentElement;
        if (playerHome) {
            // This hidden location marker lets the same receiver return to its
            // original chassis without cloning controls or changing playback.
            playerBookmark = document.createElement("span");
            playerBookmark.id = "radioPlayerHome";
            playerBookmark.hidden = true;
            playerBookmark.setAttribute("hidden", "");
            playerBookmark.setAttribute("aria-hidden", "true");
            playerHome.insertBefore(playerBookmark, player);
            syncPlayerLayer();
            window.addEventListener("renner:appearance-changed", syncPlayerLayer);
            document.getElementById("minimizeBtn")?.addEventListener("click", syncPlayerLayer);
            if (typeof window.MutationObserver === "function") {
                new window.MutationObserver(syncPlayerLayer).observe(document.body, { attributes: true, attributeFilter: ["class", "data-listening-mode"] });
            }
        }
        header = document.querySelector(".site-header"); measureHeader();
        window.addEventListener("resize", measureHeader);
        window.addEventListener("renner:language-changed", measureHeader);
        window.addEventListener("storage", event => { if (event.key === STORAGE_KEY || event.key === null) setSide(read(), false); });
        if (typeof window.ResizeObserver === "function" && header) new window.ResizeObserver(measureHeader).observe(header);
        window.RENNER_SPATIAL = { setSide, getSide: () => side };
        // Moving the real dial preserves its single receiver and all existing input handlers.
        window.dispatchEvent(new CustomEvent("renner:tuner-layout-changed"));
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
    else initialize();
})();
