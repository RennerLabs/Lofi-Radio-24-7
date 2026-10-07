/* A real frequency dial over the existing radio and current filtered catalog. */
(function () {
    "use strict";

    const byId = id => document.getElementById(id);
    const hint = "Drag to tune · Arrow keys or scroll to change station";
    let initialized = false;
    let rows = [];
    let signature = "";
    let activeIndex = -1;
    let visualPosition = 0;
    let desiredPosition = 0;
    let dialFrame = null;
    let dialToken = 0;
    let pendingKey = null;
    let pendingTimer = null;
    let wheelPixels = 0;
    let lastWheelStep = -Infinity;
    let draggingDial = false;
    let dragOriginPosition = 0;
    let root, scale, range, frequency, name, position, help, canvas;

    const radio = () => window.BODWOLF_RADIO;
    const localized = text => window.RENNER_I18N?.translateOwnedText?.(text) || text;
    const now = () => window.performance?.now?.() ?? Date.now();
    const reduced = () => window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches || document.body.classList.contains("comfort-mode");

    function stationKey(station, index) {
        return radio()?.getStationKey?.(station) || station?.stationId || station?.id || `station:${index}`;
    }

    function readRows(includeUnavailable = false) {
        try {
            return (radio()?.getFilteredStationRows?.() || [])
                .filter(row => row?.station && Number.isInteger(row.index) && (includeUnavailable || row.selectable !== false))
                .map(row => ({ ...row, key: row.key || stationKey(row.station, row.index) }));
        } catch (_) { return []; }
    }

    function frequencyOf(station) {
        return String(station?.freq || "").trim().replace(/\s*(?:FM|MHz)\s*$/i, "") || "—";
    }

    function cancelPending() {
        clearTimeout(pendingTimer);
        pendingTimer = null;
        pendingKey = null;
    }

    function selectKey(key) {
        cancelPending();
        const candidates = readRows();
        const choice = candidates.find(row => row.key === key);
        if (!choice) { synchronize(); return; }
        const current = radio()?.getCurrentStation?.();
        const playback = radio()?.getCurrentPlayback?.();
        if (stationKey(current, -1) !== choice.key || playback?.source === "playlist") {
            radio()?.loadStationByIndex?.(choice.index);
        }
        // The radio owns the selection. Read it back rather than optimistically
        // displaying the requested channel when the source cannot select it.
        synchronize();
    }

    function choose(index, deferred = false) {
        if (!rows.length) return;
        const safeIndex = Math.max(0, Math.min(rows.length - 1, Math.round(Number(index) || 0)));
        const key = rows[safeIndex].key;
        range.value = String(safeIndex);
        updateRangeProgress();
        cancelPending();
        if (!deferred) { selectKey(key); return; }
        pendingKey = key;
        pendingTimer = setTimeout(() => selectKey(key), 140);
    }

    function nearestIndex(current) {
        const value = Number.parseFloat(frequencyOf(current));
        if (!Number.isFinite(value)) return 0;
        let nearest = 0, distance = Infinity;
        rows.forEach((row, index) => {
            const candidate = Number.parseFloat(frequencyOf(row.station));
            const nextDistance = Number.isFinite(candidate) ? Math.abs(candidate - value) : Infinity;
            if (nextDistance < distance) { nearest = index; distance = nextDistance; }
        });
        return nearest;
    }

    function updateRangeProgress() {
        const lower = Number(range.min) || 0, upper = Number(range.max) || 0;
        const fraction = upper > lower ? Math.max(0, Math.min(1, ((Number(range.value) || 0) - lower) / (upper - lower))) : 0;
        range.style.setProperty("--tuner-progress", `${Math.round(fraction * 10000) / 100}%`);
    }

    function refreshRange(current, isPlaylist, matchingCount) {
        const sourceKey = stationKey(current, -1);
        activeIndex = isPlaylist ? -1 : rows.findIndex(row => row.key === sourceKey);
        range.min = "0";
        range.max = String(Math.max(0, rows.length - 1));
        range.step = "1";
        range.disabled = rows.length === 0;
        range.value = String(activeIndex >= 0 ? activeIndex : nearestIndex(current));
        updateRangeProgress();
        range.setAttribute("aria-valuemin", "0");
        range.setAttribute("aria-valuemax", range.max);
        range.setAttribute("aria-valuenow", range.value);
        range.setAttribute("aria-label", localized("Tune a station"));
        const outside = !isPlaylist && current && activeIndex < 0 && rows.length > 0;
        const emptyHint = matchingCount ? "No available stations in this filter." : "No stations match this filter.";
        const currentLabel = `${frequency.textContent}${isPlaylist ? "" : " FM"} — ${name.textContent}`;
        range.setAttribute("aria-valuetext", rows.length ? `${currentLabel}${outside ? `. ${localized("Current station is outside this filter.")}` : ""}` : localized(emptyHint));
        help.textContent = localized(!rows.length ? emptyHint : outside ? "Current station is outside this filter." : hint);
        if (position) position.textContent = `${activeIndex >= 0 ? String(activeIndex + 1).padStart(2, "0") : "—"} / ${rows.length}`;
        root.dataset.outsideFilter = String(Boolean(outside));
        root.dataset.stationCount = String(rows.length);
        root.dataset.activeIndex = String(activeIndex);
    }

    function synchronize() {
        if (!initialized) return;
        const matchingRows = readRows(true);
        const nextRows = matchingRows.filter(row => row.selectable !== false);
        const nextSignature = nextRows.map(row => `${row.key}:${row.station.freq}:${row.station.name}`).join("|");
        const catalogChanged = nextSignature !== signature;
        if (catalogChanged) {
            cancelPending();
            draggingDial = false;
        }
        signature = nextSignature;
        rows = nextRows;
        const current = radio()?.getCurrentStation?.();
        const playback = radio()?.getCurrentPlayback?.();
        const isPlaylist = playback?.source === "playlist";
        frequency.textContent = isPlaylist ? "—" : frequencyOf(current);
        name.textContent = isPlaylist ? playback.title || localized("YouTube Track") : current?.name || localized("Choose your frequency");
        refreshRange(current, isPlaylist, matchingRows.length);
        animateDial(activeIndex >= 0 ? activeIndex : nearestIndex(current), catalogChanged);
    }

    function drawDial(centerPosition) {
        const context = canvas?.getContext?.("2d");
        if (!context) return;
        const width = Math.max(240, scale.clientWidth || 320);
        const extended = document.body.classList.contains("radio-spatial-ready");
        const height = extended ? Math.max(148, scale.clientHeight || 290) : 148;
        const density = Math.min(3, window.devicePixelRatio || 1);
        if (canvas.width !== Math.round(width * density) || canvas.height !== Math.round(height * density)) {
            canvas.width = Math.round(width * density);
            canvas.height = Math.round(height * density);
        }
        context.setTransform(density, 0, 0, density, 0, 0);
        context.clearRect(0, 0, width, height);
        context.shadowBlur = 0;
        const ratio = width / 320;
        const cx = extended ? width * .55 : 167 * ratio, cy = height / 2;
        const outerRadius = extended ? Math.min(width * .43, height * .48) : 82;
        const rgb = window.getComputedStyle?.(document.body)?.getPropertyValue?.("--display-rgb")?.trim() || "128, 239, 176";
        const point = (angle, radius) => ({ x: cx - Math.cos(angle) * radius * (extended ? 1 : ratio), y: cy + Math.sin(angle) * radius });
        const radians = degrees => degrees * Math.PI / 180;
        for (const radius of [outerRadius * .99, outerRadius * .85, outerRadius * .72]) {
            context.beginPath();
            for (let degrees = -62; degrees <= 62; degrees += 2) {
                const p = point(radians(degrees), radius);
                degrees === -62 ? context.moveTo(p.x, p.y) : context.lineTo(p.x, p.y);
            }
            context.strokeStyle = `rgba(${rgb}, .36)`;
            context.lineWidth = 1;
            context.stroke();
        }
        if (!rows.length) return;
        const step = rows.length > 15 ? 10 : 14;
        let selectedLabelRight = -Infinity;
        // Every labeled mark belongs to a real, currently selectable station.
        rows.forEach((row, index) => {
            const degrees = (index - centerPosition) * step;
            if (Math.abs(degrees) > 62) return;
            const angle = radians(degrees);
            const selected = index === activeIndex;
            const outer = point(angle, outerRadius), inner = point(angle, outerRadius * (selected ? .74 : .87));
            context.beginPath(); context.moveTo(inner.x, inner.y); context.lineTo(outer.x, outer.y);
            context.strokeStyle = "rgba(2, 5, 15, .95)";
            context.lineWidth = selected ? 6 : 3.5;
            context.stroke();
            context.strokeStyle = selected ? "#effdff" : "rgba(223, 243, 255, .84)";
            context.lineWidth = selected ? 2.8 : 1.3;
            context.shadowColor = `rgba(${rgb}, ${selected ? ".95" : ".25"})`;
            context.shadowBlur = selected ? 13 : 3;
            context.stroke(); context.shadowBlur = 0;
            const text = point(angle, outerRadius + (extended ? 29 : 20));
            context.fillStyle = selected ? "#f4fdff" : "#d9edff";
            const fontSize = extended ? selected ? 16 : 13 : 10;
            context.font = `bold ${fontSize}px "Share Tech Mono", monospace`;
            context.textAlign = "center"; context.textBaseline = "middle";
            if (text.y > 7 && text.y < height - 7) {
                const label = frequencyOf(row.station);
                const measuredWidth = context.measureText?.(label)?.width;
                const halfWidth = (Number.isFinite(measuredWidth) && measuredWidth > 0 ? measuredWidth : label.length * fontSize * .64) / 2;
                text.x = Math.max(halfWidth + 4, Math.min(width - halfWidth - 4, text.x));
                if (selected) selectedLabelRight = text.x + halfWidth;
                context.strokeStyle = "rgba(2, 5, 15, .95)"; context.lineWidth = 3;
                context.strokeText?.(label, text.x, text.y);
                context.shadowColor = selected ? `rgb(${rgb})` : "#02050f";
                context.shadowBlur = selected ? 8 : 5;
                context.fillText(label, text.x, text.y); context.shadowBlur = 0;
            }
            // Fine unlabelled subdivisions are positional marks between real
            // neighboring entries, rather than fabricated station frequencies.
            if (index < rows.length - 1) {
                for (let sub = 1; sub < 4; sub++) {
                    const subDegrees = degrees + sub * step / 4;
                    if (Math.abs(subDegrees) > 62) continue;
                    const a = point(radians(subDegrees), outerRadius * .94), b = point(radians(subDegrees), outerRadius * .99);
                    context.beginPath(); context.moveTo(a.x, a.y); context.lineTo(b.x, b.y);
                    context.strokeStyle = "rgba(213, 235, 255, .48)"; context.lineWidth = .9; context.stroke();
                }
            }
        });
        if (activeIndex >= 0) {
            const arcLeft = cx - outerRadius * (extended ? 1 : ratio);
            const markerStart = Math.max(arcLeft + 6, selectedLabelRight + 8);
            const markerEnd = extended ? width * .5 - 12 : 172 * ratio;
            context.beginPath(); context.moveTo(markerStart, cy); context.lineTo(markerEnd, cy);
            context.strokeStyle = "#02050f"; context.lineWidth = 6; context.stroke();
            context.strokeStyle = "#f1fdff"; context.lineWidth = 2.2;
            context.shadowColor = `rgb(${rgb})`; context.shadowBlur = 14;
            context.stroke();
            context.beginPath(); context.moveTo(markerStart, cy - 5); context.lineTo(markerStart + 5, cy); context.lineTo(markerStart, cy + 5);
            context.strokeStyle = `rgb(${rgb})`; context.lineWidth = 2.5;
            context.stroke(); context.shadowBlur = 0;
        }
    }

    function animateDial(target, immediate = false) {
        if (!immediate && target === desiredPosition && dialFrame !== null) return;
        desiredPosition = target;
        const token = ++dialToken;
        if (dialFrame !== null) window.cancelAnimationFrame?.(dialFrame);
        dialFrame = null;
        if (immediate || reduced() || typeof window.requestAnimationFrame !== "function" || Math.abs(target - visualPosition) < .01) {
            visualPosition = target; drawDial(target); return;
        }
        const start = visualPosition, started = now();
        const frame = () => {
            if (token !== dialToken) return;
            const progress = Math.min(1, Math.max(0, (now() - started) / (document.body.classList.contains("radio-spatial-ready") ? 360 : 220)));
            const eased = 1 - (1 - progress) ** 3;
            visualPosition = start + (target - start) * eased;
            drawDial(visualPosition);
            if (progress < 1) dialFrame = window.requestAnimationFrame(frame);
            else dialFrame = null;
        };
        dialFrame = window.requestAnimationFrame(frame);
    }

    function keyDown(event) {
        const base = activeIndex >= 0 ? activeIndex : Number(range.value) || 0;
        const changes = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 5, PageDown: -5 };
        if (!Object.hasOwn(changes, event.key) && event.key !== "Home" && event.key !== "End") return;
        event.preventDefault();
        choose(event.key === "Home" ? 0 : event.key === "End" ? rows.length - 1 : base + changes[event.key]);
    }

    function wheel(event) {
        if (!rows.length || event.ctrlKey || !Number.isFinite(event.deltaY)) return;
        event.preventDefault();
        const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 120 : 1);
        wheelPixels += delta;
        if (Math.abs(wheelPixels) < 28 || now() - lastWheelStep < 150) return;
        const direction = Math.sign(wheelPixels);
        wheelPixels = 0;
        lastWheelStep = now();
        choose((activeIndex >= 0 ? activeIndex : Number(range.value) || 0) + direction);
    }

    function dragDial(event, deferred = true) {
        if (!rows.length) return;
        const box = scale.getBoundingClientRect();
        const extended = document.body.classList.contains("radio-spatial-ready");
        const cx = box.width * (extended ? .55 : 167 / 320), cy = extended ? box.height / 2 : 74;
        const angle = Math.atan2(event.clientY - box.top - cy, cx - (event.clientX - box.left)) * 180 / Math.PI;
        const step = rows.length > 15 ? 10 : 14;
        choose(dragOriginPosition + Math.max(-62, Math.min(62, angle)) / step, deferred);
    }

    function initialize() {
        if (initialized) return;
        root = byId("stationTuner"); scale = byId("stationTunerScale"); range = byId("stationTunerRange");
        frequency = byId("stationTunerFrequency"); name = byId("stationTunerName"); position = byId("stationTunerPosition"); help = byId("stationTunerHelp");
        if (!root || !scale || !range || !frequency || !name || !help) return;
        initialized = true;
        canvas = document.createElement("canvas"); canvas.setAttribute("aria-hidden", "true"); scale.appendChild(canvas);
        range.addEventListener("input", () => choose(range.value, true));
        range.addEventListener("change", () => choose(range.value));
        range.addEventListener("keydown", keyDown);
        // A single-result filter still lets a pointer select its only station.
        range.addEventListener("pointerup", () => { if (rows.length === 1) choose(0); });
        root.addEventListener("wheel", wheel, { passive: false });
        scale.addEventListener("pointerdown", event => {
            if (event.button !== undefined && event.button !== 0) return;
            draggingDial = true; dragOriginPosition = desiredPosition; scale.setPointerCapture?.(event.pointerId); dragDial(event);
        });
        scale.addEventListener("pointermove", event => { if (draggingDial) dragDial(event); });
        scale.addEventListener("pointerup", event => {
            if (!draggingDial) return;
            draggingDial = false; scale.releasePointerCapture?.(event.pointerId);
            if (pendingKey) selectKey(pendingKey);
        });
        scale.addEventListener("pointercancel", () => { draggingDial = false; cancelPending(); synchronize(); });
        for (const event of ["renner:station-changed", "renner:source-changed", "renner:catalog-changed", "renner:station-filter-changed", "renner:availability-changed", "renner:favorites-changed", "renner:language-changed"]) window.addEventListener(event, synchronize);
        if (typeof window.ResizeObserver === "function") new window.ResizeObserver(() => drawDial(visualPosition)).observe(scale);
        window.addEventListener("resize", () => drawDial(visualPosition));
        window.addEventListener("renner:tuner-layout-changed", () => drawDial(visualPosition));
        document.querySelectorAll("[data-display-color]").forEach(button => button.addEventListener("click", () => drawDial(visualPosition)));
        synchronize();
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
    else initialize();
})();
