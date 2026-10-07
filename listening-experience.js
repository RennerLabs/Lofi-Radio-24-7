/* Decorative details follow the existing receiver's real playback and fold state. */
(function (global) {
    "use strict";

    function normalizeLanguage(language) { return language === "ar" ? "ar" : "en"; }

    function normalizeCreator(config = {}) {
        const name = typeof config.name === "string" && config.name.trim() ? config.name.trim().slice(0, 60) : "RennerLabs";
        const safeUrl = (value, github = false) => {
            try {
                const url = new URL(value);
                if (url.protocol !== "https:" || url.username || url.password || (github && url.hostname !== "github.com")) return "";
                return url.href;
            } catch (_) { return ""; }
        };
        return { name, githubUrl: safeUrl(config.githubUrl, true), coffeeUrl: safeUrl(config.coffeeUrl) };
    }

    function graphemes(text, language) {
        if (typeof Intl === "object" && typeof Intl.Segmenter === "function") {
            return Array.from(new Intl.Segmenter(language, { granularity: "grapheme" }).segment(text), entry => entry.segment);
        }
        // Keep combining marks attached to their base letter in older browsers.
        return Array.from(text).reduce((parts, character) => {
            if (/\p{Mark}/u.test(character) && parts.length) parts[parts.length - 1] += character;
            else parts.push(character);
            return parts;
        }, []);
    }

    function createQuoteController(options) {
        const items = options.items || [];
        const clock = options.clock || { now: () => Date.now(), setTimeout: (fn, ms) => global.setTimeout(fn, ms), clearTimeout: id => global.clearTimeout(id) };
        const duration = options.rotationMs || 180000;
        let index = 0;
        let language = normalizeLanguage(options.language);
        let visible = options.visible !== false;
        let started = false;
        let timer = null;
        let due = 0;
        let remaining = duration;

        function publish(animate) {
            if (items.length) options.onChange({ item: items[index], index, language, animate: Boolean(animate && visible) });
        }
        function clearTimer() {
            if (timer !== null) clock.clearTimeout(timer);
            timer = null;
        }
        function schedule() {
            clearTimer();
            if (!started || !visible || items.length < 2) return;
            due = clock.now() + remaining;
            timer = clock.setTimeout(() => {
                timer = null;
                index = (index + 1) % items.length;
                remaining = duration;
                publish(true);
                schedule();
            }, remaining);
        }
        return Object.freeze({
            start() {
                if (started || !items.length) return;
                started = true;
                publish(true);
                schedule();
            },
            setLanguage(next) {
                next = normalizeLanguage(next);
                if (language === next) return;
                language = next;
                if (started) publish(false);
            },
            setVisible(next) {
                next = Boolean(next);
                if (visible === next) return;
                if (!next && timer !== null) remaining = Math.max(0, due - clock.now());
                visible = next;
                schedule();
            },
            refresh() { if (started) publish(false); },
            stop() { clearTimer(); started = false; },
            getState() { return { index, language, visible, started }; }
        });
    }

    function createTypewriter(options) {
        const clock = options.clock || { setTimeout: (fn, ms) => global.setTimeout(fn, ms), clearTimeout: id => global.clearTimeout(id) };
        let timer = null;
        let target = "";
        function cancel() {
            if (timer !== null) clock.clearTimeout(timer);
            timer = null;
        }
        function finish() {
            cancel();
            options.onText(target, false);
        }
        return Object.freeze({
            write(text, language, animate) {
                cancel();
                target = text;
                if (!animate || !text) return finish();
                const characters = graphemes(text, language);
                let length = 0;
                const step = Math.min(28, Math.max(12, Math.round(1000 / characters.length)));
                function tick() {
                    timer = null;
                    length += 1;
                    options.onText(characters.slice(0, length).join(""), length < characters.length);
                    if (length < characters.length) timer = clock.setTimeout(tick, step);
                }
                options.onText("", true);
                timer = clock.setTimeout(tick, step);
            },
            finish,
            stop: cancel
        });
    }

    function createCassette(document) {
        const cassette = document.createElement("span");
        cassette.className = "renner-cassette";
        cassette.setAttribute("aria-hidden", "true");
        cassette.setAttribute("dir", "ltr");
        const label = document.createElement("span");
        label.className = "cassette-label";
        label.textContent = "RENNER";
        const side = document.createElement("span");
        side.className = "cassette-side";
        side.textContent = "A";
        const window = document.createElement("span");
        window.className = "cassette-window";
        for (const sideName of ["left", "right"]) {
            const reel = document.createElement("span");
            reel.className = `cassette-reel cassette-reel-${sideName}`;
            const spindle = document.createElement("span");
            spindle.className = "cassette-spindle";
            reel.append(spindle);
            window.append(reel);
        }
        const bridge = document.createElement("span");
        bridge.className = "cassette-tape";
        window.append(bridge);
        const mouth = document.createElement("span");
        mouth.className = "cassette-mouth";
        for (let i = 0; i < 4; i += 1) {
            const screw = document.createElement("span");
            screw.className = `cassette-screw cassette-screw-${i}`;
            cassette.append(screw);
        }
        cassette.append(label, side, window, mouth);
        return cassette;
    }

    let initialized = false;
    function init() {
        if (initialized || !global.document) return;
        initialized = true;
        const document = global.document;
        const body = document.body;
        const reducedPreference = global.matchMedia?.("(prefers-reduced-motion: reduce)");
        const isReduced = () => Boolean(reducedPreference?.matches || body.classList.contains("comfort-mode") || body.classList.contains("reduced-motion"));
        const creator = normalizeCreator(global.BODWOLF_CONFIG?.creator);
        const creatorLink = document.getElementById("creatorGithub");
        if (creatorLink) {
            const name = creatorLink.querySelector("bdi");
            if (name) name.textContent = creator.name;
            if (creator.githubUrl) creatorLink.href = creator.githubUrl;
            else creatorLink.removeAttribute("href");
        }
        const coffeePlaceholder = document.getElementById("creatorCoffee");
        if (coffeePlaceholder && creator.coffeeUrl) {
            const coffeeLink = document.createElement("a");
            coffeeLink.id = coffeePlaceholder.id;
            coffeeLink.className = coffeePlaceholder.className;
            coffeeLink.href = creator.coffeeUrl;
            coffeeLink.target = "_blank";
            coffeeLink.rel = "noopener noreferrer";
            const label = document.createElement("span");
            label.setAttribute("data-i18n", "Buy me a coffee");
            label.textContent = global.RENNER_I18N?.translateOwnedText?.("Buy me a coffee") || "Buy me a coffee";
            const icon = coffeePlaceholder.querySelector("i");
            if (icon) coffeeLink.append(icon);
            coffeeLink.append(label);
            coffeePlaceholder.replaceWith(coffeeLink);
        }
        let cassette = null;
        const art = document.getElementById("neonNowArt");
        if (art?.parentElement) {
            cassette = createCassette(document);
            art.before(cassette);
            art.classList.add("cassette-art-replaced");
            cassette.classList.toggle("is-playing", Boolean(document.querySelector(".radio-device.playing")));
            cassette.classList.toggle("is-document-hidden", document.hidden);
        }

        for (const id of ["toggleChannelsBtn", "toggleCommunityBtn"]) {
            const button = document.getElementById(id);
            if (!button) continue;
            button.classList.add("experience-fold-toggle");
            const orbit = document.createElement("span");
            orbit.className = "experience-fold-orbit";
            orbit.setAttribute("aria-hidden", "true");
            const arrow = document.createElement("span");
            arrow.className = "experience-fold-arrow";
            orbit.append(arrow);
            button.append(orbit);
            const icon = button.querySelector("i");
            const sync = () => { button.dataset.foldDirection = icon?.classList.contains("fa-chevron-left") ? "left" : "right"; };
            sync();
            if (icon && typeof global.MutationObserver === "function") {
                new global.MutationObserver(sync).observe(icon, { attributes: true, attributeFilter: ["class"] });
            }
        }

        const slot = document.querySelector(".content-footer > span:first-child");
        const library = global.RENNER_QUOTE_LIBRARY;
        let quoteController = null;
        let typewriter = null;
        let quoteMotion = null;
        if (slot && library?.items?.length) {
            slot.removeAttribute("data-i18n");
            slot.classList.add("renner-quote-slot");
            slot.setAttribute("aria-live", "off");
            const footer = slot.closest(".content-footer");
            footer?.classList.add("has-renner-quote");
            body.classList.add("quote-experience-on");
            const fullText = document.createElement("span");
            fullText.className = "sr-only";
            const line = document.createElement("q");
            line.className = "renner-quote-text";
            line.setAttribute("aria-hidden", "true");
            const lineWrapper = document.createElement("span");
            lineWrapper.className = "renner-quote-line";
            const measure = document.createElement("q");
            measure.className = "renner-quote-text renner-quote-measure";
            measure.setAttribute("aria-hidden", "true");
            lineWrapper.append(measure, line);
            const credit = document.createElement("a");
            credit.className = "renner-quote-credit";
            credit.target = "_blank";
            credit.rel = "noopener noreferrer";
            const creditText = document.createElement("bdi");
            const sourceArrow = document.createElement("span");
            sourceArrow.className = "quote-source-arrow";
            sourceArrow.textContent = "↗";
            sourceArrow.setAttribute("aria-hidden", "true");
            credit.append(creditText, sourceArrow);
            slot.replaceChildren(fullText, lineWrapper, credit);
            const measureFooter = () => {
                if (!footer) return;
                const height = Math.ceil(footer.getBoundingClientRect().height);
                if (height > 0) body.style.setProperty("--renner-quote-footer-height", `${height}px`);
                const playerHeight = Math.ceil(document.querySelector(".player-bar")?.getBoundingClientRect().height || 0);
                if (playerHeight > 0) body.style.setProperty("--renner-player-bar-height", `${playerHeight}px`);
            };
            if (footer && typeof global.ResizeObserver === "function") {
                const observer = new global.ResizeObserver(measureFooter);
                observer.observe(footer);
                const playerBar = document.querySelector(".player-bar");
                if (playerBar) observer.observe(playerBar);
            }
            global.addEventListener("resize", measureFooter);
            typewriter = createTypewriter({ onText(text, typing) {
                line.textContent = text;
                line.classList.toggle("is-typing", typing);
            } });
            quoteController = createQuoteController({
                items: library.items,
                rotationMs: library.rotationMs,
                language: global.RENNER_I18N?.getLanguage?.() || document.documentElement.lang,
                visible: !document.hidden,
                onChange({ item, language, animate }) {
                    quoteMotion?.cancel();
                    quoteMotion = null;
                    const text = item.text[language];
                    slot.lang = language;
                    slot.dir = language === "ar" ? "rtl" : "ltr";
                    fullText.textContent = text;
                    measure.textContent = text;
                    creditText.textContent = item.credit[language];
                    credit.href = item.source.url;
                    credit.title = item.source.title;
                    credit.setAttribute("aria-label", `${language === "ar" ? "مصدر الاقتباس" : "Quote source"}: ${item.credit[language]}`);
                    typewriter.write(text, language, animate && !isReduced());
                    if (animate && !isReduced() && typeof slot.animate === "function") {
                        quoteMotion = slot.animate([
                            { opacity: 0, transform: "translateY(7px)", filter: "blur(2px)" },
                            { opacity: 1, transform: "translateY(0)", filter: "blur(0)" }
                        ], { duration: 600, easing: "cubic-bezier(.2,.8,.2,1)" });
                    }
                    measureFooter();
                }
            });
            quoteController.start();
        }

        global.addEventListener("renner:playback-changed", event => {
            cassette?.classList.toggle("is-playing", Boolean(event.detail?.isPlaying));
        });
        global.addEventListener("renner:language-changed", event => quoteController?.setLanguage(event.detail?.language));
        document.addEventListener("visibilitychange", () => {
            cassette?.classList.toggle("is-document-hidden", document.hidden);
            quoteController?.setVisible(!document.hidden);
            if (document.hidden) typewriter?.finish();
        });
        const settleMotion = () => { if (isReduced()) { typewriter?.finish(); quoteMotion?.cancel(); quoteMotion = null; } };
        global.addEventListener("renner:appearance-changed", settleMotion);
        reducedPreference?.addEventListener?.("change", settleMotion);
        // The existing comfort setting changes body classes before publishing its event.
        if (typeof global.MutationObserver === "function") {
            new global.MutationObserver(settleMotion).observe(body, { attributes: true, attributeFilter: ["class"] });
        }
    }

    const api = Object.freeze({ createQuoteController, createTypewriter, graphemes, normalizeCreator, init });
    if (typeof module === "object" && module.exports) module.exports = api;
    else {
        global.RENNER_LISTENING_EXPERIENCE = api;
        if (global.document.readyState === "loading") global.document.addEventListener("DOMContentLoaded", init, { once: true });
        else init();
    }
})(typeof window === "object" ? window : globalThis);
