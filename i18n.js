/* Shared, opt-in Arabic / English localization. UI labels are registered below;
   station titles, chat bodies, media names, form values and URLs are never scanned. */
(function (global) {
  "use strict";
  const STORAGE_KEY = "renner:language";
  const labels = {
    "Workspace navigation": "تنقّل الاستوديو",
    "Manage your station": "إدارة الراديو",
    "Channel details": "تفاصيل القناة",
    "Playback source": "مصدر التشغيل",
    "Scene and appearance": "الخلفية والمظهر",
    "Tools and imports": "الأدوات والاستيراد",
    "Made with love": "صُنع بحب",
    "by": "بواسطة",
    "Coffee · soon": "قهوة · قريبًا",
    "Buy me a coffee": "ادعمني بقهوة",
    "Coffee support is coming soon": "دعم الموقع بقهوة متاح قريبًا",
    "Open GitHub profile": "افتح حساب GitHub",
    "Listening shelves": "أدوات القنوات والمجتمع",
    "Panel side": "جهة القنوات والمجتمع",
    "Place panels on the left": "ضع القنوات والمجتمع يسار الشاشة",
    "Place panels on the right": "ضع القنوات والمجتمع يمين الشاشة",

    "Live listener counts are unavailable. They need a connection and the updated database rules.": "عدّاد المستمعين غير متاح حاليًا. يحتاج اتصالًا وتفعيل إعدادات المجتمع.",
    "{count} listeners on this channel": "{count} مستمعين لهذه القناة",

    "Reconnect chat": "أعد توصيل الدردشة",
    "{count} new messages · Jump to latest": "{count} رسائل جديدة · انتقل للأحدث",
    "Chat disconnected. Your draft is safe. Reconnect to continue.": "انقطع الاتصال. مسودتك محفوظة هنا؛ أعد الاتصال للمتابعة.",
    "Chat connection interrupted.": "انقطع اتصال الدردشة.",
    "Chat name saved. Your community name stays separate.": "تم حفظ اسم الدردشة. اسم راديو المجتمع مستقل عنه.",
    "Message not sent. Your draft is saved here; try again.": "لم تُرسل الرسالة. مسودتك محفوظة هنا؛ جرّب مجددًا.",
    "Live chat · You are {name}.": "دردشة مباشرة · اسمك {name}.",
    "Live chat · Choose a name to join.": "دردشة مباشرة · اختر اسمًا للمشاركة.",
    "Local preview · Messages stay in this browser session.": "معاينة محلية · الرسائل تبقى في جلسة المتصفح هذه.",
    "Choose a community name here: 4–16 English letters or numbers, starting with a letter.": "اختر اسمًا للمجتمع هنا: من 4 إلى 16 حرفًا إنجليزيًا أو رقمًا، يبدأ بحرف.",

    "No community channels on air.": "ما فيه قنوات مجتمع تبث حاليًا.",
    "Create your channel in Community FM, or check back soon.": "أنشئ قناتك من راديو المجتمع، أو ارجع قريبًا.",
    "Your community name": "اسمك في راديو المجتمع",
    "Choose a community name": "اختر اسمًا لراديو المجتمع",
    "For your channel only. Your chat name stays separate.": "هذا الاسم لإضافة قناتك. اسم الدردشة مستقل عنه.",
    "Messages disappear after 24 hours.": "تختفي الرسائل تلقائيًا بعد 24 ساعة.",
    "New messages": "رسائل جديدة",

    "YouTube song or playlist link": "رابط أغنية أو قائمة تشغيل من YouTube",
    "Paste a YouTube song or playlist link. YouTube Music links work too.": "ألصق رابط أغنية أو قائمة تشغيل. روابط YouTube Music مدعومة أيضًا.",
    "Paste a YouTube video, song or playlist link. YouTube Music links work too.": "ألصق رابط فيديو أو أغنية أو قائمة تشغيل. روابط YouTube Music مدعومة أيضًا.",
    "Playlist detected. Save this link as a channel to play its songs in order.": "تم التعرف على قائمة التشغيل. احفظ الرابط كقناة لتشغيل أغانيها بالترتيب.",
    "Enter a valid YouTube song or playlist URL, or an 11-character video ID.": "أدخل رابط أغنية أو قائمة تشغيل صالحًا، أو معرّف فيديو من 11 حرفًا.",
    "Playlist linked": "قائمة التشغيل مرتبطة",
    "Cannot enable this station until it has a valid YouTube song or playlist link.": "أضف رابط أغنية أو قائمة تشغيل صالحًا قبل تفعيل القناة.",
    "Replace my current channel source": "استبدل مصدر قناتي الحالية",
    "This replaces the current tracks or playlist. The station name, frequency and expiry stay the same.": "يستبدل هذا المقاطع أو القائمة الحالية. يبقى اسم القناة وترددها ووقت انتهائها كما هو.",
    "Replace Playlist": "استبدل القائمة",
    "Replace Channel Source": "استبدل مصدر القناة",
    "Updating...": "جارٍ التحديث…",
    "YouTube playlist stream": "بث قائمة YouTube",
    "Playlist stream": "بث قائمة تشغيل",
    "Open playlist": "افتح القائمة",
    "YouTube playlist": "قائمة YouTube",
    "YouTube Playlist": "قائمة YouTube",
    "Check playlist playback": "افحص تشغيل القائمة",
    "Checking playlist playback…": "جارٍ فحص تشغيل القائمة…",
    "Playlist link ready. Add it as one channel; the original playlist stays on YouTube.": "رابط القائمة جاهز. أضفها كقناة واحدة؛ تبقى القائمة الأصلية على YouTube.",
    "Playback checked. This playlist started here.": "تم الفحص وبدأ تشغيل القائمة داخل الموقع.",
    "This playlist could not play here. You can still save its link or open it on YouTube.": "تعذّر تشغيل القائمة هنا. يمكنك حفظ رابطها أو فتحها على YouTube.",
    "This playlist is already the source of your channel.": "هذه القائمة هي مصدر قناتك الحالي بالفعل.",
    "Confirm replacing your current channel source before saving.": "حدد خيار استبدال مصدر قناتك الحالية قبل الحفظ.",
    "Channel playlist updated.": "تم تحديث قائمة القناة.",
    "Channel source replaced with one track.": "تم استبدال مصدر القناة بمقطع واحد.",
    "Temporary playlist channel created.": "تم إنشاء قناة مؤقتة للقائمة.",
    "Playback is waiting. Press Play in the receiver to finish checking.": "التشغيل في الانتظار. اضغط تشغيل في المشغّل لإكمال الفحص.",
    "Playback needs a user action. Press Play in the receiver to check this playlist.": "اضغط تشغيل في المشغّل لفحص القائمة.",
    "The playlist check could not finish. You can still save the link or open it on YouTube.": "لم يكتمل فحص القائمة. يمكنك حفظ الرابط أو فتحه على YouTube.",
    "This playlist started here. Some items may be unavailable.": "بدأ تشغيل القائمة هنا. قد تكون بعض المقاطع غير متاحة.",
    "This playlist could not start here. Try Play again or open the source on YouTube.": "تعذّر بدء القائمة هنا. جرّب التشغيل مجددًا أو افتح المصدر على YouTube.",

    "Check playback": "افحص التشغيل",
    "This song cannot play here. Choose another song or open it on YouTube.": "هذه الأغنية لا تُشغّل داخل الموقع. اختر أغنية أخرى أو افتحها على YouTube.",
    "Playback checked. This song played here.": "تم فحص التشغيل واشتغلت الأغنية داخل الموقع.",
    "Checking playback…": "جارٍ فحص التشغيل…",
    "Unavailable": "غير متاحة",
    "Recheck": "أعد الفحص",
    "Some tracks unavailable": "بعض المقاطع غير متاحة",
    "NO AVAILABLE CHANNELS": "لا توجد قنوات متاحة",
    "PRESS PLAY": "اضغط تشغيل",
    "No playable channels found. Recheck a channel or try again later.": "لا توجد قناة يمكن تشغيلها. أعد فحص قناة أو حاول لاحقًا.",
    "Playback could not start. Try Play again; this channel has not been marked unavailable.": "تعذّر بدء التشغيل. جرّب زر التشغيل مجددًا؛ لم تُصنّف القناة كغير متاحة.",
    "Your browser paused autoplay. Press Play to listen.": "المتصفح أوقف التشغيل التلقائي. اضغط تشغيل للاستماع.",
    "Station tuner": "قرص الترددات",
    "Tune a station": "اختر تردد القناة",
    "Drag to tune · Arrow keys or scroll to change station": "اسحب لاختيار التردد · استخدم الأسهم أو التمرير للتبديل",
    "Current station is outside this filter.": "القناة الحالية خارج هذا الفلتر.",
    "No stations match this filter.": "لا توجد قنوات تطابق هذا الفلتر.",
    "No available stations in this filter.": "لا توجد قنوات متاحة ضمن هذا الفلتر.",
    "Choose a song from this artist": "اختر أغنية من هذا الفنان",
    "Choose one song to start. This does not import the artist’s full catalogue.": "اختر أغنية تبدأ بها القناة. هذا الخيار لا يستورد جميع أغاني الفنان.",
    "Open song": "افتح الأغنية",
    "Use this song": "استخدم هذه الأغنية",
    "Choose a song below to add to your channel.": "اختر أغنية من الأسفل لإضافتها إلى قناتك.",
    "Song selected. Review the details, then use the button below to add it.": "تم اختيار الأغنية. راجع البيانات ثم أضفها بالزر أدناه.",
    "YouTube song link ready. Use the button below to add it.": "رابط الأغنية جاهز. أضفها إلى القناة بالزر أدناه.",
    "Hide channels": "إخفاء القنوات",
    "Show channels": "إظهار القنوات",
    "Hide community": "إخفاء المجتمع",
    "Show community": "إظهار المجتمع",
    "Community": "المجتمع",
    "YouTube video or song link": "رابط فيديو أو أغنية من YouTube",
    "Artist/channel page (optional)": "صفحة الفنان أو القناة (اختياري)",
    "Paste a YouTube video or song link. YouTube Music links work too.": "ألصق رابط فيديو أو أغنية من YouTube. روابط YouTube Music مدعومة أيضًا.",
    "This is an artist/channel page. Save it in the artist field, then choose a song or video to play.": "هذا رابط صفحة فنان أو قناة. ضعه في حقل الفنان، ثم اختر أغنية أو فيديو للتشغيل.",
    "This is a playlist page. Open it and copy a song/video link; a playlist page cannot be used as a station stream.": "هذا رابط قائمة تشغيل. افتحها وانسخ رابط أغنية أو فيديو منها ليكون مصدر المحطة.",
    "This is an artist/channel page. Open it and copy the song or video you want to add.": "هذا رابط صفحة فنان أو قناة. افتحها وانسخ رابط الأغنية أو الفيديو الذي تريد إضافته.",
    "Playable YouTube video detected.": "تم التعرف على رابط الفيديو.",
    "YouTube video link detected. Open it to check playback.": "تم التعرف على رابط الفيديو. افتحه للتحقق من تشغيله.",
    "Use as artist page": "استخدمه كصفحة الفنان",
    "Enter a valid YouTube video URL or 11-character video ID.": "أدخل رابط فيديو صالحًا من YouTube أو معرّف الفيديو المكوّن من 11 حرفًا.",
    "Artist/channel page must be a YouTube channel URL.": "حقل الفنان يحتاج رابط صفحة قناة من YouTube.",
    "Choose a playable source": "اختر مصدر التشغيل",
    "Adding an artist channel?": "تضيف قناة لفنان؟",
    "Keep the artist page here, then add a video or song from that channel as the playback link.": "احفظ صفحة الفنان هنا، ثم أضف رابط فيديو أو أغنية من قناته للتشغيل.",
    "To play several songs, add individual video links to a Community FM channel.": "لتشغيل عدة أغنيات، أضف روابطها إلى قناة في راديو المجتمع.",
    "Cannons example: Fire for You": "مثال Cannons: أغنية Fire for You",
    "Fill Cannons links": "تعبئة روابط Cannons",
    "Open artist page": "افتح صفحة الفنان",
    "Open playback link": "افتح رابط التشغيل",
    "Open source page": "افتح صفحة المصدر",
    "Cannons links filled. Review the channel details before saving.": "تمت تعبئة روابط Cannons. راجع بيانات القناة قبل الحفظ.",
    "YOU ARE LISTENING TO": "أنت تستمع إلى",
    "Choose a name": "اختر اسمًا",
    "None": "دون تأثير", "Rain": "مطر", "Soft glow": "توهّج هادئ",
    "Neon skyline": "مدينة النيون",
    "Neon rain": "مطر النيون",
    "Moonlit rail": "قطار تحت القمر",
    "Coastal dusk": "غروب الساحل",
    "Night city · GIF": "مدينة الليل · GIF",
    "Misty valley · GIF": "وادي الضباب · GIF",
    "Aurora moor · GIF": "الشفق القطبي · GIF",
    "Open chat": "افتح الدردشة",
    "Open community": "افتح راديو المجتمع",
    "Your next conversation starts here.": "حديثك القادم يبدأ من هنا.",
    "Build a channel with your favorite tracks.": "أنشئ قناة بمقاطعك المفضّلة.",
    "Film grain": "تشويش الفيلم",
    "Film grain on": "تشويش الفيلم مفعّل",
    "Film grain off": "تشويش الفيلم متوقف",
    "An analog finish for your listening space.": "لمسة من الراديو القديم لأجوائك.",
    "Skip to listening": "انتقل إلى الاستماع",
    "Renner Radio home": "الصفحة الرئيسية لراديو Renner",
    "YOUR EVERYDAY ESCAPE.": "مساحتك اليومية للهدوء.",
    "Your everyday escape. Renner Radio.": "مساحتك اليومية للهدوء. Renner Radio.",
    "Listening tools": "أدوات الاستماع",
    "Create a community channel": "أنشئ قناة للمجتمع",
    "Community FM": "راديو المجتمع",
    "Live room": "الغرفة المباشرة", "Live Room": "الغرفة المباشرة",
    "Listening settings": "إعدادات الاستماع", "Settings": "الإعدادات",
    "Your listening space": "مساحتك للاستماع",
    "Pause scene motion": "أوقف حركة المشهد", "Resume scene motion": "استأنف حركة المشهد",
    "Exit focus": "الخروج من وضع التركيز", "Music player": "مشغّل الموسيقى",
    "READY TO TUNE": "جاهز للاستماع", "READY WHEN YOU ARE": "جاهز متى أردت",
    "NOW PLAYING": "يُشغّل الآن", "LISTENING": "يُشغّل الآن", "STEREO": "ستيريو",
    "COMMUNITY FM": "راديو المجتمع", "CONNECTING": "جارٍ الاتصال", "BUFFERING": "جارٍ التحميل",
    "TRY ANOTHER": "جرّب قناة أخرى", "TRY ANOTHER STATION": "جرّب قناة أخرى", "PAUSED": "متوقف مؤقتًا", "ENDED": "انتهى البث",
    "Tuning in…": "جارٍ اختيار القناة…", "Choose your frequency": "اختر ترددك",
    "NOW SELECTED": "القناة المحددة", "SIGNAL DISPLAY": "مؤشر الإشارة",
    "LOW": "منخفض", "MID": "متوسط", "HIGH": "مرتفع", "TUNE / PLAY": "التردد / التشغيل",
    "Previous station": "القناة السابقة", "Next station": "القناة التالية",
    "Play": "تشغيل", "Pause": "إيقاف مؤقت", "Save current station": "احفظ القناة الحالية",
    "Save current channel": "احفظ القناة الحالية", "Remove current channel from saved": "أزل القناة الحالية من المحفوظات",
    "Random station": "قناة عشوائية", "Surprise me": "فاجئني",
    "Volume": "الصوت", "VOLUME": "الصوت", "Radio volume": "مستوى صوت الراديو",
    "Enter focus mode": "افتح وضع التركيز", "Exit focus mode": "اخرج من وضع التركيز",
    "Enter immersive mode": "افتح العرض الموسّع", "Exit immersive mode": "اخرج من العرض الموسّع",
    "Focus mode": "وضع التركيز", "Full screen": "ملء الشاشة", "Fullscreen": "ملء الشاشة",
    "Enter full screen": "افتح ملء الشاشة", "Exit full screen": "اخرج من ملء الشاشة",
    "Drag left or right, or use the arrow keys to adjust volume.": "اسحب أو استخدم أسهم لوحة المفاتيح لتغيير مستوى الصوت.",
    "RETRO STEREO RECEIVER": "مستقبل راديو ريترو", "Radio channels": "قنوات الراديو",
    "Your channels": "قنواتك", "Channels": "القنوات", "Saved": "المحفوظات",
    "Search channels": "ابحث عن قناة", "Find your channel…": "ابحث عن قناتك…",
    "Filter channels": "تصفية القنوات", "All": "الكل", "Lo-fi": "لوفاي",
    "Focus": "تركيز", "Jazz & soul": "جاز وسول", "Night drive": "قيادة ليلية",
    "Find me a mood": "اختر لي أجواء", "More channels": "قنوات أكثر",
    "Nothing here just yet.": "لا شيء هنا بعد.",
    "Save a channel with the heart button to find it here.": "احفظ قناة بزر القلب لتجدها هنا.",
    "Keep your favorites close.": "احتفظ بقنواتك المفضلة هنا.",
    "Tap the heart on a channel to save your next escape.": "اضغط القلب على أي قناة لحفظها والاستماع إليها لاحقًا.",
    "No channels found.": "لم نعثر على قنوات.",
    "Try another name, or explore all channels.": "جرّب اسمًا آخر أو استعرض جميع القنوات.",
    "Explore all channels": "استعرض جميع القنوات", "Close channels": "أغلق القنوات", "Browse channels": "استعرض القنوات",
    "Original stream": "البث الأصلي", "THE ORIGINAL SIGNAL": "الإشارة الأصلية",
    "From the source.": "من المصدر.", "Your music, directly from its YouTube channel.": "موسيقاك مباشرة من قناتها على YouTube.",
    "Open original stream": "افتح البث الأصلي", "YouTube radio stream": "بث الراديو على YouTube",
    "Somewhere to tune out. Something to tune into.": "مساحة تهدأ فيها، وموسيقى تعود إليها.",
    "Connecting community…": "جارٍ الاتصال بالمجتمع…", "Community connected": "المجتمع متصل",
    "Community offline": "المجتمع غير متصل", "Local mode": "وضع محلي",
    "Close panel": "أغلق اللوحة", "Radio Chat": "دردشة الراديو", "Close live room": "أغلق الغرفة المباشرة",
    "Connecting chat...": "جارٍ الاتصال بالدردشة…", "Radio name": "اسمك في الراديو",
    "Choose your radio name": "اختر اسمك في الراديو", "Save": "حفظ",
    "English name, minimum 4 letters": "اسم بحروف إنجليزية، 4 أحرف على الأقل",
    "Anonymous chat profile": "ملف الدردشة المجهول", "Edit Name": "عدّل الاسم",
    "Tuning live chat...": "جارٍ تحميل الدردشة…", "Quiet room. Send the first signal.": "الغرفة هادئة. ابدأ أول حديث.",
    "Anonymous chat messages": "رسائل الدردشة", "Message": "الرسالة", "Say hi to the station": "شاركنا رسالة",
    "Send": "إرسال", "Sending...": "جارٍ الإرسال…", "Saving...": "جارٍ الحفظ…",
    "Create Temporary Community Channel": "أنشئ قناة مؤقتة للمجتمع", "Channel Deck": "قنوات المجتمع",
    "Close community channel": "أغلق قنوات المجتمع", "Connecting Community FM...": "جارٍ الاتصال براديو المجتمع…",
    "YouTube track link": "رابط المقطع على YouTube", "Channel name (optional)": "اسم القناة (اختياري)",
    "Create Channel": "أنشئ قناة", "Add Track": "أضف مقطعًا", "Creating...": "جارٍ الإنشاء…", "Adding...": "جارٍ الإضافة…",
    "Syncing Community FM...": "جارٍ مزامنة راديو المجتمع…",
    "No Community FM channel yet. Create one with a YouTube link.": "لا توجد قناة للمجتمع بعد. أنشئ واحدة برابط YouTube.",
    "Temporary community radio channels": "قنوات المجتمع المؤقتة", "Remove Channel": "أزل القناة", "Remove Track": "أزل المقطع",
    "YOUR LISTENING SPACE": "مساحتك للاستماع", "Make it yours": "اجعلها على ذوقك",
    "Settle into your own kind of quiet.": "اختر الأجواء التي تناسب هدوءك.", "Close settings": "أغلق الإعدادات",
    "The atmosphere": "الأجواء", "Choose a scene": "اختر مشهدًا",
    "Midnight": "منتصف الليل", "Neon": "نيون", "Golden hour": "الساعة الذهبية",
    "City drive · GIF": "قيادة في المدينة · GIF", "Highway · GIF": "طريق سريع · GIF",
    "Sunset cruise · GIF": "جولة عند الغروب · GIF", "Cosmic radio · GIF": "راديو الفضاء · GIF",
    "Color mood": "لون الأجواء", "Lavender, sage, or warm amber.": "بنفسجي هادئ، أخضر، أو كهرماني دافئ.",
    "Change": "تغيير", "Change theme": "غيّر الثيم", "Scene": "المشهد",
    "A new view for your next track.": "مشهد جديد لمقطعك القادم.", "Change background": "غيّر الخلفية",
    "Visual effects": "المؤثرات البصرية", "A touch of atmosphere.": "لمسة إضافية للأجواء.",
    "Retro screen": "شاشة الريترو", "CRT lines, tube glow, and neon.": "خطوط الشاشة القديمة، التوهّج، والنيون.",
    "Retro effects on": "مؤثرات الريترو مفعّلة", "Retro effects off": "مؤثرات الريترو متوقفة",
    "Stay comfortable": "استمع براحة", "Comfort mode": "وضع الراحة",
    "Less motion, a calmer session.": "حركة أقل وجلسة أهدأ.", "Comfort mode off": "وضع الراحة متوقف", "Comfort mode on": "وضع الراحة مفعّل",
    "Radio texture": "ملمس الراديو", "Soft static between stations.": "تشويش خفيف بين القنوات.",
    "Static sound off": "صوت التشويش متوقف", "Static sound on": "صوت التشويش مفعّل",
    "Use this station’s scene": "استخدم مشهد هذه القناة", "Press / to search · Esc to close a panel.": "اضغط / للبحث · Esc لإغلاق اللوحة.",
    "PRIVATE WORKSPACE": "مساحة الإدارة الخاصة", "Good music. Beautiful places.": "موسيقى جميلة وأجواء أجمل.",
    "Preview radio": "عاين الراديو", "Behind the": "خلف", "frequency.": "التردد.",
    "YOUR PRIVATE STUDIO": "استوديو الإدارة الخاص", "A little care behind every channel.": "اهتمام بالتفاصيل خلف كل قناة.",
    "Your studio is ready.": "الاستوديو جاهز.", "Checking access": "جارٍ التحقق من الصلاحية",
    "Curate your channels, set the scene, and preview everything before it goes live.": "رتّب قنواتك واختر المشاهد وعاين كل شيء قبل نشره.",
    "Continue with Google": "تابع باستخدام Google", "Try redirect sign-in": "جرّب تسجيل الدخول بإعادة التوجيه",
    "Sign out": "تسجيل الخروج", "Account details": "تفاصيل الحساب", "Email": "البريد الإلكتروني",
    "Account ID": "معرّف الحساب", "Access": "الصلاحية", "Not signed in": "لم تسجّل الدخول",
    "Waiting for sign-in": "بانتظار تسجيل الدخول", "Waiting for Google sign-in": "بانتظار تسجيل الدخول عبر Google",
    "Checking...": "جارٍ التحقق…", "Studio tools": "أدوات الاستوديو", "Manage your radio": "إدارة الراديو",
    "Scenes": "المشاهد", "Media": "الوسائط", "THE CHANNEL LINEUP": "قائمة القنوات",
    "+ New channel": "+ قناة جديدة", "Channel filters": "تصفية القنوات", "Name, mood, frequency...": "الاسم، الأجواء، التردد…",
    "Status": "الحالة", "All channels": "جميع القنوات", "Active": "مفعّلة", "Disabled": "متوقفة", "Archived": "مؤرشفة",
    "active": "مفعّلة", "disabled": "متوقفة", "removed": "مؤرشفة", "Mood": "الأجواء",
    "Sort by": "الترتيب حسب", "Channel order": "ترتيب القنوات", "Name A–Z": "الاسم من A إلى Z",
    "Frequency": "التردد", "Recently updated": "آخر تحديث", "Save order": "احفظ الترتيب", "Discard": "تراجع",
    "Drag channels to reorder, or use the arrow buttons. Save when you are ready.": "اسحب القنوات لترتيبها أو استخدم أزرار الأسهم، ثم احفظ الترتيب.",
    "Your lineup is empty. Create your first channel below.": "القائمة فارغة. أنشئ أول قناة من الأسفل.",
    "Channel lineup": "قائمة القنوات", "CHANNEL EDITOR": "محرّر القناة", "Create a channel": "أنشئ قناة",
    "Creating a new channel": "إنشاء قناة جديدة", "Edit channel": "عدّل القناة",
    "Import starter channels": "استورد القنوات الجاهزة", "Channel name": "اسم القناة", "Generate": "إنشاء",
    "YouTube link or video ID": "رابط YouTube أو معرّف الفيديو", "Channel artwork": "صورة القناة",
    "Image URL or assets/backgrounds/images/...": "رابط الصورة أو مسار داخل assets/backgrounds/images/…",
    "Choose picture": "اختر صورة", "Animated scene (MP4 or WebM)": "مشهد متحرك (MP4 أو WebM)",
    "Video URL or local asset path": "رابط الفيديو أو مسار الملف المحلي", "Scene poster / still image": "صورة المشهد الثابتة",
    "Used while the motion loads": "تظهر أثناء تحميل الحركة", "Choose still picture": "اختر صورة ثابتة",
    "Optional GIF scene": "مشهد GIF اختياري", "GIF URL or local asset path": "رابط GIF أو مسار الملف المحلي",
    "Choose GIF": "اختر GIF", "Accent color": "اللون المميّز", "Short description": "وصف قصير",
    "Warm keys, soft rain, and room to focus.": "نغمات دافئة، مطر خفيف، ومساحة للتركيز.",
    "Show this channel on the radio": "أظهر هذه القناة في الراديو", "Save channel": "احفظ القناة",
    "Clear": "مسح", "Cancel edit": "ألغِ التعديل", "Save Changes": "احفظ التغييرات",
    "Channel preview": "معاينة القناة", "LISTENING SCREEN PREVIEW": "معاينة شاشة الاستماع",
    "Preview is muted. The YouTube stream starts from the listening page.": "المعاينة صامتة. يبدأ بث YouTube من صفحة الاستماع.",
    "Open stream to check playback": "افتح البث للتحقق من التشغيل",
    "SCENE EDITOR": "محرّر المشهد", "Give the music a place.": "اختر مكانًا للموسيقى.",
    "Creating a new scene": "إنشاء مشهد جديد", "Import starter scenes": "استورد المشاهد الجاهزة",
    "Scene name": "اسم المشهد", "Rain on the window": "مطر على النافذة", "Scene type": "نوع المشهد",
    "Animated video": "فيديو متحرك", "Still image": "صورة ثابتة", "Animated GIF": "صورة GIF متحركة",
    "Scene URL or local asset path": "رابط المشهد أو مسار الملف المحلي", "Choose picture / GIF": "اختر صورة / GIF",
    "Poster / loading image": "صورة العرض أثناء التحميل",
    "GIFs and videos need a still poster for loading and when motion is off.": "تحتاج ملفات GIF والفيديو صورة ثابتة تظهر أثناء التحميل وعند إيقاف الحركة.",
    "Use for": "استخدم مع", "Mood (optional)": "الأجواء (اختياري)", "night, sunset, focus...": "night, sunset, focus…",
    "Scene order": "ترتيب المشاهد", "Enable scene": "فعّل المشهد", "Save scene": "احفظ المشهد",
    "SCENE PREVIEW": "معاينة المشهد", "Add a scene to preview it here": "أضف مشهدًا لمعاينته هنا",
    "GIFs play automatically in this preview. Video controls let you inspect a muted loop before saving.": "تتحرك صور GIF تلقائيًا هنا. استخدم أدوات الفيديو لمعاينة التكرار بصمت قبل الحفظ.",
    "THE SCENE LIBRARY": "مكتبة المشاهد", "Saved scenes": "المشاهد المحفوظة",
    "No scenes yet. Start with a quiet loop or a still image.": "لا توجد مشاهد بعد. أضف حركة هادئة أو صورة ثابتة.",
    "Scene library": "مكتبة المشاهد", "MAKE IT YOURS": "اجعلها على ذوقك",
    "Your pictures. Your atmosphere.": "صورك، وأجواؤك.", "Still pictures + GIFs": "صور ثابتة + GIF",
    "Choose a picture from your computer, preview it, then upload to your configured Firebase Storage. Add it to a channel or scene from the library below.": "اختر صورة من جهازك وعاينها، ثم ارفعها إلى تخزين Firebase المجهّز للمشروع. استخدم المكتبة بالأسفل لإضافتها إلى قناة أو مشهد.",
    "Picture from your computer": "صورة من جهازك", "PNG, JPEG, WebP up to 10 MB · GIF up to 20 MB": "PNG وJPEG وWebP حتى 10 MB · GIF حتى 20 MB",
    "Picture name": "اسم الصورة", "Rain at the window": "مطر عند النافذة", "Upload to library": "ارفع إلى المكتبة",
    "Cancel upload": "ألغِ الرفع", "Retry library save": "أعد محاولة حفظ المكتبة", "Picture upload progress": "تقدّم رفع الصورة",
    "First upload? Storage needs an active bucket and the supplied security rules.": "أول عملية رفع؟ يحتاج التخزين حاوية مفعّلة وقواعد الأمان المرفقة.",
    "Read setup instructions": "اقرأ تعليمات الإعداد", ". Existing picture URLs also work.": ". يمكنك أيضًا استخدام روابط صور موجودة.",
    "PICTURE PREVIEW": "معاينة الصورة", "Your picture will appear here": "ستظهر صورتك هنا",
    "GIFs play in this preview. Uploading adds a file to your library; your radio changes only after you use it and save a channel or scene.": "تتحرك صور GIF في المعاينة. الرفع يضيف الملف إلى المكتبة، ويتغير الراديو بعد اختيار الصورة وحفظ القناة أو المشهد.",
    "Use an existing picture URL or local asset": "استخدم رابط صورة أو ملفًا محليًا موجودًا",
    "Midnight room": "غرفة ليلية", "Picture type": "نوع الصورة", "Still picture": "صورة ثابتة",
    "Picture URL or local asset path": "رابط الصورة أو مسار الملف المحلي", "Preview link": "عاين الرابط",
    "Add link to library": "أضف الرابط إلى المكتبة",
    "This keeps a link in your private library and does not upload or copy the file. Choose the correct still/GIF type. You can always paste a URL directly in the channel or scene editor.": "يُحفظ الرابط في مكتبتك الخاصة دون رفع الملف أو نسخه. اختر نوع الصورة الصحيح، ويمكنك أيضًا لصق الرابط مباشرة في محرّر القناة أو المشهد.",
    "Preview an existing picture link": "عاين رابط صورة موجودة", "THE MEDIA LIBRARY": "مكتبة الوسائط",
    "Ready to set the scene.": "جاهزة لصناعة الأجواء.", "Search pictures": "ابحث عن صورة", "Type": "النوع",
    "All pictures": "جميع الصور", "Still pictures": "صور ثابتة", "Library": "المكتبة", "Available": "متاحة",
    "Use picture for": "استخدم الصورة في", "Channel scene (still / GIF)": "مشهد القناة (ثابت / GIF)",
    "Channel poster / still fallback": "صورة القناة الثابتة البديلة", "Channel GIF scene": "مشهد GIF للقناة",
    "Scene picture / GIF": "صورة / GIF للمشهد", "Scene poster / still fallback": "صورة المشهد الثابتة البديلة",
    "Add your first picture above, then use it in a channel or scene.": "أضف صورتك الأولى من الأعلى ثم استخدمها في قناة أو مشهد.",
    "Private picture library": "مكتبة الصور الخاصة",
    "Archive hides a library entry and keeps its file and existing uses. Restore it from the Archived filter.": "تخفي الأرشفة الصورة من المكتبة مع الاحتفاظ بملفها واستخداماتها الحالية. أعدها من فلتر المؤرشفة.",
    "FIRST IMPRESSIONS": "البداية", "Listening defaults": "إعدادات الاستماع الافتراضية",
    "Choose how the radio opens for a new listener. Returning listeners keep their own preferences.": "اختر طريقة فتح الراديو للزائر الجديد. يحتفظ الزائر العائد بتفضيلاته.",
    "Starting channel": "قناة البداية", "First active channel": "أول قناة مفعّلة", "Default color": "اللون الافتراضي",
    "Midnight lavender": "بنفسجي منتصف الليل", "Quiet sage": "أخضر هادئ", "Warm amber": "كهرماني دافئ",
    "Start with reduced motion": "ابدأ بحركة مخفّفة", "Enable radio texture": "فعّل ملمس الراديو",
    "Save defaults": "احفظ الإعدادات الافتراضية", "KEEP THINGS TIDY": "تنظيم المكتبة", "Library care": "تنظيم المكتبة",
    "Find duplicate channels and review them before archiving. Archive keeps a record; delete removes it permanently.": "ابحث عن القنوات المكررة وراجعها قبل الأرشفة. الأرشفة تحتفظ بالسجل، والحذف يزيله نهائيًا.",
    "Find duplicates": "ابحث عن المكررات", "Archive duplicates": "أرشف المكررات", "Reset channel order": "أعد ترتيب القنوات",
    "Duplicate channel preview": "معاينة القنوات المكررة", "Edit": "تعديل", "Enable": "تفعيل", "Disable": "إيقاف",
    "Archive": "أرشفة", "Restore": "استعادة", "Delete": "حذف", "Use picture": "استخدم الصورة",
    "Stream linked": "البث مرتبط", "Missing stream": "رابط البث مفقود", "Animated scene": "مشهد متحرك", "Still scene": "مشهد ثابت",
    "Image": "صورة", "Video": "فيديو", "Global / All stations": "عام / جميع القنوات",
    "Previously selected channel (unavailable)": "القناة المحددة سابقًا (غير متاحة)",
    "No source": "لا يوجد مصدر", "Video could not load": "تعذّر تحميل الفيديو",
    "Access granted": "الصلاحية متاحة", "Admin access granted": "صلاحية الإدارة متاحة", "Admin": "مدير", "Signed out": "لم تسجّل الدخول",
    "Checking admin access...": "جارٍ التحقق من صلاحية الإدارة…", "Access denied": "الصلاحية مرفوضة",
    "Firebase ready": "Firebase جاهز", "Firebase unavailable": "Firebase غير متاح", "Google account": "حساب Google",
    "Sign in with Google to access the private Studio Panel.": "سجّل الدخول بحساب Google للوصول إلى لوحة الإدارة الخاصة.",
    "Signed out of Studio Panel.": "تم تسجيل الخروج من لوحة الإدارة.",
    "Access denied. This Google account does not match the Studio Panel admin UID.": "الصلاحية مرفوضة. حساب Google هذا لا يطابق معرّف مدير الاستوديو.",
    "Channels and scenes update when you save. Preview your changes first.": "تتحدّث القنوات والمشاهد عند الحفظ. عاين التغييرات أولًا.",
    "Returned from Google redirect. Checking admin access...": "تم الرجوع من تسجيل الدخول عبر Google. جارٍ التحقق من صلاحية الإدارة…",
    "Order preview updated. Save order to apply it to the radio.": "تحدّثت معاينة الترتيب. احفظه لتطبيقه على الراديو.",
    "Editing selected station.": "تعديل القناة المحددة.", "Editing selected background.": "تعديل المشهد المحدد.",
    "Station record was not found.": "لم نعثر على سجل القناة.", "Background record was not found.": "لم نعثر على سجل المشهد.",
    "Station name is required and must be 80 characters or fewer.": "اسم القناة مطلوب، بحد أقصى 80 حرفًا.",
    "Generate a valid FM frequency between 87.5 and 108.0.": "أنشئ تردد FM صالحًا بين 87.5 و108.0.",
    "Choose a valid category from the dropdown.": "اختر تصنيفًا صالحًا من القائمة.",
    "Enter a valid YouTube URL or 11-character video ID.": "أدخل رابط YouTube صالحًا أو معرّف فيديو من 11 حرفًا.",
    "Active stations require a valid YouTube URL or 11-character video ID.": "تحتاج القنوات المفعّلة رابط YouTube صالحًا أو معرّف فيديو من 11 حرفًا.",
    "Accent color must be a valid hex color.": "اختر رمز لون سداسي صالحًا.", "Sort order must be zero or a positive number.": "يجب أن يكون الترتيب صفرًا أو رقمًا موجبًا.",
    "No unused FM frequency is available in the 87.5 to 108.0 range.": "لا يوجد تردد FM متاح بين 87.5 و108.0.",
    "Add a scene poster or channel artwork before saving an animated channel.": "أضف صورة ثابتة للمشهد أو للقناة قبل حفظ قناة متحركة.",
    "Add a separate still poster or still channel artwork before saving a GIF scene. This image is used when motion is paused or reduced.": "أضف صورة ثابتة منفصلة للمشهد أو للقناة قبل حفظ مشهد GIF، لتظهر عند إيقاف الحركة أو تخفيفها.",
    "Background name is required and must be 80 characters or fewer.": "اسم المشهد مطلوب، بحد أقصى 80 حرفًا.",
    "Choose image or video for the background type.": "اختر صورة أو فيديو لنوع المشهد.",
    "Enter a valid background source URL or local asset path.": "أدخل رابطًا صالحًا للمشهد أو مسار ملف محلي.",
    "Poster must be a valid URL or local asset path.": "يجب أن تكون الصورة الثابتة رابطًا صالحًا أو مسار ملف محلي.",
    "Add a poster image for loading and reduced motion before saving a video scene.": "أضف صورة ثابتة للتحميل والحركة المخفّفة قبل حفظ مشهد الفيديو.",
    "Add a separate still poster before saving a GIF scene. Choose a still picture for paused and reduced motion viewing.": "أضف صورة ثابتة منفصلة قبل حفظ مشهد GIF، لتظهر عند إيقاف الحركة أو تخفيفها.",
    "Station assignment key must be 120 characters or fewer.": "معرّف القناة المرتبطة يجب ألا يتجاوز 120 حرفًا.",
    "Mood should use simple English letters, numbers, spaces, or dashes.": "استخدم حروفًا إنجليزية أو أرقامًا أو مسافات أو شرطات لوصف الأجواء.",
    "Admin access is required before saving stations.": "تحتاج صلاحية الإدارة قبل حفظ القنوات.",
    "Admin access is required before saving backgrounds.": "تحتاج صلاحية الإدارة قبل حفظ المشاهد.",
    "Admin access is required before saving settings.": "تحتاج صلاحية الإدارة قبل حفظ الإعدادات.",
    "Admin access is required before importing default stations.": "تحتاج صلاحية الإدارة قبل استيراد القنوات.",
    "Admin access is required before importing default backgrounds.": "تحتاج صلاحية الإدارة قبل استيراد المشاهد.",
    "No local fallback stations were found to import.": "لا توجد قنوات محلية جاهزة للاستيراد.",
    "No local default background presets were found.": "لا توجد مشاهد محلية جاهزة للاستيراد.",
    "Cannot enable this station until it has a valid YouTube video ID.": "أضف معرّف فيديو YouTube صالحًا قبل تفعيل هذه القناة.",
    "Station disabled.": "تم إيقاف القناة.", "Station enabled.": "تم تفعيل القناة.", "Station marked removed.": "تمت أرشفة القناة.",
    "Station record deleted.": "تم حذف سجل القناة.", "Background disabled.": "تم إيقاف المشهد.", "Background enabled.": "تم تفعيل المشهد.",
    "Background record removed.": "تمت إزالة المشهد.", "No duplicate active or disabled stations found.": "لم نعثر على قنوات مفعّلة أو متوقفة مكررة.",
    "Run Find Duplicates first.": "ابحث عن المكررات أولًا.", "No active or disabled stations to reorder.": "لا توجد قنوات مفعّلة أو متوقفة لإعادة ترتيبها.",
    "Default station ID must be 120 characters or fewer.": "معرّف قناة البداية يجب ألا يتجاوز 120 حرفًا.",
    "Default theme must be 40 characters or fewer.": "اسم الثيم الافتراضي يجب ألا يتجاوز 40 حرفًا.",
    "Choose an active starting channel, or use the first active channel.": "اختر قناة بداية مفعّلة أو استخدم أول قناة مفعّلة.",
    "Listening defaults saved.": "تم حفظ إعدادات الاستماع الافتراضية.",
    "Checking the picture and preparing its preview…": "جارٍ فحص الصورة وتجهيز المعاينة…",
    "Preview ready. Upload adds this picture to your private library.": "المعاينة جاهزة. أضف الصورة إلى مكتبتك الخاصة بالرفع.",
    "Picture could not be previewed": "تعذّرت معاينة الصورة", "Choose another picture to preview": "اختر صورة أخرى للمعاينة",
    "Uploading your picture…": "جارٍ رفع الصورة…", "Upload complete · saving library entry…": "اكتمل الرفع · جارٍ حفظها في المكتبة…",
    "Upload complete · getting picture link…": "اكتمل الرفع · جارٍ تجهيز رابط الصورة…",
    "Added to library": "أُضيفت إلى المكتبة", "File uploaded · library entry incomplete": "تم رفع الملف · لم يكتمل حفظ المكتبة",
    "Upload stopped": "توقف الرفع", "Canceling upload…": "جارٍ إلغاء الرفع…",
    "Enter an HTTP(S) picture URL or a path under assets/ (500 characters or fewer).": "أدخل رابط صورة HTTP(S) أو مسارًا داخل assets/، بحد أقصى 500 حرف.",
    "Loading the picture preview…": "جارٍ تحميل معاينة الصورة…",
    "Picture preview ready. For links, choose the correct still/GIF type yourself.": "معاينة الصورة جاهزة. اختر نوع الصورة الصحيح، ثابتة أو GIF.",
    "This link could not load as a picture. Check the link and sharing permissions.": "تعذّر تحميل الرابط كصورة. تحقّق من الرابط وصلاحيات المشاركة.",
    "Preview this picture link successfully before adding it to the library.": "عاين رابط الصورة بنجاح قبل إضافته إلى المكتبة.",
    "No pictures match these filters.": "لا توجد صور تطابق هذه الفلاتر.", "Picture restored to the library.": "تمت استعادة الصورة إلى المكتبة.",
    "Picture archived. Existing channels and scenes keep using it; restore it from the Archived filter.": "تمت أرشفة الصورة. تستمر القنوات والمشاهد الحالية باستخدامها، ويمكنك استعادتها من فلتر المؤرشفة.",
    "Loading your media library…": "جارٍ تحميل مكتبة الوسائط…",
    "Sign in with the authorized Studio Google account before managing media.": "سجّل الدخول بحساب Google المصرّح له بالإدارة قبل إدارة الوسائط.",
    "Give this picture a name of 1–80 characters.": "اكتب اسمًا للصورة من 1 إلى 80 حرفًا.",
    "Choose a non-empty picture file.": "اختر ملف صورة غير فارغ.",
    "Choose a PNG, JPEG, WebP, or GIF. SVG and other file types are not supported.": "اختر PNG أو JPEG أو WebP أو GIF. ملفات SVG والأنواع الأخرى غير مدعومة.",
    "This file's contents do not match its picture type. Export a valid PNG, JPEG, WebP, or GIF and try again.": "محتوى الملف لا يطابق نوع الصورة. صدّر صورة PNG أو JPEG أو WebP أو GIF صالحة وحاول مجددًا.",
    "Choose a picture up to 8192 pixels per side and 32 megapixels in total.": "اختر صورة لا تتجاوز 8192 بكسل لكل جانب و32 ميغابكسل إجمالًا.",
    "Media access was denied. Check the Studio account and deploy the supplied Storage and Database rules. You can still paste a picture URL directly in a channel or scene.": "رُفض الوصول إلى الوسائط. تحقّق من حساب الإدارة وفعّل قواعد التخزين وقاعدة البيانات المرفقة. يمكنك لصق رابط صورة مباشرة في محرّر القناة أو المشهد.",
    "Firebase Storage is not available for this project yet, or its bucket could not be reached. See MEDIA-SETUP.md. You can still use an existing picture URL.": "تخزين Firebase غير متاح للمشروع أو تعذّر الاتصال به. راجع MEDIA-SETUP.md، ويمكنك استخدام رابط صورة موجودة.",
    "The upload could not finish. Check your connection and try again, or use an existing picture URL.": "لم يكتمل الرفع. تحقّق من الاتصال وحاول مجددًا أو استخدم رابط صورة موجودة.",
    "Upload canceled. No picture was added to the library.": "أُلغي الرفع. لم تُضف صورة إلى المكتبة.",
    "Media could not be saved. Try again.": "تعذّر حفظ الوسائط. حاول مجددًا.", "Invalid media record.": "سجل الوسائط غير صالح.",
    "Choose still picture or animated GIF.": "اختر صورة ثابتة أو GIF متحركة.",
    "This media record does not belong to the Studio account.": "سجل الوسائط لا يتبع حساب الاستوديو.", "Upload canceled.": "أُلغي الرفع.",
    "This stream is unavailable here. Try another station.": "هذا البث غير متاح هنا. جرّب قناة أخرى.",
    "Connecting to your stream…": "جارٍ الاتصال بالبث…", "Preparing your stream…": "جارٍ تجهيز البث…",
    "Tuning...": "جارٍ ضبط القناة…", "No stations found": "لم نعثر على قنوات", "No valid stations found": "لا توجد قنوات صالحة",
    "Could not send this message. Try again.": "تعذّر إرسال الرسالة. حاول مجددًا.", "Message is empty.": "الرسالة فارغة.",
    "This message is blocked by the local filter.": "الرسالة محظورة بواسطة فلتر الدردشة.", "Choose a name before chatting.": "اختر اسمًا قبل الدردشة.",
    "Name must be at least 4 characters.": "الاسم يجب أن يتكوّن من 4 أحرف على الأقل.", "Name must be 16 characters or fewer.": "الاسم يجب ألا يتجاوز 16 حرفًا.",
    "Use English letters and optional numbers only. No spaces or symbols.": "استخدم حروفًا إنجليزية وأرقامًا فقط، دون مسافات أو رموز.",
    "Live chat synced. Choose a name to chat.": "الدردشة متصلة. اختر اسمًا للمشاركة.",
    "Local preview. Firebase not connected.": "معاينة محلية. Firebase غير متصل.",
    "Community FM synced. Channels expire after 30 minutes.": "راديو المجتمع متصل. تنتهي صلاحية القنوات بعد 30 دقيقة.",
    "Choose a valid radio name before creating or updating your channel.": "اختر اسمًا صالحًا في الراديو قبل إنشاء القناة أو تحديثها.",
    "Add a YouTube link first.": "أضف رابط YouTube أولًا.", "Enter a valid YouTube link.": "أدخل رابط YouTube صالحًا.",
    "This video is already active inside your channel.": "هذا الفيديو موجود بالفعل في قناتك.",
    "Track added to your channel.": "أُضيف المقطع إلى قناتك.", "Temporary channel created.": "أُنشئت القناة المؤقتة.",
    "Could not save this channel update. Check Firebase rules and try again.": "تعذّر تحديث القناة. تحقّق من قواعد Firebase وحاول مجددًا.",
    "Track removed.": "أُزيل المقطع.", "Only the owner can remove tracks from this channel.": "مالك القناة وحده يستطيع إزالة المقاطع.",
    "Temporary channel removed.": "أُزيلت القناة المؤقتة.", "Only the owner can remove this channel.": "مالك القناة وحده يستطيع إزالتها.",
    "Saved to your channels.": "أُضيفت إلى قنواتك المحفوظة.", "Removed from saved.": "أُزيلت من المحفوظات.",
    "On": "مفعّل", "Off": "متوقف", "Uploaded": "مرفوعة", "Linked": "مرتبطة", "Remove": "إزالة",
    "Any mood": "كل الأجواء", "Poster": "صورة ثابتة", "No poster": "دون صورة ثابتة",
    "COMMUNITY": "المجتمع", "TUNE IN": "استمع", "SELECTED": "محددة",
    "LOFI": "لوفاي", "SYNTHWAVE": "سينث ويف", "CHILLHOP": "تشيل هوب", "JAZZHOP": "جاز هوب",
    "AMBIENT": "أمبينت", "DEEP HOUSE": "ديب هاوس", "HOUSE": "هاوس", "RETRO": "ريترو",
    "STUDY": "دراسة", "SLEEP": "نوم", "RELAX": "استرخاء", "RADIO": "راديو", "SONG": "أغنية", "CUSTOM": "مخصص",
    "Language": "اللغة", "Interface language": "لغة الواجهة", "English or Arabic, your choice.": "العربية أو الإنجليزية، على ذوقك.",
    "Appearance": "المظهر", "Themes": "الثيمات", "Theme": "الثيم", "Choose your theme": "اختر ثيمك",
    "Retro radio": "راديو ريترو", "Lo-fi mode": "وضع لوفاي", "Lo-fi": "لوفاي", "Lo-fi lounge": "لوفاي هادئ",
    "Display color": "لون الشاشة", "Screen color": "لون الشاشة", "Receiver color": "لون شاشة الراديو",
    "One color for the display and signal meter.": "لون موحّد للشاشة ومؤشر الإشارة.",
    "Mint": "نعناعي", "Green": "أخضر", "Cyan": "سماوي", "Amber": "كهرماني", "Violet": "بنفسجي",
    "Lavender": "بنفسجي", "Rose": "وردي", "Pink": "وردي", "Custom color": "لون مخصص",
    "Browse channels": "استعرض القنوات", "Close channel tray": "أغلق قائمة القنوات", "Open channel tray": "افتح قائمة القنوات",
    "Retro": "ريترو", "Listening theme": "ثيم الاستماع", "Retro receiver": "راديو ريترو",
    "Retro radio theme": "ثيم راديو الريترو", "Lo-fi theme": "ثيم لوفاي", "Lo-fi listening theme": "ثيم استماع لوفاي",
    "Change the interface, keep your music and scenes.": "غيّر الواجهة مع الاحتفاظ بموسيقاك ومشاهدك.",
    "Change the look. Keep your music.": "غيّر المظهر واحتفظ بموسيقاك.",
    "Display + signal color": "لون الشاشة والإشارة", "Display and signal color": "لون الشاشة والإشارة",
    "The receiver screen and signal meter share one glow.": "لون توهّج موحّد لشاشة الراديو ومؤشر الإشارة.",
    "Mint display": "شاشة نعناعية", "Cyan display": "شاشة سماوية", "Amber display": "شاشة كهرمانية",
    "Violet display": "شاشة بنفسجية", "Rose display": "شاشة وردية",
    "Arabic or English, across your radio and Studio.": "العربية أو الإنجليزية للراديو ولوحة الإدارة.",
    "Your radio, your style": "راديوك، على ذوقك", "Choose a theme. Your music and saved channels stay with you.": "اختر ثيمك مع الاحتفاظ بموسيقاك وقنواتك المحفوظة.",
    "One color for the frequency display and signal lights.": "لون موحّد لشاشة التردد وإضاءة مؤشر الإشارة.",
    "Checking Firebase": "جارٍ التحقق من Firebase", "Static mode": "وضع محلي", "Auth unavailable": "تسجيل الدخول غير متاح",
    "Auth listener failed": "تعذّر التحقق من تسجيل الدخول", "Firebase error": "خطأ Firebase", "Initialization failed": "تعذّر بدء الاتصال",
    "Setup required": "الإعداد مطلوب", "Google required": "يلزم تسجيل الدخول عبر Google",
    "Archive this channel? It will disappear from the radio, and its record will stay in the studio.": "أرشفة هذه القناة؟ ستختفي من الراديو مع الاحتفاظ بسجلها في الاستوديو.",
    "Permanently delete this channel? This cannot be undone. You can archive it instead to keep its record.": "حذف هذه القناة نهائيًا؟ لا يمكن التراجع. يمكنك أرشفتها للاحتفاظ بسجلها.",
    "Remove this background from the library?": "إزالة هذا المشهد من المكتبة؟",
    "Remove this background record? This does not delete any asset file.": "إزالة سجل هذا المشهد؟ سيبقى ملف الوسائط محفوظًا.",
    "Recalculate sort order for active and disabled stations? Removed stations will keep their current order.": "إعادة ترتيب القنوات المفعّلة والمتوقفة؟ تحتفظ القنوات المؤرشفة بترتيبها الحالي.",
    "Ice": "ثلجي", "Ice display": "شاشة ثلجية", "GIFs": "صور GIF",
    "Renner Radio — Your everyday escape.": "Renner Radio — مساحتك اليومية للهدوء.",
    "Renner Studio — Private workspace": "Renner Studio — مساحة الإدارة الخاصة",
    "Ice blue display": "شاشة زرقاء ثلجية", "Comfort Mode Off": "وضع الراحة متوقف", "Comfort Mode On": "وضع الراحة مفعّل",
    "Static Sound Off": "صوت التشويش متوقف", "Static Sound On": "صوت التشويش مفعّل",
    "Turn retro effects off": "أوقف مؤثرات الريترو", "Turn retro effects on": "فعّل مؤثرات الريترو",
    "WAITING FOR STREAM": "بانتظار البث", "Taking longer than usual. Try Play again or choose another channel.": "يستغرق البث وقتًا أطول من المعتاد. جرّب التشغيل مجددًا أو اختر قناة أخرى.",
    "Community unavailable": "المجتمع غير متاح", "Local listening": "استماع محلي",
    "Name saved.": "تم حفظ الاسم.", "Name saved locally. Firebase profile update failed.": "تم حفظ الاسم محليًا، وتعذّر تحديث الملف في Firebase.",
    "Slow down a little before sending again.": "انتظر قليلًا قبل إرسال رسالة أخرى.", "Sent.": "تم الإرسال.",
    "Sent locally for this session.": "تم الإرسال محليًا لهذه الجلسة.", "Could not load Firebase chat.": "تعذّر تحميل دردشة Firebase.",
    "Waiting for Firebase chat. Local preview is available.": "بانتظار الاتصال بالدردشة. المعاينة المحلية متاحة.",
    "Local preview only. Firebase not connected.": "معاينة محلية فقط. Firebase غير متصل.",
    "Local preview channel only. Firebase not connected.": "قناة للمعاينة المحلية فقط. Firebase غير متصل.",
    "Temporary channel is in local preview. Deploy V15.3 database rules for live sync.": "القناة المؤقتة في وضع المعاينة المحلية. فعّل قواعد قاعدة البيانات للمزامنة المباشرة.",
    "Could not load live channels. Deploy the V15.3 database rules.": "تعذّر تحميل القنوات المباشرة. فعّل قواعد قاعدة البيانات المرفقة.",
    "Saved channels updated.": "تحدّثت القنوات المحفوظة.", "Scene follows your channel.": "أصبح المشهد مرتبطًا بقناتك.",
    "Preview unavailable": "المعاينة غير متاحة", "Preparing Studio Panel access...": "جارٍ تجهيز الوصول إلى لوحة الإدارة…",
    "Opening Google popup sign-in...": "جارٍ فتح نافذة تسجيل الدخول عبر Google…",
    "Redirecting to Google sign-in...": "جارٍ الانتقال إلى تسجيل الدخول عبر Google…",
    "Copy this UID into ADMIN_UID and database.rules.json.": "انسخ المعرّف إلى ADMIN_UID وdatabase.rules.json.",
    "Firebase Auth is not ready. Reopen admin.html after Firebase finishes loading.": "تسجيل الدخول عبر Firebase غير جاهز. أعد فتح لوحة الإدارة بعد اكتمال الاتصال.",
    "Admin station listener could not start. Check Firebase rules and admin UID setup.": "تعذّر بدء تحديث القنوات. تحقّق من قواعد Firebase ومعرّف المدير.",
    "Site background listener could not start. Check Firebase rules and admin UID setup.": "تعذّر بدء تحديث المشاهد. تحقّق من قواعد Firebase ومعرّف المدير.",
    "To reorder, clear filters and choose All channels + Channel order.": "لإعادة الترتيب، امسح الفلاتر واختر جميع القنوات ثم ترتيب القنوات.",
    "Artwork": "صورة القناة", "GIF scene": "مشهد GIF", "Scene poster": "صورة المشهد الثابتة",
    "QUEUE / Temporary community item": "قائمة التشغيل / مقطع للمجتمع", "All categories": "جميع التصنيفات",
    "Your new channel": "قناتك الجديدة", "Set the scene. Make it yours.": "اختر المشهد واجعله على ذوقك.",
    "Video could not load. Check the source.": "تعذّر تحميل الفيديو. تحقّق من رابط المصدر."
  };
  const patterns = [
    [/^Recheck (.*)$/, (_, name) => `أعد فحص ${name}`],
    [/^Listen to (.*), ([\d.-]+) FM, unavailable$/, (_, name, frequency) => `استمع إلى ${name}، ${frequency} FM، غير متاحة`],
    [/^Visual effects: (None|Rain|Soft glow)$/, (_, effect) => `المؤثرات البصرية: ${labels[effect]}`],
    [/^(LOFI|SYNTHWAVE|CHILLHOP|JAZZHOP|AMBIENT|DEEP HOUSE|HOUSE|RETRO|STUDY|SLEEP|RELAX|RADIO|SONG|CUSTOM) mood \/ ([\d.-]+) FM$/, (_, category, frequency) => `${labels[category]} / ${frequency} FM`],
    [/^Public playlist · (\d+) tracks loaded$/, (_, count) => `قائمة عامة · تم تحميل ${count} مقطع`],
    [/^Public playlist: (\d+) tracks loaded\. Additional songs may remain on YouTube\.$/, (_, count) => `تم تحميل ${count} مقطع من الصفحة العامة. قد توجد أغاني إضافية على YouTube.`],
    [/^Public playlist: (\d+) tracks loaded\.$/, (_, count) => `تم تحميل ${count} مقطع من القائمة العامة.`],
    [/^Now playing: (.*) · (\d+) tracks loaded$/, (_, title, count) => `يُشغّل الآن: ${title} · تم تحميل ${count} مقطع`],
    [/^Now playing: (.*)$/, (_, title) => `يُشغّل الآن: ${title}`],
    [/^Google popup sign-in failed: (.*)\. Use redirect sign-in if popup login does not work\.$/, (_, detail) => `تعذّر تسجيل الدخول عبر النافذة: ${detail}. جرّب تسجيل الدخول بإعادة التوجيه.`],
    [/^Google redirect sign-in failed: (.*)$/, (_, detail) => `تعذّر تسجيل الدخول بإعادة التوجيه: ${detail}`],
    [/^Auth persistence warning: (.*)\. Continuing with default persistence\.$/, (_, detail) => `تعذّر حفظ جلسة تسجيل الدخول: ${detail}. سيتم استخدام الإعداد الافتراضي.`],
    [/^(.*) Studio tools require Firebase and Google sign-in\.$/, (_, detail) => `${detail} تحتاج أدوات الاستوديو اتصال Firebase وتسجيل الدخول عبر Google.`],
    [/^Order save stopped after (\d+) channels\. Your draft is kept so you can retry\. (.*)$/, (_, count, detail) => `توقف حفظ الترتيب بعد ${count} قناة. بقيت المسودة لتعيد المحاولة. ${detail}`],
    [/^(Enable|Disable)( background)? failed: (.*)$/, (_, operation, background, detail) => `تعذّر ${operation === "Enable" ? "تفعيل" : "إيقاف"} ${background ? "المشهد" : "القناة"}: ${detail}`],
    [/^Mark (\d+) duplicate station records as removed\? This will not hard delete data\.$/, (_, n) => `أرشفة ${n} سجل قناة مكرر؟ ستبقى البيانات محفوظة.`],
    [/^(\d+) stations?$/, (_, n) => `${n} قناة`],
    [/^(\d+) channels$/, (_, n) => `${n} قناة`], [/^(\d+) shown$/, (_, n) => `${n} ظاهرة`],
    [/^(\d+) scenes$/, (_, n) => `${n} مشهد`], [/^(\d+) pictures$/, (_, n) => `${n} صورة`],
    [/^Active (\d+) · Disabled (\d+) · Archived (\d+)$/, (_, a, b, c) => `مفعّلة ${a} · متوقفة ${b} · مؤرشفة ${c}`],
    [/^([\d.-]+|No frequency) \/ Order (\d+)$/, (_, frequency, order) => `${frequency === "No frequency" ? "دون تردد" : frequency} / الترتيب ${order}`],
    [/^([\d.-]+|No frequency) \/ Position (\d+) \(draft\)$/, (_, frequency, order) => `${frequency === "No frequency" ? "دون تردد" : frequency} / الموضع ${order} (مسودة)`],
    [/^(Video|GIF|Still image) \/ (.*) \/ Sort (\d+)$/, (_, type, assignment, order) => `${labels[type] || type} / ${assignment === "Global" ? "عام" : assignment === "Unknown station" ? "قناة غير معروفة" : assignment === "Assigned station" ? "قناة مرتبطة" : assignment} / الترتيب ${order}`],
    [/^(.*): keep "(.*)" \(([\d.-]+) FM\), mark (\d+) duplicates? removed\.$/, (_, group, name, frequency, count) => `${group}: احتفظ بـ «${name}» (${frequency} FM)، وأرشف ${count} قناة مكررة.`],
    [/^Editing: (.*)$/, (_, name) => `تعديل: ${name}`],
    [/^Generated ([\d.]+) FM\.$/, (_, n) => `تم إنشاء التردد ${n} FM.`],
    [/^Saved the order of (\d+) channels\.$/, (_, n) => `تم حفظ ترتيب ${n} قناة.`],
    [/^Imported (\d+) stations\. Skipped (\d+) existing stations\.$/, (_, a, b) => `تم استيراد ${a} قناة وتجاوز ${b} قناة موجودة.`],
    [/^Imported (\d+) default backgrounds\. Skipped (\d+) duplicates\.(.*)$/, (_, a, b, rest) => `تم استيراد ${a} مشهد جاهز وتجاوز ${b} مكرر.${rest}`],
    [/^([\d.]+) FM is already used by another active or disabled station\.$/, (_, n) => `التردد ${n} FM مستخدم بالفعل في قناة أخرى.`],
    [/^(Artwork|Animated scene|GIF scene|Scene poster) must use an HTTP\(S\) URL or local asset path\.$/, (_, item) => `${labels[item] || item}: استخدم رابط HTTP(S) أو مسار ملف محلي.`],
    [/^Found (\d+) duplicate groups with (\d+) removable duplicate stations\.$/, (_, a, b) => `عُثر على ${a} مجموعة مكررة تضم ${b} قناة يمكن أرشفتها.`],
    [/^Marked (\d+) duplicate stations removed\.$/, (_, n) => `تمت أرشفة ${n} قناة مكررة.`],
    [/^Recalculated sort order for (\d+) stations\.$/, (_, n) => `تمت إعادة ترتيب ${n} قناة.`],
    [/^Uploading · (\d+)%$/, (_, n) => `جارٍ الرفع · ${n}%`],
    [/^(Animated GIF|Still picture) · ([\d.]+ MB.*)$/, (_, kind, rest) => `${labels[kind]} · ${rest}`],
    [/^(GIF|Still picture) · (Uploaded|Linked)(.*)$/, (_, kind, origin, rest) => `${labels[kind] || kind} · ${labels[origin]}${rest}`],
    [/^“(.*)” is in your media library\. Choose Use to add it to a channel or scene\.$/, (_, name) => `أُضيفت «${name}» إلى المكتبة. اختر استخدامها في قناة أو مشهد.`],
    [/^“(.*)” is now in the library\.$/, (_, name) => `أُضيفت «${name}» إلى المكتبة.`],
    [/^“(.*)” added to your library\.$/, (_, name) => `أُضيفت «${name}» إلى مكتبتك.`],
    [/^“(.*)” selected\. Save this (channel|scene) to apply the change\.$/, (_, name, type) => `تم اختيار «${name}». احفظ ${type === "channel" ? "القناة" : "المشهد"} لتطبيق التغيير.`],
    [/^“(.*)” selected\. Choose a still poster for reduced motion, then save this (channel|scene)\.$/, (_, name, type) => `تم اختيار «${name}». أضف صورة ثابتة للحركة المخفّفة ثم احفظ ${type === "channel" ? "القناة" : "المشهد"}.`],
    [/^Use will fill (.*)\. Save the channel or scene afterward to publish the change\.$/, (_, field) => `الاختيار يملأ حقل ${translateTarget(field)}. احفظ القناة أو المشهد بعد ذلك لنشر التغيير.`],
    [/^(GIFs|Still pictures) must be (\d+) MB or smaller\.$/, (_, kind, n) => `${kind === "GIFs" ? "صور GIF" : "الصور الثابتة"} يجب ألا تتجاوز ${n} MB.`],
    [/^Live chat synced\. You are (.*)\.$/, (_, name) => `الدردشة متصلة. اسمك ${name}.`],
    [/^Local preview\. Firebase not connected\. You are (.*)\.$/, (_, name) => `معاينة محلية. Firebase غير متصل. اسمك ${name}.`],
    [/^Local preview\. Firebase not connected\. Choose a name to chat\.$/, () => "معاينة محلية. Firebase غير متصل. اختر اسمًا للدردشة."],
    [/^(Local preview only\. Firebase not connected\.|Waiting for Firebase chat\. Local preview is available\.) You are (.*)\.$/, (_, base, name) => `${labels[base]} اسمك ${name}.`],
    [/^(Local preview only\. Firebase not connected\.|Waiting for Firebase chat\. Local preview is available\.) Choose a name to chat\.$/, (_, base) => `${labels[base]} اختر اسمًا للدردشة.`],
    [/^Message must be (\d+) characters or fewer\.$/, (_, n) => `الرسالة يجب ألا تتجاوز ${n} حرفًا.`],
    [/^Your channel can hold up to (\d+) active tracks\.$/, (_, n) => `يمكن لقناتك أن تضم ${n} مقطعًا مفعّلًا كحد أقصى.`],
    [/^Please wait (\d+)s before adding another track\.$/, (_, n) => `انتظر ${n} ثانية قبل إضافة مقطع آخر.`],
    [/^(\d+)\/(\d+) active tracks$/, (_, a, b) => `${a}/${b} مقاطع مفعّلة`],
    [/^([\dm s]+) left$/, (_, time) => `متبقٍ ${time}`],
    [/^Listen to (.*), ([\d.-]+) FM$/, (_, name, frequency) => `استمع إلى ${name}، ${frequency} FM`],
    [/^Save (.*) to favorites$/, (_, name) => `احفظ ${name} في المفضلة`],
    [/^Remove (.*) from favorites$/, (_, name) => `أزل ${name} من المفضلة`],
    [/^Move (.*) up$/, (_, name) => `انقل ${name} للأعلى`],
    [/^Move (.*) down$/, (_, name) => `انقل ${name} للأسفل`],
    [/^(\d+) percent$/, (_, n) => `${n} بالمئة`],
    [/^(.+) saved\.$/, (_, name) => `تم حفظ ${name}.`],
    [/^(Station save failed|Background save failed|Settings save failed|Could not load site settings|Could not read admin stations|Could not read site backgrounds|Firebase error|Sign-out failed|Google sign-in failed|Remove failed|Delete failed|Background remove failed|Duplicate cleanup failed|Sort order recalculation failed|Default station import failed|Default background import failed): (.*)$/,
      (_, prefix, error) => `${errorPrefixes[prefix]}: ${error}`]
  ];
  const errorPrefixes = {
    "Station save failed": "تعذّر حفظ القناة", "Background save failed": "تعذّر حفظ المشهد", "Settings save failed": "تعذّر حفظ الإعدادات",
    "Could not load site settings": "تعذّر تحميل إعدادات الموقع", "Could not read admin stations": "تعذّر تحميل قنوات الإدارة",
    "Could not read site backgrounds": "تعذّر تحميل المشاهد", "Firebase error": "خطأ Firebase", "Sign-out failed": "تعذّر تسجيل الخروج",
    "Google sign-in failed": "تعذّر تسجيل الدخول عبر Google", "Remove failed": "تعذّرت الإزالة", "Delete failed": "تعذّر الحذف",
    "Background remove failed": "تعذّرت إزالة المشهد", "Duplicate cleanup failed": "تعذّر تنظيم المكررات",
    "Sort order recalculation failed": "تعذّرت إعادة الترتيب", "Default station import failed": "تعذّر استيراد القنوات الجاهزة",
    "Default background import failed": "تعذّر استيراد المشاهد الجاهزة"
  };
  function translateTarget(value) {
    const names = { "channel artwork": "صورة القناة", "channel scene": "مشهد القناة", "channel scene (still / gif)": "مشهد القناة", "channel poster": "صورة القناة الثابتة", "channel poster / still fallback": "صورة القناة الثابتة", "channel gif scene": "مشهد GIF للقناة", "scene source": "مصدر المشهد", "scene picture / gif": "صورة / GIF للمشهد", "scene poster": "صورة المشهد الثابتة", "scene poster / still fallback": "صورة المشهد الثابتة" };
    return names[value] || value;
  }
  const ownedTextSelectors = [
    "#heroStatusPill", "#neonPlaybackStatus", "#neonConnectionStatus", "#neonChatStatus", "#neonQueueStatus", "#tuningStatus", "#stationCount", "#emptyTitle", "#emptyDescription", "#firebaseStatus", "#uiToast", "#stationSectionTitle",
    "#chatModeHint", "#chatNameHelper", "#chatMessage", "#chatLoading", "#chatEmpty", "#chatSendBtn", "#chatNameSaveBtn",
    "#playlistModeHint", "#playlistMessage", "#playlistLoading", "#playlistEmpty", "#playlistAddBtn", "#playlistSourceHint", "#playlistResolvedHint", "#stationYoutubeHint", ".playlist-action-remove", ".playlist-item-countdown", ".playlist-item-owner",
    ".ch-badge", ".ch-meta", ".ch-availability", ".availability-retry", "#stationTunerHelp", "#adminStatusTitle", "#adminAccessPill", "#adminState", "#adminMessage", "#stationCountPill", "#stationStatusSummary", "#stationOrderMessage", "#stationListEmpty", "#stationManagerTitle", "#stationEditingLabel", "#saveStationBtn", "#stationFormMessage",
    "#backgroundEditingLabel", "#saveBackgroundBtn", "#backgroundFormMessage", "#backgroundCountPill", "#backgroundListEmpty", "#siteSettingsMessage", "#maintenanceMessage", "#duplicatePreviewList li", ".admin-station-main > span", ".admin-background-main > span",
    "#mediaCountPill", "#mediaUseHint", "#mediaLibraryEmpty", "#mediaLibraryMessage", "#mediaUploadMessage", "#mediaProgressText", "#mediaFileSummary", "#mediaUrlMessage",
    "#mediaFilePreview", "#mediaUrlPreview", "#backgroundFormPreview > span", ".media-library-details > span", ".media-library-actions button", ".admin-station-actions button", ".admin-background-actions button", ".station-badges span", ".background-badges span:first-child", ".background-badges span:last-child", ".background-preview > span",
    "#stationCategoryInput option", "#stationListCategoryFilter option", "#backgroundStationInput option[value='']", "#defaultStationIdInput option[value='']", "#stationPreviewMood"
  ].join(",");
  const ownedAttributeSelectors = ["[data-i18n-aria-label]", "[data-i18n-title]", "[data-i18n-placeholder]", ".channel-item", ".favorite-button", ".availability-retry", ".admin-station-actions button", "#volumeDial", "#motionPauseBtn", "#nowFavoriteBtn", "#minimizeBtn", "#mobileFocusModeBtn", "#retroEffectBtn", "#filmGrainBtn", "#comfortModeBtn", "#staticSoundBtn"].join(",");
  const doc = global.document;
  let language = "ar";
  try { const stored = global.localStorage?.getItem(STORAGE_KEY); if (stored === "ar" || stored === "en") language = stored; } catch (_) { /* Preference storage is optional. */ }
  const textStates = new WeakMap();
  const attributeStates = new WeakMap();
  let applying = false;
  let scheduled = false;
  function translateOwnedText(value, selectedLanguage = language) {
    const source = String(value ?? "");
    if (selectedLanguage !== "ar") return source;
    const trimmed = source.trim();
    let translated = labels[trimmed];
    if (translated === undefined) {
      for (const [expression, replacement] of patterns) {
        const match = trimmed.match(expression);
        if (match) { translated = replacement(...match); break; }
      }
    }
    if (translated === undefined) return source;
    return source.replace(trimmed, translated);
  }
  function t(key, params = {}) {
    return translateOwnedText(key).replace(/\{([\w]+)\}/g, (token, name) => Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : token);
  }
  function applyTextNode(node, explicitKey) {
    const current = node.nodeValue;
    if (!current?.trim()) return;
    let state = textStates.get(node);
    if (!state || current !== state.display) state = { source: current, display: current };
    const key = explicitKey && state.source.trim() === explicitKey ? explicitKey : state.source;
    const translated = translateOwnedText(key);
    const next = explicitKey && state.source.trim() === explicitKey ? state.source.replace(explicitKey, translated) : translated;
    state.display = next;
    textStates.set(node, state);
    if (current !== next) node.nodeValue = next;
  }
  function applyElementText(element, explicitKey) {
    for (const node of Array.from(element.childNodes || [])) if (node.nodeType === 3) applyTextNode(node, explicitKey);
  }
  function applyAttribute(element, attribute, explicitKey) {
    if (!element.hasAttribute(attribute)) return;
    let states = attributeStates.get(element);
    if (!states) { states = {}; attributeStates.set(element, states); }
    const current = element.getAttribute(attribute);
    let state = states[attribute];
    if (!state || current !== state.display) state = { source: current, display: current };
    const source = explicitKey && state.source === explicitKey ? explicitKey : state.source;
    const next = translateOwnedText(source);
    state.display = next;
    states[attribute] = state;
    if (current !== next) element.setAttribute(attribute, next);
  }
  function apply(root = doc) {
    if (!root?.querySelectorAll || applying) return;
    applying = true;
    try {
      for (const element of root.querySelectorAll("[data-i18n]")) applyElementText(element, element.getAttribute("data-i18n"));
      for (const element of root.querySelectorAll(ownedTextSelectors)) applyElementText(element);
      // Preview titles/descriptions become user content as soon as an editor value exists.
      for (const [field, preview] of [["stationNameInput", "stationPreviewName"], ["stationDescriptionInput", "stationPreviewDescription"]]) {
        const input = doc?.getElementById?.(field);
        if (input && !String(input.value || "").trim()) {
          for (const element of root.querySelectorAll(`#${preview}`)) applyElementText(element);
        }
      }
      // The receiver metadata can contain a track title. Translate only its known UI formats.
      for (const element of root.querySelectorAll("#stationMeta,#barStationMeta")) {
        for (const node of Array.from(element.childNodes || [])) {
          if (node.nodeType !== 3) continue;
          const state = textStates.get(node);
          const source = state && node.nodeValue === state.display ? state.source.trim() : node.nodeValue.trim();
          if (/^(LOFI|SYNTHWAVE|CHILLHOP|JAZZHOP|AMBIENT|DEEP HOUSE|HOUSE|RETRO|STUDY|SLEEP|RELAX|RADIO|SONG|CUSTOM) mood \/ [\d.-]+ FM$/.test(source) || /^Now playing: /.test(source) || /^Public playlist ·/.test(source) || ["Choose your frequency", "QUEUE / Temporary community item", "YouTube Playlist"].includes(source)) applyTextNode(node);
        }
      }
      // Account fields are identifiers after login. Only the named signed-out placeholders are UI.
      for (const element of root.querySelectorAll("#adminEmail,#adminUid")) {
        for (const node of Array.from(element.childNodes || [])) {
          if (node.nodeType !== 3) continue;
          const state = textStates.get(node);
          const source = state && node.nodeValue === state.display ? state.source.trim() : node.nodeValue.trim();
          if (["Not signed in", "Waiting for sign-in", "Waiting for Google sign-in", "Google account"].includes(source)) applyTextNode(node);
        }
      }
      for (const element of root.querySelectorAll(ownedAttributeSelectors)) {
        for (const attribute of ["aria-label", "title", "placeholder", "aria-valuetext"]) applyAttribute(element, attribute, element.getAttribute(`data-i18n-${attribute}`));
      }
      for (const element of root.querySelectorAll("[data-language-toggle]")) {
        const label = language === "ar" ? "EN" : "العربية";
        if (element.textContent !== label) element.textContent = label;
        const aria = language === "ar" ? "Switch to English" : "التبديل إلى العربية";
        if (element.getAttribute("aria-label") !== aria) element.setAttribute("aria-label", aria);
        if (element.title !== aria) element.title = aria;
        element.setAttribute("lang", language === "ar" ? "en" : "ar");
        element.setAttribute("dir", language === "ar" ? "ltr" : "rtl");
      }
    } finally { applying = false; }
  }
  function scheduleApply() {
    if (scheduled) return;
    scheduled = true;
    (global.queueMicrotask || ((task) => Promise.resolve().then(task)))(() => { scheduled = false; apply(); });
  }
  function setLanguage(value, persist = true) {
    if (value !== "ar" && value !== "en") return false;
    language = value;
    if (doc?.documentElement) { doc.documentElement.lang = language; doc.documentElement.dir = language === "ar" ? "rtl" : "ltr"; }
    if (persist) { try { global.localStorage?.setItem(STORAGE_KEY, language); } catch (_) { /* Keep the current session usable. */ } }
    apply();
    if (typeof global.dispatchEvent === "function" && typeof global.CustomEvent === "function") global.dispatchEvent(new global.CustomEvent("renner:language-changed", { detail: { language } }));
    return true;
  }
  const api = Object.freeze({ t, translateOwnedText, setLanguage, getLanguage: () => language, apply, supportedLanguages: Object.freeze(["ar", "en"]), storageKey: STORAGE_KEY });
  global.RENNER_I18N = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (!doc) return;
  setLanguage(language, false);
  doc.addEventListener("click", (event) => { if (event.target?.closest?.("[data-language-toggle]")) setLanguage(language === "ar" ? "en" : "ar"); });
  doc.addEventListener("DOMContentLoaded", () => apply());
  global.addEventListener?.("storage", (event) => { if (event.key === STORAGE_KEY && (event.newValue === "ar" || event.newValue === "en")) setLanguage(event.newValue, false); });
  if (typeof global.MutationObserver === "function") {
    const observer = new global.MutationObserver(scheduleApply);
    observer.observe(doc.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["aria-label", "title", "placeholder", "aria-valuetext"] });
  }
})(typeof window !== "undefined" ? window : globalThis);
