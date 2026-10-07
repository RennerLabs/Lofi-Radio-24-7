(function () {
    // Catalog, local preferences and source state.
    const fallbackStations = window.BODWOLF_STATIONS || [];
    let managedStations = [];
    let managedBackgrounds = [];
    let defaultManagedBackgrounds = [];
    let isUsingDefaultBackgrounds = false;
    let communityStations = [];
    let stationQuery = "";
    let stationMood = "all";
    let favoritesOnly = false;
    let favoriteKeys = [];
    try { favoriteKeys = JSON.parse(localStorage.getItem("renner:favorites") || "[]"); } catch (_) {}
    if (!Array.isArray(favoriteKeys)) favoriteKeys = [];
    favoriteKeys = favoriteKeys.filter(key => typeof key === "string");
    let stations = [...fallbackStations];
    const config = window.BODWOLF_CONFIG || {};
    const defaultSiteBackgrounds = Array.isArray(window.RENNER_DEFAULT_BACKGROUNDS)
        ? window.RENNER_DEFAULT_BACKGROUNDS
        : [];
    const storageKeys = {
        station: "bodwolf:lastStationIndex",
        volume: "bodwolf:volume",
        theme: "bodwolf:theme",
        background: "bodwolf:background",
        effect: "bodwolf:effect",
        staticSound: "bodwolf:staticSound",
        comfortMode: "bodwolf:comfortMode"
    };
    let savedSession = null;
    try { savedSession = JSON.parse(localStorage.getItem("renner:last-session") || "null"); } catch (_) {}
    let userSelectedStation = false;
    let deferredCatalogSelection = null;
    let siteDefaults = null;
    let activeBackgroundSignature = "";
    let activeScene = null;
    let customScene = null;
    let randomBackgroundSelection = null;
    const STATIC_AUDIO_PATH = "assets/audio/radio-static.wav";
    const STATIC_AUDIO_VOLUME = 0.12;
    const COMFORT_STATIC_AUDIO_VOLUME = 0.04;
    const PUBLIC_STATION_CATEGORIES = [
        "LOFI",
        "SYNTHWAVE",
        "CHILLHOP",
        "JAZZHOP",
        "AMBIENT",
        "DEEP HOUSE",
        "HOUSE",
        "RETRO",
        "STUDY",
        "SLEEP",
        "RELAX",
        "RADIO",
        "SONG",
        "CUSTOM"
    ];
    const STATION_MOOD_PATTERNS = {
        lofi: /lofi|lo-fi|chill|coffee|rain/,
        synth: /synth|retro|drive|night|1985|1993/,
        focus: /focus|study|coding|ambient|piano/,
        jazz: /jazz|soul|r&b/
    };

    let currentStationIndex = config.defaultStationIndex || 0;
    let currentBgIndex = 0;
    let currentThemeIndex = 0;
    let currentEffectIndex = 0;
    let player;
    let playerReady = false;
    let appInitialized = false;
    let youtubeApiReady = false;
    let playRequested = false;
    let streamStatus = "";
    let tuningTimer;
    let pendingPlaylistItem = null;
    let pendingPlaylistSource = null;
    let activePlaylistItem = null;
    let currentPlaybackSource = "station";
    let currentCommunityTrackIndex = 0;
    const youtubePlaylistCatalogs = new Map();
    const youtubePlaylistPlaybackStates = new Map();
    const youtubePlaylistResolutions = new Map();
    const PLAYLIST_RESOLUTION_TTL_MS = 5 * 60 * 1000;
    const PLAYLIST_RESOLUTION_TIMEOUT_MS = 12000;
    let activeYoutubePlaylist = null;
    // YouTube confirms availability when a selected video actually plays or fails.
    // This local cache never writes to the station catalog or claims to precheck it.
    const AVAILABILITY_STORAGE_KEY = "renner:video-availability";
    const AVAILABILITY_TTL_MS = 15 * 60 * 1000;
    const CLOSED_VIDEO_ERRORS = new Set([100, 101, 150]);
    const videoAvailability = new Map();
    let activePlaybackAttempt = null;
    let playbackAttemptSequence = 0;
    let availabilitySkipVisited = new Set();
    restoreVideoAvailability();
    let staticSoundEnabled = false;
    let comfortModeEnabled = false;
    let hasUserInteracted = false;
    let tuningVisualTimer;
    let signalLockTimer;
    let tuningStatusClearTimer;
    let staticAudio = null;
    let staticAudioWarningShown = false;
    let staticAudioProbeStarted = false;
    let activeManagedBackgroundId = "";
    let activeBackgroundLayerIndex = 0;
    const sceneImageProbes = new WeakMap();
    const reducedMotionQuery = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;

    const radioDevice = document.querySelector(".radio-device");
    const vinylRecord = document.querySelector(".vinyl-record");
    const stationNameEl = document.getElementById("stationName");
    const stationMetaEl = document.getElementById("stationMeta");
    const barStationNameEl = document.getElementById("barStationName");
    const barStationMetaEl = document.getElementById("barStationMeta");
    const barThumbEl = document.getElementById("barThumb");
    const freqValueEl = document.getElementById("freqValue");
    const heroStatusPillEl = document.getElementById("heroStatusPill");
    const meterBars = document.querySelectorAll(".meter-bar");
    const playBtn = document.getElementById("playBtn");
    const pauseBtn = document.getElementById("pauseBtn");
    const volumeSlider = document.getElementById("volumeSlider");
    const mobileVolumeSlider = document.getElementById("mobileVolumeSlider");
    const tuningStatusEl = document.getElementById("tuningStatus");
    const firebaseStatusEl = document.getElementById("firebaseStatus");
    const listBtn = document.getElementById("listBtn");
    const randomBtn = document.getElementById("randomBtn");
    const channelMenu = document.getElementById("channelMenu");
    const closeMenu = document.getElementById("closeMenu");
    const channelsContainer = document.getElementById("channelsListContainer");
    const bgBtn = document.getElementById("bgBtn");
    const themeBtn = document.getElementById("themeBtn");
    const effectBtn = document.getElementById("effectBtn");
    const weatherOverlay = document.getElementById("weatherOverlay");
    const tuningOverlay = document.getElementById("tuningOverlay");
    const minimizeBtn = document.getElementById("minimizeBtn");
    const staticSoundBtn = document.getElementById("staticSoundBtn");
    const comfortModeBtn = document.getElementById("comfortModeBtn");
    const mobileStaticSoundBtn = document.getElementById("mobileStaticSoundBtn");
    const mobileComfortModeBtn = document.getElementById("mobileComfortModeBtn");
    const dynamicBackgroundLayers = [
        document.getElementById("dynamicBackgroundLayerA"),
        document.getElementById("dynamicBackgroundLayerB")
    ].filter(Boolean);
    const panelButtons = document.querySelectorAll(".panel-toggle");
    const proxyButtons = document.querySelectorAll(".mobile-proxy-control");

    // Public bridge used by the independent UI, tuner, chat and media modules.
    window.BODWOLF_RADIO = {
        playPlaylistItem,
        playPlaylistSource,
        getPlaylistAvailability,
        getStations: () => [...stations],
        showMoreStations() { initChannelList(); updateDisplayInfo(); },
        getFilteredStationRows,
        selectStationByKey(key) {
            const index = stations.findIndex(station => getStationKey(station) === key);
            if (index < 0) return false;
            return loadStation(index);
        },
        getStationAvailability,
        getVideoAvailability,
        retryStation,
        getSceneIndex: () => currentBgIndex,
        getScenes: () => (config.backgrounds || []).map((_, index) => getSceneChoice(index)),
        setScene(index) {
            if (!Number.isInteger(index) || !config.backgrounds[index]) return;
            clearRandomBackgroundSelection();
            currentBgIndex = index;
            applyBackground(index);
            saveSetting("renner:scene-mode", "custom");
            saveSetting(storageKeys.background, index);
        },
        followStationScene() {
            clearRandomBackgroundSelection();
            cancelSceneImageProbe(radioDevice);
            radioDevice.classList.remove("custom-scene");
            customScene = null;
            saveSetting("renner:scene-mode", "station");
            activeManagedBackgroundId = "";
            activeBackgroundSignature = "";
            applyManagedBackgroundForCurrentStation("station");
            syncSceneMotion();
            window.dispatchEvent(new CustomEvent("renner:scene-changed", {detail: {index: -1}}));
        },
        getStationKey,
        getFavorites: () => [...favoriteKeys],
        setStationFilter(query, mood, savedOnly) {
            stationQuery = String(query || "").toLowerCase().trim();
            stationMood = mood || "all";
            favoritesOnly = Boolean(savedOnly);
            initChannelList();
            updateDisplayInfo();
        },
        toggleFavorite(station) {
            const key = getStationKey(station);
            if (!key) return;
            favoriteKeys = favoriteKeys.includes(key) ? favoriteKeys.filter(item => item !== key) : [...favoriteKeys, key];
            saveSetting("renner:favorites", JSON.stringify(favoriteKeys));
            initChannelList();
            updateDisplayInfo();
            window.dispatchEvent(new Event("renner:favorites-changed"));
        },
        setMainStations,
        setStudioStations: setMainStations,
        setTemporaryStations,
        loadStationByIndex: loadStation,
        getCurrentStation() {
            return stations[currentStationIndex] || null;
        },
        getCurrentPlayback() {
            if (activeYoutubePlaylist && activePlaybackAttempt?.playlistId) {
                return {source: currentPlaybackSource, videoId: activePlaybackAttempt.videoId || "", playlistId: activeYoutubePlaylist.playlistId,
                    playlistUrl: activeYoutubePlaylist.playlistUrl, title: (currentPlaybackSource === "station" ? stations[currentStationIndex]?.name : activeYoutubePlaylist.title) || "YouTube Playlist"};
            }
            if (currentPlaybackSource === "playlist" && activePlaylistItem) {
                return {source: "playlist", videoId: activePlaylistItem.videoId, title: activePlaylistItem.title || "YouTube Track"};
            }
            const station = stations[currentStationIndex];
            const track = station?.type === "community" ? getActiveCommunityTracks(station)[currentCommunityTrackIndex] : null;
            return {source: "station", videoId: track?.videoId || station?.id || "", title: station?.name || ""};
        }
    };

    function init() {
        if (!stations.length) {
            stationNameEl.textContent = "No stations found";
        }

        restoreSavedSettings();
        const restoredIndex = findValidStationIndex(currentStationIndex, 1);
        currentStationIndex = restoredIndex >= 0 ? restoredIndex : 0;
        setupDefaultBackgroundFallback("startup");
        initChannelList();
        updateDisplayInfo();
        bindControls();
        updateClock();
        setInterval(updateClock, 1000);
        setInterval(expireVideoAvailability, 30000);
        appInitialized = true;
        if (restoredIndex < 0) stopForUnavailableCatalog();
        else if (youtubeApiReady) createYouTubePlayer();
        checkFirebaseReadiness();
    }

    // Frequency catalog, filtering and confirmed source availability.
    function initChannelList() {
        channelsContainer.textContent = "";
        const rows = getFilteredStationRows();
        rows.forEach(({station,index}) => appendStationListItem(station,index));
        document.getElementById("loadMoreStations")?.classList.add("hidden");
        const count = document.getElementById("stationCount");
        if (count) count.textContent = `${rows.length} ${rows.length === 1 ? "station" : "stations"}`;
        document.getElementById("stationEmpty")?.classList.toggle("hidden", rows.length > 0);
        window.dispatchEvent(new Event("renner:catalog-changed"));
        window.dispatchEvent(new Event("renner:station-filter-changed"));
    }

    function getFilteredStationRows() {
        return getFrequencyStationRows().filter(({station}) => {
            const text = `${station.name} ${station.category} ${station.freq} ${station.description || ""}`.toLowerCase();
            if (stationQuery && !text.includes(stationQuery)) return false;
            if (favoritesOnly && !favoriteKeys.includes(getStationKey(station))) return false;
            if (stationMood === "community") return station.type === "community";
            return stationMood === "all" || Boolean(STATION_MOOD_PATTERNS[stationMood]?.test(text));
        }).map(row => ({...row, key: getStationKey(row.station), availability: getStationAvailability(row.station), selectable: isSelectableStation(row.station)}));
    }

    function getFrequencyStationRows() {
        return stations.map((station, index) => ({station,index})).filter(({station}) => station)
            .sort((a,b) => getStationFrequencyNumber(a.station.freq) - getStationFrequencyNumber(b.station.freq) || a.index - b.index);
    }

    function appendStationListItem(station, index) {
        const item = document.createElement("button");
        item.className = "channel-item";
        if (station.type === "community") {
            item.classList.add("community-channel");
        }
        item.type = "button";
        item.dataset.stationIndex = String(index);
        item.dataset.stationKey = getStationKey(station);
        item.setAttribute("aria-label", `Listen to ${station.name}, ${station.freq} FM`);
        item.style.setProperty("--station-accent", getStationAccent(station));

        const thumbnail = document.createElement("span");
        thumbnail.className = "ch-thumb";
        applyStationArtwork(thumbnail, station, getStationGlyph(getSafeStationCategory(station.category)));

        const textWrap = document.createElement("span");
        textWrap.className = "ch-copy";

        const meta = document.createElement("span");
        meta.className = "ch-meta";
        meta.textContent = getStationListMeta(station);

        const freq = document.createElement("span");
        freq.className = "ch-freq";
        freq.textContent = String(station.freq || "--");

        const badge = document.createElement("span");
        badge.className = "ch-badge";
        badge.textContent = station.type === "community" ? "COMMUNITY" : "TUNE IN";

        const signal = document.createElement("span");
        signal.className = "ch-signal";
        signal.setAttribute("aria-hidden", "true");
        for (let barIndex = 0; barIndex < 3; barIndex += 1) {
            signal.appendChild(document.createElement("span"));
        }

        const side = document.createElement("span");
        side.className = "ch-side";
        side.append(badge, signal);

        const name = document.createElement("span");
        name.className = "ch-name";
        name.textContent = station.name;

        const heading = document.createElement("span");
        heading.className = "ch-heading";
        heading.append(freq, name);
        textWrap.append(heading, meta);
        item.append(thumbnail, textWrap, side);
        item.addEventListener("click", () => {
            loadStation(index);
            toggleMenu(false);
        });

        const card = document.createElement("article");
        card.className = "station-card";
        card.dataset.stationIndex = String(index);
        card.dataset.stationKey = getStationKey(station);
        const availability = document.createElement("span");
        availability.className = "ch-availability";
        availability.setAttribute("data-i18n", "Unavailable");
        textWrap.appendChild(availability);
        const retry = document.createElement("button");
        retry.type = "button";
        retry.className = "availability-retry";
        retry.textContent = "Recheck";
        retry.setAttribute("data-i18n", "Recheck");
        retry.setAttribute("aria-label", `Recheck ${station.name}`);
        retry.addEventListener("click", () => retryStation(getStationKey(station)));
        const favorite = document.createElement("button");
        favorite.type = "button";
        favorite.className = "favorite-button";
        const saved = favoriteKeys.includes(getStationKey(station));
        favorite.setAttribute("aria-label", `${saved ? "Remove" : "Save"} ${station.name} ${saved ? "from" : "to"} favorites`);
        favorite.setAttribute("aria-pressed", String(saved));
        const icon = document.createElement("i");
        icon.className = saved ? "fas fa-heart" : "far fa-heart";
        favorite.appendChild(icon);
        favorite.addEventListener("click", () => {
            const oldIndex = Array.from(channelsContainer.children).indexOf(card);
            window.BODWOLF_RADIO.toggleFavorite(station);
            const buttons = channelsContainer.querySelectorAll(".favorite-button");
            (buttons[Math.min(oldIndex, buttons.length - 1)] || document.querySelector('[data-view="discover"]'))?.focus();
        });
        card.append(item, favorite, retry);
        channelsContainer.appendChild(card);
        updateStationAvailabilityRow(item, station, card);
    }

    function restoreVideoAvailability() {
        try {
            const records = JSON.parse(localStorage.getItem(AVAILABILITY_STORAGE_KEY) || "[]");
            if (!Array.isArray(records)) return;
            const now = Date.now();
            records.slice(-200).forEach(record => {
                if (!record || !isValidVideoId(record.videoId) || !CLOSED_VIDEO_ERRORS.has(record.code) ||
                    record.status !== "unavailable" || !Number.isFinite(record.checkedAt) || !Number.isFinite(record.expiresAt) || record.checkedAt > now ||
                    record.expiresAt <= now || record.expiresAt > record.checkedAt + AVAILABILITY_TTL_MS) return;
                videoAvailability.set(record.videoId, {...record});
            });
        } catch (_) { /* Availability storage is optional; playback still checks real iframe events. */ }
    }

    function persistVideoAvailability() {
        const records = [...videoAvailability.values()].filter(record => record.status === "unavailable" && record.expiresAt > Date.now()).slice(-200);
        saveSetting(AVAILABILITY_STORAGE_KEY, JSON.stringify(records));
    }

    function getVideoAvailability(videoId) {
        const record = videoAvailability.get(videoId);
        if (!record || record.expiresAt <= Date.now()) return {status: "unknown", videoId};
        return {...record};
    }

    function getStationAvailability(stationOrKey) {
        const station = typeof stationOrKey === "string" ? stations.find(item => getStationKey(item) === stationOrKey) : stationOrKey;
        if (!station) return {status: "unknown", videoIds: [], failedTrackCount: 0, totalTracks: 0};
        const playlistId = getStationPlaylistId(station);
        if (playlistId) return {...getPlaylistAvailability(playlistId), key: getStationKey(station)};
        const videoIds = station.type === "community" ? getActiveCommunityTracks(station).map(track => track.videoId) : [station.id];
        const records = videoIds.map(getVideoAvailability);
        const failures = records.filter(record => record.status === "unavailable");
        const status = records.length && failures.length === records.length ? "unavailable" : failures.length ? "partial" : records.some(record => record.status === "available") ? "available" : "unknown";
        return {status, key: getStationKey(station), videoIds, failedTrackCount: failures.length, totalTracks: records.length,
            checkedAt: failures.length ? Math.max(...failures.map(record => record.checkedAt)) : null,
            expiresAt: failures.length ? Math.min(...failures.map(record => record.expiresAt)) : null};
    }

    function getPlaylistAvailability(playlistId) {
        const videoIds = youtubePlaylistCatalogs.get(playlistId) || [];
        const records = videoIds.map(getVideoAvailability);
        const failures = records.filter(record => record.status === "unavailable");
        const status = records.length && failures.length === records.length ? "unavailable" : failures.length ? "partial" : records.some(record => record.status === "available") ? "available" : "unknown";
        const lastPlaybackStatus = youtubePlaylistPlaybackStates.get(playlistId) || "unknown";
        const resolution = youtubePlaylistResolutions.get(playlistId);
        return {status, playlistId, playbackStatus: lastPlaybackStatus === "unavailable" && status !== "unavailable" ? "unknown" : lastPlaybackStatus, videoIds: [...videoIds], failedTrackCount: failures.length, totalTracks: records.length,
            resolved: Boolean(resolution), partial: resolution?.partial === true, resolutionSource: resolution?.source || "", resolvedTrackCount: resolution?.videoIds.length || 0,
            checkedAt: failures.length ? Math.max(...failures.map(record => record.checkedAt)) : null,
            expiresAt: failures.length ? Math.min(...failures.map(record => record.expiresAt)) : null};
    }

    function setPlaylistPlaybackStatus(playlistId, status) {
        if (!isValidPlaylistId(playlistId)) return;
        youtubePlaylistPlaybackStates.set(playlistId, status);
        window.dispatchEvent(new CustomEvent("renner:playlist-playback-changed", {detail: {playlistId, playbackStatus: status}}));
        window.dispatchEvent(new CustomEvent("renner:availability-changed", {detail: {...getPlaylistAvailability(playlistId), source: currentPlaybackSource}}));
    }

    function setVideoAvailability(videoId, status, code = null) {
        if (!isValidVideoId(videoId)) return;
        const now = Date.now();
        videoAvailability.set(videoId, {videoId, status, code, checkedAt: now, expiresAt: now + AVAILABILITY_TTL_MS});
        persistVideoAvailability();
        refreshStationAvailability();
        window.dispatchEvent(new CustomEvent("renner:availability-changed", {detail: {videoId, ...getVideoAvailability(videoId), source: activePlaybackAttempt?.source || currentPlaybackSource}}));
        window.dispatchEvent(new Event("renner:station-filter-changed"));
    }

    function expireVideoAvailability() {
        let changed = false;
        for (const [videoId, record] of videoAvailability) if (record.expiresAt <= Date.now()) {
            videoAvailability.delete(videoId);
            changed = true;
        }
        if (!changed) return;
        persistVideoAvailability();
        refreshStationAvailability();
        window.dispatchEvent(new Event("renner:availability-changed"));
        window.dispatchEvent(new Event("renner:station-filter-changed"));
    }

    function updateStationAvailabilityRow(item, station, card = item.parentElement) {
        const info = getStationAvailability(station);
        item.dataset.availability = info.status;
        if (card) card.dataset.availability = info.status;
        item.classList.toggle("station-unavailable", info.status === "unavailable");
        item.setAttribute("aria-label", `Listen to ${station.name}, ${station.freq} FM${info.status === "unavailable" ? ", unavailable" : ""}`);
        const badge = item.querySelector(".ch-availability");
        const label = info.status === "partial" ? "Some tracks unavailable" : "Unavailable";
        if (badge) {
            badge.hidden = info.status !== "unavailable" && info.status !== "partial";
            badge.textContent = label;
            badge.setAttribute("data-i18n", label);
        }
        const retry = card?.querySelector(".availability-retry");
        if (retry) retry.hidden = info.status !== "unavailable" && info.status !== "partial";
    }

    function refreshStationAvailability() {
        document.querySelectorAll(".channel-item").forEach(item => {
            const station = stations[Number(item.dataset.stationIndex)];
            if (station) updateStationAvailabilityRow(item, station);
        });
    }

    function retryStation(key) {
        const index = stations.findIndex(station => getStationKey(station) === key);
        if (index < 0) return false;
        getStationAvailability(stations[index]).videoIds.forEach(videoId => videoAvailability.delete(videoId));
        persistVideoAvailability();
        refreshStationAvailability();
        window.dispatchEvent(new Event("renner:availability-changed"));
        window.dispatchEvent(new Event("renner:station-filter-changed"));
        return loadStation(index);
    }

    function isSelectableStation(station) {
        return isValidStation(station) && getStationAvailability(station).status !== "unavailable";
    }

    function getStationFrequencyNumber(frequency) {
        const match = String(frequency || "").match(/\d+(?:\.\d+)?/);
        return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
    }

    function setTemporaryStations(nextStations) {
        const currentStation = stations[currentStationIndex];
        const currentKey = getStationKey(currentStation);
        communityStations = Array.isArray(nextStations) ? nextStations.filter(isVisibleCommunityStation) : [];
        rebuildStationCatalog(currentStation, currentKey, "community");
    }

    function setMainStations(nextStations) {
        const currentStation = stations[currentStationIndex];
        const currentKey = getStationKey(currentStation);
        managedStations = Array.isArray(nextStations) ? nextStations.filter(isVisibleManagedStation) : [];
        rebuildStationCatalog(currentStation, currentKey, "main");
    }

    function rebuildStationCatalog(currentStation, currentKey, removedType) {
        stations = [...getMainStations(), ...communityStations];

        let nextIndex = stations.findIndex((station) => getStationKey(station) === currentKey);
        if (nextIndex < 0 && currentStation) nextIndex = stations.findIndex(station => station.id === currentStation.id);
        if (!userSelectedStation || deferredCatalogSelection) {
            const desired = deferredCatalogSelection || (savedSession && typeof savedSession === "object" ? savedSession : null);
            let savedIndex = desired ? stations.findIndex(station => getStationKey(station) === desired.key) : -1;
            if (savedIndex < 0 && desired) savedIndex = stations.findIndex(station => station.id === desired.videoId);
            const defaultIndex = !desired && siteDefaults?.defaultStationId ? stations.findIndex(station => station.stationId === siteDefaults.defaultStationId || station.id === siteDefaults.defaultStationId) : -1;
            if (savedIndex >= 0) {
                nextIndex = savedIndex;
                deferredCatalogSelection = null;
            }
            else if (defaultIndex >= 0) nextIndex = defaultIndex;
        }
        currentStationIndex = nextIndex >= 0 ? nextIndex : findValidStationIndex(currentStationIndex, 1);
        initChannelList();

        if (currentStationIndex === -1) {
            currentStationIndex = 0;
        }

        const removedCurrentStation =
            (removedType === "community" && currentStation && currentStation.type === "community") ||
            (removedType === "main" && currentStation && currentStation.source === "admin");

        if (removedCurrentStation && nextIndex === -1 && currentPlaybackSource !== "playlist") {
            deferredCatalogSelection = {key: currentKey, videoId: currentStation.id};
            loadStation(currentStationIndex, 1, {preserveSession: true});
            return;
        }

        const selectedStation = stations[currentStationIndex];
        if (currentPlaybackSource === "station" && playerReady && player && selectedStation && currentStation && getStationSourceSignature(selectedStation) !== getStationSourceSignature(currentStation)) {
            streamStatus = "";
            [tuningTimer, signalLockTimer, tuningStatusClearTimer].forEach(window.clearTimeout);
            tuningStatusEl.textContent = "";
            radioDevice.classList.remove("is-tuning");
            if (radioDevice.classList.contains("playing")) loadStationVideo(selectedStation);
            else cueStationVideo(selectedStation);
        }
        updateDisplayInfo();
    }

    // Controls route through the single YouTube receiver.
    function bindControls() {
        listBtn.addEventListener("click", () => toggleMenu(true));
        closeMenu.addEventListener("click", () => toggleMenu(false));

        playBtn.addEventListener("click", () => {
            if (currentPlaybackSource === "station") {
                userSelectedStation = true;
                deferredCatalogSelection = null;
                persistCurrentStation();
            }
            availabilitySkipVisited.clear();
            if (currentPlaybackSource === "station" && getStationAvailability(stations[currentStationIndex]).status === "unavailable") {
                retryStation(getStationKey(stations[currentStationIndex]));
                return;
            }
            if (activeYoutubePlaylist && (!activePlaybackAttempt || streamStatus === "TRY ANOTHER STATION" || streamStatus === "WAITING FOR STREAM")) {
                startYoutubePlaylist(activeYoutubePlaylist.playlistId, true, activeYoutubePlaylist.index);
                return;
            }
            if (activePlaybackAttempt?.resolving) {
                activePlaybackAttempt.requested = true;
                showTuningStatus();
                return;
            }
            if (currentPlaybackSource === "playlist" && activePlaylistItem && !activePlaybackAttempt) {
                videoAvailability.delete(activePlaylistItem.videoId);
                persistVideoAvailability();
                playPlaylistItem(activePlaylistItem);
                return;
            }
            if (activePlaybackAttempt) activePlaybackAttempt.requested = true;
            showTuningStatus();
            if (playerReady && player && player.playVideo) {
                player.playVideo();
                tuningStatusEl.textContent = "Connecting to your stream…";
            } else {
                playRequested = true;
                tuningStatusEl.textContent = "Preparing your stream…";
            }
            startStreamTimeout();
        });

        pauseBtn.addEventListener("click", () => {
            playRequested = false;
            if (activePlaybackAttempt) activePlaybackAttempt.requested = false;
            if (activePlaybackAttempt) {window.clearTimeout(activePlaybackAttempt.identityTimer); activePlaybackAttempt.identityTimer = null;}
            window.clearTimeout(tuningTimer);
            if (streamStatus !== "TRY ANOTHER STATION") {
                streamStatus = "";
                tuningStatusEl.textContent = "";
            }
            radioDevice.classList.remove("is-tuning");
            if (player && player.pauseVideo) {
                player.pauseVideo();
                togglePlayState(false);
            }
        });

        document.getElementById("nextBtn").addEventListener("click", () => stepPlayback(1));
        document.getElementById("prevBtn").addEventListener("click", () => stepPlayback(-1));
        randomBtn.addEventListener("click", loadRandomStation);

        volumeSlider.addEventListener("input", (event) => {
            if (playerReady && player && player.setVolume) {
                player.setVolume(event.target.value);
            }
            if (mobileVolumeSlider) {
                mobileVolumeSlider.value = event.target.value;
            }
            saveSetting(storageKeys.volume, event.target.value);
        });

        if (mobileVolumeSlider) {
            mobileVolumeSlider.addEventListener("input", (event) => {
                volumeSlider.value = event.target.value;
                volumeSlider.dispatchEvent(new Event("input", { bubbles: true }));
            });
        }

        bgBtn.addEventListener("click", cycleBackground);
        themeBtn.addEventListener("click", cycleTheme);
        effectBtn.addEventListener("click", cycleEffect);
        staticSoundBtn.addEventListener("click", toggleStaticSound);
        comfortModeBtn.addEventListener("click", toggleComfortMode);
        minimizeBtn.addEventListener("click", toggleMinimized);

        panelButtons.forEach((button) => {
            button.addEventListener("click", () => showFuturePanel(button.dataset.panelTarget));
        });

        proxyButtons.forEach((button) => {
            button.addEventListener("click", () => {
                const target = document.getElementById(button.dataset.proxyControl);
                if (target) target.click();
            });
        });

        document.addEventListener("pointerdown", markUserInteracted, { once: true });
        document.addEventListener("click", markUserInteracted, { once: true, capture: true });
        document.addEventListener("keydown", markUserInteracted, { once: true });

        if (reducedMotionQuery && reducedMotionQuery.addEventListener) {
            reducedMotionQuery.addEventListener("change", applyMotionPreference);
        } else if (reducedMotionQuery && reducedMotionQuery.addListener) {
            reducedMotionQuery.addListener(applyMotionPreference);
        }
        document.addEventListener("visibilitychange", syncSceneMotion);
        window.addEventListener("renner:motion-preference", syncSceneMotion);
    }

    function toggleMenu(show) {
        if (show) channelMenu.scrollIntoView({behavior: prefersReducedMotion() ? "instant" : "smooth", block: "start"});
    }

    window.onYouTubeIframeAPIReady = function () {
        youtubeApiReady = true;
        createYouTubePlayer();
    };

    // Receiver callbacks are accepted only for the current playback attempt.
    function createYouTubePlayer() {
        if (!appInitialized || player) return;
        const station = stations[currentStationIndex];
        if (!station || !isSelectableStation(station)) return;
        player = new YT.Player("player", {
            height: "200",
            width: "200",
            videoId: getStationVideoId(station),
            playerVars: {
                playsinline: 1,
                controls: 0,
                disablekb: 1
            },
            events: {
                onReady: onPlayerReady,
                onStateChange: onPlayerStateChange,
                onError: onPlayerError,
                onAutoplayBlocked
            }
        });
    }

    function onPlayerReady() {
        playerReady = true;
        const volume = getSavedNumber(storageKeys.volume, config.defaultVolume || 50, 0, 100);
        player.setVolume(volume);
        volumeSlider.value = String(volume);
        if (mobileVolumeSlider) {
            mobileVolumeSlider.value = String(volume);
        }

        if (pendingPlaylistSource) {
            const source = pendingPlaylistSource;
            pendingPlaylistSource = null;
            playPlaylistSource(source);
        } else if (pendingPlaylistItem) {
            const item = pendingPlaylistItem;
            pendingPlaylistItem = null;
            playPlaylistItem(item);
        } else {
            updateDisplayInfo();
            cueStationVideo(stations[currentStationIndex], playRequested);
        }

        hideTuningStatus();

        if (playRequested) {
            playRequested = false;
            if (!activePlaybackAttempt?.resolving) {
                player.playVideo();
                startStreamTimeout();
            }
        }

        if ("mediaSession" in navigator) {
            updateMediaSession();
        }
    }

    function onPlayerStateChange(event) {
        if (!window.YT || !YT.PlayerState) return;
        if (!isCurrentPlaybackEvent(event)) {
            if (!event?._playlistReconciled && activePlaybackAttempt?.playlistId && !activePlaybackAttempt.resolving &&
                [YT.PlayerState.PLAYING, YT.PlayerState.BUFFERING, YT.PlayerState.CUED].includes(event.data)) schedulePlaylistStateReconciliation(event.data);
            return;
        }
        window.clearTimeout(activePlaybackAttempt.identityTimer);
        activePlaybackAttempt.identityTimer = null;

        if (event.data === YT.PlayerState.PLAYING) {
            window.clearTimeout(activePlaybackAttempt.errorTimer);
            activePlaybackAttempt.errorTimer = null;
            activePlaybackAttempt.requested = true;
            activePlaybackAttempt.settled = true;
            availabilitySkipVisited.clear();
            setVideoAvailability(activePlaybackAttempt.videoId, "available");
            if (activePlaybackAttempt.playlistId) setPlaylistPlaybackStatus(activePlaybackAttempt.playlistId, "available");
            if (activeYoutubePlaylist) updateYoutubePlaylistDisplay();
            streamStatus = "";
            hideTuningStatus();
        }

        if (event.data === YT.PlayerState.BUFFERING) {
            if (["TRY ANOTHER STATION", "NO AVAILABLE CHANNELS", "PRESS PLAY"].includes(streamStatus)) return;
            streamStatus = "CONNECTING";
            togglePlayState(false);
            tuningStatusEl.textContent = "Connecting to your stream…";
            startStreamTimeout();
        }

        if (event.data === YT.PlayerState.PLAYING) togglePlayState(true);
        if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
            const failed = ["TRY ANOTHER STATION", "NO AVAILABLE CHANNELS", "PRESS PLAY"].includes(streamStatus);
            if (!failed) streamStatus = "";
            togglePlayState(false);
            window.clearTimeout(tuningTimer);
            if (!failed) tuningStatusEl.textContent = "";
            radioDevice.classList.remove("is-tuning");
        }

        if (event.data === YT.PlayerState.ENDED && !activeYoutubePlaylist && currentPlaybackSource === "station" && streamStatus !== "TRY ANOTHER STATION") {
            playNextCommunityTrack();
        }
        if (event.data === YT.PlayerState.ENDED && activePlaybackAttempt?.resolvedPlaylistSignature &&
                activePlaybackAttempt.settled === true && activePlaybackAttempt.requested && !activePlaybackAttempt.endedHandled) {
            activePlaybackAttempt.endedHandled = true;
            advanceYoutubePlaylist(1, true);
        }
    }

    function onPlayerError(event) {
        if (!isCurrentPlaybackEvent(event)) return;
        const attempt = activePlaybackAttempt;
        window.clearTimeout(attempt.identityTimer);
        attempt.identityTimer = null;
        // Only private/deleted/missing videos (100) and disabled embedding (101/150)
        // mean this source is unavailable. Browser/network/configuration errors do not.
        if (CLOSED_VIDEO_ERRORS.has(Number(event.data))) {
            if (attempt.settled === "failed" || attempt.errorTimer) return;
            // A brief stable-attempt check lets newer selection/PLAYING events cancel
            // an old failure before it changes the channel or caches an unavailable mark.
            attempt.errorTimer = window.setTimeout(() => {
                attempt.errorTimer = null;
                if (activePlaybackAttempt !== attempt || !isCurrentPlaybackEvent({target: player}) || activePlaybackAttempt !== attempt) return;
                attempt.settled = "failed";
                setVideoAvailability(attempt.videoId, "unavailable", Number(event.data));
                availabilitySkipVisited.add(`${attempt.stationKey}|${attempt.videoId}`);
                window.dispatchEvent(new CustomEvent("renner:station-skipped", {detail: {key: attempt.stationKey, videoId: attempt.videoId, code: Number(event.data)}}));
                if (attempt.playlistId && advanceYoutubePlaylist(1, attempt.requested, true)) return;
                if (attempt.playlistId) setPlaylistPlaybackStatus(attempt.playlistId, "unavailable");
                if (currentPlaybackSource === "station" && playNextAvailableCommunityTrack(attempt.requested)) return;
                if (skipToNextAvailableStation(attempt.requested)) return;
                stopForUnavailableCatalog();
            }, 180);
            return;
        }
        playRequested = false;
        if (attempt) attempt.requested = false;
        if (attempt) {window.clearTimeout(attempt.errorTimer); attempt.errorTimer = null;}
        [tuningTimer, signalLockTimer, tuningStatusClearTimer].forEach(window.clearTimeout);
        radioDevice.classList.remove("is-tuning");
        streamStatus = "TRY ANOTHER STATION";
        togglePlayState(false);
        tuningStatusEl.textContent = "Playback could not start. Try Play again; this channel has not been marked unavailable.";
        if (attempt?.playlistId) setPlaylistPlaybackStatus(attempt.playlistId, "error");
        console.warn("Renner Radio: playback error", event.data);
    }

    function onAutoplayBlocked(event) {
        if (!isCurrentPlaybackEvent(event)) return;
        window.clearTimeout(activePlaybackAttempt.identityTimer);
        activePlaybackAttempt.identityTimer = null;
        playRequested = false;
        activePlaybackAttempt.requested = false;
        window.clearTimeout(activePlaybackAttempt.errorTimer);
        activePlaybackAttempt.errorTimer = null;
        [tuningTimer, signalLockTimer, tuningStatusClearTimer].forEach(window.clearTimeout);
        radioDevice.classList.remove("is-tuning");
        streamStatus = "PRESS PLAY";
        togglePlayState(false);
        tuningStatusEl.textContent = "Your browser paused autoplay. Press Play to listen.";
        if (activePlaybackAttempt.playlistId) setPlaylistPlaybackStatus(activePlaybackAttempt.playlistId, "blocked");
    }

    function loadStation(index, direction = 1, options = {}) {
        if (!options.automaticSkip) availabilitySkipVisited.clear();
        const validIndex = findValidStationIndex(index, direction);
        if (validIndex === -1) {
            stopForUnavailableCatalog();
            return false;
        }

        const previousStationKey = getStationKey(stations[currentStationIndex]);
        currentStationIndex = validIndex;
        if (!options.preserveSession) {
            userSelectedStation = true;
            deferredCatalogSelection = null;
        }
        pendingPlaylistItem = null;
        pendingPlaylistSource = null;
        activePlaylistItem = null;
        activeYoutubePlaylist = null;
        currentPlaybackSource = "station";
        currentCommunityTrackIndex = 0;
        const autoplay = options.autoplay !== false;
        if (!options.preserveSession && getStationKey(stations[currentStationIndex]) !== previousStationKey) {
            selectRandomBackgroundForStation();
        }
        showTuningStatus();

        togglePlayState(false);
        if (playerReady && player && player.loadVideoById) {
            if (autoplay) loadStationVideo(stations[currentStationIndex]);
            else cueStationVideo(stations[currentStationIndex]);
        } else {
            playRequested = autoplay;
            beginPlaybackAttempt(getStationVideoId(stations[currentStationIndex]), "station", autoplay);
        }

        updateDisplayInfo();
        if (!options.preserveSession && stations[currentStationIndex] && stations[currentStationIndex].type !== "community") {
            saveSetting(storageKeys.station, currentStationIndex);
            persistCurrentStation();
        }

        if ("mediaSession" in navigator) {
            updateMediaSession();
        }

        if (autoplay) startStreamTimeout();
        else {
            streamStatus = "";
            [tuningTimer, signalLockTimer, tuningStatusClearTimer].forEach(window.clearTimeout);
            hideTuningStatus();
            updateHeroStreamStatus();
        }
        if (youtubeApiReady && appInitialized && !player) createYouTubePlayer();
        return true;
    }

    function playPlaylistItem(item) {
        if (!item || !isValidVideoId(item.videoId)) {
            console.warn("Renner Radio: queue item has an invalid YouTube video ID.", item);
            return false;
        }

        pendingPlaylistItem = item;
        pendingPlaylistSource = null;
        activePlaylistItem = item;
        activeYoutubePlaylist = null;
        currentPlaybackSource = "playlist";
        availabilitySkipVisited.clear();
        beginPlaybackAttempt(item.videoId, "playlist", true);
        if (getVideoAvailability(item.videoId).status === "unavailable") {
            if (!skipToNextAvailableStation(true)) stopForUnavailableCatalog();
            return false;
        }
        showTuningStatus();
        renderPlaylistDisplay(item);
        window.dispatchEvent(new Event("renner:source-changed"));

        if (!playerReady || !player || !player.loadVideoById) {
            playRequested = true;
            startStreamTimeout();
            return true;
        }

        pendingPlaylistItem = null;
        player.loadVideoById(item.videoId);
        togglePlayState(false);

        if ("mediaSession" in navigator) {
            updatePlaylistMediaSession(item);
        }

        startStreamTimeout();
        return true;
    }

    function playPlaylistSource(source) {
        if (!source || !isValidPlaylistId(source.playlistId)) return false;
        pendingPlaylistItem = null;
        activePlaylistItem = null;
        pendingPlaylistSource = null;
        currentPlaybackSource = "playlist";
        availabilitySkipVisited.clear();
        activeYoutubePlaylist = {playlistId: source.playlistId, playlistUrl: `https://www.youtube.com/playlist?list=${source.playlistId}`,
            title: source.title || "YouTube Playlist", catalog: [], index: 0};
        setPlaylistPlaybackStatus(source.playlistId, "checking");
        showTuningStatus();
        if (!playerReady || !player) {
            pendingPlaylistSource = {...source};
            playRequested = true;
            beginPlaybackAttempt("", "playlist", true, {playlistId: source.playlistId});
            updateYoutubePlaylistDisplay();
            startStreamTimeout();
            return true;
        }
        return startYoutubePlaylist(source.playlistId, true);
    }

    function renderPlaylistDisplay(item) {
        stationNameEl.textContent = item.title || "YouTube Track";
        updateStationMeta("QUEUE / Temporary community item");
        updateBottomNowPlaying(item.title || "YouTube Track", "Community Queue");
        freqValueEl.textContent = "--";
        document.querySelectorAll(".channel-item").forEach((channelItem) => {
            channelItem.classList.remove("active-channel");
            channelItem.setAttribute("aria-current", "false");
        });
    }

    function beginPlaybackAttempt(videoId, source = "station", requested = false, playlist = {}) {
        if (activePlaybackAttempt) {
            window.clearTimeout(activePlaybackAttempt.errorTimer);
            window.clearTimeout(activePlaybackAttempt.resolverTimer);
            window.clearTimeout(activePlaybackAttempt.identityTimer);
            activePlaybackAttempt.resolverAbort?.abort();
        }
        activePlaybackAttempt = {sequence: ++playbackAttemptSequence, videoId, source, requested, settled: false,
            stationKey: source === "station" ? getStationKey(stations[currentStationIndex]) : playlist.playlistId ? `playlist:${playlist.playlistId}` : "playlist", ...playlist};
        return activePlaybackAttempt;
    }

    function isCurrentPlaybackEvent(event) {
        if (!activePlaybackAttempt || !playerReady) return false;
        const target = event?.target || player;
        let observed = "";
        let identityAvailable = false;
        try {
            if (typeof target?.getVideoData === "function") {
                identityAvailable = true;
                observed = target.getVideoData()?.video_id || "";
            }
            if (!observed && typeof target?.getVideoUrl === "function") {
                identityAvailable = true;
                observed = String(target.getVideoUrl() || "").match(/[?&]v=([A-Za-z0-9_-]{11})(?:[&#]|$)/)?.[1] || "";
            }
        } catch (_) { return false; }
        // The iframe does not attach a request token to errors. If it cannot identify
        // the loaded video, do not assign its late event to a newly selected channel.
        if (activePlaybackAttempt.playlistId) return identifyYoutubePlaylistEvent(target, observed);
        return identityAvailable ? observed === activePlaybackAttempt.videoId : true;
    }

    // Playlist resolution, native identity reconciliation and bounded advancement.
    function readYoutubePlaylist(target = player) {
        try {
            const ids = typeof target?.getPlaylist === "function" ? target.getPlaylist() : [];
            const index = typeof target?.getPlaylistIndex === "function" ? Number(target.getPlaylistIndex()) : -1;
            return {ids: Array.isArray(ids) ? ids.filter(isValidVideoId) : [], index};
        } catch (_) {return {ids: [], index: -1};}
    }

    function schedulePlaylistStateReconciliation(expectedState) {
        const attempt = activePlaybackAttempt;
        if (!attempt?.playlistId || typeof player?.getPlayerState !== "function") return;
        if (expectedState === YT.PlayerState.PLAYING || attempt.identityExpectedState !== YT.PlayerState.PLAYING) attempt.identityExpectedState = expectedState;
        if (attempt.identityTimer) return;
        let remaining = 40;
        const check = () => {
            attempt.identityTimer = null;
            if (activePlaybackAttempt !== attempt || attempt.resolving || attempt.settled === "failed") return;
            let state;
            try {state = Number(player.getPlayerState());} catch (_) {return;}
            if (state === YT.PlayerState.PAUSED || state === YT.PlayerState.ENDED) return;
            const playingExpected = attempt.identityExpectedState === YT.PlayerState.PLAYING;
            if ((!playingExpected || state === YT.PlayerState.PLAYING) && [YT.PlayerState.PLAYING, YT.PlayerState.BUFFERING, YT.PlayerState.CUED].includes(state) && isCurrentPlaybackEvent({target: player})) {
                onPlayerStateChange({data: state, target: player, _playlistReconciled: true});
                return;
            }
            if (--remaining > 0) attempt.identityTimer = window.setTimeout(check, 50);
        };
        attempt.identityTimer = window.setTimeout(check, 50);
    }

    function identifyYoutubePlaylistEvent(target, observed) {
        const attempt = activePlaybackAttempt;
        if (!attempt?.playlistId || !activeYoutubePlaylist || activeYoutubePlaylist.playlistId !== attempt.playlistId ||
                attempt.resolving || !isValidVideoId(observed)) return false;
        if (attempt.resolvedPlaylistSignature) {
            const ids = activeYoutubePlaylist.catalog, index = activeYoutubePlaylist.index;
            // Public playlist snapshots play explicit videos. Native list caches may still
            // describe the old queue, so only the selected real video can confirm it.
            if (!Number.isInteger(index) || index < 0 || index >= ids.length || ids[index] !== attempt.videoId ||
                    observed !== attempt.videoId || ids.join("|") !== attempt.resolvedPlaylistSignature) return false;
            attempt.catalogConfirmed = true;
            return true;
        }
        const {ids, index} = readYoutubePlaylist(target);
        if (!ids.length || !Number.isInteger(index) || index < 0 || ids[index] !== observed) return false;
        let observedList = "";
        try {observedList = String(target.getVideoUrl?.() || "").match(/[?&]list=([A-Za-z0-9_-]+)(?:[&#]|$)/)?.[1] || "";} catch (_) {return false;}
        const signature = ids.join("|");
        if (observedList && observedList !== attempt.playlistId) return false;
        // Playlist callbacks carry no request token. Until a changed catalog or an
        // explicit matching list URL is observed, an old iframe catalog is ignored.
        if (!attempt.catalogConfirmed && observedList !== attempt.playlistId && signature === attempt.previousPlaylistSignature) return false;
        attempt.catalogConfirmed = true;
        activeYoutubePlaylist.catalog = ids;
        activeYoutubePlaylist.index = index;
        youtubePlaylistCatalogs.set(attempt.playlistId, ids);
        if (attempt.videoId !== observed) {
            window.clearTimeout(attempt.errorTimer);
            activePlaybackAttempt = {...attempt, sequence: ++playbackAttemptSequence, videoId: observed, settled: false, errorTimer: null};
        }
        return true;
    }

    function startYoutubePlaylist(playlistId, autoplay, index = 0) {
        const resolution = getFreshPlaylistResolution(playlistId);
        const method = autoplay ? "loadVideoById" : "cueVideoById";
        const previousPlaylistSignature = readYoutubePlaylist().ids.join("|");
        const oldConfirmed = activePlaybackAttempt?.playlistId === playlistId && activePlaybackAttempt.catalogConfirmed;
        beginPlaybackAttempt("", currentPlaybackSource, autoplay, {playlistId, previousPlaylistSignature, catalogConfirmed: Boolean(oldConfirmed)});
        const station = stations[currentStationIndex];
        if (!activeYoutubePlaylist || activeYoutubePlaylist.playlistId !== playlistId) activeYoutubePlaylist = {
            playlistId, playlistUrl: `https://www.youtube.com/playlist?list=${playlistId}`, title: station?.name || "YouTube Playlist", catalog: [], index};
        if (!player || typeof player[method] !== "function") {
            streamStatus = "TRY ANOTHER STATION";
            togglePlayState(false);
            tuningStatusEl.textContent = "This playlist could not start here. Try Play again or open the source on YouTube.";
            activePlaybackAttempt.requested = false;
            updateYoutubePlaylistDisplay();
            setPlaylistPlaybackStatus(playlistId, "error");
            window.dispatchEvent(new Event("renner:source-changed"));
            updateHeroStreamStatus();
            return false;
        }
        if (!resolution) {
            activePlaybackAttempt.resolving = true;
            updateYoutubePlaylistDisplay();
            setPlaylistPlaybackStatus(playlistId, "checking");
            window.dispatchEvent(new Event("renner:source-changed"));
            togglePlayState(false);
            return resolveYoutubePlaylist(activePlaybackAttempt, index, autoplay) !== false;
        }
        return queueYoutubePlaylist(activePlaybackAttempt, index, autoplay, resolution);
    }

    function getFreshPlaylistResolution(playlistId) {
        const resolution = youtubePlaylistResolutions.get(playlistId);
        return resolution && resolution.checkedAt + PLAYLIST_RESOLUTION_TTL_MS > Date.now() ? resolution : null;
    }

    function queueYoutubePlaylist(attempt, index, autoplay, resolution) {
        if (activePlaybackAttempt !== attempt || !activeYoutubePlaylist) return false;
        const playlistId = attempt.playlistId;
        const method = resolution ? (autoplay ? "loadVideoById" : "cueVideoById") : (autoplay ? "loadPlaylist" : "cuePlaylist");
        attempt.resolving = false;
        try {
            if (resolution) {
                const ids = resolution.videoIds;
                if (!Array.isArray(ids) || !ids.length || !ids.every(isValidVideoId)) throw new Error("Invalid resolved playlist.");
                const selected = Number.isInteger(index) && index >= 0 && index < ids.length ? index : 0;
                attempt.resolvedPlaylistSignature = ids.join("|");
                attempt.videoId = ids[selected];
                attempt.catalogConfirmed = false;
                activeYoutubePlaylist.catalog = [...ids];
                activeYoutubePlaylist.index = selected;
                youtubePlaylistCatalogs.set(playlistId, [...ids]);
                player[method](attempt.videoId);
            } else player[method]({listType: "playlist", list: playlistId, index, startSeconds: 0});
        } catch (_) {
            streamStatus = "TRY ANOTHER STATION";
            activePlaybackAttempt.requested = false;
            togglePlayState(false);
            tuningStatusEl.textContent = "This playlist could not start here. Try Play again or open the source on YouTube.";
            updateYoutubePlaylistDisplay();
            setPlaylistPlaybackStatus(playlistId, "error");
            window.dispatchEvent(new Event("renner:source-changed"));
            updateHeroStreamStatus();
            return false;
        }
        updateYoutubePlaylistDisplay();
        setPlaylistPlaybackStatus(playlistId, "checking");
        window.dispatchEvent(new Event("renner:source-changed"));
        togglePlayState(false);
        if (autoplay) {showTuningStatus(); startStreamTimeout();}
        return true;
    }

    function resolveYoutubePlaylist(attempt, index, autoplay) {
        const playlistId = attempt.playlistId;
        const resolverUrl = String(config.youtubePlaylistResolverUrl || "/api/youtube-playlist");
        const readFetch = typeof window.fetch === "function" ? window.fetch.bind(window) : typeof fetch === "function" ? fetch : null;
        const fail = (allowNativeFallback = true) => {
            if (activePlaybackAttempt !== attempt) return;
            window.clearTimeout(attempt.resolverTimer);
            attempt.resolverAbort?.abort();
            attempt.resolverTimer = null;
            attempt.resolverAbort = null;
            attempt.resolving = false;
            // Ordinary public playlists can still use the official list API when
            // this host has no resolver or a temporary upstream/network failure.
            // A Music mix needs verified IDs; malformed resolver data is never used.
            const nativeMethod = autoplay && attempt.requested ? "loadPlaylist" : "cuePlaylist";
            if (allowNativeFallback && !/^RD/.test(playlistId) && typeof player?.[nativeMethod] === "function") {
                attempt.nativePlaylistFallback = true;
                return queueYoutubePlaylist(attempt, index, autoplay && attempt.requested, null);
            }
            attempt.requested = false;
            [tuningTimer, signalLockTimer, tuningStatusClearTimer].forEach(window.clearTimeout);
            radioDevice.classList.remove("is-tuning");
            streamStatus = "TRY ANOTHER STATION";
            togglePlayState(false);
            tuningStatusEl.textContent = "This playlist could not start here. Try Play again or open the source on YouTube.";
            setPlaylistPlaybackStatus(playlistId, "error");
            updateHeroStreamStatus();
            return false;
        };
        if (!readFetch || !/^(?:https?:\/\/|\/[^/])/.test(resolverUrl)) return fail();
        attempt.resolverAbort = typeof AbortController === "function" ? new AbortController() : null;
        const separator = resolverUrl.includes("?") ? "&" : "?";
        // Music's public playlist page exposes audio lists that the regular page
        // may omit. Preserve the canonical source separately from this read URL.
        const publicHost = /^PL/.test(playlistId) ? "music.youtube.com" : "www.youtube.com";
        const requestUrl = `${resolverUrl}${separator}url=${encodeURIComponent(`https://${publicHost}/playlist?list=${playlistId}`)}`;
        attempt.resolverTimer = window.setTimeout(() => fail(), PLAYLIST_RESOLUTION_TIMEOUT_MS);
        Promise.resolve().then(() => {
            if (activePlaybackAttempt !== attempt || !attempt.resolving) throw new Error("Playlist selection changed.");
            return readFetch(requestUrl, {method: "GET", credentials: "omit", cache: "no-store", signal: attempt.resolverAbort?.signal});
        })
            .then(response => {
                if (!response?.ok) throw new Error("Playlist source could not be read.");
                return response.json();
            })
            .then(payload => {
                if (activePlaybackAttempt !== attempt || !attempt.resolving) return;
                if (payload?.ok !== true || payload.playlistId !== playlistId || payload.source !== "public-page" || !Array.isArray(payload.videoIds) ||
                    !payload.videoIds.length || payload.videoIds.length > 500 || !payload.videoIds.every(isValidVideoId)) {
                    const invalid = new Error("Invalid playlist source response.");
                    invalid.invalidPlaylistPayload = true;
                    throw invalid;
                }
                window.clearTimeout(attempt.resolverTimer);
                attempt.resolverTimer = null;
                attempt.resolverAbort = null;
                const resolution = {videoIds: [...payload.videoIds], title: typeof payload.title === "string" ? payload.title.slice(0, 160) : "",
                    partial: payload.partial === true, source: "public-page", checkedAt: Date.now()};
                youtubePlaylistResolutions.set(playlistId, resolution);
                queueYoutubePlaylist(attempt, index, autoplay && attempt.requested, resolution);
            }).catch(error => {
                if (activePlaybackAttempt === attempt && attempt.resolving) fail(error?.invalidPlaylistPayload !== true);
            });
    }

    function updateYoutubePlaylistDisplay() {
        if (!activeYoutubePlaylist) return;
        let trackTitle = "";
        try {if (activePlaybackAttempt?.catalogConfirmed) trackTitle = player?.getVideoData?.().title || "";} catch (_) {}
        const station = stations[currentStationIndex];
        const title = currentPlaybackSource === "station" ? station?.name || activeYoutubePlaylist.title : activeYoutubePlaylist.title;
        stationNameEl.textContent = title;
        const resolution = youtubePlaylistResolutions.get(activeYoutubePlaylist.playlistId);
        const loadedText = resolution ? `Public playlist · ${resolution.videoIds.length} tracks loaded` : "YouTube Playlist";
        const meta = trackTitle ? `Now playing: ${trackTitle}${resolution ? ` · ${resolution.videoIds.length} tracks loaded` : ""}` : loadedText;
        updateStationMeta(meta);
        updateBottomNowPlaying(title, resolution ? meta : trackTitle || "YouTube Playlist");
        freqValueEl.textContent = currentPlaybackSource === "station" ? station?.freq || "--" : "--";
        if (currentPlaybackSource === "playlist") document.querySelectorAll(".channel-item").forEach(item => {item.classList.remove("active-channel"); item.setAttribute("aria-current", "false");});
    }

    function advanceYoutubePlaylist(direction = 1, autoplay = true, failed = false) {
        if (!activeYoutubePlaylist || !player || !activePlaybackAttempt?.playlistId) return false;
        const ids = activeYoutubePlaylist.catalog;
        if (!ids.length) return false;
        let next = -1;
        for (let offset = 1; offset <= ids.length; offset += 1) {
            const candidate = (activeYoutubePlaylist.index + (direction < 0 ? -offset : offset) + ids.length * 2) % ids.length;
            if (getVideoAvailability(ids[candidate]).status === "unavailable") continue;
            if (failed && availabilitySkipVisited.has(`${activePlaybackAttempt.stationKey}|${ids[candidate]}`)) continue;
            next = candidate;
            break;
        }
        if (next < 0) return false;
        const playlistId = activeYoutubePlaylist.playlistId;
        const previousIndex = activeYoutubePlaylist.index;
        activeYoutubePlaylist.index = next;
        const oldAttempt = activePlaybackAttempt;
        beginPlaybackAttempt(ids[next], currentPlaybackSource, autoplay, {playlistId, catalogConfirmed: !oldAttempt.resolvedPlaylistSignature, previousPlaylistSignature: ids.join("|"),
            resolvedPlaylistSignature: oldAttempt.resolvedPlaylistSignature || ""});
        try {
            if (oldAttempt.resolvedPlaylistSignature) player[autoplay ? "loadVideoById" : "cueVideoById"](ids[next]);
            else if (autoplay && typeof player.playVideoAt === "function") player.playVideoAt(next);
            else if (!startYoutubePlaylist(playlistId, autoplay, next)) return false;
        } catch (_) {
            activePlaybackAttempt = oldAttempt;
            activeYoutubePlaylist.index = previousIndex;
            return false;
        }
        togglePlayState(false);
        if (autoplay) {showTuningStatus(); startStreamTimeout();}
        else {streamStatus = ""; hideTuningStatus(); updateHeroStreamStatus();}
        updateYoutubePlaylistDisplay();
        return true;
    }

    function stepPlayback(direction) {
        availabilitySkipVisited.clear();
        if (activeYoutubePlaylist && advanceYoutubePlaylist(direction, true)) return true;
        return stepStation(direction);
    }

    // Radio and community track selection.
    function getStationVideoId(station) {
        if (getStationPlaylistId(station)) return "";
        if (station?.type !== "community") return station?.id || "";
        const tracks = getActiveCommunityTracks(station);
        const index = tracks.findIndex(track => getVideoAvailability(track.videoId).status !== "unavailable");
        currentCommunityTrackIndex = Math.max(index, 0);
        return tracks[currentCommunityTrackIndex]?.videoId || "";
    }

    function cueStationVideo(station, requested = false) {
        if (!player || !player.cueVideoById || !station) return;
        const playlistId = getStationPlaylistId(station);
        if (playlistId) return startYoutubePlaylist(playlistId, requested);
        const videoId = getStationVideoId(station);
        beginPlaybackAttempt(videoId, "station", requested);
        if (station.type === "community") updateCommunityTrackDisplay(station, getActiveCommunityTracks(station)[currentCommunityTrackIndex]);
        player.cueVideoById(videoId);
    }

    function stepStation(direction) {
        const rows = getFrequencyStationRows();
        const position = rows.findIndex(row => row.index === currentStationIndex);
        for (let offset = 1; offset <= rows.length; offset += 1) {
            const row = rows[(position + (direction < 0 ? -offset : offset) + rows.length * 2) % rows.length];
            if (isSelectableStation(row.station)) return loadStation(row.index, direction);
        }
        stopForUnavailableCatalog();
        return false;
    }

    function skipToNextAvailableStation(autoplay) {
        const rows = getFrequencyStationRows();
        const position = rows.findIndex(row => row.index === currentStationIndex);
        for (let offset = 1; offset <= rows.length; offset += 1) {
            const row = rows[(position + offset + rows.length) % rows.length];
            if (!isSelectableStation(row.station)) continue;
            const ids = getStationAvailability(row.station).videoIds;
            if (ids.length && ids.every(videoId => availabilitySkipVisited.has(`${getStationKey(row.station)}|${videoId}`))) continue;
            return loadStation(row.index, 1, {automaticSkip: true, autoplay, preserveSession: !autoplay});
        }
        return false;
    }

    function stopForUnavailableCatalog() {
        playRequested = false;
        pendingPlaylistItem = null;
        pendingPlaylistSource = null;
        if (activePlaybackAttempt) {
            window.clearTimeout(activePlaybackAttempt.errorTimer);
            window.clearTimeout(activePlaybackAttempt.resolverTimer);
            window.clearTimeout(activePlaybackAttempt.identityTimer);
            activePlaybackAttempt.resolverAbort?.abort();
        }
        activePlaybackAttempt = null;
        [tuningTimer, signalLockTimer, tuningStatusClearTimer].forEach(window.clearTimeout);
        radioDevice.classList.remove("is-tuning");
        streamStatus = "NO AVAILABLE CHANNELS";
        togglePlayState(false);
        if (player && player.pauseVideo) player.pauseVideo();
        tuningStatusEl.textContent = "No playable channels found. Recheck a channel or try again later.";
        updateHeroStreamStatus();
    }

    function loadStationVideo(station) {
        if (!player || !player.loadVideoById || !station) return;
        const playlistId = getStationPlaylistId(station);
        if (playlistId) return startYoutubePlaylist(playlistId, true);

        beginPlaybackAttempt(getStationVideoId(station), "station", true);

        if (station.type === "community") {
            const track = getActiveCommunityTracks(station)[currentCommunityTrackIndex];
            if (!track) return;
            updateCommunityTrackDisplay(station, track);
            try {
                // TODO V15.5: use known track durations to sync visitors to the same channel position.
                player.loadVideoById({
                    videoId: track.videoId,
                    startSeconds: 0
                });
                return;
            } catch (error) {
                console.warn("Renner Radio: community station sync seek failed. Starting normally.", error);
            }
        }

        player.loadVideoById(station.id);
    }

    function playNextCommunityTrack() {
        return playNextAvailableCommunityTrack(true);
    }

    function playNextAvailableCommunityTrack(autoplay = true) {
        const station = stations[currentStationIndex];
        if (!station || station.type !== "community" || !player || !player.loadVideoById) return false;

        const tracks = getActiveCommunityTracks(station);
        if (!tracks.length) return false;
        let next = -1;
        for (let offset = 1; offset <= tracks.length; offset += 1) {
            const candidate = (currentCommunityTrackIndex + offset) % tracks.length;
            if (getVideoAvailability(tracks[candidate].videoId).status !== "unavailable" &&
                !availabilitySkipVisited.has(`${getStationKey(station)}|${tracks[candidate].videoId}`)) {
                next = candidate;
                break;
            }
        }
        if (next < 0) return false;
        currentCommunityTrackIndex = next;
        const track = tracks[currentCommunityTrackIndex];
        beginPlaybackAttempt(track.videoId, "station", autoplay);
        updateCommunityTrackDisplay(station, track);
        if (autoplay) player.loadVideoById(track.videoId);
        else player.cueVideoById(track.videoId);
        togglePlayState(false);
        if (autoplay) {showTuningStatus(); startStreamTimeout();}
        else {streamStatus = ""; hideTuningStatus(); updateHeroStreamStatus();}
        return true;
    }

    function getActiveCommunityTracks(station) {
        return Array.isArray(station.tracks)
            ? station.tracks
                .filter((track) => track && track.status === "active" && isValidVideoId(track.videoId))
                .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
            : [];
    }

    function updateCommunityTrackDisplay(station, track) {
        if (!station || station.type !== "community") return;

        const title = track && track.title ? track.title : "YouTube Track";
        updateStationMeta(`Now playing: ${title}`);
        updateBottomNowPlaying(station.name, `${title} / ${station.freq || "--"} FM`);
        window.dispatchEvent(new Event("renner:source-changed"));

        if ("mediaSession" in navigator) {
            updateCommunityMediaSession(station, track);
        }
    }

    function loadRandomStation() {
        const validIndexes = stations
            .map((station, index) => (isSelectableStation(station) ? index : -1))
            .filter((index) => index !== -1);

        if (!validIndexes.length) {
            stopForUnavailableCatalog();
            return;
        }

        const pool = validIndexes.length > 1 ? validIndexes.filter((index) => index !== currentStationIndex) : validIndexes;
        const randomIndex = pool[Math.floor(Math.random() * pool.length)];
        loadStation(randomIndex, 1);
    }

    // Station labels, artwork and desktop media controls.
    function updateDisplayInfo() {
        if (activeYoutubePlaylist && currentPlaybackSource === "playlist") {
            updateYoutubePlaylistDisplay();
            updateHeroStreamStatus();
            return;
        }
        if (currentPlaybackSource === "playlist" && activePlaylistItem) {
            renderPlaylistDisplay(activePlaylistItem);
            updateHeroStreamStatus();
            return;
        }
        const station = stations[currentStationIndex];
        if (!station) return;
        stationNameEl.textContent = station.name;
        freqValueEl.textContent = station.freq;
        if (getStationPlaylistId(station)) {
            updateStationMeta("YouTube Playlist");
            updateBottomNowPlaying(station.name, `YouTube Playlist / ${station.freq || "--"} FM`);
        } else if (station.type === "community") {
            const remaining = formatRemainingTime(station.expiresAt - Date.now());
            const tracks = getActiveCommunityTracks(station);
            const trackTitle = tracks[currentCommunityTrackIndex]?.title || tracks[0]?.title || "Waiting for tracks";
            updateStationMeta(`${trackTitle} / ${remaining} left`);
            updateBottomNowPlaying(station.name, `${tracks.length} tracks / ${station.freq || "--"} FM`);
        } else {
            const category = getSafeStationCategory(station.category);
            updateStationMeta(`${category} mood / ${station.freq || "--"} FM`);
            updateBottomNowPlaying(station.name, `${category} / ${station.freq || "--"} FM`);
        }
        if (getStationPlaylistId(station) && activeYoutubePlaylist?.playlistId === getStationPlaylistId(station)) updateYoutubePlaylistDisplay();

        document.querySelectorAll(".channel-item").forEach((item) => {
            const active = Number(item.dataset.stationIndex) === currentStationIndex;
            item.classList.toggle("active-channel", active);
            item.setAttribute("aria-current", active ? "true" : "false");
            const badge = item.querySelector(".ch-badge");
            if (badge) badge.textContent = active ? "SELECTED" : "TUNE IN";
            updateStationAvailabilityRow(item, stations[Number(item.dataset.stationIndex)]);
        });
        updateStationVisualHooks(station);
        applyManagedBackgroundForCurrentStation("station");
        window.dispatchEvent(new CustomEvent("renner:station-changed", {detail: station}));
    }

    function getStationListMeta(station) {
        if (station.type === "community") {
            const remaining = formatRemainingTime(station.expiresAt - Date.now());
            if (getStationPlaylistId(station)) return `${station.displayName || "RadioGuest"} / YouTube Playlist / ${remaining}`;
            const trackCount = getActiveCommunityTracks(station).length;
            return `${station.displayName || "RadioGuest"} / ${trackCount} tracks / ${remaining}`;
        }

        return getSafeStationCategory(station.category);
    }

    function getStationKey(station) {
        if (!station) return "";
        if (station.type === "community") return `community:${station.stationId || station.id}`;
        if (station.source === "admin") return `admin:${station.stationId || station.id}`;
        return `fallback:${station.id}`;
    }

    function persistCurrentStation() {
        if (currentPlaybackSource !== "station") return;
        const station = stations[currentStationIndex];
        if (!station || station.type === "community") return;
        savedSession = { key: getStationKey(station), videoId: station.id };
        saveSetting("renner:last-session", JSON.stringify(savedSession));
    }

    function getMainStations() {
        return managedStations.length ? managedStations : fallbackStations;
    }

    function isVisibleManagedStation(station) {
        return Boolean(
            station &&
            station.status === "active" &&
            station.isActive !== false &&
            (isValidVideoId(station.id) || Boolean(getStationPlaylistId(station)))
        );
    }

    function getSafeStationCategory(category) {
        const normalized = String(category || "CUSTOM").trim().toUpperCase();
        return PUBLIC_STATION_CATEGORIES.includes(normalized)
            ? normalized
            : "CUSTOM";
    }

    function isVisibleCommunityStation(station) {
        return Boolean(
            station &&
            station.type === "community" &&
            station.status === "active" &&
            Number(station.expiresAt) > Date.now() &&
            (getActiveCommunityTracks(station).length > 0 || Boolean(getStationPlaylistId(station)))
        );
    }

    function formatRemainingTime(milliseconds) {
        const safeMs = Math.max(0, Number(milliseconds) || 0);
        const totalSeconds = Math.ceil(safeMs / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        if (minutes <= 0) return `${seconds}s`;
        return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
    }

    function updateStationMeta(text) {
        if (stationMetaEl) stationMetaEl.textContent = text;
    }

    function updateBottomNowPlaying(name, meta) {
        if (barStationNameEl) barStationNameEl.textContent = name;
        if (barStationMetaEl) barStationMetaEl.textContent = meta;
    }

    function updateStationVisualHooks(station) {
        if (!station) return;

        const accent = getStationAccent(station);
        radioDevice.style.setProperty("--station-accent", accent);
        applyStationArtwork(barThumbEl, station, getStationGlyph(getSafeStationCategory(station.category)));

        if (heroStatusPillEl) {
            updateHeroStreamStatus();
            heroStatusPillEl.style.setProperty("--station-accent", accent);
        }
    }

    function updateHeroStreamStatus() {
        if (!heroStatusPillEl) return;
        const station = stations[currentStationIndex];
        heroStatusPillEl.textContent = streamStatus || (radioDevice.classList.contains("playing") ? "LISTENING" : (station?.type === "community" ? "COMMUNITY FM" : "READY TO TUNE"));
    }

    function applyStationArtwork(element, station, fallbackText) {
        if (!element || !station) return;

        const artworkUrl = getStationArtwork(station);
        element.style.setProperty("--station-accent", getStationAccent(station));
        element.classList.toggle("has-media", Boolean(artworkUrl));
        element.style.backgroundImage = artworkUrl ? `url("${artworkUrl}")` : "";

        const label = element.querySelector("span") || element;
        label.textContent = artworkUrl ? "" : fallbackText;
    }

    function getStationArtwork(station) {
        if (!station) return "";
        const custom = [station.thumbnail, station.image, station.fallbackImage].find((value) => typeof value === "string" && value.trim());
        if (custom) return custom;
        const name = `${station.name} ${station.category}`.toLowerCase();
        if (/space|ambient/.test(name)) return "assets/backgrounds/gifs/original-04-poster.webp";
        if (/sun|morning|love/.test(name)) return "assets/backgrounds/images/golden-hour.webp";
        if (/synth|retro|drive|gaming/.test(name)) return "assets/backgrounds/images/neon-drift.webp";
        if (/rain|night/.test(name)) return "assets/backgrounds/images/neon-drift.webp";
        return "assets/backgrounds/images/midnight-studio.webp";
    }

    function getStationStillPoster(station) {
        const still = [station?.backgroundImageUrl, station?.thumbnail, station?.image]
            .map(value => replaceRetiredScene(value, true))
            .find(value => typeof value === "string" && value.trim() && !/\.(gif|mp4|webm|mov)(?:[?#]|$)/i.test(value));
        return still || getStationArtwork({...station, thumbnail: "", image: "", fallbackImage: ""});
    }

    function getStationAccent(station) {
        return station && typeof station.accentColor === "string" && /^#[0-9A-Fa-f]{6}$/.test(station.accentColor)
            ? station.accentColor
            : "var(--accent-color)";
    }

    function getStationGlyph(category) {
        const glyphs = {
            LOFI: "LO",
            SONG: "SO",
            "COMMUNITY FM": "CM"
        };

        return glyphs[category] || "ON";
    }

    function togglePlayState(isPlaying) {
        playBtn.classList.toggle("hidden", isPlaying);
        pauseBtn.classList.toggle("hidden", !isPlaying);
        radioDevice.classList.toggle("playing", isPlaying);
        vinylRecord.classList.toggle("spinning", isPlaying);
        window.dispatchEvent(new CustomEvent("renner:playback-changed", {detail: {isPlaying}}));
        updateHeroStreamStatus();
        if ("mediaSession" in navigator) navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
        meterBars.forEach((bar) => bar.classList.toggle("active", isPlaying));
    }

    function cycleBackground() {
        const backgrounds = config.backgrounds || [];
        if (!backgrounds.length) return;

        clearRandomBackgroundSelection();
        currentBgIndex = (currentBgIndex + 1) % backgrounds.length;
        applyBackground(currentBgIndex);
        saveSetting("renner:scene-mode", "custom");
        saveSetting(storageKeys.background, currentBgIndex);
    }

    function cycleTheme() {
        const themes = config.themes || [];
        if (!themes.length) return;

        currentThemeIndex = (currentThemeIndex + 1) % themes.length;
        applyTheme(currentThemeIndex);
        saveSetting(storageKeys.theme, currentThemeIndex);
    }

    function cycleEffect() {
        const effects = config.effects || [];
        if (!effects.length) return;

        // Grain has its own persistent control; retain old indices for saved settings.
        do { currentEffectIndex = (currentEffectIndex + 1) % effects.length; }
        while (effects[currentEffectIndex].className === "effect-noise" && effects.length > 1);
        applyEffect(currentEffectIndex);
        saveSetting(storageKeys.effect, currentEffectIndex);
    }

    function toggleStaticSound() {
        staticSoundEnabled = !staticSoundEnabled;
        saveSetting(storageKeys.staticSound, staticSoundEnabled ? "1" : "0");
        updateTuningControlUi();
        if (staticSoundEnabled) {
            probeStaticAudioFile();
        }
    }

    function toggleComfortMode() {
        comfortModeEnabled = !comfortModeEnabled;
        if (comfortModeEnabled && staticSoundEnabled) {
            staticSoundEnabled = false;
            saveSetting(storageKeys.staticSound, "0");
        }
        saveSetting(storageKeys.comfortMode, comfortModeEnabled ? "1" : "0");
        applyComfortMode();
        updateTuningControlUi();
    }

    function toggleMinimized() {
        radioDevice.classList.toggle("minimized");
        document.body.classList.toggle("focus-mode", radioDevice.classList.contains("minimized"));
        minimizeBtn.setAttribute("aria-pressed", String(radioDevice.classList.contains("minimized")));
        const iconClass = radioDevice.classList.contains("minimized") ? "fas fa-compress" : "fas fa-expand";
        minimizeBtn.innerHTML = `<i class="${iconClass}"></i>`;
        minimizeBtn.setAttribute("aria-label", radioDevice.classList.contains("minimized") ? "Exit focus mode" : "Enter focus mode");
    }

    function showFuturePanel(panelId) {
        if (panelId === "channelMenu") { toggleMenu(true); return; }
        window.RENNER_UI?.openPanel(panelId);
    }

    function updateClock() {
        const now = new Date();
        const timeString = now.toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit"
        });

        document.getElementById("clock").textContent = timeString;
    }

    function setMediaSessionMetadata(title, artist, album) {
        if (!("mediaSession" in navigator)) return;

        navigator.mediaSession.metadata = new MediaMetadata({
            title,
            artist,
            album,
            artwork: [
                {
                    src: (config.backgrounds || [])[0] || "",
                    sizes: "96x96",
                    type: "image/gif"
                }
            ]
        });
    }

    function updateMediaSession() {
        if (!("mediaSession" in navigator)) return;
        setMediaSessionMetadata(stations[currentStationIndex].name, "Renner Radio Station", "Live 24/7");

        navigator.mediaSession.setActionHandler("play", () => {
            playBtn.click();
        });

        navigator.mediaSession.setActionHandler("pause", () => {
            pauseBtn.click();
        });

        navigator.mediaSession.setActionHandler("previoustrack", () => stepPlayback(-1));
        navigator.mediaSession.setActionHandler("nexttrack", () => stepPlayback(1));
    }

    function updatePlaylistMediaSession(item) {
        setMediaSessionMetadata(item.title || "YouTube Track", "Renner Queue", "Community YouTube Queue");
    }

    function updateCommunityMediaSession(station, track) {
        setMediaSessionMetadata(station.name, track?.title || "Community Track", "Renner Community FM");
    }

    // Read-only subscriptions and managed site defaults.
    function checkFirebaseReadiness() {
        let handled = false;

        const handleFirebaseState = async (state) => {
            if (handled) return;
            handled = true;

            if (!state || !state.configured) {
                if (state && state.error) {
                    setFirebaseStatus("Community unavailable", "error");
                    console.warn("Renner Radio: Firebase error. Static radio continues.", state.error);
                    console.warn("Firebase smoke test failed.", state.error);
                } else {
                    setFirebaseStatus("Local listening", "static");
                    console.info("Renner Radio: Firebase config missing. Static mode continues.");
                    console.info("Firebase smoke test skipped.");
                }
                return;
            }

            const firebaseBridge = window.BODWOLF_FIREBASE;
            const user = firebaseBridge ? await firebaseBridge.signInAnonymousUser() : null;
            const databaseRootRef = firebaseBridge ? firebaseBridge.getDatabaseRootRef() : null;

            if (user && databaseRootRef) {
                setFirebaseStatus("Community connected", "ready");
                console.log("Firebase ready.");
                // Production initialization must not write test records to the community database.
                setupManagedStations(firebaseBridge);
                setupManagedBackgrounds(firebaseBridge);
                loadSiteDefaults(firebaseBridge);
                return;
            }

            setFirebaseStatus("Community unavailable", "error");
            console.warn("Renner Radio: Firebase configured, but readiness check did not complete. Static radio continues.");
            console.warn("Firebase smoke test skipped.");
        };

        const firebaseBridge = window.BODWOLF_FIREBASE;
        if (firebaseBridge && firebaseBridge.ready) {
            firebaseBridge.ready.then(handleFirebaseState).catch((error) => {
                setFirebaseStatus("Community unavailable", "error");
                console.warn("Renner Radio: Firebase readiness check failed. Static radio continues.", error);
                console.warn("Firebase smoke test failed.", error);
            });
            return;
        }

        window.addEventListener("bodwolf:firebase-ready", (event) => handleFirebaseState(event.detail), { once: true });
        window.addEventListener("bodwolf:firebase-unavailable", (event) => handleFirebaseState(event.detail), { once: true });

        window.setTimeout(() => {
            if (handled) return;

            handled = true;
            setFirebaseStatus("Local listening", "static");
            console.info("Renner Radio: Firebase module did not report status. Static mode continues.");
            console.info("Firebase smoke test skipped.");
        }, 2500);
    }

    async function runFirebaseSmokeTest(firebaseBridge) {
        if (!firebaseBridge || !firebaseBridge.runFirebaseSmokeTest) {
            console.info("Firebase smoke test skipped.");
            return;
        }

        try {
            const result = await firebaseBridge.runFirebaseSmokeTest();

            if (result.skipped) {
                console.info("Firebase smoke test skipped.", result);
                return;
            }

            if (result.ok) {
                console.log("Firebase smoke test passed.", result);
                return;
            }

            console.warn("Firebase smoke test failed.", result);
        } catch (error) {
            console.warn("Firebase smoke test failed.", error);
        }
    }

    function setupManagedStations(firebaseBridge) {
        if (!firebaseBridge || typeof firebaseBridge.watchActiveAdminStations !== "function") {
            return;
        }

        const unsubscribe = firebaseBridge.watchActiveAdminStations((records) => {
            const managed = normalizeAdminStations(records);
            if (!managed.length) {
                console.info("Renner Radio: no active admin stations found. Using stations.js fallback.");
            }
            setMainStations(managed);
        }, (error) => {
            console.warn("Renner Radio: admin station read failed. Using stations.js fallback.", error);
            setMainStations([]);
        });

        if (!unsubscribe) {
            console.warn("Renner Radio: admin station listener could not start. Using stations.js fallback.");
        }
    }

    async function loadSiteDefaults(firebaseBridge) {
        if (typeof firebaseBridge?.getSiteSettings !== "function") return;
        try {
            siteDefaults = await firebaseBridge.getSiteSettings();
            if (!siteDefaults) return;
            const noSaved = key => { try { return localStorage.getItem(key) === null; } catch (_) { return true; } };
            if (noSaved(storageKeys.theme)) {
                currentThemeIndex = ({default: 0, sage: 1, amber: 2})[siteDefaults.defaultTheme] || 0;
                applyTheme(currentThemeIndex);
            }
            if (noSaved(storageKeys.comfortMode)) {comfortModeEnabled = siteDefaults.comfortModeDefault === true; applyComfortMode();}
            if (noSaved(storageKeys.staticSound)) staticSoundEnabled = siteDefaults.staticSoundDefault === true;
            updateTuningControlUi();
            if (!userSelectedStation && !savedSession && siteDefaults.defaultStationId) {
                const index = stations.findIndex(station => station.stationId === siteDefaults.defaultStationId || station.id === siteDefaults.defaultStationId);
                if (index >= 0) {
                    currentStationIndex = index;
                    if (playerReady) cueStationVideo(stations[index]);
                    updateDisplayInfo();
                }
            }
        } catch (_) { console.info("Renner Radio: site defaults unavailable; local preferences continue."); }
    }

    function setupManagedBackgrounds(firebaseBridge) {
        if (!firebaseBridge || typeof firebaseBridge.watchActiveSiteBackgrounds !== "function") {
            return;
        }

        const unsubscribe = firebaseBridge.watchActiveSiteBackgrounds((records) => {
            const firebaseBackgrounds = normalizeSiteBackgrounds(records);
            if (!firebaseBackgrounds.length) {
                setupDefaultBackgroundFallback("default");
                return;
            }

            managedBackgrounds = firebaseBackgrounds;
            isUsingDefaultBackgrounds = false;
            applyManagedBackgroundForCurrentStation("firebase");
        }, (error) => {
            if (isFirebasePermissionDenied(error)) {
                console.info("Renner Radio: site backgrounds are unavailable until database rules are deployed. Local Renner backgrounds continue.");
            } else {
                console.warn("Renner Radio: site background read failed. Local Renner backgrounds continue.", error);
            }
            setupDefaultBackgroundFallback("default");
        });

        if (!unsubscribe) {
            console.warn("Renner Radio: site background listener could not start. Local Renner backgrounds continue.");
            setupDefaultBackgroundFallback("default");
        }
    }

    function setupDefaultBackgroundFallback(reason = "default") {
        const defaults = normalizeDefaultSiteBackgrounds();
        if (!defaults.length) {
            managedBackgrounds = [];
            defaultManagedBackgrounds = [];
            isUsingDefaultBackgrounds = false;
            applyManagedBackgroundForCurrentStation(reason);
            clearManagedBackgrounds();
            return;
        }

        managedBackgrounds = defaults;
        defaultManagedBackgrounds = defaults;
        isUsingDefaultBackgrounds = true;
        applyManagedBackgroundForCurrentStation(reason);
    }

    function normalizeDefaultSiteBackgrounds() {
        const records = {};
        defaultSiteBackgrounds.forEach((background, index) => {
            records[`renner-default-${index + 1}`] = {
                ...(background || {}),
                isActive: background ? background.isActive !== false : false,
                sortOrder: Number.isFinite(Number(background && background.sortOrder))
                    ? Number(background.sortOrder)
                    : index * 10
            };
        });

        return normalizeSiteBackgrounds(records);
    }

    function normalizeSiteBackgrounds(records) {
        return Object.entries(records || {})
            .map(([backgroundId, background]) => normalizeSiteBackground(backgroundId, background))
            .filter(Boolean)
            .sort((a, b) => {
                const sortDelta = Number(a.sortOrder || 0) - Number(b.sortOrder || 0);
                if (sortDelta !== 0) return sortDelta;
                return String(a.name || "").localeCompare(String(b.name || ""));
            });
    }

    function normalizeSiteBackground(backgroundId, background) {
        if (!background || background.isActive !== true || !background.src) return null;

        const mediaType = String(background.type || "").toLowerCase();
        const src = replaceRetiredScene(String(background.src || "").trim());
        const isGif = mediaType === "gif" || String(background.mediaKind || "").toLowerCase() === "gif" || /\.gif(?:[?#]|$)/i.test(src);
        const type = mediaType === "video" ? "video" : isGif ? "gif" : "image";
        const suppliedPoster = replaceRetiredScene(String(background.poster || "").trim(), true);
        const poster = suppliedPoster || (isGif ? getStationStillPoster({name: background.name, category: background.mood}) : "");
        return {
            backgroundId,
            name: background.name || "Cinematic Background",
            type,
            src,
            poster,
            stationId: String(background.stationId || "").trim(),
            mood: normalizeBackgroundMood(background.mood),
            originalGif: background.originalGif === true,
            isActive: true,
            sortOrder: Number(background.sortOrder || 0),
            createdAt: Number(background.createdAt || 0),
            updatedAt: Number(background.updatedAt || 0)
        };
    }

    function applyManagedBackgroundForCurrentStation(reason = "station") {
        if (radioDevice.classList.contains("custom-scene")) {syncSceneMotion(); return;}
        if (randomBackgroundSelection) {
            const selected = getRandomBackgroundPool().find(choice => choice.kind === "managed" &&
                choice.scene.backgroundId === randomBackgroundSelection.backgroundId);
            if (selected) {
                randomBackgroundSelection.restoring = false;
                const signature = getBackgroundSignature(selected.scene);
                if (signature !== activeBackgroundSignature) {
                    activeBackgroundSignature = signature;
                    renderManagedBackground(selected.scene);
                }
                return;
            }
            // A saved admin scene can arrive after the local startup catalog.
            if (!randomBackgroundSelection.restoring || reason === "firebase") {
                clearRandomBackgroundSelection();
                const fallback = getSceneChoice(currentBgIndex);
                if (fallback) {
                    applyBackground(currentBgIndex);
                    saveSetting("renner:scene-mode", "custom");
                    return;
                }
            }
        }
        if (!dynamicBackgroundLayers.length || !managedBackgrounds.length) {
            return;
        }

        const station = stations[currentStationIndex] || null;
        const pool = getBackgroundPoolForStation(station);
        if (!pool.length) {
            clearManagedBackgrounds();
            return;
        }

        const nextBackground = chooseManagedBackground(pool, reason);
        const signature = getBackgroundSignature(nextBackground);
        if (!nextBackground || signature === activeBackgroundSignature) {
            return;
        }

        activeBackgroundSignature = signature;
        renderManagedBackground(nextBackground);
    }

    // Scenery selection stays stable until the listener selects another channel.
    function getBackgroundSignature(background) {
        return background ? [background.backgroundId, background.src, background.poster,
            background.type, background.updatedAt].join("|") : "";
    }

    function clearRandomBackgroundSelection() {
        if (!randomBackgroundSelection) return;
        randomBackgroundSelection = null;
        saveSetting("renner:random-scene", "null");
    }

    function getSceneArtworkSources(scene) {
        const still = comfortModeEnabled || prefersReducedMotion() || document.hidden ||
            document.body.classList.contains("motion-paused");
        return [scene?.src, scene?.renderSrc, still ? scene?.poster : ""].filter(Boolean);
    }

    function getRandomBackgroundPool() {
        const station = stations[currentStationIndex] || null;
        const stationKeys = getBackgroundStationKeys(station);
        const builtIn = (config.backgrounds || []).map((_, index) => ({kind: "builtin", scene: getSceneChoice(index)}));
        const local = defaultManagedBackgrounds.length ? defaultManagedBackgrounds : normalizeDefaultSiteBackgrounds();
        const available = [...local, ...managedBackgrounds].filter(background =>
            !background.stationId || stationKeys.includes(background.stationId));
        if (station?.backgroundVideoUrl || station?.backgroundGifUrl || station?.backgroundImageUrl) {
            const video = station.backgroundVideoUrl;
            available.push({backgroundId: `channel-${getStationKey(station)}`, name: `${station.name} · Scene`,
                type: video ? "video" : station.backgroundGifUrl ? "gif" : "image",
                src: video || station.backgroundGifUrl || station.backgroundImageUrl,
                poster: getStationStillPoster(station), mood: station.category});
        }
        const pool = [...builtIn, ...available.map(scene => ({kind: "managed", scene}))];
        // Local and managed catalogs can publish the same file under different IDs.
        const seenSources = new Set();
        return pool.filter(choice => {
            if (!choice.scene?.src || (choice.kind === "managed" && !dynamicBackgroundLayers.length)) return false;
            if (seenSources.has(choice.scene.src) && choice.scene.backgroundId !== randomBackgroundSelection?.backgroundId) return false;
            seenSources.add(choice.scene.src);
            return true;
        });
    }

    function selectRandomBackgroundForStation() {
        const current = radioDevice.classList.contains("custom-scene")
            ? customScene || getSceneChoice(currentBgIndex) : activeScene || getSceneChoice(currentBgIndex);
        const currentSources = new Set(getSceneArtworkSources(current));
        if (!radioDevice.classList.contains("custom-scene")) {
            const renderedSrc = dynamicBackgroundLayers[activeBackgroundLayerIndex]?.dataset.sceneSrc;
            if (renderedSrc) currentSources.add(renderedSrc);
        }
        const choices = getRandomBackgroundPool().filter(choice =>
            !getSceneArtworkSources(choice.scene).some(src => currentSources.has(src)));
        if (!choices.length) return;
        const next = choices[Math.floor(Math.random() * choices.length)];
        if (next.kind === "builtin") {
            clearRandomBackgroundSelection();
            currentBgIndex = next.scene.index;
            applyBackground(currentBgIndex);
            saveSetting("renner:scene-mode", "custom");
            saveSetting(storageKeys.background, currentBgIndex);
            return;
        }
        cancelSceneImageProbe(radioDevice);
        radioDevice.classList.remove("custom-scene");
        customScene = null;
        randomBackgroundSelection = {backgroundId: next.scene.backgroundId, restoring: false};
        saveSetting("renner:scene-mode", "station");
        saveSetting("renner:random-scene", JSON.stringify({backgroundId: next.scene.backgroundId}));
        activeBackgroundSignature = getBackgroundSignature(next.scene);
        renderManagedBackground(next.scene);
    }

    function getBackgroundPoolForStation(station) {
        if (station?.backgroundVideoUrl || station?.backgroundGifUrl || station?.backgroundImageUrl) {
            const video = station.backgroundVideoUrl;
            return [{backgroundId: `channel-${getStationKey(station)}`, name: `${station.name} · Scene`, type: video ? "video" : station.backgroundGifUrl ? "gif" : "image", src: video || station.backgroundGifUrl || station.backgroundImageUrl, poster: getStationStillPoster(station), mood: station.category}];
        }
        if (isUsingDefaultBackgrounds) {
            const original = getOriginalGifForStation(station);
            if (original) return [original];
            const text = `${station?.name || ""} ${station?.category || ""}`.toLowerCase();
            const index = /space|ambient|sleep/.test(text) ? 3 : /sun|morning|love|relax/.test(text) ? 2 : /synth|retro|night|rain|drive|gaming|house/.test(text) ? 1 : 0;
            const local = defaultManagedBackgrounds[index];
            if (local) return [local];
        }
        const primaryPool = getBackgroundPoolFromList(managedBackgrounds, station);
        if (primaryPool.length) return primaryPool;

        if (!isUsingDefaultBackgrounds) {
            if (!defaultManagedBackgrounds.length) {
                defaultManagedBackgrounds = normalizeDefaultSiteBackgrounds();
            }

            const original = getOriginalGifForStation(station);
            if (original) return [original];
            return getBackgroundPoolFromList(defaultManagedBackgrounds, station);
        }

        return [];
    }

    function getOriginalGifForStation(station) {
        const originals = defaultManagedBackgrounds.filter(background => background.originalGif);
        if (!originals.length) return null;
        const text = `${station?.name || ""} ${station?.category || ""}`.toLowerCase();
        const mood = /space|ambient|sleep/.test(text) ? "space"
            : /sun|morning|love|relax|jazz/.test(text) ? "sunset"
            : /synth|retro|drive|gaming|house/.test(text) ? "cyber" : "night";
        return originals.find(background => background.mood === mood) || originals[0];
    }

    function getBackgroundPoolFromList(backgrounds, station) {
        if (!Array.isArray(backgrounds) || !backgrounds.length) return [];

        const stationKeys = getBackgroundStationKeys(station);
        const assigned = backgrounds.filter((background) => {
            if (!background.stationId) return false;
            return stationKeys.includes(background.stationId);
        });

        if (assigned.length) return assigned;

        const moodMatches = backgrounds.filter((background) => {
            return !background.stationId && background.mood && doesBackgroundMoodMatchStation(background, station);
        });

        if (moodMatches.length) return moodMatches;

        return backgrounds.filter((background) => !background.stationId);
    }

    function getBackgroundStationKeys(station) {
        if (!station) return [];
        return [
            station.stationId,
            station.id,
            station.youtubeId,
            station.name
        ].map((value) => String(value || "").trim())
            .filter(Boolean);
    }

    function doesBackgroundMoodMatchStation(background, station) {
        const mood = normalizeBackgroundMood(background && background.mood);
        if (!mood) return false;
        return getStationMoodTokens(station).includes(mood);
    }

    function getStationMoodTokens(station) {
        const tokens = new Set();
        const rawCategory = normalizeBackgroundMood(station && station.category);
        const rawMood = normalizeBackgroundMood(station && station.mood);
        const safeCategory = getSafeStationCategory(station && (station.category || station.mood));
        const categoryToken = normalizeBackgroundMood(safeCategory);

        [rawCategory, rawMood, categoryToken].filter(Boolean).forEach((token) => tokens.add(token));

        const categoryMoodMap = {
            LOFI: ["room", "chill", "focus"],
            CHILLHOP: ["chill", "room", "focus"],
            JAZZHOP: ["chill", "room"],
            SYNTHWAVE: ["night", "cyber"],
            RETRO: ["sunset", "night"],
            AMBIENT: ["space", "chill"],
            "DEEP HOUSE": ["alley", "cyber", "night"],
            HOUSE: ["alley", "cyber"],
            STUDY: ["focus", "room"],
            SLEEP: ["night", "space", "chill"],
            RELAX: ["chill", "sunset"],
            RADIO: ["night", "focus"],
            SONG: ["chill"],
            CUSTOM: ["cyber"]
        };

        (categoryMoodMap[safeCategory] || []).forEach((token) => tokens.add(token));

        const textHints = normalizeBackgroundMood([
            station && station.name,
            station && station.description
        ].filter(Boolean).join(" "));

        ["night", "sunset", "room", "alley", "space", "chill", "focus", "cyber"].forEach((token) => {
            if (textHints.includes(token)) tokens.add(token);
        });

        return [...tokens];
    }

    function normalizeBackgroundMood(value) {
        return String(value || "")
            .trim()
            .toLowerCase()
            .replace(/[_\s]+/g, "-")
            .replace(/[^a-z0-9-]/g, "")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "")
            .slice(0, 40);
    }

    function chooseManagedBackground(pool, reason) {
        if (!pool.length) return null;
        if (pool.length === 1) return pool[0];

        if (reason === "rotate") {
            const currentIndex = pool.findIndex((background) => background.backgroundId === activeManagedBackgroundId);
            return pool[(currentIndex + 1 + pool.length) % pool.length];
        }

        return pool[0];
    }

    // Scene layers and image probes; old asynchronous loads cannot paint a new choice.
    function renderManagedBackground(background) {
        const nextLayerIndex = activeBackgroundLayerIndex === 0 ? 1 : 0;
        const nextLayer = dynamicBackgroundLayers[nextLayerIndex];
        const previousLayer = dynamicBackgroundLayers[activeBackgroundLayerIndex];
        if (!nextLayer) return;

        prepareBackgroundLayer(nextLayer, background);
        nextLayer.hidden = false;
        nextLayer.classList.add("is-active");
        nextLayer.classList.toggle("is-video", background.type === "video");
        nextLayer.classList.toggle("is-image", background.type !== "video");

        if (previousLayer && previousLayer !== nextLayer) {
            previousLayer.hidden = true;
            previousLayer.classList.remove("is-active");
            pauseLayerVideo(previousLayer);
        }

        activeBackgroundLayerIndex = nextLayerIndex;
        activeManagedBackgroundId = background.backgroundId;
        activeScene = background;
        document.body.classList.add("has-dynamic-background");
        nextLayer.dataset.sceneName = background.name || "Your listening space";
        radioDevice.dataset.sceneSrc = background.src;
        radioDevice.dataset.sceneType = background.type;
        radioDevice.dataset.sceneName = background.name || "";
        window.dispatchEvent(new CustomEvent("renner:managed-scene", {detail: background}));
        syncSceneMotion();
    }

    function prepareBackgroundLayer(layer, background) {
        cancelSceneImageProbe(layer);
        layer.textContent = "";
        layer.style.backgroundImage = "";
        layer.dataset.backgroundId = background.backgroundId;
        layer.dataset.backgroundType = background.type;
        layer.dataset.sceneSrc = background.src;
        layer.dataset.scenePoster = background.poster || "";

        if (background.type === "video") {
            const video = document.createElement("video");
            video.src = background.src;
            if (background.poster) {
                video.poster = background.poster;
            }
            video.muted = true;
            video.loop = true;
            video.playsInline = true;
            video.autoplay = false;
            video.preload = "metadata";
            video.addEventListener("error", () => {
                // A detached video's error may arrive after this layer has a new scene.
                if (layer.querySelector("video") !== video) return;
                pauseLayerVideo(layer);
                showScenePoster(layer, background);
            }, { once: true });
            layer.appendChild(video);
            return;
        }

        layer.style.backgroundImage = `url("${background.src}")`;
        probeSceneImage(layer, background.src, () => showScenePoster(layer, background));
    }

    function probeSceneImage(target, src, onError) {
        cancelSceneImageProbe(target);
        if (typeof window.Image !== "function") return;
        const probe = new window.Image();
        sceneImageProbes.set(target, probe);
        probe.onload = () => {
            if (sceneImageProbes.get(target) === probe) cancelSceneImageProbe(target);
        };
        probe.onerror = () => {
            if (sceneImageProbes.get(target) !== probe) return;
            cancelSceneImageProbe(target);
            onError();
        };
        probe.src = src;
    }

    function cancelSceneImageProbe(layer) {
        const probe = sceneImageProbes.get(layer);
        if (!probe) return;
        probe.onload = null;
        probe.onerror = null;
        sceneImageProbes.delete(layer);
    }

    function showScenePoster(layer, background) {
        const poster = background.poster || getStationStillPoster({name: background.name, category: background.mood});
        layer.textContent = "";
        layer.dataset.sceneSrc = poster;
        layer.dataset.backgroundType = "image";
        layer.style.backgroundImage = `url("${poster}")`;
        layer.classList.remove("is-video");
        layer.classList.add("is-image");
    }

    function pauseLayerVideo(layer) {
        const video = layer ? layer.querySelector("video") : null;
        if (video && typeof video.pause === "function") {
            video.pause();
        }
    }

    function clearManagedBackgrounds() {
        activeManagedBackgroundId = "";
        activeBackgroundSignature = "";
        activeScene = null;
        dynamicBackgroundLayers.forEach((layer) => {
            cancelSceneImageProbe(layer);
            pauseLayerVideo(layer);
            layer.hidden = true;
            layer.textContent = "";
            layer.style.backgroundImage = "";
            layer.classList.remove("is-active", "is-video", "is-image");
            delete layer.dataset.backgroundId;
            delete layer.dataset.backgroundType;
            delete layer.dataset.sceneSrc;
            delete layer.dataset.scenePoster;
        });
        activeBackgroundLayerIndex = 0;
        document.body.classList.remove("has-dynamic-background");
        if (!radioDevice.classList.contains("custom-scene")) {
            const fallback = getSceneChoice(currentBgIndex);
            if (fallback) {
                radioDevice.dataset.sceneSrc = fallback.src;
                radioDevice.dataset.sceneType = fallback.type;
                radioDevice.dataset.sceneName = fallback.name;
                window.dispatchEvent(new CustomEvent("renner:managed-scene", {detail: fallback}));
            }
            syncSceneMotion();
        }
    }

    function isFirebasePermissionDenied(error) {
        const text = String((error && (error.code || error.message)) || error || "").toLowerCase();
        return text.includes("permission_denied") || text.includes("permission denied") || text.includes("permission");
    }

    function normalizeAdminStations(records) {
        return Object.entries(records || {})
            .map(([stationId, station]) => normalizeAdminStation(stationId, station))
            .filter(Boolean)
            .sort((a, b) => {
                const sortDelta = Number(a.sortOrder || 0) - Number(b.sortOrder || 0);
                if (sortDelta !== 0) return sortDelta;
                return String(a.name || "").localeCompare(String(b.name || ""));
            });
    }

    function normalizeAdminStation(stationId, station) {
        const playlistId = getStationPlaylistId(station);
        if (!station || station.status !== "active" || station.isActive === false || (!isValidVideoId(station.youtubeId) && !playlistId)) {
            return null;
        }

        const oldSpaceScene = /(?:^|\/)renner-deep-space-radio-01\.svg(?:[?#]|$)/i.test(station.backgroundImageUrl || "");
        return {
            source: "admin",
            stationId,
            category: getSafeStationCategory(station.category),
            mood: getSafeStationCategory(station.category),
            freq: station.frequency || "--",
            name: station.name || "Managed Station",
            id: isValidVideoId(station.youtubeId) ? station.youtubeId : stationId,
            youtubeUrl: station.youtubeUrl || "",
            youtubePlaylistId: playlistId,
            youtubePlaylistUrl: playlistId ? `https://www.youtube.com/playlist?list=${playlistId}` : "",
            thumbnail: replaceRetiredScene(station.thumbnailUrl || "", true),
            image: replaceRetiredScene(station.backgroundImageUrl || "", true),
            fallbackImage: station.backgroundGifUrl || "",
            backgroundVideoUrl: station.backgroundVideoUrl || "",
            backgroundGifUrl: station.backgroundGifUrl || (oldSpaceScene ? "assets/backgrounds/gifs/original-04.gif" : ""),
            backgroundImageUrl: replaceRetiredScene(station.backgroundImageUrl || "", true),
            accentColor: station.accentColor || "",
            description: station.description || station.category || "Admin managed station",
            sortOrder: Number(station.sortOrder || 0),
            status: station.status,
            isActive: station.isActive !== false
        };
    }

    function setFirebaseStatus(text, mode) {
        if (!firebaseStatusEl) return;

        firebaseStatusEl.textContent = text;
        firebaseStatusEl.classList.toggle("is-ready", mode === "ready");
        firebaseStatusEl.classList.toggle("is-error", mode === "error");
    }

    // Saved preferences and migration of retired scene references.
    function restoreSavedSettings() {
        currentStationIndex = getSavedNumber(storageKeys.station, config.defaultStationIndex || 0, 0, stations.length - 1);
        if (savedSession && typeof savedSession === "object") {
            let savedIndex = stations.findIndex(station => getStationKey(station) === savedSession.key);
            if (savedIndex < 0) savedIndex = stations.findIndex(station => station.id === savedSession.videoId);
            if (savedIndex >= 0) currentStationIndex = savedIndex;
        }
        let savedSceneMode = null;
        let hasSavedSceneChoice = false;
        try {
            savedSceneMode = localStorage.getItem("renner:scene-mode");
            hasSavedSceneChoice = savedSceneMode !== null || localStorage.getItem(storageKeys.background) !== null;
        } catch (_) {}
        const maximumSceneIndex = Math.max(0, (config.backgrounds || []).length - 1);
        const configuredSceneIndex = Number.isInteger(config.defaultSceneIndex)
            ? Math.min(Math.max(config.defaultSceneIndex, 0), maximumSceneIndex) : 0;
        currentBgIndex = getSavedNumber(storageKeys.background, hasSavedSceneChoice ? 0 : configuredSceneIndex, 0, maximumSceneIndex);
        if (savedSceneMode === "station") {
            try {
                const savedRandom = JSON.parse(localStorage.getItem("renner:random-scene") || "null");
                if (savedRandom && typeof savedRandom.backgroundId === "string" && savedRandom.backgroundId) {
                    randomBackgroundSelection = {backgroundId: savedRandom.backgroundId, restoring: true};
                }
            } catch (_) {}
        }
        currentThemeIndex = getSavedNumber(storageKeys.theme, 0, 0, (config.themes || []).length - 1);
        currentEffectIndex = getSavedNumber(storageKeys.effect, 0, 0, (config.effects || []).length - 1);
        staticSoundEnabled = getSavedBoolean(storageKeys.staticSound, false);
        comfortModeEnabled = getSavedBoolean(storageKeys.comfortMode, false);

        if (savedSceneMode === "custom" || (!hasSavedSceneChoice && config.defaultSceneMode === "custom")) {
            applyBackground(currentBgIndex);
        }
        applyTheme(currentThemeIndex);
        applyEffect(currentEffectIndex);
        applyComfortMode();
        applyMotionPreference();
        updateTuningControlUi();
        if (staticSoundEnabled) {
            probeStaticAudioFile();
        }
        volumeSlider.value = String(getSavedNumber(storageKeys.volume, config.defaultVolume || 50, 0, 100));
    }

    function replaceRetiredScene(source, still = false) {
        if (typeof source !== "string") return "";
        if (/(?:^|\/)renner-lofi-room-01\.svg(?:[?#]|$)/i.test(source)) return "assets/backgrounds/images/midnight-studio.webp";
        if (/(?:^|\/)renner-deep-space-radio-01\.svg(?:[?#]|$)/i.test(source)) return still
            ? "assets/backgrounds/gifs/original-04-poster.webp" : "assets/backgrounds/gifs/original-04.gif";
        return source;
    }

    function getSceneChoice(index) {
        const src = replaceRetiredScene((config.backgrounds || [])[index]);
        if (!src) return null;
        const metadata = (config.sceneMetadata || [])[index] || {};
        return {index, src, name: metadata.name || "Your listening space", type: /\.gif(?:[?#]|$)/i.test(src) ? "gif" : metadata.type || "image", poster: replaceRetiredScene(metadata.poster || "", true)};
    }

    function applyBackground(index) {
        const scene = getSceneChoice(index);
        if (scene) {
            customScene = scene;
            radioDevice.style.setProperty("--scene-image", `url("${scene.src}")`);
            radioDevice.classList.add("custom-scene");
            window.dispatchEvent(new CustomEvent("renner:scene-changed", {detail: {index, scene}}));
            radioDevice.dataset.sceneSrc = scene.src;
            radioDevice.dataset.sceneType = scene.type;
            radioDevice.dataset.sceneName = scene.name;
            syncSceneMotion();
            probeSceneImage(radioDevice, scene.src, () => {
                if (customScene !== scene || !radioDevice.classList.contains("custom-scene")) return;
                const poster = scene.poster || getStationStillPoster({name: scene.name});
                customScene = {...scene, renderSrc: poster};
                syncSceneMotion();
                window.dispatchEvent(new CustomEvent("renner:scene-changed", {detail: {index, scene: {...scene, src: poster, type: "image"}}}));
            });
        }
    }

    function applyTheme(index) {
        (config.themes || []).forEach((theme) => {
            if (theme.className) {
                document.body.classList.remove(theme.className);
            }
        });

        const selectedTheme = (config.themes || [])[index];
        if (selectedTheme && selectedTheme.className) {
            document.body.classList.add(selectedTheme.className);
        }
    }

    function applyEffect(index) {
        (config.effects || []).forEach((effect) => {
            if (effect.className) {
                weatherOverlay.classList.remove(effect.className);
            }
        });

        const selectedEffect = (config.effects || [])[index] || (config.effects || [])[0];
        if (selectedEffect && selectedEffect.className) {
            weatherOverlay.classList.add(selectedEffect.className);
        }

        if (selectedEffect) {
            effectBtn.innerHTML = `<i class="${selectedEffect.icon}"></i>`;
            const label = selectedEffect.className === "effect-noise" ? "None" : selectedEffect.label || "None";
            effectBtn.setAttribute("aria-label", `Visual effects: ${label}`);
            effectBtn.title = `Visual effects: ${label}`;
        }
    }

    function findValidStationIndex(startIndex, direction) {
        if (!stations.length) return -1;
        const rows = getFrequencyStationRows();
        const normalizedDirection = direction < 0 ? -1 : 1;
        const position = rows.findIndex(row => row.index === normalizeIndex(startIndex));
        for (let attempts = 0; attempts < rows.length; attempts += 1) {
            const row = rows[(position + attempts * normalizedDirection + rows.length * 2) % rows.length];
            if (isSelectableStation(row.station)) return row.index;
        }

        return -1;
    }

    function isValidStation(station) {
        if (!station) return false;
        if (station.type === "community") {
            return isVisibleCommunityStation(station);
        }

        return isValidVideoId(station.id) || Boolean(getStationPlaylistId(station));
    }

    function isValidPlaylistId(playlistId) {
        return typeof playlistId === "string" && /^[A-Za-z0-9_-]{10,128}$/.test(playlistId);
    }

    function getStationPlaylistId(station) {
        return isValidPlaylistId(station?.youtubePlaylistId) ? station.youtubePlaylistId : "";
    }

    function getStationSourceSignature(station) {
        const playlistId = getStationPlaylistId(station);
        return playlistId ? `playlist:${playlistId}` : `video:${station?.id || ""}`;
    }

    function isValidVideoId(videoId) {
        return typeof videoId === "string" && /^[A-Za-z0-9_-]{11}$/.test(videoId);
    }

    function normalizeIndex(index) {
        return ((index % stations.length) + stations.length) % stations.length;
    }

    // Tuning feedback, static sound and motion preferences.
    function showTuningStatus() {
        streamStatus = "CONNECTING";
        updateHeroStreamStatus();
        tuningStatusEl.textContent = "Tuning...";
        radioDevice.classList.add("is-tuning");
        triggerTuningTransition();
    }

    function hideTuningStatus() {
        tuningStatusEl.textContent = "";
        radioDevice.classList.remove("is-tuning");
        window.clearTimeout(tuningTimer);
        window.clearTimeout(tuningStatusClearTimer);
        tuningStatusClearTimer = window.setTimeout(() => {
            if (tuningStatusEl.textContent === "Signal locked") {
                tuningStatusEl.textContent = "";
            }
        }, 900);
    }

    function triggerTuningTransition() {
        const duration = getTuningDuration();

        window.clearTimeout(tuningVisualTimer);
        window.clearTimeout(signalLockTimer);
        window.clearTimeout(tuningStatusClearTimer);

        if (tuningOverlay) {
            tuningOverlay.classList.remove("is-active");
            void tuningOverlay.offsetWidth;
            tuningOverlay.classList.add("is-active");
        }

        document.body.classList.add("is-tuning-visual");
        playStaticSound();

        tuningVisualTimer = window.setTimeout(() => {
            if (tuningOverlay) {
                tuningOverlay.classList.remove("is-active");
            }
            document.body.classList.remove("is-tuning-visual");
        }, duration + 80);
    }

    function getTuningDuration() {
        if (prefersReducedMotion()) return 360;
        if (comfortModeEnabled) return 460;
        return 720;
    }

    function playStaticSound() {
        if (!staticSoundEnabled || !hasUserInteracted) return;

        probeStaticAudioFile();

        const audio = getStaticAudio();
        if (!audio) return;

        try {
            audio.pause();
            audio.currentTime = 0;
            audio.volume = comfortModeEnabled ? COMFORT_STATIC_AUDIO_VOLUME : STATIC_AUDIO_VOLUME;
            const playPromise = audio.play();

            if (playPromise && typeof playPromise.catch === "function") {
                playPromise.catch((error) => {
                    warnStaticAudioOnce(`Renner Radio: optional radio static sound could not play. ${error.message || error}`);
                });
            }
        } catch (error) {
            warnStaticAudioOnce(`Renner Radio: optional radio static sound failed. ${error.message || error}`);
        }
    }

    function probeStaticAudioFile() {
        if (staticAudioProbeStarted) return;
        if (!window.location.protocol.startsWith("http")) return;

        if (typeof fetch === "function") {
            staticAudioProbeStarted = true;
            fetch(STATIC_AUDIO_PATH, { method: "HEAD", cache: "no-store" })
                .then((response) => {
                    if (!response.ok) {
                        warnStaticAudioOnce(`Renner Radio: optional radio static file was not found at ${STATIC_AUDIO_PATH}.`);
                    }
                })
                .catch((error) => {
                    warnStaticAudioOnce(`Renner Radio: optional radio static file could not be checked. ${error.message || error}`);
                });
            return;
        }

        if (typeof XMLHttpRequest === "undefined") return;

        staticAudioProbeStarted = true;
        const request = new XMLHttpRequest();
        request.open("HEAD", STATIC_AUDIO_PATH, true);
        request.onload = () => {
            if (request.status < 200 || request.status >= 400) {
                warnStaticAudioOnce(`Renner Radio: optional radio static file was not found at ${STATIC_AUDIO_PATH}.`);
            }
        };
        request.onerror = () => {
            warnStaticAudioOnce(`Renner Radio: optional radio static file could not be checked.`);
        };
        request.send();
    }

    function getStaticAudio() {
        if (staticAudio) return staticAudio;
        if (typeof Audio === "undefined") return null;

        staticAudio = new Audio(STATIC_AUDIO_PATH);
        staticAudio.preload = "none";
        staticAudio.volume = STATIC_AUDIO_VOLUME;
        staticAudio.addEventListener("error", () => {
            warnStaticAudioOnce(`Renner Radio: optional radio static file was not found or could not load at ${STATIC_AUDIO_PATH}.`);
        });
        return staticAudio;
    }

    function warnStaticAudioOnce(message) {
        if (staticAudioWarningShown) return;
        staticAudioWarningShown = true;
        console.warn(message);
    }

    function markUserInteracted() {
        hasUserInteracted = true;
    }

    function applyComfortMode() {
        document.body.classList.toggle("comfort-mode", comfortModeEnabled);
        syncSceneMotion();
    }

    function applyMotionPreference() {
        document.body.classList.toggle("reduced-motion", prefersReducedMotion());
        syncSceneMotion();
    }

    function syncSceneMotion() {
        const still = comfortModeEnabled || prefersReducedMotion() || document.body.classList.contains("motion-paused");
        const custom = radioDevice.classList.contains("custom-scene");
        if (custom && customScene) {
            const src = customScene.renderSrc || ((still || document.hidden) && customScene.poster ? customScene.poster : customScene.src);
            radioDevice.style.setProperty("--scene-image", `url("${src}")`);
        } else if (!activeScene) {
            const fallback = getSceneChoice(currentBgIndex);
            if (fallback) {
                const src = (still || document.hidden) && fallback.poster ? fallback.poster : fallback.src;
                radioDevice.style.setProperty("--scene-image", `url("${src}")`);
            }
        }
        dynamicBackgroundLayers.forEach((layer, index) => {
            const active = index === activeBackgroundLayerIndex && !custom && Boolean(activeScene);
            // Opacity fades alone leave two artworks visible during rapid scene changes.
            layer.hidden = !active;
            const freeze = still || document.hidden || !active;
            const video = layer.querySelector("video");
            if (video) {
                if (freeze) video.pause();
                else video.play().catch(() => {});
                const poster = video.poster || layer.dataset.scenePoster;
                video.style.visibility = freeze && poster ? "hidden" : "visible";
                layer.style.backgroundImage = freeze && poster ? `url("${poster}")` : "";
            } else if (layer.dataset.sceneSrc) {
                const src = freeze && layer.dataset.scenePoster ? layer.dataset.scenePoster : layer.dataset.sceneSrc;
                layer.style.backgroundImage = `url("${src}")`;
            }
        });
    }

    function startStreamTimeout() {
        window.clearTimeout(tuningTimer);
        tuningTimer = window.setTimeout(() => {
            if (radioDevice.classList.contains("playing")) return;
            if (activePlaybackAttempt?.playlistId && !activePlaybackAttempt.resolving) {
                try {
                    if (player?.getPlayerState?.() === YT.PlayerState.PLAYING && isCurrentPlaybackEvent({target: player})) {
                        onPlayerStateChange({data: YT.PlayerState.PLAYING, target: player, _playlistReconciled: true});
                        return;
                    }
                } catch (_) { /* A missing native identity remains a waiting state. */ }
            }
            radioDevice.classList.remove("is-tuning");
            streamStatus = "WAITING FOR STREAM";
            tuningStatusEl.textContent = "Taking longer than usual. Try Play again or choose another channel.";
            if (activePlaybackAttempt?.playlistId) setPlaylistPlaybackStatus(activePlaybackAttempt.playlistId, "waiting");
            updateHeroStreamStatus();
        }, 20000);
    }

    function prefersReducedMotion() {
        return Boolean(reducedMotionQuery && reducedMotionQuery.matches);
    }

    function updateTuningControlUi() {
        updateToggleButton(staticSoundBtn, mobileStaticSoundBtn, staticSoundEnabled, "Static Sound", "broadcast-tower");
        updateToggleButton(comfortModeBtn, mobileComfortModeBtn, comfortModeEnabled, "Comfort Mode", "eye");
    }

    function updateToggleButton(button, mobileButton, isEnabled, label, iconName) {
        const stateText = isEnabled ? "On" : "Off";
        const title = `${label} ${stateText}`;
        const iconClass = iconName === "eye" && isEnabled ? "fas fa-eye-slash" : `fas fa-${iconName}`;

        if (button) {
            button.classList.toggle("is-enabled", isEnabled);
            button.setAttribute("aria-pressed", String(isEnabled));
            button.title = title;
            button.setAttribute("aria-label", title);
            button.innerHTML = `<i class="${iconClass}"></i>`;
        }

        if (mobileButton) {
            mobileButton.classList.toggle("is-enabled", isEnabled);
            mobileButton.innerHTML = `<i class="${iconClass}"></i><span>${label.replace(" Sound", "")} ${stateText}</span>`;
        }
    }

    // Storage failures retain usable session defaults.
    function getSavedNumber(key, fallback, min, max) {
        let rawValue;
        try {
            if (!window.localStorage) return fallback;
            rawValue = window.localStorage.getItem(key);
        } catch (error) {
            console.warn(`Renner Radio: could not read setting "${key}".`, error);
            return fallback;
        }

        if (rawValue === null) return fallback;
        const value = Number(rawValue);
        if (!Number.isFinite(value)) return fallback;

        return Math.min(Math.max(value, min), max);
    }

    function getSavedBoolean(key, fallback) {
        try {
            if (!window.localStorage) return fallback;
            const value = window.localStorage.getItem(key);
            if (value === null) return fallback;
            return value === "1" || value === "true";
        } catch (error) {
            console.warn(`Renner Radio: could not read setting "${key}".`, error);
            return fallback;
        }
    }

    function saveSetting(key, value) {
        try {
            if (!window.localStorage) return;
            window.localStorage.setItem(key, String(value));
        } catch (error) {
            console.warn(`Renner Radio: could not save setting "${key}".`, error);
        }
    }

    // V9: Firebase config is loaded by firebase.js; app.js only checks readiness.
    // V15.3: playlist.js owns temporary community channels, tracks, expiry, and Firebase sync.
    // V15.4: UI reads optional station thumbnail/image/fallbackImage/accentColor hooks only.
    // V11: chat.js owns anonymous names, validation, local preview, and Firebase chat sync.
    document.addEventListener("DOMContentLoaded", init);
})();
