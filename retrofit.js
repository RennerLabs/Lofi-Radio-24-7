/* Decorative radio controls. The meter shows playback activity, not audio analysis. */
(function () {
    "use strict";

    const effectsKey = "renner:retro-effects";
    const motionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    let initialized = false;
    let disposed = false;
    let playing = false;
    let confirmedPlayback = null;
    let currentStation = null;
    let effectsEnabled = true;
    let inViewport = true;
    let pageSuspended = false;
    let timer = null;
    let beat = 0;
    let meter = null;
    let stage = null;
    let columns = [];
    let classObserver = null;
    let intersectionObserver = null;
    const listeners = [];

    function listen(target, type, handler, options) {
        if (!target?.addEventListener) return;
        target.addEventListener(type, handler, options);
        listeners.push(() => target.removeEventListener(type, handler, options));
    }

    function readEffects() {
        try { return window.localStorage.getItem(effectsKey) !== "off"; }
        catch (_) { return true; }
    }

    function stopMeter() {
        if (timer !== null) window.clearInterval(timer);
        timer = null;
    }

    function setLevel(column, level) {
        const count = column.segments.length;
        const lit = Math.max(0, Math.min(count, Math.round(level)));
        column.level = lit;
        column.element.style.setProperty("--level", String(lit));
        column.element.style.setProperty("--peak-level", String(lit ? Math.min(count, lit + 1) : 0));
        column.segments.forEach((segment, index) => segment.classList.toggle("is-lit", index < lit));
        column.peak?.classList.toggle("is-lit", lit > 0);
    }

    function lowerMeter(level = 0) {
        columns.forEach(column => setLevel(column, level));
    }

    function state() {
        if (!effectsEnabled) return "disabled";
        if (document.hidden || pageSuspended || !inViewport) return "hidden";
        if (!playing) return "off";
        if (motionQuery?.matches || document.body.classList.contains("comfort-mode")
            || document.body.classList.contains("motion-paused")
            || document.body.classList.contains("reduced-motion")) return "still";
        return "active";
    }

    function animate() {
        if (state() !== "active") return reconcile();
        beat += 0.16;
        columns.forEach((column, index) => {
            const center = 1 - Math.abs(index - (columns.length - 1) / 2) / Math.max(1, columns.length / 2);
            const wave = Math.sin(beat * (0.72 + index * 0.035) + index * 1.17);
            const ripple = Math.sin(beat * 1.8 + index * 0.53);
            const target = (0.3 + center * 0.2 + wave * 0.18 + ripple * 0.09) * column.segments.length;
            const ceiling = Math.max(1, column.segments.length - 2);
            setLevel(column, Math.min(ceiling, column.level * 0.55 + target * 0.45));
        });
    }

    function reconcile() {
        if (!meter || disposed) return;
        const nextState = state();
        meter.dataset.meterState = nextState;
        if (nextState !== "active") {
            stopMeter();
            lowerMeter(nextState === "still" ? 2 : 0);
            return;
        }
        if (timer === null) {
            animate();
            timer = window.setInterval(animate, 1000 / 9);
        }
    }

    function updateEffectsButton(button) {
        if (!button) return;
        button.setAttribute("aria-pressed", String(effectsEnabled));
        button.setAttribute("aria-label", `Retro effects ${effectsEnabled ? "on" : "off"}`);
        button.title = effectsEnabled ? "Turn retro effects off" : "Turn retro effects on";
        const label = button.querySelector("[data-retro-label]");
        if (label) label.textContent = effectsEnabled ? "On" : "Off";
    }

    function initializeVolume() {
        const dial = document.getElementById("volumeDial");
        if (!dial) return;
        const desktop = document.getElementById("volumeSlider");
        const mobile = document.getElementById("mobileVolumeSlider");
        const output = document.getElementById("dialValue");
        function synchronize(value) {
            const parsed = Number(value);
            const volume = Math.max(0, Math.min(100, Number.isFinite(parsed) ? parsed : 50));
            const display = String(Math.round(volume));
            dial.value = display;
            if (desktop) desktop.value = display;
            if (mobile) mobile.value = display;
            if (output) output.textContent = `${display}%`;
            dial.setAttribute("aria-valuetext", `${display} percent`);
            const angle = `${volume * 2.7 - 135}deg`;
            dial.style.setProperty("--dial-angle", angle);
            dial.parentElement?.style.setProperty("--dial-angle", angle);
        }
        listen(dial, "input", () => {
            const volume = dial.value;
            const original = desktop || mobile;
            if (original) {
                original.value = volume;
                original.dispatchEvent(new Event("input", { bubbles: true }));
            }
            synchronize(volume);
        });
        if (desktop) listen(desktop, "input", () => synchronize(desktop.value));
        if (mobile) listen(mobile, "input", () => synchronize(mobile.value));
        synchronize(desktop?.value ?? mobile?.value ?? dial.value);
    }

    function updateTuning(station) {
        currentStation = station || currentStation;
        if (!initialized) return;
        const value = Number.parseFloat(currentStation?.freq);
        const position = Number.isFinite(value) ? Math.max(0, Math.min(100, (value - 88) * 5)) : 50;
        document.querySelectorAll(".frequency-dial").forEach(element => {
            element.style.setProperty("--tuning-position", `${position}%`);
        });
    }

    function initialize() {
        if (initialized || disposed) return;
        initialized = true;
        stage = document.querySelector(".radio-device");
        meter = document.getElementById("retroMeter");
        playing = confirmedPlayback ?? stage?.classList.contains("playing") ?? false;
        effectsEnabled = readEffects();
        document.body.classList.toggle("retro-effects-off", !effectsEnabled);
        const effectsButton = document.getElementById("retroEffectBtn");
        updateEffectsButton(effectsButton);
        listen(effectsButton, "click", () => {
            effectsEnabled = !effectsEnabled;
            document.body.classList.toggle("retro-effects-off", !effectsEnabled);
            try { window.localStorage.setItem(effectsKey, effectsEnabled ? "on" : "off"); } catch (_) {}
            updateEffectsButton(effectsButton);
            reconcile();
            window.dispatchEvent(new Event("renner:motion-preference"));
        });
        initializeVolume();
        updateTuning(currentStation || window.BODWOLF_RADIO?.getCurrentStation?.());
        if (!meter) return;
        meter.setAttribute("aria-hidden", "true");
        columns = [...meter.querySelectorAll(".meter-column")].map(element => ({
            element,
            segments: [...element.querySelectorAll(".meter-segment")],
            peak: element.querySelector(".meter-peak"),
            level: 0
        }));
        if (window.MutationObserver) {
            classObserver = new MutationObserver(reconcile);
            classObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });
        }
        if (window.IntersectionObserver) {
            intersectionObserver = new IntersectionObserver(entries => {
                for (const entry of entries) if (entry.target === meter) inViewport = entry.isIntersecting;
                reconcile();
            }, { threshold: 0 });
            intersectionObserver.observe(meter);
        }
        reconcile();
    }

    function destroy() {
        disposed = true;
        stopMeter();
        lowerMeter();
        classObserver?.disconnect();
        intersectionObserver?.disconnect();
        listeners.splice(0).forEach(remove => remove());
    }

    listen(window, "renner:playback-changed", event => {
        if (typeof event.detail?.isPlaying !== "boolean") return;
        confirmedPlayback = event.detail.isPlaying;
        playing = confirmedPlayback;
        reconcile();
    });
    listen(window, "renner:motion-preference", reconcile);
    listen(window, "renner:station-changed", event => updateTuning(event.detail));
    listen(document, "visibilitychange", reconcile);
    listen(motionQuery, "change", reconcile);
    listen(window, "pagehide", event => {
        pageSuspended = true;
        reconcile();
        if (!event.persisted) destroy();
    });
    listen(window, "pageshow", () => {
        pageSuspended = false;
        reconcile();
    });
    if (document.readyState === "loading") listen(document, "DOMContentLoaded", initialize, { once: true });
    else initialize();
})();
