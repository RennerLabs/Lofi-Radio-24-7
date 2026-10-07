/* Listening UI uses the existing radio bridge. */
(function () {
    const radio = window.BODWOLF_RADIO;
    const search = document.getElementById("stationSearch");
    const backdrop = document.getElementById("drawerBackdrop");
    const stage = document.querySelector(".radio-device");
    const playerBar = document.querySelector(".player-bar");
    const shell = document.querySelector(".app-shell");
    const panels = ["chatPanel", "playlistPanel", "morePanel"];
    const sceneNames = ["Midnight Studio", "Neon Drift", "Golden Hour", "Quiet Room", "Deep Space",
        "Neon City Drive", "Midnight Highway", "Sunset Cruise", "Cosmic Radio"];
    const focusableControls = "button:not(:disabled),input:not(:disabled),textarea:not(:disabled),a[href],select:not(:disabled)";
    let view = "discover", mood = "all", returnFocus = null, toastTimer, idleTimer;

    window.RENNER_UI = { openPanel, closePanel };
    const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
    const playControl = () => document.getElementById(
        document.getElementById("playBtn").classList.contains("hidden") ? "pauseBtn" : "playBtn");

    function synchronizePanelTriggers(activeId = "") {
        document.querySelectorAll(".panel-toggle").forEach(button => {
            const active = button.dataset.panelTarget === activeId;
            button.classList.toggle("active-toggle", active);
            button.setAttribute("aria-expanded", String(active));
        });
    }

    function closePanel() {
        panels.forEach(id => {
            const panel = document.getElementById(id);
            panel.classList.remove("active-panel");
            panel.inert = true;
            panel.removeAttribute("aria-modal");
            panel.removeAttribute("role");
        });
        synchronizePanelTriggers();
        backdrop.classList.add("hidden");
        document.body.classList.remove("drawer-open");
        shell.inert = false;
        returnFocus?.focus();
        returnFocus = null;
    }

    function openPanel(id) {
        if (!panels.includes(id)) return;
        const panel = document.getElementById(id);
        if (panel.classList.contains("active-panel")) {
            closePanel();
            return;
        }
        const trigger = document.activeElement;
        closePanel();
        returnFocus = trigger;
        panel.inert = false;
        panel.classList.add("active-panel");
        panel.setAttribute("role", "dialog");
        panel.setAttribute("aria-modal", "true");
        backdrop.classList.remove("hidden");
        document.body.classList.add("drawer-open");
        shell.inert = true;
        synchronizePanelTriggers(id);
        panel.querySelector("[data-close-drawer]")?.focus();
    }

    function synchronizeFilterButtons(selector, attribute, value, className) {
        document.querySelectorAll(selector).forEach(button => {
            const selected = button.dataset[attribute] === value;
            button.classList.toggle(className, selected);
            button.setAttribute("aria-pressed", String(selected));
        });
    }

    function applyFilters() {
        radio.setStationFilter(search.value, mood, view === "favorites");
        const emptySaved = view === "favorites" && !search.value && mood === "all";
        const community = mood === "community";
        document.getElementById("emptyTitle").textContent = emptySaved ? "Keep your favorites close."
            : community ? "No community channels on air." : "No channels found.";
        document.getElementById("emptyDescription").textContent = emptySaved
            ? "Tap the heart on a channel to save your next escape."
            : community ? "Create your channel in Community FM, or check back soon."
                : "Try another name, or explore all channels.";
        synchronizeFilterButtons("[data-view]", "view", view, "active");
        synchronizeFilterButtons("[data-mood]", "mood", mood, "selected");
    }

    function updateSaved() {
        const favorites = radio.getFavorites(), station = radio.getCurrentStation();
        const saved = favorites.includes(radio.getStationKey(station));
        const button = document.getElementById("nowFavoriteBtn");
        document.getElementById("favoriteCount").textContent = String(favorites.length);
        button.setAttribute("aria-pressed", String(saved));
        button.setAttribute("aria-label", saved ? "Remove current channel from saved" : "Save current channel");
        button.querySelector("i").className = saved ? "fas fa-heart" : "far fa-heart";

        const playback = radio.getCurrentPlayback?.() || {};
        const source = playback.videoId || station?.youtubeId || station?.id;
        const playlist = playback.playlistUrl || station?.youtubePlaylistUrl;
        document.getElementById("sourceChannelLink").href = playlist
            || (typeof source === "string" && /^[A-Za-z0-9_-]{11}$/.test(source)
                ? `https://www.youtube.com/watch?v=${encodeURIComponent(source)}` : "https://www.youtube.com");
    }

    function toast(text) {
        const element = document.getElementById("uiToast");
        element.textContent = text;
        element.classList.remove("hidden");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => element.classList.add("hidden"), 2400);
    }

    function revealControls() {
        clearTimeout(idleTimer);
        document.body.classList.remove("controls-idle");
        if (!document.body.classList.contains("focus-mode") || reduceMotion()) return;
        idleTimer = setTimeout(() => {
            const focused = document.activeElement;
            const keyboardFocus = (stage.contains(focused) || playerBar?.contains(focused))
                && focused.matches(":focus-visible");
            if (!keyboardFocus && !document.body.classList.contains("drawer-open")) {
                document.body.classList.add("controls-idle");
            }
        }, 4000);
    }

    function exitFocus() {
        if (document.body.classList.contains("focus-mode")) document.getElementById("minimizeBtn").click();
        revealControls();
        playControl().focus();
    }

    function trapDrawerFocus(event) {
        const panel = document.querySelector(".drawer.active-panel");
        const elements = [...panel.querySelectorAll(focusableControls)].filter(element => element.getClientRects().length);
        if (!elements.length) return;
        const first = elements[0], last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }

    function handleKeyboard(event) {
        const editing = /INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || event.target.isContentEditable;
        if (event.key === "Escape") {
            closePanel();
            if (document.body.classList.contains("focus-mode")) exitFocus();
        }
        if (event.key === "/" && !editing) {
            event.preventDefault();
            closePanel();
            window.RENNER_PANELS?.showChannels(false);
            search.focus();
            search.scrollIntoView({ block: "center", behavior: reduceMotion() ? "instant" : "smooth" });
        }
        if (event.key === "Tab" && document.body.classList.contains("drawer-open")) trapDrawerFocus(event);
    }

    function updateScene(index) {
        document.querySelectorAll("[data-world]").forEach(button => {
            button.setAttribute("aria-pressed", String(Number(button.dataset.world) === index));
        });
        if (index >= 0) {
            const scene = radio.getScenes?.().find(item => item.index === index);
            document.getElementById("sceneName").textContent = scene?.name || sceneNames[index] || "Your listening space";
        }
    }

    function toggleMotion(event) {
        const paused = document.body.classList.toggle("motion-paused"), button = event.currentTarget;
        const label = paused ? "Resume scene motion" : "Pause scene motion";
        button.setAttribute("aria-pressed", String(paused));
        button.setAttribute("aria-label", label);
        button.title = label;
        button.querySelector("i").className = paused ? "far fa-image" : "fas fa-wind";
        window.dispatchEvent(new Event("renner:motion-preference"));
    }

    search.addEventListener("input", applyFilters);
    document.getElementById("loadMoreStations").addEventListener("click", () => radio.showMoreStations());
    document.querySelectorAll("[data-mood]").forEach(button => button.addEventListener("click", () => {
        mood = button.dataset.mood;
        applyFilters();
    }));
    document.querySelectorAll("[data-view]").forEach(button => button.addEventListener("click", () => {
        view = button.dataset.view;
        applyFilters();
    }));
    document.getElementById("resetFilters").addEventListener("click", () => {
        view = "discover";
        mood = "all";
        search.value = "";
        applyFilters();
        search.focus();
    });
    document.getElementById("nowFavoriteBtn").addEventListener("click", () => radio.toggleFavorite(radio.getCurrentStation()));
    document.getElementById("surpriseBtn").addEventListener("click", () => document.getElementById("randomBtn").click());
    document.getElementById("mobileFocusModeBtn").addEventListener("click", () => {
        closePanel();
        document.getElementById("minimizeBtn").click();
        revealControls();
        (document.getElementById("browseChannelsBtn") || document.getElementById("exitFocusBtn")).focus();
    });
    document.getElementById("exitFocusBtn").addEventListener("click", exitFocus);
    document.getElementById("minimizeBtn").addEventListener("click", revealControls);
    [stage, playerBar].filter(Boolean).forEach(element => {
        ["pointermove", "pointerdown", "focusin"].forEach(type => element.addEventListener(type, revealControls));
    });
    document.querySelectorAll("[data-close-drawer]").forEach(button => button.addEventListener("click", closePanel));
    backdrop.addEventListener("click", closePanel);
    panels.forEach(id => { document.getElementById(id).inert = true; });
    synchronizePanelTriggers();
    document.addEventListener("keydown", handleKeyboard);

    ["renner:station-changed", "renner:source-changed", "renner:catalog-changed"]
        .forEach(type => window.addEventListener(type, updateSaved));
    window.addEventListener("renner:favorites-changed", () => {
        updateSaved();
        toast("Saved channels updated.");
    });
    window.addEventListener("renner:playback-changed", event => {
        document.getElementById("heroStatusPill").textContent = event.detail.isPlaying ? "NOW PLAYING" : "READY WHEN YOU ARE";
    });
    document.querySelectorAll("[data-world]").forEach(button => {
        button.addEventListener("click", () => radio.setScene(Number(button.dataset.world)));
    });
    document.getElementById("followStationScene").addEventListener("click", () => {
        radio.followStationScene();
        updateScene(-1);
        toast("Scene follows your channel.");
    });
    window.addEventListener("renner:scene-changed", event => updateScene(event.detail.index));
    window.addEventListener("renner:managed-scene", event => {
        if (!stage.classList.contains("custom-scene")) {
            document.getElementById("sceneName").textContent = event.detail.name || "Your listening space";
        }
    });
    document.getElementById("motionPauseBtn").addEventListener("click", toggleMotion);
    document.addEventListener("DOMContentLoaded", () => {
        updateSaved();
        updateScene(stage.classList.contains("custom-scene") ? radio.getSceneIndex() : -1);
        const layer = document.querySelector(".dynamic-bg-layer.is-active");
        if (layer?.dataset.sceneName && !stage.classList.contains("custom-scene")) {
            document.getElementById("sceneName").textContent = layer.dataset.sceneName;
        }
    });
})();
