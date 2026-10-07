/* Source recognition only. Channel and playlist pages never become invented video IDs. */
(function (root, factory) {
    "use strict";
    const api = factory();
    if (typeof module === "object" && module.exports) module.exports = api;
    if (root) root.RENNER_YOUTUBE_SOURCE = api;
})(typeof window !== "undefined" ? window : null, function () {
    "use strict";
    const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
    const PLAYLIST_ID = /^[A-Za-z0-9_-]{10,128}$/;
    const CHANNEL_ID = /^UC[A-Za-z0-9_-]{22}$/;
    const LONG_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com"]);
    const SHORT_HOSTS = new Set(["youtu.be", "www.youtu.be"]);
    // A small, verified example for the user-supplied artist. This is not a fetched catalogue.
    const CANNONS_EXAMPLES = Object.freeze([Object.freeze({
        artistName: "Cannons",
        title: "Cannons — Fire for You",
        videoId: "u4HQevc9JE0",
        url: "https://www.youtube.com/watch?v=u4HQevc9JE0"
    })]);
    const NO_EXAMPLES = Object.freeze([]);
    const MESSAGES = Object.freeze({
        empty: "Paste a YouTube song or playlist link. YouTube Music links work too.",
        video: "YouTube video link detected. Open it to check playback.",
        channel: "This is an artist/channel page. Save it in the artist field, then choose a song or video to play.",
        playlist: "Playlist detected. Save this link as a channel to play its songs in order.",
        invalid: "Enter a valid YouTube song or playlist URL, or an 11-character video ID.",
        artist: "Artist/channel page must be a YouTube channel URL."
    });

    function videoSource(videoId, playlistId = "") {
        const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;
        return { type: "video", videoId, playlistId, url: canonicalUrl, canonicalUrl };
    }

    function parseYouTubeSource(value) {
        const input = String(value || "").trim();
        if (!input) return { type: "empty" };
        if (VIDEO_ID.test(input)) return videoSource(input);
        let url;
        try { url = new URL(input); } catch (_) { return { type: "invalid" }; }
        if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || url.port) return { type: "invalid" };
        const host = url.hostname.toLowerCase();
        const parts = url.pathname.split("/").filter(Boolean);
        if (SHORT_HOSTS.has(host)) return parts.length === 1 && VIDEO_ID.test(parts[0]) ? videoSource(parts[0]) : { type: "invalid" };
        if (!LONG_HOSTS.has(host)) return { type: "invalid" };
        const watchId = url.searchParams.get("v") || "";
        const playlistId = url.searchParams.get("list") || "";
        if (parts[0] === "watch" && parts.length === 1 && VIDEO_ID.test(watchId)) return videoSource(watchId, PLAYLIST_ID.test(playlistId) ? playlistId : "");
        if (["embed", "shorts", "live"].includes(parts[0]) && parts.length === 2 && VIDEO_ID.test(parts[1])) return videoSource(parts[1]);
        if (parts[0] === "playlist" && parts.length === 1 && PLAYLIST_ID.test(playlistId)) {
            const canonicalUrl = `https://www.youtube.com/playlist?list=${encodeURIComponent(playlistId)}`;
            return { type: "playlist", playlistId, url: canonicalUrl, canonicalUrl };
        }
        let channelPath = "";
        let handle = "";
        // Handles may contain non-Latin characters. URL path separators remain disallowed.
        if (parts[0]?.startsWith("@") && parts[0].length > 1) {
            let decoded;
            try { decoded = decodeURIComponent(parts[0]); } catch (_) { return { type: "invalid" }; }
            if (!/^@[\p{L}\p{N}_.·-]+$/u.test(decoded)) return { type: "invalid" };
            handle = decoded;
            channelPath = parts[0];
        } else if (parts[0] === "channel" && CHANNEL_ID.test(parts[1] || "")) {
            channelPath = `channel/${parts[1]}`;
        } else if (["c", "user"].includes(parts[0]) && /^[A-Za-z0-9_-]+$/.test(parts[1] || "")) {
            channelPath = `${parts[0]}/${parts[1]}`;
        }
        if (channelPath) {
            const canonicalHost = host === "music.youtube.com" ? host : "www.youtube.com";
            const canonicalUrl = `https://${canonicalHost}/${channelPath}`;
            return { type: "channel", handle, url: canonicalUrl, canonicalUrl };
        }
        return { type: "invalid" };
    }

    function extractYouTubeVideoId(value) {
        const parsed = parseYouTubeSource(value);
        return parsed.type === "video" ? parsed.videoId : null;
    }

    function getArtistSuggestions(value) {
        const source = typeof value === "string" ? parseYouTubeSource(value) : value;
        return source?.type === "channel" && String(source.handle || "").toLowerCase() === "@cannonstheband"
            ? CANNONS_EXAMPLES : NO_EXAMPLES;
    }

    function collectYouTubeStationSource(playbackInput, artistInput = "", requirePlayback = true) {
        const playback = parseYouTubeSource(playbackInput);
        const artist = parseYouTubeSource(artistInput);
        if (artist.type !== "empty" && artist.type !== "channel") return { ok: false, message: MESSAGES.artist };
        if (!["video", "playlist"].includes(playback.type) && !(playback.type === "empty" && !requirePlayback)) {
            return { ok: false, message: MESSAGES[playback.type] || MESSAGES.invalid };
        }
        return {
            ok: true,
            youtubeId: playback.videoId || "",
            youtubeUrl: playback.type === "video" ? playback.canonicalUrl : "",
            youtubePlaylistId: playback.type === "playlist" ? playback.playlistId : "",
            youtubePlaylistUrl: playback.type === "playlist" ? playback.canonicalUrl : "",
            youtubeChannelUrl: artist.canonicalUrl || ""
        };
    }

    return Object.freeze({ parseYouTubeSource, extractYouTubeVideoId, collectYouTubeStationSource, getArtistSuggestions, messages: MESSAGES });
});
