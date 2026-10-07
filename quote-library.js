/* Short excerpts checked against the linked rights-holder sources on 2026-10-03.
 * Arabic text is an original Renner translation, not an official dubbed script.
 * This is a local bibliography: rendering never contacts these sites.
 */
(function (global) {
    "use strict";
    const items = [
        {
            id: "nemo-swimming", medium: "film",
            text: { en: "Just keep swimming.", ar: "واصل السباحة." },
            credit: { en: "Finding Nemo", ar: "Finding Nemo" },
            source: { title: "Disney: 17 Disney Quotes That Will Never Get Old", url: "https://news.disney.com/17-disney-quotes-that-will-never-get-old" }
        },
        {
            id: "doctor-kindness", medium: "television",
            text: { en: "Always try to be nice, but never fail to be kind.", ar: "حاول أن تكون لطيفًا دائمًا، ولا تتخلَّ عن طيبتك أبدًا." },
            credit: { en: "Twelfth Doctor · Doctor Who", ar: "الدكتور الثاني عشر · Doctor Who" },
            source: { title: "Doctor Who: Quotes to Live By — Twice Upon a Time", url: "https://www.doctorwho.tv/news-and-features/doctor-who-quotes-to-live-by" }
        },
        {
            id: "up-adventure", medium: "film",
            text: { en: "Adventure is out there!", ar: "المغامرة تنتظرك هناك!" },
            credit: { en: "Up · Pixar", ar: "Up · Pixar" },
            source: { title: "Pixar: Up — The World / Research", url: "https://www.pixar.com/upfilm" }
        },
        {
            id: "joel-purpose", medium: "game",
            text: { en: "And you, no matter what, you keep finding something to fight for.", ar: "وأنت، مهما حصل، ستجد دائمًا شيئًا يستحق أن تقاتل من أجله." },
            credit: { en: "Joel · The Last of Us", ar: "جويل · The Last of Us" },
            source: { title: "Naughty Dog: The Last of Us Podcast — Episode 4 transcript", url: "https://www.naughtydog.com/podcasts/thelastofus/en/ep-04" }
        },
        {
            id: "hera-hope", medium: "television",
            text: { en: "We have hope. Hope that things can get better. And they will.", ar: "لدينا أمل؛ أمل بأن الأمور يمكن أن تتحسن، وستتحسن." },
            credit: { en: "Hera Syndulla · Star Wars Rebels", ar: "هيرا سيندولا · Star Wars Rebels" },
            source: { title: "Star Wars: 6 Things You Can Learn from Hera Syndulla — Vision of Hope", url: "https://www.starwars.com/news/6-things-you-can-learn-from-hera-syndulla" }
        },
        {
            id: "yoda-resolve", medium: "film",
            text: { en: "Do. Or do not. There is no try.", ar: "افعل، أو لا تفعل. لا مكان للمحاولة." },
            credit: { en: "Yoda · The Empire Strikes Back", ar: "يودا · The Empire Strikes Back" },
            source: { title: "Star Wars: Empire at 40 — Teaching with Star Wars: The Wisdom of Do. Or Do Not.", url: "https://www.starwars.com/news/empire-at-40-teaching-with-star-wars-the-wisdom-of-do-or-do-not" }
        }
    ];
    for (const item of items) {
        Object.freeze(item.text);
        Object.freeze(item.credit);
        Object.freeze(item.source);
        Object.freeze(item);
    }
    const library = Object.freeze({ rotationMs: 180000, arabicTranslation: "Original Renner translation", verifiedOn: "2026-10-03", items: Object.freeze(items) });
    if (typeof module === "object" && module.exports) module.exports = library;
    else global.RENNER_QUOTE_LIBRARY = library;
})(typeof window === "object" ? window : globalThis);
