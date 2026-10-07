/* The frequency shelves fold without changing a stream, filter, or theme. */
(function () {
    "use strict";

    const definitions = [
        { name: "channels", panel: "channelMenu", content: "channelMenuContent", button: "toggleChannelsBtn", hide: "Hide channels", show: "Show channels", side: "start" },
        { name: "community", panel: "neonCommunityPanel", content: "communityPanelContent", button: "toggleCommunityBtn", hide: "Hide community", show: "Show community", side: "end" }
    ];
    const panels = new Map();
    let initialized = false;

    function localized(text) {
        return window.RENNER_I18N?.translateOwnedText?.(text) || text;
    }

    function read(name) {
        const fallback = name === "channels" && document.body.classList.contains("focus-mode") && ["retro", "lofi"].includes(document.body.dataset.listeningMode);
        try {
            const value = window.localStorage.getItem(`renner:${name}-collapsed`);
            return value === "1" ? true : value === "0" ? false : fallback;
        }
        catch (_) { return fallback; }
    }

    function save(name, collapsed) {
        try { window.localStorage.setItem(`renner:${name}-collapsed`, collapsed ? "1" : "0"); }
        catch (_) { /* Folding still works during private sessions. */ }
    }

    function synchronize(panel) {
        const label = localized(panel.collapsed ? panel.show : panel.hide);
        panel.button.setAttribute("aria-expanded", String(!panel.collapsed));
        panel.button.setAttribute("aria-label", label);
        panel.button.setAttribute("data-i18n-aria-label", panel.collapsed ? panel.show : panel.hide);
        panel.button.setAttribute("data-i18n-title", panel.collapsed ? panel.show : panel.hide);
        panel.button.title = label;
        const rtl = document.documentElement.dir === "rtl";
        const physicalSide = document.body.dataset.radioPanelSide;
        const outwardLeft = ["left", "right"].includes(physicalSide) ? physicalSide === "left" : (panel.side === "start") !== rtl;
        const arrowLeft = panel.collapsed ? !outwardLeft : outwardLeft;
        const icon = panel.button.querySelector("i");
        if (icon) icon.className = `fas fa-chevron-${arrowLeft ? "left" : "right"}`;
    }

    function clearMotion(panel) {
        const motion = panel.motion;
        panel.motion = null;
        motion?.parent?.cancel();
        motion?.content?.cancel();
        for (const property of ["height", "width", "overflow"]) panel.panel.style[property] = "";
        panel.panel.classList.remove("panel-folding");
    }

    function finishFold(panel, token) {
        if (panel.token !== token) return;
        panel.content.hidden = panel.collapsed;
        panel.content.inert = panel.collapsed;
        clearMotion(panel);
        if (!panel.collapsed && panel.scrollOnOpen) scrollShelf(panel);
    }

    function scrollShelf(panel) {
        if (!document.body.classList.contains("radio-spatial-ready") || !window.matchMedia?.("(max-width: 1080px), (max-height: 540px)")?.matches) return;
        const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches || document.body.classList.contains("comfort-mode") || document.body.classList.contains("reduced-motion");
        panel.panel.scrollIntoView?.({ block: "start", inline: "nearest", behavior: reduced ? "auto" : "smooth" });
    }

    function setCollapsed(name, collapsed, persist = true, animate = true) {
        const panel = panels.get(name);
        if (!panel) return;
        const next = Boolean(collapsed);
        if (panel.motion && panel.collapsed === next) {
            synchronize(panel);
            if (persist) save(name, next);
            if (!next && persist) panel.scrollOnOpen = true;
            return;
        }
        const changed = panel.collapsed !== next;
        const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches || document.body.classList.contains("comfort-mode") || document.body.classList.contains("reduced-motion");
        const canAnimate = animate && changed && !reduceMotion && typeof panel.panel.animate === "function" && typeof panel.content.animate === "function" && typeof panel.panel.getBoundingClientRect === "function";
        const start = canAnimate ? panel.panel.getBoundingClientRect() : null;
        const opacity = canAnimate ? panel.content.hidden ? "0" : window.getComputedStyle?.(panel.content)?.opacity || "1" : "1";
        const transform = canAnimate ? panel.content.hidden ? "translateY(-8px)" : window.getComputedStyle?.(panel.content)?.transform || "none" : "none";
        const token = ++panel.token;
        clearMotion(panel);
        panel.scrollOnOpen = !next && persist;
        // Return focus before hiding a subtree, including cross-tab changes.
        const spatial = document.body.classList.contains("radio-spatial-ready");
        if (next && (panel.content.contains(document.activeElement) || spatial && panel.panel.contains(document.activeElement))) panel.button.focus({ preventScroll: true });
        panel.collapsed = next;
        panel.content.hidden = panel.collapsed;
        panel.content.inert = panel.collapsed;
        if (spatial) {
            panel.panel.inert = panel.collapsed;
            panel.panel.setAttribute("aria-hidden", String(panel.collapsed));
        }
        panel.panel.classList.toggle("panel-collapsed", panel.collapsed);
        document.body.classList.toggle(`${name}-collapsed`, panel.collapsed);
        synchronize(panel);
        if (persist) save(name, panel.collapsed);
        const measured = start && Number.isFinite(start.width) && start.width > 0 && Number.isFinite(start.height) && start.height >= 0 && (start.height > 0 || !next);
        if (!canAnimate || !measured) {
            if (!next && persist) scrollShelf(panel);
            return;
        }
        const end = panel.panel.getBoundingClientRect();
        // Measure the final layout first, then keep the subtree rendered while
        // the real panel clips its shrinking height. It stays inert on collapse.
        panel.content.hidden = false;
        panel.panel.style.height = `${start.height}px`;
        panel.panel.style.width = `${start.width}px`;
        panel.panel.style.overflow = "hidden";
        panel.panel.classList.add("panel-folding");
        const timing = { duration: 280, easing: "cubic-bezier(.22,.72,.18,1)", fill: "both" };
        try {
            const parent = panel.panel.animate([
                { height: `${start.height}px`, width: `${start.width}px` },
                { height: `${end.height}px`, width: `${end.width}px` }
            ], timing);
            panel.motion = { parent, content: null };
            const content = panel.content.animate([
                { opacity, transform },
                { opacity: panel.collapsed ? "0" : "1", transform: panel.collapsed ? "translateY(-8px)" : "none" }
            ], timing);
            panel.motion.content = content;
            parent.onfinish = () => finishFold(panel, token);
        } catch (_) {
            // Embedded browsers without complete animation support still fold.
            finishFold(panel, token);
        }
    }

    function showChannels(focusSearch = true) {
        setCollapsed("channels", false);
        if (focusSearch) document.getElementById("stationSearch")?.focus({ preventScroll: true });
    }

    function initialize() {
        if (initialized) return;
        initialized = true;
        for (const definition of definitions) {
            const panel = document.getElementById(definition.panel);
            const content = document.getElementById(definition.content);
            const button = document.getElementById(definition.button);
            if (!panel || !content || !button) continue;
            const entry = { ...definition, panel, content, button, collapsed: false, motion: null, token: 0 };
            panels.set(definition.name, entry);
            setCollapsed(definition.name, read(definition.name), false, false);
            button.addEventListener("click", () => setCollapsed(definition.name, !entry.collapsed));
        }
        window.RENNER_PANELS = {
            showChannels,
            showCommunity: () => setCollapsed("community", false),
            toggleChannels: () => setCollapsed("channels", !panels.get("channels")?.collapsed),
            toggleCommunity: () => setCollapsed("community", !panels.get("community")?.collapsed)
        };
        document.getElementById("channelMenu")?.querySelectorAll("[data-view]").forEach(button => {
            button.addEventListener("click", () => showChannels(false));
        });
        // Refresh only labels and arrows. The user's collapsed state stays put.
        window.addEventListener("renner:language-changed", () => panels.forEach(synchronize));
        window.addEventListener("renner:panel-side-changed", () => panels.forEach(synchronize));
        const applyReceiverDefault = () => {
            let hasSavedState = false;
            try { hasSavedState = ["0", "1"].includes(window.localStorage.getItem("renner:channels-collapsed")); }
            catch (_) { /* Apply the same default when storage is blocked. */ }
            if (!hasSavedState) setCollapsed("channels", read("channels"), false);
        };
        window.addEventListener("renner:appearance-changed", applyReceiverDefault);
        document.getElementById("minimizeBtn")?.addEventListener("click", applyReceiverDefault);
        window.addEventListener("storage", event => {
            for (const panel of panels.values()) {
                if (event.key === `renner:${panel.name}-collapsed` || event.key === null) setCollapsed(panel.name, read(panel.name), false);
            }
        });
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
    else initialize();
})();
