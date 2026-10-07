/* Ambient motion for illustrated scenes. Load before app.js to receive its first scene event. */
(function () {
    "use strict";

    const frameInterval = 1000 / 30;
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const listenerController = new AbortController();
    const listenerOptions = { signal: listenerController.signal };
    let canvas = null;
    let stage = null;
    let context = null;
    let sizeObserver = null;
    let classObserver = null;
    let visibilityObserver = null;
    let animationFrame = 0;
    let lastFrame = 0;
    let width = 0;
    let height = 0;
    let pixels = 1;
    let clock = 0;
    let particles = [];
    let mode = "rain";
    let inViewport = true;
    let pageSuspended = false;
    let initialized = false;
    let scene = { name: "Midnight Studio", type: "image", src: "midnight-studio" };
    let managedScene = scene;

    function inferMode(value) {
        const words = [value.name, value.src, value.mood].filter(Boolean).join(" ").toLowerCase();
        if (/space|stars?|cosmic|galaxy|orbit/.test(words)) return "stars";
        if (/golden|sunset|sunrise|seaside|beach|warm|room|cafe|coffee/.test(words)) return "dust";
        if (/midnight|neon|night|rain|city|cyber|alley|drift/.test(words)) return "rain";
        return "ambient";
    }

    function animatedSceneType() {
        if (scene.type === "video" || /\.(mp4|webm|mov)(?:[?#]|$)/i.test(scene.src || "")) return "video";
        if (scene.type === "gif" || /\.gif(?:[?#]|$)/i.test(scene.src || "")) return "gif";
        return null;
    }

    function seededRandom(value) {
        let seed = 2166136261;
        for (const character of value) seed = Math.imul(seed ^ character.charCodeAt(0), 16777619);
        return function () {
            seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
            return seed / 4294967296;
        };
    }

    function makeParticles() {
        const random = seededRandom(`${scene.src || scene.name || "renner"}:${mode}`);
        const areaScale = Math.min(1, width * height / 700000);
        const count = mode === "rain" ? Math.round(24 + 30 * areaScale)
            : mode === "stars" ? Math.round(24 + 26 * areaScale)
                : mode === "dust" ? Math.round(12 + 16 * areaScale) : 0;
        particles = Array.from({ length: count }, () => ({
            x: mode === "rain" ? 0.46 + random() * 0.54 : 0.2 + random() * 0.8,
            y: random(),
            speed: 0.035 + random() * 0.055,
            radius: 0.5 + random() * 1.1,
            length: 8 + random() * 13,
            opacity: 0.08 + random() * 0.16,
            phase: random() * Math.PI * 2,
            depth: 0.45 + random() * 0.55
        }));
    }

    function clear() {
        if (context) context.clearRect(0, 0, width, height);
    }

    function stop() {
        if (animationFrame) cancelAnimationFrame(animationFrame);
        animationFrame = 0;
        lastFrame = 0;
    }

    function getMotionState() {
        const nativeMotion = animatedSceneType();
        if (nativeMotion) return nativeMotion;
        if (motionPreference.matches || document.body.classList.contains("comfort-mode")
            || document.body.classList.contains("motion-paused")
            || document.body.classList.contains("reduced-motion")) return "still";
        if (document.hidden || pageSuspended || !inViewport) return "hidden";
        if (!width || !height) return "zero-size";
        return "active";
    }

    function reconcile() {
        if (!context) return;
        const state = getMotionState();
        canvas.dataset.motionMode = mode;
        canvas.dataset.motionState = state;
        if (state !== "active") {
            stop();
            clear();
            return;
        }
        if (!animationFrame) animationFrame = requestAnimationFrame(render);
    }

    function resize() {
        const bounds = stage.getBoundingClientRect();
        const nextWidth = Math.round(bounds.width);
        const nextHeight = Math.round(bounds.height);
        const nextPixels = Math.min(window.devicePixelRatio || 1, 1.5,
            Math.sqrt(2000000 / Math.max(1, nextWidth * nextHeight)));
        if (nextWidth !== width || nextHeight !== height || nextPixels !== pixels) {
            width = nextWidth;
            height = nextHeight;
            pixels = nextPixels;
            canvas.width = Math.max(1, Math.round(width * pixels));
            canvas.height = Math.max(1, Math.round(height * pixels));
            context.setTransform(pixels, 0, 0, pixels, 0, 0);
            makeParticles();
        }
        reconcile();
    }

    function drawGlow(x, y, radius, color, strength) {
        const glow = context.createRadialGradient(x, y, 0, x, y, radius);
        glow.addColorStop(0, `rgba(${color},${strength})`);
        glow.addColorStop(1, `rgba(${color},0)`);
        context.fillStyle = glow;
        context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }

    function drawAtmosphere() {
        const pulse = 0.9 + Math.sin(clock * 0.18) * 0.1;
        const radius = Math.max(width, height) * 0.38;
        if (mode === "rain") {
            const neon = /neon|cyber|alley|city|drift/i.test(`${scene.name} ${scene.src}`);
            drawGlow(width * 0.83, height * 0.27, radius,
                neon ? "123,103,228" : "99,146,164", 0.055 * pulse);
            drawGlow(width * 0.6, height * 0.73, radius * 0.45,
                neon ? "55,189,199" : "229,168,89", 0.035 / pulse);
        } else if (mode === "stars") {
            drawGlow(width * 0.72, height * 0.34, radius, "110,113,218", 0.035 * pulse);
        } else {
            drawGlow(width * 0.7, height * 0.38, radius, "235,169,101", 0.055 * pulse);
        }
    }

    function drawRain(delta) {
        context.lineCap = "round";
        for (const particle of particles) {
            particle.y += delta * (0.22 + particle.speed * 1.5);
            particle.x -= delta * 0.014 * particle.depth;
            if (particle.y > 0.78) {
                particle.y = -0.04;
                if (particle.x < 0.46) particle.x += 0.5;
            }
            const x = particle.x * width;
            const y = particle.y * height;
            const edge = Math.min(1, Math.max(0, (particle.x - 0.45) * 8));
            const fade = Math.max(0, 1 - Math.max(0, particle.y - 0.55) * 4.5);
            context.strokeStyle = `rgba(197,219,232,${particle.opacity * edge * fade})`;
            context.lineWidth = particle.depth * 0.8;
            context.beginPath();
            context.moveTo(x, y);
            context.lineTo(x + particle.length * 0.1, y - particle.length * particle.depth);
            context.stroke();
        }
    }

    function drawDust(delta) {
        for (const particle of particles) {
            particle.y -= delta * particle.speed * 0.09;
            if (particle.y < -0.02) particle.y = 1.02;
            const drift = Math.sin(clock * 0.12 + particle.phase) * width * 0.014;
            const shimmer = 0.45 + Math.sin(clock * 0.28 + particle.phase) * 0.25;
            const edge = Math.sin(Math.max(0, Math.min(1, particle.y)) * Math.PI);
            context.fillStyle = `rgba(247,213,162,${particle.opacity * shimmer * edge})`;
            context.beginPath();
            context.arc(particle.x * width + drift, particle.y * height, particle.radius, 0, Math.PI * 2);
            context.fill();
        }
    }

    function drawStars() {
        for (const particle of particles) {
            const shimmer = 0.45 + Math.sin(clock * 0.32 + particle.phase) * 0.35;
            context.fillStyle = `rgba(220,225,255,${particle.opacity * shimmer})`;
            context.beginPath();
            context.arc(particle.x * width, particle.y * height * 0.8,
                particle.radius * 0.8, 0, Math.PI * 2);
            context.fill();
        }
    }

    function render(time) {
        animationFrame = 0;
        if (getMotionState() !== "active") {
            reconcile();
            return;
        }
        if (!lastFrame || time - lastFrame >= frameInterval - 1) {
            const delta = lastFrame ? Math.min(0.08, (time - lastFrame) / 1000) : 0;
            lastFrame = time;
            clock += delta;
            clear();
            drawAtmosphere();
            if (mode === "rain") drawRain(delta);
            if (mode === "dust") drawDust(delta);
            if (mode === "stars") drawStars();
        }
        animationFrame = requestAnimationFrame(render);
    }

    function selectScene(value) {
        scene = { ...value, type: String(value.type || "image").toLowerCase() };
        mode = inferMode(scene);
        clock = 0;
        makeParticles();
        clear();
        reconcile();
    }

    function onManagedScene(event) {
        managedScene = event.detail || {};
        selectScene(managedScene);
    }

    function onSceneChanged(event) {
        const index = Number(event.detail && event.detail.index);
        if (index < 0) {
            selectScene(managedScene);
            return;
        }
        const selected = event.detail?.scene;
        if (selected?.src) {
            selectScene(selected);
            return;
        }
        const src = window.BODWOLF_CONFIG?.backgrounds?.[index];
        const metadata = window.BODWOLF_CONFIG?.sceneMetadata?.[index] || {};
        if (typeof src === "string") selectScene({ ...metadata, src, type: metadata.type || "image" });
    }

    function onStationChanged(event) {
        // The selected artwork decides the weather; station metadata is only a fallback.
        if (!scene.src && !scene.name) {
            const station = event.detail || {};
            selectScene({ name: station.name, mood: station.mood || station.category, type: "image" });
        }
    }

    function destroy() {
        stop();
        listenerController.abort();
        sizeObserver?.disconnect();
        classObserver?.disconnect();
        visibilityObserver?.disconnect();
        motionPreference.removeEventListener("change", reconcile);
        clear();
    }

    function initialize() {
        if (initialized) return;
        initialized = true;
        canvas = document.getElementById("sceneMotionCanvas");
        const device = canvas?.closest(".radio-device");
        stage = canvas?.closest(".radio-screen") || device;
        if (!canvas || !stage) return destroy();
        context = canvas.getContext("2d", { alpha: true });
        if (!context) {
            canvas.dataset.motionState = "unsupported";
            return destroy();
        }
        canvas.setAttribute("aria-hidden", "true");
        resize();
        sizeObserver = new ResizeObserver(resize);
        sizeObserver.observe(stage);
        classObserver = new MutationObserver(reconcile);
        classObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });
        if ("IntersectionObserver" in window) {
            visibilityObserver = new IntersectionObserver(entries => {
                inViewport = entries[0]?.isIntersecting !== false;
                reconcile();
            }, { threshold: 0 });
            visibilityObserver.observe(stage);
        }
        if (device?.classList.contains("custom-scene")) {
            const index = window.BODWOLF_RADIO?.getSceneIndex?.();
            onSceneChanged({ detail: { index } });
        }
    }

    window.addEventListener("renner:managed-scene", onManagedScene, listenerOptions);
    window.addEventListener("renner:scene-changed", onSceneChanged, listenerOptions);
    window.addEventListener("renner:station-changed", onStationChanged, listenerOptions);
    window.addEventListener("resize", () => { if (context) resize(); }, listenerOptions);
    document.addEventListener("visibilitychange", reconcile, listenerOptions);
    motionPreference.addEventListener("change", reconcile);
    window.addEventListener("pagehide", event => {
        pageSuspended = true;
        reconcile();
        if (!event.persisted) destroy();
    }, listenerOptions);
    window.addEventListener("pageshow", () => {
        pageSuspended = false;
        reconcile();
    }, listenerOptions);
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialize, { once: true, ...listenerOptions });
    } else {
        initialize();
    }
})();
