(function () {
    const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
    const PLAYLIST_ID_PATTERN = /^[A-Za-z0-9_-]{10,128}$/;
    const DISPLAY_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9]{3,15}$/;
    const STATION_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 -]{0,23}$/;
    const CHANNEL_EXPIRY_MS = 30 * 60 * 1000;
    const ADD_RATE_LIMIT_MS = 30 * 1000;
    const ADD_STORAGE_KEY = "bodwolf:temporaryChannelLastAddAt";
    const COMMUNITY_PROFILE_KEYS = { name: "bodwolf:communityName", color: "bodwolf:communityColor" };
    const MAX_ACTIVE_TRACKS = 10;
    const FALLBACK_TRACK_TITLE = "YouTube Track";

    const state = {
        mode: "local",
        loading: true,
        saving: false,
        channels: [],
        unsubscribe: null,
        userId: null,
        firebaseBridge: null,
        countdownTimer: null,
        selectedSuggestedTrack: null,
        messageOrigin: "",
        replacementDraftKey: ""
    };

    const form = document.getElementById("playlistForm");
    const urlInput = document.getElementById("playlistUrlInput");
    const nameInput = document.getElementById("temporaryStationNameInput");
    const communityNameInput = document.getElementById("communityDisplayNameInput");
    const submitButton = document.getElementById("playlistAddBtn");
    const messageEl = document.getElementById("playlistMessage");
    const loadingEl = document.getElementById("playlistLoading");
    const emptyEl = document.getElementById("playlistEmpty");
    const itemsEl = document.getElementById("playlistItems");
    const modeHintEl = document.getElementById("playlistModeHint");

    window.extractYouTubeVideoId = extractYouTubeVideoId;
    window.BODWOLF_PLAYLIST = {
        extractYouTubeVideoId,
        getItems() {
            return [...state.channels];
        }
    };

    document.addEventListener("DOMContentLoaded", initTemporaryChannels);
    window.addEventListener("beforeunload", cleanupTemporaryChannelListener);
    window.addEventListener("renner:availability-changed", updateTrackAvailability);
    window.addEventListener("renner:playlist-playback-changed", updateTrackAvailability);

    function initTemporaryChannels() {
        if (!form || !urlInput || !submitButton || !itemsEl) return;

        form.addEventListener("submit", handleSubmit);
        urlInput.addEventListener("keydown", handleInputKeydown);
        urlInput.addEventListener("input", updateSourceHint);
        document.getElementById("playlistUseSuggestedTrack")?.addEventListener("click", useSuggestedArtistTrack);
        document.getElementById("playlistPreviewBtn")?.addEventListener("click", previewSourcePlayback);
        document.getElementById("playlistReplaceSourceCheck")?.addEventListener("change", updateSourceHint);
        if (nameInput) {
            nameInput.addEventListener("keydown", handleInputKeydown);
        }
        if (communityNameInput) {
            const savedName = getStoredValue(COMMUNITY_PROFILE_KEYS.name);
            if (DISPLAY_NAME_PATTERN.test(String(savedName || ""))) communityNameInput.value = savedName;
            communityNameInput.addEventListener("keydown", handleInputKeydown);
        }
        itemsEl.addEventListener("click", handleChannelAction);
        updateSourceHint();
        connectTemporaryChannelDataSource();
    }

    function handleInputKeydown(event) {
        if (event.key !== "Enter") return;

        event.preventDefault();
        if (state.loading || state.saving) return;

        if (typeof form.requestSubmit === "function") {
            form.requestSubmit(submitButton);
        } else {
            form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        }
    }

    function connectTemporaryChannelDataSource() {
        setLoading(true);
        setModeHint("local");

        const firebaseBridge = window.BODWOLF_FIREBASE;
        if (firebaseBridge && firebaseBridge.ready) {
            firebaseBridge.ready
                .then((firebaseState) => setupFirebaseTemporaryChannels(firebaseBridge, firebaseState))
                .catch((error) => {
                    console.warn("Renner Radio: temporary channel Firebase setup failed. Local preview continues.", error);
                    setupLocalTemporaryChannels("Local preview channel only. Firebase not connected.");
                });
            return;
        }

        const onReady = (event) => setupFirebaseTemporaryChannels(window.BODWOLF_FIREBASE, event.detail);
        const onUnavailable = () => setupLocalTemporaryChannels("Local preview channel only. Firebase not connected.");

        window.addEventListener("bodwolf:firebase-ready", onReady, { once: true });
        window.addEventListener("bodwolf:firebase-unavailable", onUnavailable, { once: true });

        window.setTimeout(() => {
            if (state.loading) {
                setupLocalTemporaryChannels("Local preview channel only. Firebase not connected.");
            }
        }, 2800);
    }

    async function setupFirebaseTemporaryChannels(firebaseBridge, firebaseState) {
        if (!firebaseBridge || !firebaseState || !firebaseState.ready) {
            setupLocalTemporaryChannels("Local preview channel only. Firebase not connected.");
            return;
        }

        try {
            const user = await firebaseBridge.signInAnonymousUser();
            if (!user || !user.uid) {
                setupLocalTemporaryChannels("Local preview channel only. Firebase not connected.");
                return;
            }

            cleanupTemporaryChannelListener();
            state.mode = "firebase";
            state.firebaseBridge = firebaseBridge;
            state.userId = user.uid;

            const unsubscribe = firebaseBridge.watchTemporaryStations(handleFirebaseChannels, (error) => {
                console.warn("Renner Radio: temporary channel listener failed.", error);
                setupLocalTemporaryChannels("Temporary channel is in local preview. Deploy V15.3 database rules for live sync.");
                showMessage("Could not load live channels. Deploy the V15.3 database rules.", "error");
            });

            if (!unsubscribe) {
                setupLocalTemporaryChannels("Local preview channel only. Firebase not connected.");
                return;
            }

            state.unsubscribe = unsubscribe;
            setModeHint("firebase");
        } catch (error) {
            console.warn("Renner Radio: temporary channel Firebase setup failed. Local preview continues.", error);
            setupLocalTemporaryChannels("Local preview channel only. Firebase not connected.");
        }
    }

    function setupLocalTemporaryChannels(message) {
        cleanupTemporaryChannelListener();
        state.mode = "local";
        state.firebaseBridge = null;
        state.userId = null;
        state.loading = false;
        setModeHint("local", message);
        publishChannelsToRadio();
        renderChannelManager();
        syncCountdownTimer();
    }

    function handleFirebaseChannels(channelsById) {
        state.channels = Object.entries(channelsById || {})
            .map(([id, channel]) => normalizeChannel({ ...channel, stationId: id }))
            .filter(isVisibleChannel)
            .sort((a, b) => b.createdAt - a.createdAt);

        state.loading = false;
        publishChannelsToRadio();
        renderChannelManager();
        syncCountdownTimer();
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (state.loading || state.saving) return;
        clearMessage();

        const profile = getCurrentProfile();
        if (!profile) {
            showMessage("Choose a community name here: 4–16 English letters or numbers, starting with a letter.", "error");
            communityNameInput?.focus();
            return;
        }

        const rawUrl = urlInput.value.trim();
        if (!rawUrl) {
            showMessage("Add a YouTube link first.", "error");
            return;
        }

        const source = parseInputSource(rawUrl);
        const videoId = source.type === "video" ? source.videoId : null;
        const playlistSource = source.type === "playlist" ? source : null;
        if (!videoId && !playlistSource) {
            const sourceType = source.type;
            updateSourceHint();
            const artistSuggestions = window.RENNER_YOUTUBE_SOURCE?.getArtistSuggestions?.(rawUrl) || [];
            showMessage(sourceType === "channel"
                ? artistSuggestions.length
                    ? "Choose a song below to add to your channel."
                    : "This is an artist/channel page. Open it and copy the song or video you want to add."
                : "Enter a valid YouTube link.", "error");
            return;
        }
        const playbackUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : playlistSource.canonicalUrl;
        if (videoId && window.BODWOLF_RADIO?.getVideoAvailability?.(videoId)?.status === "unavailable") {
            updateSourceHint();
            showMessage("This song cannot play here. Choose another song or open it on YouTube.", "error", "source-failure");
            return;
        }

        const ownerChannel = getOwnerChannel();
        const ownerPlaylist = getChannelPlaylistSource(ownerChannel);
        const replacingSource = Boolean(ownerChannel && (playlistSource || ownerPlaylist));
        // Revalidate the current URL on submit as well as input; a stale checked box cannot approve a new source.
        updateSourceHint();
        if (playlistSource && ownerPlaylist?.playlistId === playlistSource.playlistId) {
            showMessage("This playlist is already the source of your channel.", "error");
            return;
        }
        if (replacingSource && !document.getElementById("playlistReplaceSourceCheck")?.checked) {
            updateSourceHint();
            showMessage("Confirm replacing your current channel source before saving.", "error");
            return;
        }
        if (ownerChannel && !replacingSource && hasDuplicateTrack(ownerChannel, videoId)) {
            showMessage("This video is already active inside your channel.", "error");
            return;
        }

        if (ownerChannel && !replacingSource && getActiveTracks(ownerChannel).length >= MAX_ACTIVE_TRACKS) {
            showMessage(`Your channel can hold up to ${MAX_ACTIVE_TRACKS} active tracks.`, "error");
            return;
        }

        const rateLimitRemaining = getAddRateLimitRemaining();
        if (rateLimitRemaining > 0) {
            showMessage(`Please wait ${Math.ceil(rateLimitRemaining / 1000)}s before adding another track.`, "error");
            return;
        }

        setSaving(true);
        const submittedName = nameInput?.value || "";

        try {
            if (replacingSource) {
                await replaceChannelSource(ownerChannel, source);
            } else if (playlistSource) {
                await createChannelWithPlaylist(profile, playlistSource);
            } else if (ownerChannel) {
                await addTrack(ownerChannel, playbackUrl, videoId);
            } else {
                await createChannelWithFirstTrack(profile, playbackUrl, videoId);
            }

            rememberAddTime(Date.now());
            setStoredValue(COMMUNITY_PROFILE_KEYS.name, profile.displayName);
            setStoredValue(COMMUNITY_PROFILE_KEYS.color, profile.userColor);
            if (urlInput.value.trim() === rawUrl) {
                urlInput.value = "";
                state.selectedSuggestedTrack = null;
            }
            updateSourceHint();
            if (nameInput && nameInput.value === submittedName) nameInput.value = "";
            clearMessage();
            showMessage(replacingSource
                ? playlistSource ? "Channel playlist updated." : "Channel source replaced with one track."
                : playlistSource ? "Temporary playlist channel created." : ownerChannel ? "Track added to your channel." : "Temporary channel created.", "success");
        } catch (error) {
            console.warn("Renner Radio: temporary channel save failed.", error);
            showMessage("Could not save this channel update. Check Firebase rules and try again.", "error");
        } finally {
            setSaving(false);
        }
    }

    async function createChannelWithFirstTrack(profile, rawUrl, videoId) {
        const channel = createChannelRecord(profile);
        const now = channel.createdAt;
        const track = createTrack(rawUrl, videoId, now, 1);

        if (state.mode === "firebase" && state.firebaseBridge) {
            await state.firebaseBridge.createTemporaryStationWithFirstTrack(channel, track);
            return;
        }

        state.channels = [{
            ...channel,
            stationId: `local-${now}`,
            tracks: [{ ...track, trackId: `local-track-${now}` }]
        }];
        publishChannelsToRadio();
        renderChannelManager();
        syncCountdownTimer();
    }

    function createChannelRecord(profile) {
        const rawName = nameInput ? nameInput.value.trim() : "";
        const channelName = rawName ? sanitizeStationName(rawName) : `${profile.displayName} FM`;
        if (!channelName) {
            throw new Error("Invalid station name.");
        }

        const now = Date.now();
        return {
            name: channelName,
            frequency: generateFrequency(),
            createdBy: state.userId || "local-preview",
            displayName: profile.displayName,
            createdAt: now,
            expiresAt: now + CHANNEL_EXPIRY_MS,
            status: "active",
            type: "community",
            accentColor: profile.userColor || "#7dd3fc"
        };
    }

    async function createChannelWithPlaylist(profile, source) {
        const channel = {
            ...createChannelRecord(profile),
            youtubePlaylistId: source.playlistId,
            youtubePlaylistUrl: source.canonicalUrl
        };
        if (state.mode === "firebase" && state.firebaseBridge) {
            await state.firebaseBridge.createTemporaryStation(channel);
            return;
        }
        state.channels = [{ ...channel, stationId: `local-${channel.createdAt}`, tracks: [] }];
        publishChannelsToRadio();
        renderChannelManager();
        syncCountdownTimer();
    }

    async function replaceChannelSource(channel, source) {
        const now = Date.now();
        const nextSource = source.type === "playlist"
            ? { youtubePlaylistId: source.playlistId, youtubePlaylistUrl: source.canonicalUrl }
            : { youtubePlaylistId: "", youtubePlaylistUrl: "", track: createTrack(source.canonicalUrl, source.videoId, now, 1) };
        if (state.mode === "firebase" && state.firebaseBridge) {
            await state.firebaseBridge.replaceTemporaryStationSource(channel.stationId, nextSource);
            return;
        }
        channel.youtubePlaylistId = nextSource.youtubePlaylistId;
        channel.youtubePlaylistUrl = nextSource.youtubePlaylistUrl;
        channel.tracks = nextSource.track ? [{ ...nextSource.track, trackId: `local-track-${now}` }] : [];
        publishChannelsToRadio();
        renderChannelManager();
        syncCountdownTimer();
    }

    async function addTrack(channel, rawUrl, videoId) {
        const now = Date.now();
        const nextOrder = getNextTrackOrder(channel);
        const track = createTrack(rawUrl, videoId, now, nextOrder);

        if (state.mode === "firebase" && state.firebaseBridge) {
            await state.firebaseBridge.addTrackToTemporaryStation(channel.stationId, track);
            return;
        }

        channel.tracks = [...getAllTracks(channel), {
            ...track,
            trackId: `local-track-${now}`
        }];
        publishChannelsToRadio();
        renderChannelManager();
        syncCountdownTimer();
    }

    function createTrack(rawUrl, videoId, createdAt, order) {
        return {
            videoId,
            url: rawUrl,
            title: state.selectedSuggestedTrack?.videoId === videoId ? state.selectedSuggestedTrack.title : FALLBACK_TRACK_TITLE,
            order,
            createdAt,
            status: "active"
        };
    }

    async function handleChannelAction(event) {
        const button = event.target.closest("button[data-action]");
        if (!button) return;

        const ownerChannel = getOwnerChannel();
        if (!ownerChannel) return;

        if (button.dataset.action === "remove-track") {
            await removeTrack(ownerChannel, button.dataset.trackId);
        }

        if (button.dataset.action === "remove-channel") {
            await removeChannel(ownerChannel);
        }
    }

    async function removeTrack(channel, trackId) {
        clearMessage();
        const track = getAllTracks(channel).find((item) => item.trackId === trackId);
        if (!track) return;

        try {
            if (state.mode === "firebase" && state.firebaseBridge) {
                await state.firebaseBridge.markTemporaryStationTrackRemoved(channel.stationId, trackId);
            } else {
                track.status = "removed";
                channel.tracks = getAllTracks(channel);
                publishChannelsToRadio();
                renderChannelManager();
            }
            showMessage("Track removed.", "success");
        } catch (error) {
            console.warn("Renner Radio: temporary track remove failed.", error);
            showMessage("Only the owner can remove tracks from this channel.", "error");
        }
    }

    async function removeChannel(channel) {
        clearMessage();

        try {
            if (state.mode === "firebase" && state.firebaseBridge) {
                await state.firebaseBridge.markTemporaryStationRemoved(channel.stationId);
            } else {
                state.channels = state.channels.filter((item) => item.stationId !== channel.stationId);
                publishChannelsToRadio();
                renderChannelManager();
            }
            showMessage("Temporary channel removed.", "success");
        } catch (error) {
            console.warn("Renner Radio: temporary channel remove failed.", error);
            showMessage("Only the owner can remove this channel.", "error");
        }
    }

    function renderChannelManager() {
        pruneExpiredChannels();
        setLoading(state.loading);
        itemsEl.textContent = "";

        const ownerChannel = getOwnerChannel();
        updateFormMode(ownerChannel);
        emptyEl.classList.toggle("hidden", state.loading || Boolean(ownerChannel));

        if (ownerChannel) {
            itemsEl.appendChild(createOwnerChannelElement(ownerChannel));
        }
    }

    function createOwnerChannelElement(channel) {
        const row = document.createElement("li");
        row.className = "playlist-item temporary-channel-item";

        const meta = document.createElement("div");
        meta.className = "playlist-item-meta";

        const title = document.createElement("strong");
        title.textContent = channel.name;
        title.title = channel.name;

        const frequency = document.createElement("span");
        frequency.className = "playlist-item-id";
        frequency.textContent = `${channel.frequency} FM`;

        const countdown = document.createElement("span");
        countdown.className = "playlist-item-countdown";
        countdown.textContent = `${formatRemainingTime(channel.expiresAt - Date.now())} left`;

        const playlistSource = getChannelPlaylistSource(channel);
        const trackCount = document.createElement("span");
        trackCount.className = "playlist-item-owner";
        trackCount.textContent = playlistSource ? "YouTube playlist stream" : `${getActiveTracks(channel).length}/${MAX_ACTIVE_TRACKS} active tracks`;

        meta.append(title, frequency, countdown, trackCount);

        const actions = document.createElement("div");
        actions.className = "playlist-item-actions";

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "playlist-action-btn playlist-action-remove";
        removeButton.dataset.action = "remove-channel";
        removeButton.textContent = "Remove Channel";
        actions.append(removeButton);

        row.append(meta, actions, playlistSource ? createPlaylistSourceList(playlistSource) : createTrackList(channel));
        return row;
    }

    function createPlaylistSourceList(source) {
        const list = document.createElement("ul");
        list.className = "temporary-track-list";
        const item = document.createElement("li");
        item.className = "temporary-track-item playlist-source-item";
        item.dataset.playlistId = source.playlistId;
        const label = document.createElement("span");
        label.textContent = "Playlist stream";
        label.setAttribute("data-i18n", "Playlist stream");
        const availabilityBadge = document.createElement("span");
        availabilityBadge.className = "track-availability";
        availabilityBadge.setAttribute("data-i18n", "Unavailable");
        availabilityBadge.textContent = "Unavailable";
        availabilityBadge.hidden = true;
        label.appendChild(availabilityBadge);
        const open = document.createElement("a");
        open.className = "playlist-action-btn";
        open.href = source.canonicalUrl;
        open.target = "_blank";
        open.rel = "noopener noreferrer";
        open.textContent = "Open playlist";
        open.setAttribute("data-i18n", "Open playlist");
        item.append(label, open);
        markTrackAvailability(item);
        list.appendChild(item);
        return list;
    }

    function createTrackList(channel) {
        const list = document.createElement("ol");
        list.className = "temporary-track-list";

        getActiveTracks(channel).forEach((track) => {
            const item = document.createElement("li");
            item.className = "temporary-track-item";
            item.dataset.videoId = track.videoId;

            const label = document.createElement("span");
            label.textContent = `${track.order}. ${track.title || FALLBACK_TRACK_TITLE} / ${shortVideoId(track.videoId)}`;
            const availabilityBadge = document.createElement("span");
            availabilityBadge.className = "track-availability";
            availabilityBadge.setAttribute("data-i18n", "Unavailable");
            availabilityBadge.textContent = "Unavailable";
            availabilityBadge.hidden = true;
            label.appendChild(availabilityBadge);

            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.className = "playlist-action-btn playlist-action-remove";
            removeButton.dataset.action = "remove-track";
            removeButton.dataset.trackId = track.trackId;
            removeButton.textContent = "Remove Track";

            item.append(label, removeButton);
            markTrackAvailability(item);
            list.appendChild(item);
        });

        return list;
    }

    function markTrackAvailability(item) {
        const status = item.dataset.playlistId
            ? window.BODWOLF_RADIO?.getPlaylistAvailability?.(item.dataset.playlistId)?.status
            : window.BODWOLF_RADIO?.getVideoAvailability?.(item.dataset.videoId)?.status;
        item.dataset.availability = ["available", "unavailable"].includes(status) ? status : "unknown";
        const badge = item.querySelector(".track-availability");
        if (badge) badge.hidden = item.dataset.availability !== "unavailable";
    }

    function updateTrackAvailability() {
        // Keep the user's draft, focused controls and removal actions intact; only update the local status.
        for (const item of itemsEl?.querySelectorAll(".temporary-track-item") || []) markTrackAvailability(item);
        updateSourceHint();
    }

    function updateFormMode(ownerChannel) {
        if (nameInput) {
            nameInput.disabled = Boolean(ownerChannel);
            nameInput.placeholder = ownerChannel ? ownerChannel.name : "Renner FM";
        }

        const source = parseInputSource(urlInput.value);
        const replacing = Boolean(ownerChannel && (getChannelPlaylistSource(ownerChannel) || source.type === "playlist"));
        submitButton.textContent = state.saving
            ? (replacing ? "Updating..." : ownerChannel ? "Adding..." : "Creating...")
            : (replacing ? source.type === "playlist" ? "Replace Playlist" : "Replace Channel Source" : ownerChannel ? "Add Track" : "Create Channel");
    }

    function publishChannelsToRadio() {
        const radioStations = state.channels
            .filter(isVisibleChannel)
            .map((channel) => ({
                category: "COMMUNITY FM",
                freq: channel.frequency,
                name: channel.name,
                id: getActiveTracks(channel)[0]?.videoId || "",
                type: "community",
                status: channel.status,
                stationId: channel.stationId,
                displayName: channel.displayName,
                createdAt: channel.createdAt,
                expiresAt: channel.expiresAt,
                accentColor: channel.accentColor,
                youtubePlaylistId: getChannelPlaylistSource(channel)?.playlistId || "",
                youtubePlaylistUrl: getChannelPlaylistSource(channel)?.canonicalUrl || "",
                tracks: getActiveTracks(channel)
            }));

        if (window.BODWOLF_RADIO && window.BODWOLF_RADIO.setTemporaryStations) {
            window.BODWOLF_RADIO.setTemporaryStations(radioStations);
        }
    }

    function updateSourceHint() {
        const hint = document.getElementById("playlistSourceHint");
        const open = document.getElementById("playlistSourceOpen");
        const source = parseInputSource(urlInput.value);
        if (source?.type !== "video" || source.videoId !== state.selectedSuggestedTrack?.videoId) state.selectedSuggestedTrack = null;
        const suggestions = window.RENNER_YOUTUBE_SOURCE?.getArtistSuggestions?.(source) || [];
        const playlistAvailability = source.type === "playlist" ? window.BODWOLF_RADIO?.getPlaylistAvailability?.(source.playlistId) : null;
        const resolvedHint = document.getElementById("playlistResolvedHint");
        if (resolvedHint) {
            const count = Number(playlistAvailability?.resolvedTrackCount || 0);
            resolvedHint.hidden = !playlistAvailability?.resolved || !count;
            resolvedHint.textContent = resolvedHint.hidden ? "" : playlistAvailability.partial
                ? `Public playlist: ${count} tracks loaded. Additional songs may remain on YouTube.`
                : `Public playlist: ${count} tracks loaded.`;
        }
        const playbackStatus = source?.type === "playlist"
            ? playlistAvailability?.status || "unknown"
            : source?.type === "video" ? window.BODWOLF_RADIO?.getVideoAvailability?.(source.videoId)?.status : "unknown";
        const knownUnavailable = source.type === "video" && playbackStatus === "unavailable";
        const ownerChannel = getOwnerChannel();
        const ownerPlaylist = getChannelPlaylistSource(ownerChannel);
        const replacing = Boolean(ownerChannel && (["playlist", "video"].includes(source.type)) && (source.type === "playlist" || ownerPlaylist));
        const duplicatePlaylist = source.type === "playlist" && ownerPlaylist?.playlistId === source.playlistId;
        const replacementControl = document.getElementById("playlistReplaceSourceControl");
        const replacementCheck = document.getElementById("playlistReplaceSourceCheck");
        const replacementKey = replacing && !duplicatePlaylist ? `${ownerChannel.stationId}:${source.type}:${source.playlistId || source.videoId}` : "";
        if (state.replacementDraftKey !== replacementKey) {
            state.replacementDraftKey = replacementKey;
            if (replacementCheck) replacementCheck.checked = false;
        }
        if (replacementControl) replacementControl.hidden = !replacementKey;
        if (replacementCheck) replacementCheck.disabled = state.loading || state.saving || !replacementKey;
        if (submitButton) submitButton.disabled = state.loading || state.saving || knownUnavailable || duplicatePlaylist || Boolean(replacementKey && !replacementCheck?.checked);
        updateFormMode(ownerChannel);
        if (knownUnavailable && !state.saving && (!messageEl.textContent || ["source-selection", "source-failure"].includes(state.messageOrigin))) {
            showMessage("This song cannot play here. Choose another song or open it on YouTube.", "error", "source-failure");
        } else if (!knownUnavailable && state.messageOrigin === "source-failure") {
            clearMessage();
        }
        if (hint) {
            hint.textContent = source.type === "playlist"
                ? duplicatePlaylist ? "This playlist is already the source of your channel."
                    : playlistAvailability?.playbackStatus === "checking" ? "Checking playlist playback…"
                    : playlistAvailability?.playbackStatus === "waiting" ? "Playback is waiting. Press Play in the receiver to finish checking."
                    : playlistAvailability?.playbackStatus === "blocked" ? "Playback needs a user action. Press Play in the receiver to check this playlist."
                    : playlistAvailability?.playbackStatus === "error" ? "The playlist check could not finish. You can still save the link or open it on YouTube."
                    : playbackStatus === "partial" && playlistAvailability?.playbackStatus === "available" ? "This playlist started here. Some items may be unavailable."
                    : playbackStatus === "available" ? "Playback checked. This playlist started here."
                    : playbackStatus === "unavailable" ? "This playlist could not play here. You can still save its link or open it on YouTube."
                    : ["checking", "pending"].includes(playbackStatus) ? "Checking playlist playback…"
                    : "Playlist link ready. Add it as one channel; the original playlist stays on YouTube."
                : playbackStatus === "unavailable"
                ? "This song cannot play here. Choose another song or open it on YouTube."
                : playbackStatus === "available"
                    ? "Playback checked. This song played here."
                    : source?.type === "channel"
                ? suggestions.length
                    ? "Choose a song below to add to your channel."
                    : "This is an artist/channel page. Open it and copy the song or video you want to add."
                : source?.type === "video"
                        ? "YouTube song link ready. Use the button below to add it."
                    : "Paste a YouTube video, song or playlist link. YouTube Music links work too.";
        }
        if (open) {
            const show = ["channel", "playlist", "video"].includes(source?.type);
            open.hidden = !show;
            if (show) open.href = source.canonicalUrl || source.url;
            else open.removeAttribute("href");
        }
        const preview = document.getElementById("playlistPreviewBtn");
        if (preview) {
            const canPreview = source.type === "playlist"
                ? typeof window.BODWOLF_RADIO?.playPlaylistSource === "function"
                : source.type === "video" && typeof window.BODWOLF_RADIO?.playPlaylistItem === "function";
            preview.disabled = !canPreview || state.loading || state.saving;
            preview.textContent = source.type === "playlist" ? "Check playlist playback" : "Check playback";
            preview.setAttribute("data-i18n", preview.textContent);
        }
        updateArtistSongChoice(source, suggestions);
    }

    function updateArtistSongChoice(source, suggestions) {
        const choice = document.getElementById("playlistArtistChoice");
        const name = document.getElementById("playlistArtistName");
        const track = document.getElementById("playlistSuggestedTrack");
        const trackName = document.getElementById("playlistSuggestedTrackName");
        const trackOpen = document.getElementById("playlistSuggestedTrackOpen");
        const useTrack = document.getElementById("playlistUseSuggestedTrack");
        const isArtist = source?.type === "channel";
        const suggestion = isArtist ? suggestions[0] : null;
        if (choice) choice.hidden = !isArtist;
        if (name) name.textContent = isArtist ? suggestion?.artistName || source.handle || source.canonicalUrl : "";
        if (track) track.hidden = !suggestion;
        if (trackName) trackName.textContent = suggestion?.title || "";
        if (trackOpen) {
            trackOpen.hidden = !suggestion;
            if (suggestion) trackOpen.href = suggestion.url;
            else trackOpen.removeAttribute("href");
        }
        if (useTrack) useTrack.disabled = !suggestion || state.loading || state.saving;
    }

    function useSuggestedArtistTrack() {
        if (state.loading || state.saving) return;
        // Re-resolve the current field on every click so a stale artist suggestion cannot replace a new draft.
        const suggestion = window.RENNER_YOUTUBE_SOURCE?.getArtistSuggestions?.(urlInput.value)?.[0];
        if (!suggestion) return;
        state.selectedSuggestedTrack = suggestion;
        urlInput.value = suggestion.url;
        clearMessage();
        updateSourceHint();
        if (window.BODWOLF_RADIO?.getVideoAvailability?.(suggestion.videoId)?.status !== "unavailable") {
            showMessage("Song selected. Review the details, then use the button below to add it.", "neutral", "source-selection");
        }
        urlInput.focus({ preventScroll: true });
    }

    function previewSourcePlayback() {
        if (state.loading || state.saving) return;
        const source = parseInputSource(urlInput.value);
        if (source.type === "playlist") {
            if (typeof window.BODWOLF_RADIO?.playPlaylistSource !== "function") return;
            window.BODWOLF_RADIO.playPlaylistSource({ playlistId: source.playlistId, playlistUrl: source.canonicalUrl, title: nameInput?.value.trim() || getOwnerChannel()?.name || "YouTube playlist" });
            updateSourceHint();
            return;
        }
        if (typeof window.BODWOLF_RADIO?.playPlaylistItem !== "function") return;
        if (source?.type !== "video") return;
        const suggestion = state.selectedSuggestedTrack?.videoId === source.videoId ? state.selectedSuggestedTrack : null;
        // Use the existing receiver only. Previewing never submits the form or creates a channel.
        window.BODWOLF_RADIO.playPlaylistItem({ videoId: source.videoId, title: suggestion?.title || FALLBACK_TRACK_TITLE });
        updateSourceHint();
    }

    function extractYouTubeVideoId(url) {
        if (window.RENNER_YOUTUBE_SOURCE) return window.RENNER_YOUTUBE_SOURCE.extractYouTubeVideoId(url);
        if (typeof url !== "string") return null;

        const value = url.trim();
        if (!value) return null;

        let parsedUrl;
        try {
            parsedUrl = new URL(value);
        } catch (error) {
            return null;
        }

        if (parsedUrl.protocol !== "https:") return null;

        const hostname = parsedUrl.hostname.toLowerCase();
        let candidate = null;

        if (hostname === "youtu.be") {
            candidate = parsedUrl.pathname.split("/").filter(Boolean)[0];
        }

        if (hostname === "youtube.com" || hostname === "www.youtube.com" || hostname === "m.youtube.com" || hostname === "music.youtube.com") {
            if (parsedUrl.pathname === "/watch") {
                candidate = parsedUrl.searchParams.get("v");
            } else {
                const parts = parsedUrl.pathname.split("/").filter(Boolean);
                if ((parts[0] === "embed" || parts[0] === "shorts") && parts[1]) {
                    candidate = parts[1];
                }
            }
        }

        if (!candidate || !VIDEO_ID_PATTERN.test(candidate)) return null;
        return candidate;
    }

    function parseInputSource(value) {
        if (window.RENNER_YOUTUBE_SOURCE) return window.RENNER_YOUTUBE_SOURCE.parseYouTubeSource(value);
        const videoId = extractYouTubeVideoId(value);
        if (videoId) return { type: "video", videoId, canonicalUrl: `https://www.youtube.com/watch?v=${videoId}` };
        try {
            const url = new URL(String(value || "").trim());
            const playlistId = url.searchParams.get("list") || "";
            if (url.protocol === "https:" && !url.username && !url.password && !url.port && ["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com"].includes(url.hostname.toLowerCase()) && url.pathname === "/playlist" && PLAYLIST_ID_PATTERN.test(playlistId)) {
                return { type: "playlist", playlistId, canonicalUrl: `https://www.youtube.com/playlist?list=${encodeURIComponent(playlistId)}` };
            }
        } catch (_) { /* Missing shared parser still fails closed for unsupported URLs. */ }
        return { type: String(value || "").trim() ? "invalid" : "empty" };
    }

    function getChannelPlaylistSource(channel) {
        const playlistId = typeof channel?.youtubePlaylistId === "string" ? channel.youtubePlaylistId : "";
        if (!PLAYLIST_ID_PATTERN.test(playlistId)) return null;
        const canonicalUrl = `https://www.youtube.com/playlist?list=${encodeURIComponent(playlistId)}`;
        return { type: "playlist", playlistId, canonicalUrl };
    }

    function normalizeChannel(channel) {
        const createdAt = toSafeNumber(channel.createdAt, Date.now());
        return {
            ...channel,
            name: sanitizeStationName(channel.name) || `${getSafeDisplayName(channel.displayName)} FM`,
            frequency: sanitizeFrequency(channel.frequency),
            displayName: getSafeDisplayName(channel.displayName),
            createdAt,
            expiresAt: toSafeNumber(channel.expiresAt, createdAt + CHANNEL_EXPIRY_MS),
            type: "community",
            youtubePlaylistId: getChannelPlaylistSource(channel)?.playlistId || "",
            youtubePlaylistUrl: getChannelPlaylistSource(channel)?.canonicalUrl || "",
            tracks: normalizeTracks(channel.tracks)
        };
    }

    function normalizeTracks(tracks) {
        return Object.entries(tracks || {})
            .map(([trackId, track]) => ({
                trackId,
                ...track,
                title: track.title || FALLBACK_TRACK_TITLE,
                order: toSafeNumber(track.order, 0),
                createdAt: toSafeNumber(track.createdAt, Date.now())
            }))
            .filter((track) => track.status === "active" || track.status === "removed")
            .sort((a, b) => a.order - b.order);
    }

    function isVisibleChannel(channel) {
        return Boolean(
            channel &&
            channel.status === "active" &&
            channel.type === "community" &&
            channel.expiresAt > Date.now() &&
            (getChannelPlaylistSource(channel) || getActiveTracks(channel).length > 0)
        );
    }

    function pruneExpiredChannels() {
        const visibleChannels = state.channels.filter((channel) => channel.status === "active" && channel.expiresAt > Date.now());
        if (visibleChannels.length !== state.channels.length) {
            state.channels = visibleChannels;
            publishChannelsToRadio();
        }
    }

    function syncCountdownTimer() {
        if (state.countdownTimer) {
            window.clearInterval(state.countdownTimer);
            state.countdownTimer = null;
        }

        if (!state.channels.some((channel) => channel.status === "active" && channel.expiresAt > Date.now())) return;

        state.countdownTimer = window.setInterval(() => {
            renderChannelManager();
            publishChannelsToRadio();
            syncCountdownTimer();
        }, 30000);
    }

    function getOwnerChannel() {
        return state.channels.find((channel) => {
            if (channel.status !== "active" || channel.expiresAt <= Date.now()) return false;
            if (state.mode === "firebase") return channel.createdBy === state.userId;
            return channel.createdBy === "local-preview";
        }) || null;
    }

    function getCurrentProfile() {
        // Community FM has its own inline identity. Creating a channel never requires opening chat.
        const displayName = String(communityNameInput?.value || "").trim();
        if (!DISPLAY_NAME_PATTERN.test(displayName)) return null;
        const savedColor = getStoredValue(COMMUNITY_PROFILE_KEYS.color);
        return { displayName, userColor: /^#[0-9A-Fa-f]{6}$/.test(savedColor || "") ? savedColor : "#7dd3fc" };
    }

    function getSafeDisplayName(displayName) {
        if (typeof displayName !== "string") return "RadioGuest";
        const trimmed = displayName.trim();
        return DISPLAY_NAME_PATTERN.test(trimmed) ? trimmed : "RadioGuest";
    }

    function sanitizeStationName(name) {
        if (typeof name !== "string") return "";
        const cleaned = name.trim().replace(/\s+/g, " ").slice(0, 24);
        if (!cleaned || !STATION_NAME_PATTERN.test(cleaned)) return "";
        return cleaned;
    }

    function sanitizeFrequency(frequency) {
        if (typeof frequency === "string" && /^\d{3}\.\d$/.test(frequency)) return frequency;
        return generateFrequency();
    }

    function generateFrequency() {
        const used = new Set(state.channels.map((channel) => channel.frequency));
        const pool = [];
        for (let value = 1011; value <= 1079; value += 2) {
            pool.push((value / 10).toFixed(1));
        }

        const available = pool.filter((frequency) => !used.has(frequency));
        const choices = available.length ? available : pool;
        return choices[Math.floor(Math.random() * choices.length)];
    }

    function hasDuplicateTrack(channel, videoId) {
        return getActiveTracks(channel).some((track) => track.videoId === videoId);
    }

    function getAllTracks(channel) {
        return Array.isArray(channel.tracks) ? channel.tracks : [];
    }

    function getActiveTracks(channel) {
        return getAllTracks(channel)
            .filter((track) => track.status === "active" && VIDEO_ID_PATTERN.test(track.videoId || ""))
            .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
    }

    function getNextTrackOrder(channel) {
        const orders = getAllTracks(channel).map((track) => Number(track.order || 0));
        return orders.length ? Math.max(...orders) + 1 : 1;
    }

    function getAddRateLimitRemaining() {
        const lastAddAt = Number(getStoredValue(ADD_STORAGE_KEY) || "0");
        if (!Number.isFinite(lastAddAt) || lastAddAt <= 0) return 0;
        return Math.max(0, ADD_RATE_LIMIT_MS - (Date.now() - lastAddAt));
    }

    function rememberAddTime(timestamp) {
        setStoredValue(ADD_STORAGE_KEY, String(timestamp));
    }

    function getStoredValue(key) {
        try {
            return window.localStorage ? window.localStorage.getItem(key) : null;
        } catch (error) {
            return null;
        }
    }

    function setStoredValue(key, value) {
        try {
            if (window.localStorage) {
                window.localStorage.setItem(key, value);
            }
        } catch (error) {
            console.warn("Renner Radio: temporary channel localStorage persistence is unavailable.", error);
        }
    }

    function toSafeNumber(value, fallback) {
        return Number.isFinite(Number(value)) ? Number(value) : fallback;
    }

    function formatRemainingTime(milliseconds) {
        const safeMs = Math.max(0, milliseconds);
        const totalSeconds = Math.ceil(safeMs / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        if (minutes <= 0) return `${seconds}s`;
        return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
    }

    function shortVideoId(videoId) {
        if (!videoId) return "unknown";
        return `${videoId.slice(0, 4)}...${videoId.slice(-3)}`;
    }

    function setSaving(isSaving) {
        state.saving = isSaving;
        submitButton.disabled = isSaving || state.loading;
        updateFormMode(getOwnerChannel());
        updateSourceHint();
    }

    function setLoading(isLoading) {
        state.loading = isLoading;
        loadingEl.classList.toggle("hidden", !isLoading);
        submitButton.disabled = isLoading || state.saving;
        updateSourceHint();
    }

    function setModeHint(mode, customText) {
        if (mode === "firebase") {
            modeHintEl.textContent = "Community FM synced. Channels expire after 30 minutes.";
            modeHintEl.classList.add("is-ready");
            return;
        }

        modeHintEl.textContent = customText || "Local preview. Firebase not connected.";
        modeHintEl.classList.remove("is-ready");
    }

    function showMessage(text, type, origin = "action") {
        state.messageOrigin = origin;
        messageEl.textContent = text;
        messageEl.classList.toggle("is-error", type === "error");
        messageEl.classList.toggle("is-success", type === "success");
    }

    function clearMessage() {
        state.messageOrigin = "";
        messageEl.textContent = "";
        messageEl.classList.remove("is-error", "is-success");
    }

    function cleanupTemporaryChannelListener() {
        if (state.unsubscribe) {
            state.unsubscribe();
            state.unsubscribe = null;
        }

        if (state.countdownTimer) {
            window.clearInterval(state.countdownTimer);
            state.countdownTimer = null;
        }
    }

    // V16: Studio Panel can moderate channels/tracks without changing this public schema.
})();
