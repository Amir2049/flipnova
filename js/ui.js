// FLIPNOVA — menus, save data, achievements, cosmetics, results & sharing (Arabic-first, RTL).
(function (FF) {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  // ------------------------------------------------------------------ strings
  const T = {
    ar: {
      tagline: 'اركض. اقلب الجاذبية. غيّر العالم.',
      best: 'أفضل رقم', play: 'العب', daily: 'ريمكس اليوم', zen: 'تدريب زِن', skins: 'الشخصيات',
      ach: 'الإنجازات', howto: 'كيف ألعب', settings: 'الإعدادات', noMusic: 'بدون موسيقى — مؤثرات صوتية فقط. ارفع الصوت!',
      paused: 'إيقاف مؤقت', resume: 'تابع', restart: 'ابدأ من جديد', home: 'الرئيسية', again: 'العب مجددًا', share: 'شارك النتيجة',
      back: 'رجوع', chars: 'شخصيات', trails: 'آثار الحركة', fairNote: 'كل الأشكال تجميلية فقط: نفس الحجم والسرعة للجميع.',
      crash: 'اصطدام!', newBest: 'رقم شخصي جديد!', finished: 'اكتمل التحدي!', soonTitle: 'خلّصت كل المراحل!', soonSub: 'COMING SOON — مراحل جديدة جاية قريب 🔥', soonBonus: '🏁 كل المراحل! ', soonSkin: '🎁 هدية: سكن <b>NOVA</b> بقى بتاعك ولبسته!', needSoon: 'خلّص كل المراحل في Endless', bestWas: 'أفضل رقم: ', newBestSub: 'حطمت رقمك!',
      dist: 'المسافة', coins: 'العملات', perfect: 'Perfect', near: 'Near Miss', chain: 'أفضل سلسلة', lines: 'خطوط كاملة',
      equip: 'ارتداء', equipped: 'مُرتدى', buy: 'شراء', needAch: 'يُفتح بإنجاز:', notEnough: 'عملات غير كافية',
      sfx: 'المؤثرات الصوتية', ui: 'أصوات الواجهة', amb: 'أصوات الأجواء', mute: 'كتم الكل', vib: 'الاهتزاز', reduce: 'تقليل الوميض والاهتزاز',
      guides: 'علامات توقيت Perfect', lang: 'اللغة', hand: 'زر الإيقاف', handR: 'يسار الشاشة', handL: 'يمين الشاشة', on: 'تشغيل', off: 'إيقاف',
      weekly: 'تحدي الأسبوع', bWeek: 'الأسبوع', weekLeft: 'طريق جديد بعد {t}', weekNew: '🗓 رقم جديد ليك في تحدي الأسبوع!', weekNote: '🗓 نفس الطريق للكل لحد الجمعة 8 بالليل بتوقيت القاهرة. 🎯 العلم الأزرق في الجري = اللاعب اللي فوقك على طول.', weekLocal: ' (جهازك)', weekRival: '🎯 هدفك الجاي: {n} ({s}) — علمه الأزرق مستنيك في الطريق', weekTop: '👑 إنت الأول في الأسبوع ده!', weekShare: '🗓 تحدي الأسبوع في FLIPPO: جبت {s} — نفس الطريق للكل لحد الجمعة. اكسرني:', weekPassed: '🎯 عدّيت {n}!', dD: 'ي', dH: 'س', dM: 'د',
      dailyBest: 'أفضلك اليوم: ', dailyNew: 'جديد كل يوم', ghostNote: 'ظلّك يسابقك!',
      star1: 'أكمل التحدي', star2: 'كل العملات', star3: 'Perfect ×', locked: 'مقفل — أكمل السابق',
      ach_unlocked: 'إنجاز جديد: ', unlocked: 'فُتح: ', shareText: 'سجلت {s} نقطة في FLIPPO! هل تقدر تتفوق عليّ؟',
      saved: 'تم حفظ الصورة', moveBrave: 'أفضل حركة: مسار شجاع ×', movePerf: 'أفضل حركة: سلسلة Perfect ×',
      moveChain: 'أفضل حركة: سلسلة كومبو ', moveNear: 'أفضل حركة: Near Miss ×', moveFirst: 'كل محاولة تعلّمك شيئًا — جرّب مرة أخرى!',
      legendTitle: 'أسطورة',
      checking: 'بنتحقق من الإثبات…',
      heroPlay: 'العب', evWeekTag: 'حدث الأسبوع', evGo: 'العب',
      adventure: 'المغامرة', endless: 'جري لانهائي', levelDone: 'اكتملت المرحلة!', next: 'التالي ▶', firstClear: 'أول مرة! +', starBonus: 'نجوم جديدة! +',
      campStar1: 'خلّصها', campStar2: 'كل العملات', campStar3: 'بدون موت', deaths: 'موت', gauntlet: 'تحدي',
      board: 'لوحة الشرف', bRuns: 'أفضل جولاتي', bToday: 'اليوم', bWorld: 'العالم', bMine: 'جولاتي', onOff: 'لوحة العالم لسه مش متوصلة بسيرفر — خطوة واحدة في README.', onLoad: 'بيحمّل لوحة العالم...', onFail: 'مفيش اتصال بلوحة العالم', onLink: 'لوحة العالم والهدايا شغالين في النسخة اللي بتتحمّل (APK أو ملف الكمبيوتر)', retry: 'جرب تاني', onOk: '✓ كل رقم هنا اتأكد بإعادة تشغيل الجولة نفسها على جهازك', onFake: ' · اتشال {n} رقم مزيف', onSent: '🌍 رقمك اتسجل في لوحة العالم!', noWorld: 'لسه محدش سجل هنا — خليك الأول!', onChecking: 'بيتأكد من الأرقام {a}/{b}...', yourName: 'اسمك:', nameSave: 'حفظ', nameOk: '✓ الاسم ده بتاعك في لوحة العالم', nameTaken: 'الاسم ده محجوز لحد تاني — اختار اسم تاني', nameBad: 'من 3 لـ 14 حرف أو رقم', nameLimit: 'محاولات كتير النهارده — جرب بكرة', nameOffline: 'مفيش نت — هنتأكد من الاسم بعدين', nameNeed: 'اختار اسم خاص بيك عشان تظهر في لوحة العالم', nameNeedToast: '🌍 اختار اسمك في لوحة الشرف عشان رقمك يظهر للعالم', minNote: 'بيظهر هنا أعلى رقم لكل لاعب من {n} وطالع', missionsNote: 'مهام جديدة كل يوم — المكافأة تتضاف تلقائيًا.', noScores: 'لسه مفيش أرقام — العب جولة!', you: 'أنت',
      maker: 'صانع المراحل', newLevel: '+ مرحلة جديدة', importLevel: 'استيراد كود', toEditor: 'رجوع للمحرر',
      here: 'من هنا', featured: 'مختارة', mine: 'مراحلي', noLevels: 'لسه معندكش مراحل — اعمل أول واحدة!', verified: 'مُجرَّبة ✓',
      edStart: 'منطقة البداية — ضع العقبات بعدها', edFull: 'وصلت للحد الأقصى من العناصر', edSaved: 'تم الحفظ!', edVerifying: 'البوت بيجرب المرحلة…',
      edOk: '✓ البوت عدّاها! المرحلة قابلة للعبور', edFail: '✗ البوت مات هنا — جرّبها بنفسك أو عدّلها', edEmpty: 'المرحلة فاضية — ضيف عقبات الأول',
      edHelp: 'اختار أداة من تحت واضغط في الملعب (اسحب صباعك لرسم صف كامل). ◀ ▶ للتحرك.', edClear: 'تم مسح كل العناصر (تقدر ترجع بـ ↶)',
      codeShare: 'كود المرحلة', codeShareNote: 'انسخ الكود وابعته لصحابك — يقدروا يلعبوها من «استيراد كود».', copy: 'نسخ / مشاركة', copied: 'تم النسخ!',
      rotate: 'لفّ الموبايل بالعرض', soClose: '😤 فاضلك {n} بس على رقمك!', cbMode: 'وضع عمى الألوان', clipText: 'شوف موتتي في FLIPPO 😂 تقدر تعدّي أحسن مني؟', clipSaved: '🎬 الفيديو اتحفظ', collected: 'جمعت \u2066{a}/{b}\u2069 — \u2066{p}%\u2069', vsShare: '⚔️ العب نفس الطريق واكسرني:', vsHello: '⚔️ {n} بيتحدّاك! اكسر <b>{s}</b> على نفس الطريق — دوس Endless', vsWin: '🏆 كسرت {n}! ابعتله رقمك 😎', vsLose: '⚔️ لسه مكسرتش {n} ({s}) — حاول تاني!', replayNote: '⏪ آخر 3 ثواني بالبطيء — شوف إيه اللي موّتك', bFriends: 'صحابي', friendPh: 'اسم صاحبك في اللعبة', friendAdd: '+ ضيف', friendHave: 'موجود عندك', friendMax: 'كفاية 30 صاحب 😅', friendNone: 'ضيف أسامي صحابك زي ما مكتوبة في اللعبة، وهتشوف أحسن رقم لكل واحد فيهم — من غير أي حد أدنى.', friendMissing: 'لسه ملعبوش Endless بالاسم ده: ', streakDay: '🔥 يوم {n} ورا بعض!', streakNext: '💎 فاضل {n} يوم وتاخد سكن AURORA', streakAurora: '💎 7 أيام ورا بعض! سكن AURORA بقى بتاعك', needStreak: 'افتح اللعبة 7 أيام ورا بعض', tutStart: '🎓 تدريب سريع: اضغط عشان تقلب الجاذبية!', tutDone: '🎓 خلّصت التدريب! دلوقتي جرّب Endless 🔥', tutSkip: '🎓 تمام — التدريب موجود في «طريقة اللعب» لو حبيت تعيده', tutBtn: '🎓 جرّب التدريب', tutGo: '🎓 خلّصت التدريب! دلوقتي الجد — Endless 🔥', firstScore: 'أول رقم ليك!', firstScoreSub: 'دلوقتي اكسره', tapAny: 'اضغط في أي مكان', goalStage: '🎯 الجاي: وصّل المرحلة {n}', goalMis: '🎯 مهمة اليوم: {t} ({p}/{q})', newObs: '🆕 دي جديدة عليك — جرّب تاني، إنت عارفها دلوقتي', againKnow: 'جرّب تاني', tmrw: '🌙 بكرة: يوم {n} = <b>+{c}</b> ● · طريق ريمكس جديد · تحدي الأسبوع لحد الجمعة', vsClose: '⚔️ قرّبت جدًا! تحدّى صاحبك', vsBest: '⚔️ رقم جديد! تحدّى صاحبك', vsBack: '⚔️ رد عليه التحدي', vsCardText: '😤 جبت {s} في FLIPPO (المرحلة {st}). نفس الطريق بالظبط — تقدر تكسرني؟', vsCopied: '🔗 لينك التحدي اتنسخ — ابعته لصاحبك', vsCopyNote: 'انسخ ده وابعته لصاحبك — هيلعب نفس الطريق بالظبط', vsBanner: '⚔️ <b>{n}</b> بيتحدّاك: اكسر <b>{s}</b> على نفس الطريق', vsBannerGo: 'العب', vsGap: '⚔️ فاضلك <b>{d}</b> وتكسر {n} ({s})', vsWinLine: '🏆 كسرت {n} ({s})! رد عليه التحدي', vsOld: '⚔️ طريق اليومي بتاع {n} — جولة تحدي، مبتتحسبش في لوحة النهارده', saveRow: '💾 تقدّمك', saveOut: 'نسخ', saveIn: 'استرجاع', saveOutTitle: '💾 كود تقدّمك', saveOutNote: 'ده كل تقدّمك: اسمك وعملاتك وسكناتك ومراحلك. انسخه واحفظه في مكان أمين، أو الصقه في متصفح تاني أو في التطبيق.', saveInTitle: '📥 استرجاع التقدّم', saveInNote: 'الصق كود تقدّمك هنا. ⚠️ ده هيحل مكان التقدّم اللي على الجهاز ده.', saveInBtn: 'استرجاع', saveBad: 'الكود ده مش كود تقدّم', saveInOk: '✓ رجع تقدّمك!', savedBack: '💾 رجّعنا تقدّمك المحفوظ', rar_icon: '👑 ICON — أسطوري', rar_diamond: '💎 DIAMOND — نادر جدًا', rar_rare: '🔷 RARE — نادر', rar_dirt: '🟫 DIRT — عادي', ownerT: '♛ لوحة صاحب اللعبة', oGod: 'وضع الدرع (مفيش موت)', oSpeed: 'سرعة اللعبة', oStart: 'ابدأ الجري من المرحلة', oEnd: 'شوف نهاية اللعبة (COMING SOON)', watch: '▶ شوف', oHit: 'إظهار حدود الخطر', oCoins: '+10,000 عملة', oMaker: 'صانع المراحل', open: 'افتح', oNote: 'الجولات اللي فيها أي صلاحية مش بتتحسب ومش بتتبعت للوحة العالم.', assistNote: '♛ صلاحيات صاحب اللعبة شغالة — الجولة دي مش بتتحسب', needLegendAll: 'إنجاز ♛ أسطورة + كل نجوم المغامرة', credit: 'من صنع أمير', updNew: '⬆ فيه نسخة جديدة — نزّلها', creditLong: 'FLIPPO — فكرة وتصميم وتطوير: أمير', redeem: '🎁 كود', redeemTitle: 'كود هدية', redeemNote: 'لو معاك كود خاص اكتبه هنا.', redeemOk: '♛ أهلا يا صاحب اللعبة — كل حاجة اتفتحت!', redeemBad: 'الكود ده مش صحيح', redeemNet: 'الكود ده محتاج نت عشان يتفعّل — اتصل وجرب تاني', redeemWait: 'بيتأكد من الكود...', redeemGift: '🎁 اتفتح: ', redeemYs: '> ACCESS GRANTED_ أهلا يا يوسف — سكن Y0U55EF وأثر MATRIX بقوا بتوعك', redeemGh: '∞ أهلا يا غنيم — إنت الأقوى. سكن GHONEIM ∞ وأثر INFINITY بقوا بتوعك', redeemBtn: 'تفعيل',
      codeImport: 'استيراد مرحلة', codeImportNote: 'الصق كود المرحلة اللي وصلك هنا.', importOk: 'تمت إضافة المرحلة: ', importBad: 'الكود غير صحيح',
      remix: 'ريمكس', delConfirm: 'اضغط تاني للحذف', customDone: 'خلّصت المرحلة!', stageLbl: 'المرحلة ',
      tools: { spike: 'شوك', wallB: 'جدار ز', wallP: 'جدار ب', block: 'صندوق', slab: 'رف', catchB: 'منصة ز', catchP: 'منصة ب', mover: 'كسّار', laser: 'ليزر', pad: 'قفّاز', lock: 'قفل', coin: 'عملة', gem: 'جوهرة', finish: 'نهاية', erase: 'ممحاة', pop: 'شوك قافز', saw: 'منشار', orbit: 'كرة دوّارة', pend: 'بندول', lift: 'مصعد', crumble: 'هشّة', blink: 'وامضة', bumper: 'نطّاط', fan: 'مروحة', dash: 'تسريع', flyIn: 'طيران', flyOut: 'هبوط', piston: 'مكبس', jaws: 'فكوك', geyser: 'نافورة' },
      cats: { danger: 'عقبات', platform: 'منصات', reward: 'عملات' },
      missions: 'مهام اليوم', misDone: 'مهمة مكتملة! ', allDone: 'كل مهام اليوم! مكافأة ', lvlUp: 'مستوى جديد! LV ', needLvl: 'يُفتح في المستوى ', xp: 'خبرة'
    },
    en: {
      tagline: 'Run. Flip gravity. Change the world.',
      best: 'Best', play: 'PLAY', daily: 'Daily Remix', zen: 'Zen Practice', skins: 'Characters',
      ach: 'Achievements', howto: 'How to play', settings: 'Settings', noMusic: 'No music — sound effects only. Turn it up!',
      paused: 'Paused', resume: 'Resume', restart: 'Restart', home: 'Home', again: 'PLAY AGAIN', share: 'Share result',
      back: 'Back', chars: 'Characters', trails: 'Trails', fairNote: 'All cosmetics only: same size & speed for everyone.',
      crash: 'CRASH!', newBest: 'NEW BEST!', finished: 'CHALLENGE CLEAR!', soonTitle: 'ALL STAGES CLEARED!', soonSub: 'COMING SOON — new stages are on the way 🔥', soonBonus: '🏁 Every stage! ', soonSkin: '🎁 Gift: the <b>NOVA</b> skin is yours — you\'re wearing it!', needSoon: 'Clear every Endless stage', bestWas: 'Best: ', newBestSub: 'You broke your record!',
      dist: 'Distance', coins: 'Coins', perfect: 'Perfect', near: 'Near Miss', chain: 'Best chain', lines: 'Clean lines',
      equip: 'Equip', equipped: 'Equipped', buy: 'Buy', needAch: 'Unlock by:', notEnough: 'Not enough coins',
      sfx: 'Sound effects', ui: 'UI sounds', amb: 'Ambience', mute: 'Mute all', vib: 'Vibration', reduce: 'Reduce flashes & shake',
      guides: 'Perfect timing marks', lang: 'Language', hand: 'Pause button', handR: 'Left side', handL: 'Right side', on: 'ON', off: 'OFF',
      weekly: 'Weekly challenge', bWeek: 'Week', weekLeft: 'new road in {t}', weekNew: '🗓 New best in this week\'s challenge!', weekNote: '🗓 Same road for everyone until Friday 20:00 Cairo time. 🎯 The blue flag in your run = the player just above you.', weekLocal: ' (this device)', weekRival: '🎯 Next target: {n} ({s}) — their blue flag waits on the road', weekTop: '👑 You lead this week!', weekShare: '🗓 FLIPPO weekly challenge: I got {s} — same road for everyone until Friday. Beat me:', weekPassed: '🎯 You passed {n}!', dD: 'd', dH: 'h', dM: 'm',
      dailyBest: 'Today: ', dailyNew: 'New every day', ghostNote: 'Your ghost races you!',
      star1: 'Finish', star2: 'All coins', star3: 'Perfect ×', locked: 'Locked — clear the previous one',
      ach_unlocked: 'Achievement: ', unlocked: 'Unlocked: ', shareText: 'I scored {s} in FLIPPO! Can you beat me?',
      saved: 'Image saved', moveBrave: 'Best move: Brave Route ×', movePerf: 'Best move: Perfect streak ×',
      moveChain: 'Best move: Combo chain ', moveNear: 'Best move: Near Miss ×', moveFirst: 'Every run teaches you something — go again!',
      legendTitle: 'Legend',
      checking: 'Checking proof…',
      heroPlay: 'PLAY', evWeekTag: 'WEEKLY EVENT', evGo: 'Play',
      adventure: 'Adventure', endless: 'Endless', levelDone: 'LEVEL CLEAR!', next: 'NEXT ▶', firstClear: 'First clear! +', starBonus: 'New stars! +',
      campStar1: 'Finish', campStar2: 'All coins', campStar3: 'No deaths', deaths: 'deaths', gauntlet: 'Gauntlet',
      board: 'Scoreboard', bRuns: 'Best runs', bToday: 'Today', bWorld: 'World', bMine: 'My runs', onOff: 'World board is not connected to a server yet — one step in the README.', onLoad: 'Loading world board...', onFail: 'Could not reach the world board', onLink: 'The world board and gift codes work in the downloaded game (APK or the computer version)', retry: 'Try again', onOk: '✓ Every score here was re-played and verified on your device', onFake: ' · {n} fake score(s) removed', onSent: '🌍 Your score is on the world board!', noWorld: 'Nobody here yet — be the first!', onChecking: 'Verifying scores {a}/{b}...', yourName: 'Your name:', nameSave: 'Save', nameOk: '✓ This name is yours on the world board', nameTaken: 'That name belongs to someone else — pick another', nameBad: 'Use 3 to 14 letters or numbers', nameLimit: 'Too many tries today — try again tomorrow', nameOffline: 'No internet — your name will be checked later', nameNeed: 'Pick a name of your own to appear on the world board', nameNeedToast: '🌍 Pick your name in the Scoreboard to join the world board', minNote: 'Each player\'s best score of {n}+ is shown here', missionsNote: 'New missions every day — rewards are added automatically.', noScores: 'No scores yet — play a run!', you: 'You',
      maker: 'Level Maker', newLevel: '+ New level', importLevel: 'Import code', toEditor: 'Back to editor',
      here: 'here', featured: 'Featured', mine: 'My levels', noLevels: 'No levels yet — make your first one!', verified: 'Verified ✓',
      edStart: 'Start zone — place obstacles after it', edFull: 'Item limit reached', edSaved: 'Saved!', edVerifying: 'The bot is testing your level…',
      edOk: '✓ The bot beat it! Level is beatable', edFail: '✗ The bot died here — try it yourself or tweak it', edEmpty: 'Empty level — add some obstacles first',
      edHelp: 'Pick a tool below and tap the track (drag to paint a row). Use ◀ ▶ to scroll.', edClear: 'Cleared everything (undo with ↶)',
      codeShare: 'Level code', codeShareNote: 'Copy the code and send it to friends — they can play it via “Import code”.', copy: 'Copy / share', copied: 'Copied!',
      rotate: 'Turn your phone sideways', soClose: '😤 Only {n} short of your best!', cbMode: 'Colour-blind mode', clipText: 'Watch me crash in FLIPPO 😂 Can you do better?', clipSaved: '🎬 Clip saved', collected: 'Collected {a}/{b} — {p}%', vsShare: '⚔️ Play the same road and beat me:', vsHello: '⚔️ {n} challenges you! Beat <b>{s}</b> on the same road — tap Endless', vsWin: '🏆 You beat {n}! Send them your score 😎', vsLose: '⚔️ Not yet — {n} still leads with {s}. Try again!', replayNote: '⏪ The last 3 seconds in slow motion — see what got you', bFriends: 'Friends', friendPh: 'Your friend’s name in the game', friendAdd: '+ Add', friendHave: 'Already added', friendMax: '30 friends is enough 😅', friendNone: 'Add your friends’ names exactly as they show in the game and you’ll see everyone’s best run — no minimum score.', friendMissing: 'No Endless run under this name yet: ', streakDay: '🔥 Day {n} in a row!', streakNext: '💎 {n} more days for the AURORA skin', streakAurora: '💎 7 days in a row! The AURORA skin is yours', needStreak: 'Open the game 7 days in a row', tutStart: '🎓 Quick tutorial: tap to flip gravity!', tutDone: '🎓 Tutorial done! Now try Endless 🔥', tutSkip: '🎓 OK — the tutorial is in “How to play” if you want it again', tutBtn: '🎓 Play the tutorial', tutGo: '🎓 Tutorial done! Now the real thing — Endless 🔥', firstScore: 'YOUR FIRST SCORE!', firstScoreSub: 'Now beat it', tapAny: 'tap anywhere', goalStage: '🎯 Next: reach STAGE {n}', goalMis: '🎯 Today\'s mission: {t} ({p}/{q})', newObs: '🆕 That one was new — try again, now you know it', againKnow: 'TRY AGAIN', tmrw: '🌙 Tomorrow: day {n} = <b>+{c}</b> ● · a new Remix road · Weekly challenge until Friday', vsClose: '⚔️ So close! Challenge a friend', vsBest: '⚔️ New best! Challenge a friend', vsBack: '⚔️ Challenge them back', vsCardText: '😤 I got {s} in FLIPPO (stage {st}). The exact same road — can you beat it?', vsCopied: '🔗 Challenge link copied — send it to a friend', vsCopyNote: 'Copy this and send it to a friend — they get the exact same road', vsBanner: '⚔️ <b>{n}</b> challenges you: beat <b>{s}</b> on the same road', vsBannerGo: 'PLAY', vsGap: '⚔️ <b>{d}</b> more to beat {n} ({s})', vsWinLine: '🏆 You beat {n} ({s})! Challenge them back', vsOld: '⚔️ {n}’s Daily road — a challenge run, not counted on today’s board', saveRow: '💾 Your progress', saveOut: 'Copy', saveIn: 'Restore', saveOutTitle: '💾 Your progress code', saveOutNote: 'This is all your progress: your name, coins, skins and stages. Copy it and keep it somewhere safe, or paste it in another browser or in the app.', saveInTitle: '📥 Restore progress', saveInNote: 'Paste your progress code here. ⚠️ It replaces the progress on this device.', saveInBtn: 'Restore', saveBad: 'That is not a progress code', saveInOk: '✓ Your progress is back!', savedBack: '💾 We restored your saved progress', rar_icon: '👑 ICON — Legendary', rar_diamond: '💎 DIAMOND — Super rare', rar_rare: '🔷 RARE', rar_dirt: '🟫 DIRT — Common', ownerT: '♛ Owner panel', oGod: 'Shield mode (no deaths)', oSpeed: 'Game speed', oStart: 'Start Endless at stage', oEnd: 'Watch the ending (COMING SOON)', watch: '▶ Watch', oHit: 'Show hitboxes', oCoins: '+10,000 coins', oMaker: 'Stage Maker', open: 'Open', oNote: 'Runs with any owner power on are not counted and never sent to the world board.', assistNote: '♛ Owner powers on — this run is not counted', needLegendAll: '♛ Legend achievement + every Adventure star', credit: 'Created by Amir', updNew: '⬆ New version available — download', creditLong: 'FLIPPO — idea, design & development by Amir', redeem: '🎁 Code', redeemTitle: 'Gift code', redeemNote: 'Have a special code? Type it here.', redeemOk: '♛ Welcome, owner — everything is unlocked!', redeemBad: 'That code is not valid', redeemNet: 'This code needs internet to activate — connect and try again', redeemWait: 'Checking the code...', redeemGift: '🎁 Unlocked: ', redeemYs: '> ACCESS GRANTED_ Welcome, Youssef — the Y0U55EF skin and MATRIX trail are yours', redeemGh: '∞ Welcome, Ghoneim — the strongest. The GHONEIM ∞ skin and INFINITY trail are yours', redeemBtn: 'Redeem',
      codeImport: 'Import level', codeImportNote: 'Paste a level code here.', importOk: 'Level added: ', importBad: 'Invalid code',
      remix: 'Remix', delConfirm: 'Tap again to delete', customDone: 'Level cleared!', stageLbl: 'Stage ',
      tools: { spike: 'Spike', wallB: 'B wall', wallP: 'P wall', block: 'Block', slab: 'Shelf', catchB: 'B plat', catchP: 'P plat', mover: 'Crusher', laser: 'Laser', pad: 'Jumper', lock: 'Lock', coin: 'Coin', gem: 'Gem', finish: 'Finish', erase: 'Erase', pop: 'Pop', saw: 'Saw', orbit: 'Orbit', pend: 'Swing', lift: 'Lift', crumble: 'Crumble', blink: 'Blink', bumper: 'Bumper', fan: 'Fan', dash: 'Dash', flyIn: 'Fly', flyOut: 'Land', piston: 'Piston', jaws: 'Jaws', geyser: 'Geyser' },
      cats: { danger: 'Danger', platform: 'Platforms', reward: 'Coins' },
      missions: "Today's missions", misDone: 'Mission complete! ', allDone: 'All missions done! Bonus ', lvlUp: 'Level up! LV ', needLvl: 'Unlocks at level ', xp: 'XP'
    }
  };
  // 🎲 build 35: weekly twists, the Daily remix, weekly rank / rewards / last-week card
  Object.assign(T.en, {
    tw_lowgrav: 'FEATHER FALL', twd_lowgrav: 'Low gravity the whole run — every flip floats longer',
    tw_dark: 'DARKNESS', twd_dark: 'The lights are out — you only see the road just ahead',
    tw_burst: 'TURBO BURSTS', twd_burst: 'Two speed bursts in every stage: +30% — hold on',
    tw_mirror: 'MIRROR RUN', twd_mirror: 'The whole road runs right-to-left',
    tw_sawrain: 'SAW RAIN', twd_sawrain: 'Saws in every stage, from the very first one',
    dm_heavy: 'HEAVY DAY', dmd_heavy: 'Heavy gravity the whole run — flips snap fast', dm_tight: 'TIGHT DAY', dmd_tight: 'Obstacles packed close together all run',
    dm_turbo: 'TURBO DAY', dmd_turbo: 'Faster the whole run', dm_storm: 'SPIKE STORM', dmd_storm: 'Zigzags and spike walls in every stage',
    weekTag: 'WEEK {n} · TWIST', weekNo: 'WEEK {n}', dailyTag: 'TODAY\'S REMIX · NEW WORLD ORDER', weekSoon: 'twist from Friday: {t}', weekRank: '#{r} of {n}', weekGap: '{d} to pass {n}', weekFirst: '👑 #1 of {n}',
    weekGhostLead: '👻 Race #1 {n}’s ghost ({s})', weekGhostMe: '👻 Race your best run this week', weekRwGot: '🎁 Weekly reward: <b>{n}</b>',
    weekRes: '🗓 This week: <b>#{r} of {n}</b>', weekResGap: ' · <b>{d}</b> more to pass {n}', weekResNext: '🎁 Reach stage {s} this week: <b>{n}</b>', weekResAll: '🎁 All 3 weekly rewards are yours ✓',
    needWeek: '{t} week: reach stage {s} (back every 5 weeks)', wkTrail: 'trail', wkSkin: 'character', wkShiny: 'shiny character',
    lastTitle: '🗓 Last week', lastRank: 'You finished <b>#{r} of {n}</b>', lastNoRank: 'You played last week’s road', lastStats: '{s} points · stage {st}',
    lastNew: 'New week, new road: <b>{t}</b>', lastGo: '▶ PLAY THE NEW WEEK', lastLater: 'Later', endsIn: 'ends in {t}'
  });
  Object.assign(T.ar, {
    tw_lowgrav: 'ريشة', twd_lowgrav: 'جاذبية خفيفة طول الجولة — كل قلبة بتطوّل في الهوا',
    tw_dark: 'ضلمة', twd_dark: 'النور مقطوع — بتشوف الحتة اللي قدامك بس',
    tw_burst: 'دفعات تيربو', twd_burst: 'دفعتين سرعة في كل مرحلة: +30% — اثبت',
    tw_mirror: 'الطريق المعكوس', twd_mirror: 'الطريق كله ماشي من اليمين للشمال',
    tw_sawrain: 'مطر المناشير', twd_sawrain: 'مناشير في كل مرحلة، من أول مرحلة',
    dm_heavy: 'يوم الجاذبية التقيلة', dmd_heavy: 'جاذبية تقيلة طول الجولة — القلبة بتخبط بسرعة', dm_tight: 'يوم الزحمة', dmd_tight: 'العقبات لازقة في بعض طول الجولة',
    dm_turbo: 'يوم التيربو', dmd_turbo: 'أسرع طول الجولة', dm_storm: 'عاصفة الشوك', dmd_storm: 'زجزاج وحيطان شوك في كل مرحلة',
    weekTag: 'الأسبوع {n} · التويست', weekNo: 'الأسبوع {n}', dailyTag: 'ريمكس النهارده · ترتيب عوالم جديد', weekSoon: 'التويست من الجمعة: {t}', weekRank: '#{r} من {n}', weekGap: 'فاضلك {d} وتعدّي {n}', weekFirst: '👑 الأول من {n}',
    weekGhostLead: '👻 سابق ظل الأول {n} ({s})', weekGhostMe: '👻 سابق أحسن جولة ليك الأسبوع ده', weekRwGot: '🎁 مكافأة الأسبوع: <b>{n}</b>',
    weekRes: '🗓 الأسبوع ده: <b>#{r} من {n}</b>', weekResGap: ' · فاضلك <b>{d}</b> وتعدّي {n}', weekResNext: '🎁 وصّل المرحلة {s} الأسبوع ده: <b>{n}</b>', weekResAll: '🎁 أخدت التلات مكافآت بتوع الأسبوع ✓',
    needWeek: 'أسبوع {t}: وصّل المرحلة {s} (بيرجع كل 5 أسابيع)', wkTrail: 'أثر', wkSkin: 'شخصية', wkShiny: 'شخصية لامعة',
    lastTitle: '🗓 الأسبوع اللي فات', lastRank: 'خلّصت <b>#{r} من {n}</b>', lastNoRank: 'لعبت طريق الأسبوع اللي فات', lastStats: '{s} نقطة · المرحلة {st}',
    lastNew: 'أسبوع جديد وطريق جديد: <b>{t}</b>', lastGo: '▶ العب الأسبوع الجديد', lastLater: 'بعدين', endsIn: 'بيخلص بعد {t}'
  });
  // ⚔️ build 36: the WEEKLY BOSS event (INFINITY VOID vs THE CRIMSON TYRANT)
  Object.assign(T.en, {
    bossCard: 'BOSS', bossName: 'THE CRIMSON TYRANT', bossVs: 'INFINITY VOID vs THE CRIMSON TYRANT', bossLeft: '⏳ {t}', bossNone: '3 hearts, a checkpoint every phase. Flip through seal orbs to strike.',
    bossBestT: '🏆 Best: {t}', bossBestP: '⚔️ Best: {p}% damage', bossWins: '{n}× defeated', bossRwP2: 'PHASE 2', bossRwP3: 'PHASE 3', bossRwWin: 'DEFEAT', bossLocal: 'Boss results are kept on this device',
    bossWinT: 'TYRANT FALLS!', bossLoseT: 'DEFEATED', bossResWin: '⚔️ Defeated in <b>{t}</b>', bossResLose: '⚔️ <b>{p}%</b> damage · phase {ph}/3', bossNewBest: '🏆 New best time this week!',
    bossNewPct: '⚔️ New best damage this week!', bossSkin: '✦ INFINITY VOID unlocked — it is yours, equip it in Characters', needBoss: 'Defeat the Weekly Boss', shopToday: "TODAY'S SHOP · new in {h}h", shopDeal: '-30%', bundle: 'BUNDLE ×3', bundleDone: 'Bundle bought!', needNerve: 'Reach NERVE 40 (NOVA)', needSecs: 'Survive 180 s in Endless', earnSkin: '✦ Earned: {n}', bossHow: 'Flip through glowing seals to strike · a last-moment dodge = COUNTER + time-shield',
    bossCounters: 'counters', bossSeals: 'seals', bossEquip: '✦ INFINITY VOID equipped'
  });
  Object.assign(T.ar, {
    bossCard: 'الزعيم', bossName: 'الطاغية القرمزي', bossVs: 'إنفينيتي ڤويد ضد الطاغية القرمزي', bossLeft: '⏳ {t}', bossNone: '٣ قلوب ونقطة حفظ كل مرحلة. اقلب جوه الأختام المنوّرة عشان تضرب.',
    bossBestT: '🏆 أحسن وقت: {t}', bossBestP: '⚔️ أحسن ضرب: {p}%', bossWins: 'هزمته {n} مرة', bossRwP2: 'المرحلة ٢', bossRwP3: 'المرحلة ٣', bossRwWin: 'اهزمه', bossLocal: 'نتايج الزعيم محفوظة على جهازك بس',
    bossWinT: 'الطاغية وقع!', bossLoseT: 'اتهزمت', bossResWin: '⚔️ هزمته في <b>{t}</b>', bossResLose: '⚔️ ضربته <b>{p}%</b> · المرحلة {ph}/3', bossNewBest: '🏆 أحسن وقت ليك الأسبوع ده!',
    bossNewPct: '⚔️ أحسن ضرب ليك الأسبوع ده!', bossSkin: '✦ إنفينيتي ڤويد بقى بتاعك — لبسه من الشخصيات', needBoss: 'اهزم زعيم الأسبوع', shopToday: 'محل النهارده · يتجدد بعد {h}س', shopDeal: '-30%', bundle: 'بكج ×3', bundleDone: 'اشتريت البكج!', needNerve: 'وصّل NERVE لـ40 (NOVA)', needSecs: 'عيش 180 ثانية في Endless', earnSkin: '✦ كسبت: {n}', bossHow: 'اقلب جوه الأختام المنوّرة عشان تضرب · تفادي في آخر لحظة = ضربة مرتدة + درع زمن',
    bossCounters: 'ضربات مرتدة', bossSeals: 'أختام', bossEquip: '✦ لبست إنفينيتي ڤويد'
  });
  const TW_ICON = { lowgrav: '🪶', dark: '🌑', burst: '⚡', mirror: '🪞', sawrain: '🪚', heavy: '🧲', tight: '🧱', turbo: '🚀', storm: '🌩' };

  const HINTS = {
    ar: {
      tap: 'اضغط في أي مكان لـ<b>قلب الجاذبية</b>',
      spikeF: 'الأشواك الحمراء خطر دائمًا. اقلب <b>قبلها بلحظة</b> لتحصل على PERFECT',
      spikeC: 'أشواك في السقف! اقلب للأسفل <b>قبلها بلحظة</b>',
      trajectory: 'خط العملات يرسم لك <b>مسار القلبة المثالية</b> — اجمعه كاملًا',
      zigzag: 'أشواك متناوبة: اقلب… ثم اقلب من جديد',
      gate: 'كل قلبة تبدّل العالم: <span class="b">أزرق = أرض</span> و<span class="p">بنفسجي = سقف</span>. الجدار الملوّن صلب فقط في عالمه — مرّ وأنت باللون الآخر',
      gatePair: 'جداران بلونين: بدّل العالم بينهما',
      gateSpike: 'اقفز فوق الأشواك ثم <b>اقلب مجددًا</b> قبل الجدار',
      mover: 'الكسّار يتحرك على خط مرسوم — مرّ من <b>الجهة الفارغة</b>',
      fork: 'مفترق! الممر عليه <b>x5</b> خطِر وثمين، والآخر آمن. اختر قبل الحافة',
      catch: 'منصة طور: تحملك فقط وأنت بلونها — <b>لا تقلب فوق الأشواك!</b>',
      lock: 'منطقة قفل: <b>لا قلب</b> بداخلها. اقرأ ما ينتظرك عند الخروج',
      pad: 'لوحة القفز <b style="color:#39ff88">تقلبك تلقائيًا</b> — جهّز قلبة العودة!',
      laser: 'بوابة الليزر تبدّل نصفها بإيقاع ثابت وتومض قبل التبديل — مرّ من <b>النصف المطفأ</b>',
      lift: '<b>مصعد!</b> انزل عليه واركبه فوق الأشواك، واقلب قبل ما يخلص',
      crumble: 'منصة <b>هشّة</b>: تشيلك لحظة وبعدين تتكسر — متطوّلش عليها',
      bumper: '<b>ممر النطّاطات:</b> سيبها ترميك من ناحية لناحية — ومتقلبش!',
      fan: '<b>مروحة:</b> الهوا هيرفعك فوق الأشواك — ثق فيها ومتقلبش',
      dash: '<b>بوابة تسريع!</b> كل حاجة بعدها هتيجي أسرع لشوية',
      pop: 'شوك <b>قافز</b>: بيطلع على إيقاع وبيهتز قبلها — اقرأه، واقلب بس لو لازم',
      saw: '<b>منشار</b> رايح جاي على السطح — راقب مكانه',
      orbit: '<b>كرة دوّارة</b> في النص — وقّت قلبتك عشان تعدّي من الدايرة',
      pend: '<b>بندول</b> بيعدّي فوق الأرض بشعرة — الجري تحته آمن، القفز جنبه خطر',
      blink: 'جسر <b>بيظهر ويختفي</b> — الجواهر للشجعان',
      fly: '<b style="color:#ffb000">طيران!</b> اضغط <b>مطوّل</b> عشان تطلع، وسيب عشان تنزل — عدّي من النفق',
      rift: '<b style="color:#ff5ae0">✦ بوابة سرية!</b> اقلب لفوق وادخلها — عالم مؤقت مليان ذهب. لو وقعت جوه بترجع الجري عادي',
      piston: '<b>المكابس</b> بتخبط وتملا الحارة كلها — خليك في <b>الحارة التانية</b>',
      jaws: '<b>الفكوك</b> بتقفل فوق وتحت بالدور — بص على اللي بيلمع واقلب للناحية الأمان',
      geyser: '<b style="color:#ff8a3a">النافورات</b> بتطلع نار — اقلب فوقها وارجع بين الأشواك',
      firebar: '<b style="color:#ff9a3c">ذراع النار</b> بيلف — عدّي لما يكون بعيد عن حارتك',
      snake: '<b style="color:#27d7ff">الثعبان الكهربا</b> بيتموّج — اتسلّل من المكان اللي الموجة مش فيه',
      meteor: '<b style="color:#ff5a6e">النيازك</b> بتقع من السقف — العمود الأحمر بيحذّرك قبلها',
      bouncer: '<b style="color:#ff5ad1">الكورة الطايشة</b> بتخبط في كل حتة — اتفرّج على اتجاهها وعدّي',
      wind: '<b style="color:#ffc23a">ريح!</b> TAILWIND بتزقك لقدام والضغطات بتيجي أسرع — HEADWIND بتشدك لورا والأشواك أقرب',
      float: '<b style="color:#3fdc7a">FLOAT</b>: جاذبية خفيفة — القلبة بطيئة، <b>اضغط بدري</b>',
      heavy: '<b style="color:#ff6a1a">HEAVY</b>: جاذبية تقيلة — القلبة سريعة جدًا، ضغطات ورا بعض',
      totem: '<b style="color:#7aff6a">التوتم</b> بيقلبك لوحده لما تعدّيه! لو الشوك في الناحية اللي رماك فيها <b>اضغط</b> — لو في اللي سبتها <b>متضغطش</b>'
    },
    en: {
      tap: 'Tap anywhere to <b>flip gravity</b>',
      spikeF: 'Red spikes always hurt. Flip <b>just before</b> them for a PERFECT',
      spikeC: 'Ceiling spikes! Flip down <b>just before</b> them',
      trajectory: 'The coins draw the <b>perfect flip arc</b> — collect them all',
      zigzag: 'Alternating spikes: flip… then flip again',
      gate: 'Every flip swaps the world: <span class="b">blue = floor</span>, <span class="p">purple = ceiling</span>. A coloured wall is solid only in its own colour — pass it in the other one',
      gatePair: 'Two walls, two colours: swap between them',
      gateSpike: 'Hop the spikes, then <b>flip back</b> before the wall',
      mover: 'The crusher follows a drawn track — pass on the <b>empty side</b>',
      fork: 'Fork! The <b>x5</b> lane is risky and rich; the other is safe. Choose before the edge',
      catch: 'Phase platform: it holds you only in its colour — <b>don\'t flip over the spikes!</b>',
      lock: 'Lock zone: <b>no flipping</b> inside. Read what waits at the exit',
      pad: 'Flip pads <b style="color:#39ff88">flip you automatically</b> — be ready to flip back!',
      laser: 'The laser gate swaps halves on a steady beat and flickers first — pass through the <b>dark half</b>',
      lift: '<b>Lift!</b> Drop onto it, ride it over the spikes, flip off before it ends',
      crumble: '<b>Crumbling</b> platform: holds you a moment, then breaks — don\'t linger',
      bumper: '<b>Pinball alley:</b> let the bumpers bounce you through — don\'t flip!',
      fan: '<b>Fan:</b> the wind lifts you over the spikes — trust it, don\'t flip',
      dash: '<b>Dash gate!</b> Everything after it comes faster for a bit',
      pop: '<b>Pop spikes</b> spring out on a beat and shake first — read them, flip only if needed',
      saw: 'A <b>buzzsaw</b> rolls back and forth — watch where it is',
      orbit: '<b>Orbiting ball</b> mid-air — time your flip through the ring',
      pend: '<b>Pendulum</b> skims just over the floor — running under is safe, flipping near it is not',
      blink: 'A bridge that <b>blinks</b> in and out — gems for the brave',
      fly: '<b style="color:#ffb000">FLY!</b> <b>Hold</b> to rise, let go to fall — thread the tunnel',
      rift: '<b style="color:#ff5ae0">✦ SECRET RIFT!</b> Flip up into it — a short bonus world full of gold. Crash inside and you just return to the run',
      piston: '<b>Pistons</b> slam out and fill their whole lane — stay in the <b>other lane</b>',
      jaws: '<b>Jaws</b> slam top and bottom in turn — watch which one glows and flip to the safe side',
      geyser: '<b style="color:#ff8a3a">Geysers</b> erupt fire — flip over each vent, then back between the spikes',
      firebar: 'A <b style="color:#ff9a3c">firebar</b> spins — pass when the arm is away from your lane',
      snake: 'The <b style="color:#27d7ff">electric snake</b> ripples — slip through where the wave isn\'t',
      meteor: '<b style="color:#ff5a6e">Meteors</b> drop from the ceiling — the red column warns you first',
      bouncer: 'The <b style="color:#ff5ad1">bouncer</b> ricochets everywhere — watch where it\'s heading',
      wind: '<b style="color:#ffc23a">Wind!</b> A TAILWIND carries you faster — the taps come quicker. A HEADWIND holds you back — the spikes sit closer',
      float: '<b style="color:#3fdc7a">FLOAT</b>: weak gravity — slow flips, <b>tap early</b>',
      heavy: '<b style="color:#ff6a1a">HEAVY</b>: strong gravity — snappy flips, quick taps',
      totem: 'A <b style="color:#7aff6a">totem</b> flips you by itself! Spikes on the side it throws you to: <b>tap</b>. On the side you left: <b>don\'t</b>'
    }
  };

  const WHY = {
    ar: {
      spike_floor: 'أشواك الأرض — قلبتك جت متأخرة عن آخر لحظة آمنة. القلبة المتأخرة بتجيب NERVE، بس العلامات الخضراء بتوريك آخر لحظة.',
      spike_ceil: 'أشواك السقف — قلبتك للأرض جت متأخرة عن آخر لحظة آمنة.',
      spike_slab: 'أشواك الممر الخطِر — القلبات هنا أقصر، اقلب أبكر بقليل.',
      wall_b: 'الجدار <span style="color:#27d7ff">الأزرق ▼</span> صلب وانت نازل للأرض — اعبره وانت مقلوب للسقف ▲.',
      wall_p: 'الجدار <span style="color:#b45cff">البنفسجي ▲</span> صلب وانت مقلوب للسقف — اعبره وانت نازل للأرض ▼.',
      slab: 'اصطدمت بحافة المفترق — اختر ممرك قبل الوصول إليه.',
      catch: 'اصطدمت بحافة منصة الطور — ادخل تحتها أو فوقها.',
      block: 'اصطدمت بحافة صلبة.',
      mover: 'الكسّار! راقب خط حركته ومرّ من الجهة الفارغة.',
      laser: 'الليزر! يبدّل نصفه بإيقاع ثابت ويومض قبل التبديل — كن على الأرض أو السقف في النصف المطفأ.',
      pop: 'الشوك القافز طلع! بيهتز قبلها بلحظة — لو شفته بيهتز اقلب.',
      saw: 'المنشار! راقب هو رايح فين وعدّي من الناحية التانية.',
      orbit: 'الكرة الدوّارة! وقّت قلبتك لما تكون في الناحية التانية من الدايرة.',
      pend: 'البندول! الجري تحته آمن — القفز وهو نازل خطر.',
      lift: 'خبطت في جنب المصعد — انزل عليه من فوق.',
      crumble: 'خبطت في حافة المنصة الهشّة.',
      blink: 'خبطت في حافة الجسر الوامض.',
      hblock: 'خبطت في جدار النفق — في الطيران: اضغط مطوّل للطلوع وسيب للنزول، وبحركات صغيرة.',
      look_floor: 'خطر على الأرض — قلبتك جت متأخرة عن آخر لحظة آمنة. البلوك والكورة أم شوك والكريستال والجمر بيموّتوا زي الشوك بالظبط.',
      look_ceil: 'خطر في السقف — قلبتك للأرض جت متأخرة عن آخر لحظة آمنة.'
    },
    en: {
      spike_floor: 'Floor spikes — your flip came after the last safe moment. Late flips pay NERVE; the green marks show where late becomes too late.',
      spike_ceil: 'Ceiling spikes — your flip down came after the last safe moment.',
      spike_slab: 'Risk-lane spikes — flips are shorter here, tap a bit earlier.',
      wall_b: 'The <span style="color:#27d7ff">blue ▼</span> wall is solid while your gravity points down — cross it flipped up ▲.',
      wall_p: 'The <span style="color:#b45cff">purple ▲</span> wall is solid while your gravity points up — cross it flipped down ▼.',
      slab: 'You hit the fork edge — pick your lane before it.',
      catch: 'You hit the edge of a phase platform.',
      block: 'You hit a solid edge.',
      mover: 'The crusher! Watch its track and pass on the empty side.',
      laser: 'Laser! It swaps halves on a beat and flickers first — be on the floor or ceiling of the dark half.',
      pop: 'Pop spikes! They shake right before springing out — flip when you see the shake.',
      saw: 'Buzzsaw! Watch which way it rolls and pass on the other side.',
      orbit: 'Orbit ball! Time your flip for when it is on the far side of the ring.',
      pend: 'Pendulum! Running under it is safe — flipping into its swing is not.',
      lift: 'You hit the side of the lift — land on it from above.',
      crumble: 'You hit the edge of a crumbling platform.',
      blink: 'You hit the edge of the blinking bridge.',
      hblock: 'You hit the tunnel wall — while flying: hold to rise, release to fall, in small taps.',
      look_floor: 'Floor hazard — your flip came after the last safe moment. Blocks, maces, crystals and embers kill just like spikes.',
      look_ceil: 'Ceiling hazard — your flip down came after the last safe moment.'
    }
  };

  const ACH = [
    { id: 'first_flip', ar: ['القلبة الأولى', 'أول قلب ناجح'], en: ['First Flip', 'Your first flip'] },
    { id: 'clean_line', ar: ['خط نظيف', 'اجمع خط عملات كاملًا'], en: ['Clean Line', 'Collect a full coin line'] },
    { id: 'perfect_rhythm', ar: ['إيقاع مثالي', '5 قلبات Perfect متتالية — بلا موسيقى!'], en: ['Perfect Rhythm', '5 Perfect flips in a row — no music needed'] },
    { id: 'combo_x3', ar: ['مضاعف ×3', 'اوصل لمضاعف الكومبو الأعلى'], en: ['Combo x3', 'Reach the top multiplier'] },
    { id: 'frenzy', ar: ['فرينزي!', 'فعّل نافذة Frenzy'], en: ['Frenzy!', 'Trigger a Frenzy window'] },
    { id: 'brave_route', ar: ['الطريق الشجاع', 'أتمم ممر المخاطرة دون اصطدام'], en: ['Brave Route', 'Clear a risk lane'] },
    { id: 'shadow_runner', ar: ['عدّاء الظل', 'تفوّق على ظلك في ريمكس اليوم'], en: ['Shadow Runner', 'Beat your Daily ghost'] },
    { id: 'rift_walker', ar: ['عابر البوابات', 'أكمل عالم سري من بوابة ✦'], en: ['Rift Walker', 'Clear a secret ✦ rift world'] },
    { id: 'glitch_hunter', ar: ['صائد الخلل', 'اعثر على البوابة السرية «?»'], en: ['Glitch Hunter', 'Find the secret “?” portal'] },
    { id: 'm1000', ar: ['ألف متر', 'اركض 1000م في جولة واحدة'], en: ['1000 Meters', 'Run 1000m in one go'] },
    // build 35 removed the Challenge Tower, build 36 the 1% challenges: 'master' is now every Adventure Gauntlet without dying (holders keep it)
    { id: 'master', ar: ['سيد التحديات', 'خلّص كل «تحديات» المغامرة بدون ولا موتة'], en: ['Challenge Master', 'Clear every Adventure Gauntlet without dying'] },
    { id: 'maker', ar: ['صانع المراحل', 'احفظ مرحلة من صنعك عدّاها البوت'], en: ['Level Maker', 'Save a level of yours the bot can beat'] },
    { id: 'stage10', ar: ['المرحلة العاشرة', 'اوصل للمرحلة 10 في الجري اللانهائي'], en: ['Stage 10', 'Reach stage 10 in an endless run'] },
    { id: 'adventurer', ar: ['المغامر', 'خلّص عالم المغامرة الأول'], en: ['Adventurer', 'Finish the first Adventure world'] },
    { id: 'flawless', ar: ['بلا خدش', 'خلّص أي «تحدي» آخر عالم بدون ولا موتة'], en: ['Flawless', 'Clear any world Gauntlet with zero deaths'] },
    { id: 'summit', ar: ['على القمة', 'خلّص المرحلة الأخيرة «القمة»'], en: ['On the Summit', 'Clear the final level, The Summit'] },
    // build 36: the Path of the Legend is gone; these four come from the Adventure now (holders keep them)
    { id: 'legend25', ar: ['ربع الطريق', 'اجمع ربع نجوم المغامرة'], en: ['Quarter Way', 'Earn a quarter of all Adventure stars'] },
    { id: 'legend50', ar: ['نص الطريق', 'اجمع نص نجوم المغامرة'], en: ['Halfway', 'Earn half of all Adventure stars'] },
    { id: 'legend75', ar: ['قربت', 'اجمع تلات تربع نجوم المغامرة'], en: ['So Close', 'Earn three quarters of all Adventure stars'] },
    { id: 'legend', ar: ['♛ أسطورة', 'كل نجوم المغامرة + سيد التحديات'], en: ['♛ Legend', 'Every Adventure star + Challenge Master'] },
    { id: 'missions3', ar: ['يوم كامل', 'أنهِ مهام اليوم الثلاث'], en: ['Full Day', 'Finish all three daily missions'] },
    { id: 'lvl10', ar: ['محترف القلب', 'اوصل للمستوى 10'], en: ['Flip Pro', 'Reach level 10'] }
  ];

  // ------------------------------------------------------------------ save
  const KEY = 'flipfrenzy.v1';
  const DEF = {
    best: 0, coins: 0, runs: 0, skin: 'flippo', trail: 'pixel', owned: { flippo: 1 }, ach: {}, seen: {}, tower: {},
    daily: { date: '', best: 0, ghost: null }, totalDist: 0, xp: 0, missions: null, levels: [], bestStage: 1, scores: [], todayScores: { date: '', list: [] }, name: '', camp: {}, legend: null,
    settings: { sfx: 0.8, ui: 0.6, muted: false, amb2: false, vibration: true, reduceFx: false, guides: false, lang: 'en', hand: 'right' }
  };
  function load() {
    let s = null;
    try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) { s = null; }
    s = Object.assign(JSON.parse(JSON.stringify(DEF)), s || {});
    s.settings = Object.assign({}, DEF.settings, s.settings || {});
    // the game is English now: switch everyone over once (Arabic stays available in Settings)
    if (!s.enV1) { s.enV1 = 1; s.settings.lang = 'en'; }
    return s;
  }
  const save = load();
  // a second copy of the save in IndexedDB: if the browser ever wipes localStorage (iPhone after a week away,
  // a cleaner app…), the game restores everything from it on the next start
  const IDB = { db: null, timer: 0 };
  function idb(cb) {
    if (IDB.db) return cb(IDB.db);
    try {
      const r = indexedDB.open('flipnova', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('save');
      r.onsuccess = () => { IDB.db = r.result; cb(IDB.db); };
      r.onerror = () => cb(null);
    } catch (e) { cb(null); }
  }
  function backup() {
    clearTimeout(IDB.timer);
    IDB.timer = setTimeout(() => idb((db) => { try { if (db) db.transaction('save', 'readwrite').objectStore('save').put(JSON.stringify(save), KEY); } catch (e) { /* ok */ } }), 800);
  }
  function restoreBackup(done) {
    let had = false;
    try { had = !!localStorage.getItem(KEY); } catch (e) { had = false; }
    if (had) { backup(); return done(false); }
    idb((db) => {
      if (!db) return done(false);
      try {
        const q = db.transaction('save').objectStore('save').get(KEY);
        q.onsuccess = () => {
          let b = null;
          try { b = JSON.parse(q.result || 'null'); } catch (e) { b = null; }
          if (!b || !(b.runs > 0)) return done(false);
          Object.assign(save, b); save.settings = Object.assign({}, DEF.settings, b.settings || {});
          persist();
          done(true);
        };
        q.onerror = () => done(false);
      } catch (e) { done(false); }
    });
  }
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { /* storage full/blocked: keep playing */ }
    backup();
  }
  // 💾 the whole save as one code: copy it, keep it, paste it in another browser / phone / the app
  const saveSum = (txt) => (FF.hashStr(txt + '|flipnova-save') >>> 0).toString(36);
  function saveCode() {
    const txt = JSON.stringify(save);
    return 'FNSAVE:' + btoa(unescape(encodeURIComponent(JSON.stringify({ v: 1, s: txt, c: saveSum(txt) }))));
  }
  function readSaveCode(code) {
    try {
      const m = String(code || '').trim().match(/FNSAVE:([A-Za-z0-9+/=]+)/);
      if (!m) return null;
      const o = JSON.parse(decodeURIComponent(escape(atob(m[1]))));
      if (!o || o.v !== 1 || saveSum(o.s) !== o.c) return null;
      const d = JSON.parse(o.s);
      return d && typeof d === 'object' ? d : null;
    } catch (e) { return null; }
  }
  FF.save = save;

  const UI = { screen: 'home', game: null, demo: null, lastMode: 'endless', lastOpts: null };
  FF.UI = UI;

  const lang = () => save.settings.lang;
  const t = (k) => T[lang()][k] || k;

  // ------------------------------------------------------------------ helpers
  function sound(n) { FF.audio.play(n); }
  function show(id) {
    $$('.screen').forEach((s) => s.classList.add('hidden'));
    $('#editor').classList.toggle('hidden', id !== 'editor');
    if (id) $('#' + id).classList.remove('hidden');
    UI.screen = id;
    if (id) stageBanner('');
    if (id) { const tb = $('#twistBan'); if (tb) tb.classList.add('hidden'); } // the run's banner never sits over a menu
    $('#pauseBtn').classList.toggle('hidden', !!id || !UI.game);
  }
  // build 35: toasts queue up and show one at a time, in the wall band above the ceiling (top centre),
  // so they never sit on the floor lane, on each other or on the results buttons
  function stageBanner(html) {
    const el = $('#stageName');
    if (!el) return;
    el.innerHTML = html || '';
    el.classList.toggle('hidden', !html || !!UI.screen);
  }
  function toast(html) {
    const box = $('#toasts');
    if (!box) return;
    const d = document.createElement('div');
    d.className = 'toast';
    d.innerHTML = html;
    for (const o of box.children) if (o.innerHTML === d.innerHTML) return; // the same message is already showing / waiting
    while (box.children.length >= 6) box.children[1].remove(); // keep the queue short: drop the oldest waiting one
    box.appendChild(d);
    if (box.children.length === 1) toastRun(d);
  }
  function toastRun(d) {
    const box = $('#toasts');
    if (!d || d.dataset.run) return; // each toast gets one timer
    d.dataset.run = '1';
    const dur = box.children.length > 2 ? 1700 : 2400; // hurry when more are waiting
    d.style.setProperty('--tdur', dur + 'ms');
    setTimeout(() => { d.remove(); if (box.firstElementChild) toastRun(box.firstElementChild); }, dur + 60);
  }
  let hintTimer = 0;
  function hint(key) {
    UI.hintAt = performance.now();
    const el = $('#hint');
    el.innerHTML = HINTS[lang()][key] || '';
    el.classList.remove('hidden');
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => el.classList.add('hidden'), key === 'gate' ? 5200 : 3400);
  }
  function hideHint() { clearTimeout(hintTimer); $('#hint').classList.add('hidden'); }

  function unlockAch(id) {
    if (save.ach[id]) return;
    if (UI.game && UI.game.opts && UI.game.opts.tutorial) return;
    save.ach[id] = Date.now();
    persist();
    const a = ACH.find((x) => x.id === id);
    if (a) toast(t('ach_unlocked') + '<b>' + a[lang()][0] + '</b>');
    for (const s of FF.SKINS) if (s.unlock === id) toast(t('unlocked') + '<b>' + s.name + '</b>');
    for (const tr of FF.TRAILS) if (tr.unlock === id) toast(t('unlocked') + '<b>' + tr.name + '</b>');
  }

  function applyLang() {
    document.documentElement.lang = lang();
    document.documentElement.dir = lang() === 'ar' ? 'rtl' : 'ltr';
    $$('[data-t]').forEach((el) => { el.textContent = t(el.getAttribute('data-t')); });
    const lb = $('#langBtn');
    if (lb) lb.textContent = lang() === 'ar' ? 'EN' : 'ع'; // shows the language you'd switch TO
    refreshHome();
  }

  // old copies can't update themselves: tell the player when a newer build is out and where to get it
  async function checkUpdate() {
    let m = null;
    try { m = await FF.Online.checkUpdate(); } catch (e) { return; }
    const b = $('#updBtn');
    if (!m || !b) return;
    b.querySelector('small').textContent = m.note ? String(m.note).slice(0, 80) : '';
    b.onclick = () => {
      if (window.AndroidBridge && window.AndroidBridge.openUrl) window.AndroidBridge.openUrl(m.url);
      else window.open(m.url, '_blank', 'noopener');
    };
    b.classList.remove('hidden');
  }

  // the Challenge Tower was removed in build 35. save.tower stays in the save untouched: its old stars still count for SIR FLIP
  function towerStarsTotal() {
    return Object.values(save.tower || {}).reduce((a, b) => a + (+b || 0), 0);
  }

  function refreshHome() {
    $('#home').classList.toggle('newbie', (save.runs || 0) < 5 && (save.bestStage || 1) < 3); // build 33: fewer choices until stage 3
    $('#homeBest').textContent = save.best ? '★ \u2066' + save.best + '\u2069' + (save.bestStage > 1 ? ' · ' + t('stageLbl') + save.bestStage : '') : '';
    $('#homeCoins').textContent = save.coins;
    // ⚔️ who challenged you, and what to beat — one tap plays the same road
    $('#vsBanner').classList.toggle('hidden', !UI.vs || !!FF.MAKER_APP);
    if (UI.vs) $('#vsBannerT').innerHTML = t('vsBanner').replace('{n}', UI.vs.name).replace('{s}', UI.vs.score);
    { const n = (save.streak && save.streak.n) || 0; $('#streakN').textContent = n; $('#streakChip').classList.toggle('hidden', n < 2); }
    $('.legendChip').classList.toggle('hidden', !isLegend());
    $('#home').classList.toggle('legendary', isLegend());
    $('#campStars').textContent = '★ ' + campStars() + '/' + FF.CAMPAIGN.list.length * 3;
    const today = FF.todayKey();
    { const rx = FF.dailyRemix(FF.hashStr('daily-' + today)); // 🎲 today's remix shows on the button
      if ($('#dailyBest')) $('#dailyBest').textContent = (save.daily.date === today && save.daily.best ? '★ ' + save.daily.best + (rx ? ' · ' : '') : rx ? '' : t('dailyNew')) + (rx ? TW_ICON[rx.mod] + ' ' + t('dm_' + rx.mod) : ''); }
    weekCard();
    bossCard();
    // b66: the weekly RUN is gone (the Weekly Boss is the weekly challenge): no week-board fetch, no last-week card
    const lv = levelInfo();
    $('#lvlTxt').textContent = 'LV ' + lv.level;
    $('#lvlBar').style.width = Math.round(lv.frac * 100) + '%';
    $('#misDot').classList.toggle('hidden', missions().list.every((m) => m.done));
    $('#pauseBtn').classList.toggle('left-hand', save.settings.hand === 'left');
  }

  // ------------------------------------------------------------------ build 36: The Legend and the 1% challenges are gone
  // Their data stays in the save untouched (save.legend, save.viral). The achievements that came from them are earned
  // in the Adventure now (whoever already has one keeps it):
  //   Quarter Way / Halfway / So Close = 25% / 50% / 75% of every Adventure star,
  //   Challenge Master = every world Gauntlet cleared without dying, ♛ Legend = every Adventure star + Challenge Master.
  function gauntletsFlawless() { return FF.CAMPAIGN.list.filter((l) => l.gauntlet).every((l) => (save.camp[l.id] || {}).deaths === 0 && (save.camp[l.id] || {}).cleared); }
  function legacyAch() {
    if (FF.MAKER_APP) return;
    const all = FF.CAMPAIGN.list.length * 3, st = campStars();
    if (st >= Math.ceil(all * 0.25)) unlockAch('legend25');
    if (st >= Math.ceil(all * 0.5)) unlockAch('legend50');
    if (st >= Math.ceil(all * 0.75)) unlockAch('legend75');
    if (gauntletsFlawless()) unlockAch('master');
    if (st >= all && save.ach.master) unlockAch('legend');
  }
  const isLegend = () => !!((save.legend && save.legend.done) || save.ach.legend); // the ♛ next to your own name

  // ------------------------------------------------------------------ Adventure
  function campStars() { return Object.values(save.camp).reduce((a, r) => a + (r.stars || 0), 0); }
  function campUnlocked(i) {
    const lv = FF.CAMPAIGN.list[i], w = lv && FF.CAMPAIGN.worlds[lv.wi];
    if (w && w.free && lv.li === 0) return true; // (b55: a world marked free opens on its own — NOVA RUSH)
    return i === 0 || !!save.owner || !!(save.camp[FF.CAMPAIGN.list[i - 1].id] || {}).cleared;
  }
  function starsHtml(n) { return [1, 2, 3].map((i) => '<span class="' + (i <= n ? 'on' : '') + '">★</span>').join(''); }
  function worldThumb(wid) {
    const w = FF.worldById(wid);
    const cv = FF.makeCanvas(88, 50);
    const g = cv.getContext('2d');
    g.drawImage(w.far, 40, 100, 88, 50, 0, 0, 88, 50);
    g.drawImage(w.mid, 40, 100, 88, 50, 0, 0, 88, 50);
    g.drawImage(w.floorTile, 0, 0, 32, 12, 0, 40, 32, 12);
    g.drawImage(w.floorTile, 0, 0, 32, 12, 32, 40, 32, 12);
    g.drawImage(w.floorTile, 0, 0, 32, 12, 64, 40, 32, 12);
    return cv;
  }
  function renderCamp() {
    const list = $('#campList');
    list.innerHTML = '';
    $('#campTotal').textContent = '★ ' + campStars() + '/' + FF.CAMPAIGN.list.length * 3;
    const all = FF.CAMPAIGN.list;
    let nextMarked = false;
    FF.CAMPAIGN.worlds.forEach((w, wi) => {
      const row = document.createElement('div');
      const levels = all.filter((l) => l.wi === wi);
      const firstIdx = all.indexOf(levels[0]);
      row.className = 'wrow' + (campUnlocked(firstIdx) ? '' : ' locked');
      const th = worldThumb(w.world);
      th.className = 'wthumb';
      row.appendChild(th);
      const info = document.createElement('div');
      info.className = 'winfo';
      const ws = levels.reduce((a, l) => a + ((save.camp[l.id] || {}).stars || 0), 0);
      info.innerHTML = '<b></b><small>★ ' + ws + '/15</small>';
      info.querySelector('b').textContent = (wi + 1) + '. ' + (lang() === 'ar' ? w.ar : w.en);
      row.appendChild(info);
      const tiles = document.createElement('div');
      tiles.className = 'tiles';
      levels.forEach((lv) => {
        const i = all.indexOf(lv);
        const rec = save.camp[lv.id] || {};
        const open = campUnlocked(i);
        const b = document.createElement('button');
        b.className = 'tile' + (lv.gauntlet ? ' g' : '') + (rec.cleared ? ' done' : '') + (open ? '' : ' lock');
        if (open && !rec.cleared && !nextMarked) { b.classList.add('next'); nextMarked = true; }
        b.innerHTML = '<span>' + (open ? (lv.gauntlet ? '♛' : '') + lv.label : '🔒') + '</span><span class="st">' + starsHtml(rec.stars || 0) + '</span>';
        b.title = lang() === 'ar' ? lv.ar : lv.en;
        b.onclick = () => { if (!open) { sound('uiBack'); return; } startGame('campaign', { level: lv }); };
        tiles.appendChild(b);
      });
      row.appendChild(tiles);
      list.appendChild(row);
    });
    const nx = list.querySelector('.tile.next');
    if (nx) setTimeout(() => nx.scrollIntoView({ block: 'center' }), 50);
  }
  function campaignResult(res) {
    const lv = res.level;
    const rec = save.camp[lv.id] || (save.camp[lv.id] = {});
    const stars = 1 + (res.coinsTaken >= res.coinTotal ? 1 : 0) + (res.deaths === 0 ? 1 : 0);
    let reward = 0;
    if (!rec.cleared) { reward += 25 + lv.wi * 10; setTimeout(() => toast(t('firstClear') + '<b>' + (25 + lv.wi * 10) + '</b>'), 600); }
    const newStars = Math.max(0, stars - (rec.stars || 0));
    if (newStars && rec.cleared) { reward += newStars * 10; setTimeout(() => toast(t('starBonus') + '<b>' + newStars * 10 + '</b>'), 900); }
    else if (newStars) reward += newStars * 10;
    save.coins += reward;
    rec.cleared = true;
    rec.stars = Math.max(rec.stars || 0, stars);
    rec.deaths = rec.deaths === undefined ? res.deaths : Math.min(rec.deaths, res.deaths);
    rec.time = rec.time ? Math.min(rec.time, res.time) : res.time;
    if (lv.id === 'c1-5') unlockAch('adventurer');
    if (lv.gauntlet && res.deaths === 0) unlockAch('flawless');
    if (lv.id === 'c9-5') unlockAch('summit');
    setTimeout(legacyAch, 1600);
    return stars;
  }

  // ------------------------------------------------------------------ scoreboard (on this device)
  function playerName() { return save.name || (lang() === 'ar' ? 'فليبو' : 'FLIPPO'); }
  function recordScore(res) {
    if (res.mode !== 'endless' && res.mode !== 'daily') return -1;
    const entry = { s: res.score, d: res.dist, st: res.stage || 1, skin: save.skin, t: Date.now(), name: playerName(), id: Math.random().toString(36).slice(2) };
    const today = FF.todayKey();
    if (save.todayScores.date !== today) save.todayScores = { date: today, list: [] };
    save.todayScores.list.push(entry);
    save.todayScores.list.sort((a, b) => b.s - a.s);
    save.todayScores.list = save.todayScores.list.slice(0, 15);
    if (res.mode === 'endless') {
      save.scores.push(entry);
      save.scores.sort((a, b) => b.s - a.s);
      save.scores = save.scores.slice(0, 20);
    }
    res.entryId = entry.id;
    const list = res.mode === 'endless' ? save.scores : save.todayScores.list;
    return list.findIndex((e) => e.id === entry.id);
  }
  function skinIcon(id) {
    const cv = FF.makeCanvas(20, 22);
    FF.drawFlippo(cv.getContext('2d'), 4, 6, { skin: id, face: 'run', foot: 0 });
    return cv;
  }
  function boardRows(el, list, meId, max) {
    el.innerHTML = '';
    if (!list.length) { el.innerHTML = '<p class="note">' + t('noScores') + '</p>'; return; }
    const meIdx = list.findIndex((e) => e.id === meId);
    let rows = list.slice(0, max);
    if (meIdx >= max) rows = rows.slice(0, max - 1).concat([list[meIdx]]);
    for (const e of rows) {
      const i = list.indexOf(e);
      const r = document.createElement('div');
      r.className = 'brow' + (i < 3 ? ' top' + (i + 1) : '') + (e.id === meId ? ' me' : '');
      const rk = document.createElement('span');
      rk.className = 'rk';
      rk.textContent = i < 3 ? ['①', '②', '③'][i] : '#' + (i + 1);
      r.appendChild(rk);
      r.appendChild(skinIcon(e.skin || 'flippo'));
      const nm = document.createElement('span');
      nm.className = 'nm';
      nm.textContent = (e.pre !== undefined ? e.pre : isLegend() || save.owner ? '♛ ' : '') + (e.name || playerName());
      const sm = document.createElement('small');
      sm.textContent = e.sub || e.d + (lang() === 'ar' ? 'م · ' : 'm · ') + t('stageLbl') + (e.st || 1);
      nm.appendChild(sm);
      r.appendChild(nm);
      const sc = document.createElement('b');
      sc.textContent = e.val !== undefined ? e.val : e.s;
      r.appendChild(sc);
      el.appendChild(r);
    }
  }
  let boardTab = 'world';
  const fmtTime = (sec) => Math.floor(sec / 60) + ':' + String(Math.floor(sec % 60)).padStart(2, '0');
  // ------------------------------------------------------------------ 🗓 weekly challenge
  // One Endless seed for the whole week (FF.weekInfo). Runs on it are normal Endless runs, so the world board's
  // existing rows already hold them: the Week board is those rows, filtered here by seed and date. Nothing new on the server.
  // Build 35: the week's road has a TWIST (FF.weekTwist, from the seed), a ghost (the week's #1 replayed from the
  // proof stored with their verified run, or your own best), a real rank, and cosmetic rewards for stages 3 / 6 / 10.
  function weekSave() {
    const w = FF.weekInfo();
    if (!save.weekly || save.weekly.key !== w.key) {
      const o = save.weekly;
      // 🗓 a new week: remember how the last one went, for the "last week you finished #12" card
      if (o && o.key && o.key < w.key && o.best > 0) save.weekLast = { key: o.key, best: o.best, stage: o.stage || 1, rank: o.rank || 0, of: o.of || 0, shown: 0 };
      save.weekly = { key: w.key, best: 0, dist: 0, stage: 1, tries: 0, x: 0, rival: null, proof: '' };
    }
    return save.weekly;
  }
  // Arabic counts read as words ("يومين و3 ساعات"); English stays compact ("2d 3h")
  function arCount(n, one, two, few, many) { return n === 1 ? one : n === 2 ? two : n <= 10 ? n + ' ' + few : n + ' ' + many; }
  function fmtLeft(ms) {
    const m = Math.max(1, Math.floor(ms / 60000)), d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60;
    if (lang() === 'ar') {
      const D = (n) => arCount(n, 'يوم', 'يومين', 'أيام', 'يوم'), Hh = (n) => arCount(n, 'ساعة', 'ساعتين', 'ساعات', 'ساعة'), M = (n) => arCount(n, 'دقيقة', 'دقيقتين', 'دقايق', 'دقيقة');
      return d ? D(d) + (h ? ' و' + Hh(h) : '') : h ? Hh(h) + (mm ? ' و' + M(mm) : '') : M(m);
    }
    return '\u2066' + (d ? d + t('dD') + ' ' + h + t('dH') : h ? h + t('dH') + ' ' + mm + t('dM') : m + t('dM')) + '\u2069';
  }
  UI.fmtLeft = fmtLeft;
  function weekStatText() {
    const w = FF.weekInfo(), ws = weekSave();
    return (ws.best ? '★ ' + ws.best + ' · ' : '') + t('weekLeft').replace('{t}', fmtLeft(w.left));
  }
  const isWeekRun = (res) => res.mode === 'endless' && res.seed === FF.weekInfo().seed && !res.replay;
  // the ISO week number people know ("WEEK 45"): the Monday inside this Friday-to-Friday week
  const weekNum = (key) => { const d = new Date(Date.parse(key + 'T00:00:00Z') + 3 * 86400000); const th = new Date(d.getTime() + (3 - ((d.getUTCDay() + 6) % 7)) * 86400000); const y0 = Date.UTC(th.getUTCFullYear(), 0, 1); return 1 + Math.floor((th.getTime() - y0) / 604800000); };
  const WEEK_STEPS = [3, 6, 10];
  const weekItem = (th, step) => { const G = FF.weekGear(th); return step === 3 ? G.trail : step === 6 ? G.skin : G.shiny; };
  const weekItemName = (th, step) => { const it = weekItem(th, step); return it.name + ' ' + t(step === 3 ? 'wkTrail' : step === 6 ? 'wkSkin' : 'wkShiny'); };
  function weekRewards(res) {
    const th = FF.weekTheme(FF.weekInfo().key);
    save.wkr = save.wkr || {};
    let d = 2400;
    for (const st of WEEK_STEPS) {
      const it = weekItem(th, st);
      if ((res.stage || 1) >= st && !save.wkr[it.id]) {
        save.wkr[it.id] = FF.weekInfo().key;
        res.weekGot = (res.weekGot || []).concat([it.id]);
        setTimeout(() => { toast(t('weekRwGot').replace('{n}', weekItemName(th, st))); sound('record'); }, (d += 900));
      }
    }
  }
  function weekEnd(res) {
    if (!isWeekRun(res) || res.assist || res.comingSoon) return false;
    const ws = weekSave();
    ws.tries++;
    UI.weekAt = 0; // the home card re-reads the week board after every weekly run
    weekRewards(res);
    if (ws.rival && res.dist * 10 > ws.rival.x) setTimeout(() => toast(t('weekPassed').replace('{n}', ws.rival.name)), 2600);
    if (res.score <= ws.best) return false;
    Object.assign(ws, { best: res.score, dist: res.dist, stage: res.stage || 1, x: res.dist * 10 });
    if (res.ghostRec && res.ghostRec.length) ws.ghost = res.ghostRec; // 👻 your best this week races you next time
    if (ws.rival && res.score > ws.rival.s) ws.rival = null; // beaten: the next one shows when the Week board loads
    if (UI.weekList) weekRank(UI.weekList); // the rank moves right away (from the rows already verified)
    setTimeout(() => toast(t('weekNew')), 2000);
    return true;
  }
  // a week's verified runs (read only, from the rows the world board already has). w = FF.weekInfo(...) of that week
  async function loadWeek(w) {
    const rows = await FF.Online.weekTop(w.start);
    const list = [], seen = {};
    let n = 0;
    for (const r of rows) {
      const tm = Date.parse(r.created_at || '');
      if (tm && (tm < w.start || tm >= w.end)) continue;
      const pr = FF.Online.decodeRun(r.proof);
      if (!pr || pr.seed !== w.seed) continue; // only runs on that week's road (a twist week's road replays with its twist)
      const k = r.device || FF.Online.key(r.name);
      if (seen[k] || seen[FF.Online.key(r.name)]) continue;
      if ((++n & 3) === 0) await new Promise((ok) => setTimeout(ok, 0)); // keep the screen responsive while replaying
      if (!FF.Online.verifyEntry(r)) continue;
      seen[k] = 1; seen[FF.Online.key(r.name)] = 1;
      list.push({ id: 'dev:' + (r.device || r.id), name: r.name, skin: r.skin, s: r.score, d: r.dist, st: r.stage, pre: '✓ ', proof: r.proof });
    }
    return list;
  }
  // my place in the verified list: "#7 of 43", how many points to pass the one above, the rival flag and the #1 ghost
  function weekRank(rows) {
    const ws = weekSave(), myDev = FF.Online.deviceId();
    const list = rows.map((e) => Object.assign({}, e));
    if (ws.best) {
      const mine = { id: 'dev:' + myDev, name: playerName() + t('weekLocal'), skin: save.skin, s: ws.best, d: ws.dist, st: ws.stage, pre: '' };
      const i = list.findIndex((e) => e.id === mine.id);
      if (i < 0) list.push(mine);
      else if (list[i].s < mine.s) list[i] = mine;
      list.sort((a, b) => b.s - a.s);
    }
    const myI = list.findIndex((e) => e.id === 'dev:' + myDev);
    const above = myI > 0 ? list[myI - 1] : myI < 0 ? list[list.length - 1] : null;
    ws.rival = above ? { name: String(above.name).slice(0, 14), s: above.s, x: (above.d || 0) * 10 } : null;
    ws.rank = myI >= 0 ? myI + 1 : 0;
    ws.of = list.length;
    ws.gap = above && myI >= 0 ? above.s - ws.best + 1 : 0;
    const top = list[0];
    ws.lead = top && top.id !== 'dev:' + myDev && top.proof ? { name: String(top.name).slice(0, 14), s: top.s, proof: top.proof } : null;
    persist();
    return { list, myI };
  }
  // the home card fetches the week quietly (at most every 90 s)
  async function weekRefresh(force) {
    if (window.FF_LINK || !FF.Online.enabled() || UI.weekBusy) return;
    if (!force && UI.weekAt && Date.now() - UI.weekAt < 90000) return;
    UI.weekBusy = true;
    const w = FF.weekInfo();
    try {
      const list = await loadWeek(w);
      if (FF.weekInfo().key === w.key) { UI.weekList = list; UI.weekAt = Date.now(); weekRank(list); if (UI.screen === 'home') weekCard(); }
    } catch (e) { UI.weekAt = Date.now(); } finally { UI.weekBusy = false; }
  }
  // 🗓 the home card: the week's twist, a live countdown (red in the last 24 h), my rank, the reward ladder
  function weekCard() {
    if (!$('#weekStat')) { weekSave(); return; } // build 37: the boss card replaced the weekly-run card (the week still rolls over: last week's card)
    const w = FF.weekInfo(), ws = weekSave(), tw = FF.weekTwistOf(w.key), th = FF.weekTheme(w.key);
    const nextTw = FF.weekTwistOf(FF.weekInfo(w.end + 3600000).key);
    $('#weekTwist').textContent = tw ? TW_ICON[tw] + ' ' + t('tw_' + tw) : nextTw ? t('weekSoon').replace('{t}', TW_ICON[nextTw] + ' ' + t('tw_' + nextTw)) : '';
    $('#weekStat').textContent = '⏳ ' + fmtLeft(w.left);
    $('#weekStat').classList.toggle('urgent', w.left < 86400000);
    const bits = [];
    if (ws.rank && ws.of) bits.push(ws.rank === 1 ? t('weekFirst').replace('{n}', ws.of) : t('weekRank').replace('{r}', ws.rank).replace('{n}', ws.of) + (ws.gap > 0 && ws.rival ? ' · ' + t('weekGap').replace('{d}', ws.gap).replace('{n}', ws.rival.name) : ''));
    else if (ws.best) bits.push('★ ' + ws.best);
    else if (tw) bits.push(t('twd_' + tw));
    const pips = WEEK_STEPS.map((st) => (save.wkr && save.wkr[weekItem(th, st).id] ? st + '✓' : String(st))).join(' ');
    bits.push('🎁 ' + FF.WEEK_GEAR[th].name + ' ' + pips);
    $('#weekRank').textContent = bits.join(' · ');
    // build 36: the event card shows this week's top prize (the shiny character for stage 10)
    const art = $('#evArt'), prize = weekItem(th, 10);
    if (art && prize && art.dataset.id !== prize.id) {
      art.dataset.id = prize.id;
      const g = art.getContext('2d');
      g.clearRect(0, 0, art.width, art.height);
      FF.drawFlippo(g, 4, 6, { skin: prize, face: save.wkr && save.wkr[prize.id] ? 'joy' : 'run', foot: 0, t: 0.5 });
    }
  }
  UI.weekCard = weekCard;
  // ⚔️ WEEKLY BOSS: results live on this device (the world board only holds Endless/Daily replay proofs), keyed by the week
  function bossSave() {
    const bw = FF.bossWeek();
    if (!save.boss || save.boss.key !== bw.key) save.boss = { key: bw.key, best: 0, pct: 0, tries: 0, wins: 0 };
    return save.boss;
  }
  UI.bossSave = bossSave;
  function bossCard() {
    const el = $('#bossStat');
    if (!el) return;
    const bw = FF.bossWeek(), b = bossSave();
    $('#bossLeft').textContent = t('bossLeft').replace('{t}', fmtLeft(bw.left));
    $('#bossLeft').classList.toggle('urgent', bw.left < 86400000);
    el.textContent = b.best ? t('bossBestT').replace('{t}', FF.fmtBossTime(b.best)) + ' · ' + t('bossWins').replace('{n}', b.wins) : b.pct ? t('bossBestP').replace('{p}', b.pct) : t('bossNone');
    // build 37: the boss duel IS the weekly challenge — its week number and this week's reward ladder live on the card
    const wk = $('#bossWeek'); if (wk) wk.textContent = t('weekNo').replace('{n}', weekNum(bw.key));
    const rw = $('#bossRw');
    if (rw) {
      const th = FF.weekTheme(FF.weekInfo().key), got = (st) => save.wkr && save.wkr[weekItem(th, st).id];
      rw.textContent = '🎁 ' + FF.WEEK_GEAR[th].name + ' ' + BOSS_STEPS.map((b2) => t(b2.k) + (got(b2.st) ? '✓' : '')).join(' · ');
    }
    bossArtStart();
  }
  // the week's gear, earned in the duel: reach phase 2 → trail, reach phase 3 → character, defeat the Tyrant → shiny
  const BOSS_STEPS = [{ st: 3, k: 'bossRwP2', ok: (r) => r.phase >= 2 || r.win }, { st: 6, k: 'bossRwP3', ok: (r) => r.phase >= 3 || r.win }, { st: 10, k: 'bossRwWin', ok: (r) => r.win }];
  function bossRewards(res) {
    const th = FF.weekTheme(FF.weekInfo().key), r = res.boss;
    save.wkr = save.wkr || {};
    let d = 2400;
    for (const b2 of BOSS_STEPS) {
      const it = weekItem(th, b2.st);
      if (b2.ok(r) && !save.wkr[it.id]) {
        save.wkr[it.id] = FF.weekInfo().key;
        res.weekGot = (res.weekGot || []).concat([it.id]);
        setTimeout(() => { toast(t('weekRwGot').replace('{n}', weekItemName(th, b2.st))); sound('record'); }, (d += 900));
      }
    }
  }
  // the Tyrant peeks out of the card: drawn at ~15 fps while the home is open (cheap: one small canvas)
  function bossArtStart() {
    if (UI.bossArtTimer || !FF.drawTyrantArt) return;
    UI.bossArtTimer = setInterval(() => {
      const cv = $('#bossArt');
      if (!cv || UI.screen !== 'home' || document.hidden) return;
      FF.drawTyrantArt(cv.getContext('2d'), performance.now() / 1000);
    }, 66);
  }
  UI.bossCard = bossCard;
  UI.whyText = (L, cause) => (WHY[L] || {})[cause] || ''; // b66: tools/death-tip-test.js checks every death has a tip
  function bossEnd(res) {
    if (res.replay || !res.boss) return;
    const b = bossSave(), r = res.boss;
    b.tries++;
    bossRewards(res);
    save.bossIntro = 1; // the long entrance plays once; after that it is short and a tap skips it
    res.bossNew = '';
    if (r.win) {
      b.wins++;
      const tm = Math.round(r.time * 10) / 10;
      if (!b.best || tm < b.best) { b.best = tm; res.bossNew = 'bossNewBest'; }
      b.pct = 100;
      save.bossWins = (save.bossWins || 0) + 1;
      if (!save.bossBest || tm < save.bossBest) save.bossBest = tm;
      if (!save.bossWin) { save.bossWin = 1; save.owned.ivoid = 1; res.bossUnlocked = true; setTimeout(() => { toast(t('bossSkin')); sound('unlock'); }, 1000); }
    } else if (r.pct > b.pct) { b.pct = r.pct; res.bossNew = 'bossNewPct'; }
  }
  // the run's opening banner (DOM, so Arabic reads right): the weekly twist or the Daily remix, and who your ghost is
  function twistBanner(g, opts) {
    const el = $('#twistBan');
    if (!el || !g || g.replay || opts.tutorial) return;
    let tag = '', id = '', name = '', desc = '', sub = '';
    if (g.twist && g.weekRun) { const k = FF.weekKeyOfSeed(g.seed); tag = t('weekTag').replace('{n}', weekNum(k)); id = g.twist; name = t('tw_' + id); desc = t('twd_' + id); }
    else if (g.remix) { tag = t('dailyTag'); id = g.remix.mod; name = t('dm_' + id); desc = t('dmd_' + id); }
    else if (g.weekRun) { const w = FF.weekInfo(), nx = FF.weekTwistOf(FF.weekInfo(w.end + 3600000).key); tag = t('weekNo').replace('{n}', weekNum(w.key)); name = t('weekly'); desc = nx ? t('weekSoon').replace('{t}', t('tw_' + nx)) : ''; }
    else return;
    if (g.weekRun && opts.ghost) sub = opts.ghostName ? t('weekGhostLead').replace('{n}', opts.ghostLead).replace('{s}', opts.ghostS) : t('weekGhostMe');
    el.innerHTML = '<small></small><b></b><span></span>' + (sub ? '<i></i>' : '');
    el.querySelector('small').textContent = tag;
    el.querySelector('b').textContent = (TW_ICON[id] ? TW_ICON[id] + ' ' : '') + name;
    el.querySelector('span').textContent = desc;
    if (sub) el.querySelector('i').textContent = sub;
    el.classList.remove('hidden', 'go');
    void el.offsetWidth; // restart the pop-in animation
    el.classList.add('go');
    clearTimeout(UI.banT);
    UI.banT = setTimeout(() => el.classList.add('hidden'), UI.banSeen === id ? 2200 : 3600);
    UI.banSeen = id;
  }
  // 👻 the week's #1 replayed from their verified proof (cached: one replay per proof)
  function leadGhost(lead) {
    const k = FF.hashStr(lead.proof);
    if (UI.leadG && UI.leadG.k === k) return UI.leadG.g;
    let g = null;
    try { g = FF.Online.ghostOf(lead.proof); } catch (e) { g = null; }
    UI.leadG = { k, g };
    return g;
  }
  // the results: where this run leaves you this week, and the next weekly reward
  function weekResLine(res) {
    if (!res.weekRun || !isWeekRun(res) || res.assist) return '';
    const ws = weekSave(), th = FF.weekTheme(ws.key), out = [];
    if (ws.rank && ws.of) out.push(t('weekRes').replace('{r}', ws.rank).replace('{n}', ws.of) + (ws.gap > 0 && ws.rival ? t('weekResGap').replace('{d}', ws.gap).replace('{n}', ws.rival.name) : ''));
    const next = WEEK_STEPS.find((st) => !(save.wkr && save.wkr[weekItem(th, st).id]));
    out.push(next ? t('weekResNext').replace('{s}', next).replace('{n}', weekItemName(th, next)) : t('weekResAll'));
    return out.join('<br>');
  }
  // 🗓 first open of a new week: "last week you finished #12 of 80" (rank from the real board when it loads)
  async function lastWeekCard() {
    const L = save.weekLast;
    if (!L || L.shown || UI.screen !== 'home' || needsTutorial() || UI.vs) return;
    L.shown = 1;
    persist();
    const el = $('#weekLast');
    const fill = () => {
      const tw = FF.weekTwistOf(FF.weekInfo().key) || FF.weekTheme(FF.weekInfo().key);
      el.querySelector('.wlT').textContent = t('lastTitle') + ' · ' + 'W' + weekNum(L.key);
      el.querySelector('.wlR').innerHTML = L.rank && L.of ? t('lastRank').replace('{r}', L.rank).replace('{n}', L.of) : t('lastNoRank');
      el.querySelector('.wlS').textContent = t('lastStats').replace('{s}', L.best).replace('{st}', L.stage);
      el.querySelector('.wlN').innerHTML = t('lastNew').replace('{t}', TW_ICON[tw] + ' ' + t('tw_' + tw));
      el.querySelector('[data-act=weekLastGo]').textContent = t('lastGo');
      el.querySelector('[data-act=weekLastClose]').textContent = t('lastLater');
    };
    fill();
    el.classList.remove('hidden');
    sound('record');
    const cur = FF.weekInfo(), prev = FF.weekInfo(cur.start - 86400000);
    if (prev.key !== L.key || window.FF_LINK || !FF.Online.enabled()) return;
    try {
      const list = await loadWeek(prev), myDev = FF.Online.deviceId();
      const others = list.filter((e) => e.id !== 'dev:' + myDev);
      if (!list.length) return; // nobody on that board: the last rank this device saw stays
      L.rank = others.filter((e) => e.s > L.best).length + 1;
      L.of = others.length + 1;
      persist();
      if (!el.classList.contains('hidden')) fill();
    } catch (e) { /* offline: the last rank this device saw stays */ }
  }
  UI.weekSave = weekSave;
  // world boards: fetch, then re-play every entry here and show only the ones that reproduce
  let boardReq = 0;
  async function renderOnline(el, board) {
    const req = ++boardReq;
    const st = $('#boardStatus');
    el.innerHTML = '';
    if (window.FF_LINK) { st.textContent = t('onLink'); return; } // the instant web link can't reach servers
    if (!FF.Online.enabled()) { st.textContent = t('onOff'); return; }
    st.textContent = t('onLoad');
    let rows;
    try { rows = await FF.Online.top(board, 80); } catch (e) {
      if (req !== boardReq) return;
      // say exactly what went wrong (so a screenshot tells us), and offer a retry
      st.textContent = t('onFail') + ' (' + String(e.message || e).slice(0, 90) + ') ';
      const again = document.createElement('button');
      again.className = 'btn ghost small';
      again.textContent = t('retry');
      again.onclick = () => { sound('ui'); renderOnline(el, board); };
      st.appendChild(again);
      return;
    }
    if (req !== boardReq) return;
    const current = await FF.Online.currentNames(rows.map((r) => r.device)); // renamed players show their new name
    if (req !== boardReq) return;
    const me = FF.Online.deviceId();
    const list = [], seenDev = {}, seenName = {};
    const min = FF.Online.minFor(board);
    let fake = 0;
    const draw = () => {
      if (!list.length) el.innerHTML = '<p class="note">' + t('noWorld') + '</p>';
      else boardRows(el, list, 'dev:' + me, 50);
    };
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (r.score < min) break; // rows come best first: the rest are too low to show
      const shown = current[r.device] || r.name;
      const nk = FF.Online.key(shown);
      if (seenDev[r.device || r.id] || seenName[nk]) continue; // one line per player (their best / first)
      const pk = 'p' + FF.hashStr(r.proof || '');
      if (seenDev[pk]) { fake++; continue; } // a copied proof under another name: the first one owns it
      if (i % 2 === 0) {
        st.textContent = t('onChecking').replace('{a}', i).replace('{b}', rows.length);
        await new Promise((ok) => setTimeout(ok, 0));
        if (req !== boardReq) return;
      }
      // a run from an older version that no longer replays isn't a cheat — just skip it quietly
      if (!FF.Online.verifyEntry(r)) { if (FF.Online.isCurrent(r)) fake++; continue; }
      seenDev[r.device || r.id] = 1;
      seenDev[pk] = 1;
      seenName[nk] = 1;
      list.push({ id: 'dev:' + (r.device || r.id), name: shown, skin: r.skin, s: r.score, d: r.dist, st: r.stage, pre: '✓ ' });
      if (list.length % 5 === 1) draw();
    }
    draw();
    st.textContent = t('onOk') + (fake ? t('onFake').replace('{n}', fake) : '') + (min ? ' · ' + t('minNote').replace('{n}', min) : '');
  }
  // 👥 FRIENDS: type your friends' names; you see their best runs and yours, whatever the score
  async function renderFriends(el) {
    const req = ++boardReq;
    const st = $('#boardStatus');
    const fr = save.friends || (save.friends = []);
    el.innerHTML = '';
    const row = document.createElement('div');
    row.className = 'friendAdd';
    const inp = document.createElement('input');
    inp.maxLength = 14; inp.placeholder = t('friendPh');
    const add = document.createElement('button');
    add.className = 'btn small'; add.textContent = t('friendAdd');
    add.onclick = () => {
      const n = inp.value.trim().slice(0, 14);
      if (!n) return;
      if (fr.some((x) => FF.Online.key(x) === FF.Online.key(n))) { toast(t('friendHave')); return; }
      if (fr.length >= 30) { toast(t('friendMax')); return; }
      fr.push(n); persist(); sound('coin'); renderFriends(el);
    };
    inp.onkeydown = (e) => { if (e.key === 'Enter') add.onclick(); };
    row.appendChild(inp); row.appendChild(add);
    el.appendChild(row);
    const box = document.createElement('div');
    el.appendChild(box);
    if (fr.length) {
      const chips = document.createElement('div');
      chips.className = 'friendChips';
      fr.forEach((n, i) => {
        const c = document.createElement('button');
        c.className = 'smChip'; c.textContent = n + ' ✕';
        c.onclick = () => { fr.splice(i, 1); persist(); sound('uiBack'); renderFriends(el); };
        chips.appendChild(c);
      });
      el.insertBefore(chips, box);
    }
    const me = save.name ? [save.name] : [];
    if (!fr.length) { box.innerHTML = '<p class="note">' + t('friendNone') + '</p>'; st.textContent = ''; return; }
    if (window.FF_LINK) { st.textContent = t('onLink'); return; }
    if (!FF.Online.enabled()) { st.textContent = t('onOff'); return; }
    st.textContent = t('onLoad');
    let rows;
    try { rows = await FF.Online.friendsTop(fr.concat(me)); } catch (e) { if (req === boardReq) st.textContent = t('onFail') + ' (' + String(e.message || e).slice(0, 60) + ')'; return; }
    if (req !== boardReq) return;
    const myDev = FF.Online.deviceId(), list = [], seen = {};
    for (const r of rows) {
      const k = FF.Online.key(r.name);
      if (seen[k]) continue; // best run per name (rows come best first)
      if (!FF.Online.verifyEntry(r)) continue;
      seen[k] = 1;
      list.push({ id: 'dev:' + (r.device || r.id), name: r.name, skin: r.skin, s: r.score, d: r.dist, st: r.stage, pre: '' });
    }
    boardRows(box, list, 'dev:' + myDev, 40);
    const missing = fr.filter((n) => !seen[FF.Online.key(n)]);
    st.textContent = missing.length ? t('friendMissing') + missing.join(lang() === 'ar' ? '، ' : ', ') : t('onOk');
  }
  function renderBoard() {
    $$('#boardTabs .tab').forEach((b) => b.classList.toggle('on', b.dataset.btab === boardTab));
    $('#playerName').value = save.name || '';
    $('#playerName').placeholder = playerName();
    nameStatus();
    const el = $('#boardList');
    const online = boardTab.indexOf('world') === 0 || boardTab === 'friends';
    $('.nameRow').classList.toggle('hidden', boardTab === 'ach' || boardTab === 'friends');
    $('#boardStatus').classList.toggle('hidden', !online);
    if (!online) boardReq++;
    if (boardTab === 'world') renderOnline(el, 'endless');
    else if (boardTab === 'worldDaily') renderOnline(el, 'daily-' + FF.todayKey());
    else if (boardTab === 'friends') renderFriends(el);
    else if (boardTab === 'runs') boardRows(el, save.scores, null, 20);
    else if (boardTab === 'today') boardRows(el, save.todayScores.date === FF.todayKey() ? save.todayScores.list : [], null, 15);
    else { renderAch(); el.innerHTML = $('#achList').innerHTML; }
  }
  function nameStatus(msg) {
    const el = $('#nameStatus');
    if (!el) return;
    const online = boardTab.indexOf('world') === 0;
    el.classList.toggle('hidden', !online && !msg);
    const ok = FF.Online.named();
    el.textContent = msg ? t(msg) : ok ? t('nameOk') : t('nameNeed');
    el.classList.toggle('warn', msg ? msg !== 'nameOk' : !ok);
  }
  async function saveName() {
    const nm = $('#playerName').value.trim().slice(0, 14);
    save.name = nm;
    persist();
    if (!FF.Online.canSend()) { nameStatus('nameOffline'); return; }
    let r;
    try { r = await FF.Online.claimName(nm); } catch (e) { nameStatus('nameOffline'); return; }
    const M = { ok: 'nameOk', taken: 'nameTaken', bad: 'nameBad', limit: 'nameLimit', nosrv: 'nameOk' };
    nameStatus(M[r] || 'nameBad');
    sound(r === 'ok' || r === 'nosrv' ? 'record' : 'uiBack');
    if (r === 'ok' || r === 'nosrv') { FF.Online.flush(); renderBoard(); }
  }
  // send a new personal best to the world board (queued while offline)
  function submitOnline(res) {
    if (!res.inputs || res.replay || (!res.cause && !res.comingSoon) || res.score <= 0) return;
    if (res.mode !== 'endless' && res.mode !== 'daily') return;
    // best score sent per world board (old local records have no proof, so the world board starts fresh)
    const board = res.mode === 'daily' ? 'daily-' + res.date : 'endless';
    if (res.score < FF.Online.minFor(board)) return; // too low for the world board anyway
    if (!save.onlineBest || typeof save.onlineBest !== 'object' || save.onlineV !== FF.Online.PROOF_V) { save.onlineBest = {}; save.onlineV = FF.Online.PROOF_V; }
    for (const k in save.onlineBest) if (k.indexOf('daily-') === 0 && k !== board && k !== 'daily-' + FF.todayKey()) delete save.onlineBest[k];
    // 🗓 FF.Online.WEEK_SEND (off until Amir decides): also send a weekly best that isn't an all-time best
    const weekSend = FF.Online.WEEK_SEND && board === 'endless' && isWeekRun(res) && res.score >= weekSave().best;
    if (res.score <= (save.onlineBest[board] || 0) && !weekSend) return;
    save.onlineBest[board] = Math.max(save.onlineBest[board] || 0, res.score);
    FF.Online.queue({
      board, name: playerName(), score: res.score, dist: res.dist,
      stage: res.stage || 1, skin: save.skin, proof: FF.Online.encodeRun(res), device: FF.Online.deviceId()
    });
  }

  // ------------------------------------------------------------------ XP / level
  const xpFor = (lvl) => Math.round(120 * Math.pow(lvl, 1.35)); // xp needed to go from lvl to lvl+1
  function levelInfo() {
    let lvl = 1, xp = save.xp;
    while (xp >= xpFor(lvl)) { xp -= xpFor(lvl); lvl++; }
    return { level: lvl, into: xp, need: xpFor(lvl), frac: xp / xpFor(lvl) };
  }
  UI.levelInfo = levelInfo;
  FF.isUnlocked = function (it) {
    if (save.owner) return true;
    if (!it.unlock) return it.cost === 0 || !!save.owned[it.id];
    if (it.unlock.indexOf('lvl') === 0) return levelInfo().level >= parseInt(it.unlock.slice(3), 10);
    if (it.unlock === 'stage8') return (save.bestStage || 1) >= 8;
    if (/^runs\d+$/.test(it.unlock)) return (save.runs || 0) >= +it.unlock.slice(4);
    if (it.unlock === 'stars30') return campStars() + towerStarsTotal() >= 30; // Adventure stars (+ any old Tower stars)
    if (it.unlock === 'streak7') return (save.streakBest || 0) >= 7;
    if (it.unlock === 'soon') return !!save.soonDone;
    if (it.unlock === 'legendAll') return !!save.ach.legend && campStars() >= FF.CAMPAIGN.list.length * 3;
    if (it.unlock === 'owner') return false;
    if (it.unlock.indexOf('code:') === 0) return !!(save.codes && save.codes[it.unlock.slice(5)]);
    if (it.unlock.indexOf('week:') === 0) return !!(save.wkr && save.wkr[it.id]); // 🗓 a weekly reward (cosmetic)
    if (it.unlock === 'boss') return !!save.bossWin; // ⚔️ beat the Weekly Boss once
    if (it.unlock === 'nerve40') return (save.bestNerve || 0) >= 40; // ✦ earned only: NERVE NOVA in one run
    if (it.unlock === 'secs180') return (save.bestSecs || 0) >= 180; // ✦ earned only: 3 minutes in one Endless run
    if (it.unlock === 'story' || it.unlock === 'storyPlay') return !!(save.storyWin || save.storyPlay || save.bossWin); // (the Story is gone: its skins come with the Weekly Boss; kept if already earned)
    return !!save.ach[it.unlock];
  };
  function unlockLabel(it) {
    if (it.unlock.indexOf('lvl') === 0) return t('needLvl') + it.unlock.slice(3);
    if (it.unlock === 'stage8') return lang() === 'ar' ? 'اوصل للمرحلة 8' : 'Reach stage 8';
    if (it.unlock === 'stars30') { const n = Math.min(30, campStars() + towerStarsTotal()); return (lang() === 'ar' ? '30 نجمة في المغامرة' : '30 Adventure stars') + ' (' + n + '/30)'; }
    if (it.unlock === 'soon') return t('needSoon');
    if (/^runs\d+$/.test(it.unlock)) { const n = +it.unlock.slice(4); return (lang() === 'ar' ? 'العب ' + n + ' جولة' : 'Play ' + n + ' runs') + ' (' + Math.min(n, save.runs || 0) + '/' + n + ')'; }
    if (it.unlock === 'streak7') return t('needStreak') + ' (' + Math.min(7, (save.streak && save.streak.n) || 0) + '/7)';
    if (it.unlock === 'legendAll') return t('needLegendAll') + ' (' + (save.ach.legend ? '♛ ✓' : '♛ ✗') + ' · ★ ' + campStars() + '/' + FF.CAMPAIGN.list.length * 3 + ')';
    if (it.codeShow) return lang() === 'ar' ? '🎁 بكود' : '🎁 code';
    if (it.unlock.indexOf('code:') === 0) return lang() === 'ar' ? '🔒 بكود خاص' : '🔒 Secret code';
    if (it.unlock === 'boss') return '⚔️ ' + t('needBoss');
    if (it.unlock === 'nerve40') return '✦ ' + t('needNerve') + ' (' + Math.min(40, save.bestNerve || 0) + '/40)';
    if (it.unlock === 'secs180') return '✦ ' + t('needSecs') + ' (' + Math.min(180, save.bestSecs || 0) + '/180)';
    if (it.unlock === 'story' || it.unlock === 'storyPlay') return '⚔️ ' + t('needBoss');
    if (it.unlock.indexOf('week:') === 0) { const u = it.unlock.split(':'); return t('needWeek').replace('{t}', t('tw_' + u[1])).replace('{s}', u[2]); }
    const a = ACH.find((x) => x.id === it.unlock);
    return t('needAch') + ' ' + (a ? a[lang()][0] : '');
  }

  // ------------------------------------------------------------------ 🔥 daily streak
  // open the game on days in a row: more coins each day, and day 7 unlocks the AURORA skin (💎 DIAMOND)
  const STREAK_COINS = [25, 50, 75, 100, 150, 200, 300];
  function dayKey(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function checkStreak() {
    const now = new Date(), today = dayKey(now), y = new Date(now); y.setDate(now.getDate() - 1);
    const st = save.streak || (save.streak = { last: '', n: 0 });
    if (st.last === today) return;
    st.n = st.last === dayKey(y) ? st.n + 1 : 1;
    st.last = today;
    const coins = STREAK_COINS[Math.min(st.n, 7) - 1];
    save.coins += coins;
    const firstAurora = st.n >= 7 && (save.streakBest || 0) < 7;
    save.streakBest = Math.max(save.streakBest || 0, st.n);
    persist();
    if (!save.runs) { UI.streakLater = true; refreshHome(); return; } // build 33: a brand-new player plays first
    setTimeout(() => {
      toast(t('streakDay').replace('{n}', st.n) + ' <b>+' + coins + '</b> ●');
      if (firstAurora) setTimeout(() => { toast(t('streakAurora')); sound('record'); }, 1200);
      else if (st.n < 7) setTimeout(() => toast(t('streakNext').replace('{n}', 7 - st.n)), 1200);
      refreshHome();
    }, 900);
  }
  UI.checkStreak = checkStreak;

  // ------------------------------------------------------------------ daily missions
  const MISSIONS = [
    { id: 'perf', kind: 'run', stat: 'perfects', n: [6, 10, 15], ar: 'حقق {n} Perfect في جولة', en: 'Get {n} Perfects in one run' },
    { id: 'near', kind: 'run', stat: 'nears', n: [3, 5, 8], ar: 'حقق {n} Near Miss في جولة', en: 'Get {n} Near Misses in one run' },
    { id: 'dist', kind: 'run', stat: 'dist', n: [400, 700, 1100], ar: 'اركض {n}م في جولة', en: 'Run {n}m in one run' },
    { id: 'chain', kind: 'run', stat: 'bestChain', n: [8, 12, 20], ar: 'سلسلة كومبو {n}', en: 'Reach a {n} combo chain' },
    { id: 'coins', kind: 'day', stat: 'coins', n: [60, 120, 200], ar: 'اجمع {n} عملة اليوم', en: 'Collect {n} coins today' },
    { id: 'brave', kind: 'day', stat: 'brave', n: [1, 2, 3], ar: 'أتمم {n} ممر مخاطرة', en: 'Clear {n} risk lanes' },
    { id: 'frenzy', kind: 'day', stat: 'frenzies', n: [1, 2, 4], ar: 'فعّل Frenzy {n} مرة', en: 'Trigger Frenzy {n} times' },
    { id: 'lines', kind: 'day', stat: 'lines', n: [3, 6, 10], ar: 'اجمع {n} خطوط عملات كاملة', en: 'Complete {n} coin lines' },
    { id: 'daily', kind: 'day', stat: 'dailyRun', n: [1], ar: 'العب ريمكس اليوم', en: "Play today's Daily Remix" },
    // Endless v8: missions for what the run is about now (NERVE, GREAT taps, the time milestones)
    { id: 'nerve', kind: 'run', stat: 'bestNerve', n: [8, 15, 25], ar: 'وصّل NERVE لـ{n} في جولة', en: 'Reach NERVE {n} in one run' },
    { id: 'great', kind: 'run', stat: 'greats', n: [8, 15, 25], ar: 'اعمل {n} GREAT في جولة', en: 'Get {n} GREATs in one run' },
    { id: 'secs', kind: 'run', stat: 'secs', n: [20, 30, 60], ar: 'عيش {n} ثانية في جولة', en: 'Survive {n} seconds in one run' }
  ];
  function missions() {
    const today = FF.todayKey();
    if (!save.missions || save.missions.date !== today) {
      const r = FF.mulberry32(FF.hashStr('missions-' + today));
      const pool = MISSIONS.slice();
      const list = [];
      while (list.length < 3) {
        const m = pool.splice(Math.floor(r() * pool.length), 1)[0];
        const tier = Math.floor(r() * m.n.length);
        list.push({ id: m.id, target: m.n[tier], reward: 60 + tier * 70, progress: 0, done: false });
      }
      save.missions = { date: today, list, bonus: false };
      persist();
    }
    // an old save can hold a mission that no longer exists (build 35 removed 'tower'): swap it for one that does
    const ms = save.missions;
    if (!Array.isArray(ms.list)) ms.list = [];
    if (ms.list.some((m) => !m || !MISSIONS.find((x) => x.id === m.id))) {
      const r = FF.mulberry32(FF.hashStr('missions-fix-' + today));
      const pool = MISSIONS.filter((x) => !ms.list.some((m) => m && m.id === x.id));
      ms.list = ms.list.map((m) => {
        if (m && MISSIONS.find((x) => x.id === m.id)) return m;
        const d = pool.splice(Math.floor(r() * pool.length), 1)[0];
        if (!d) return null;
        const tier = Math.floor(r() * d.n.length);
        // an old mission already finished today stays finished (its coins were paid), under the new name
        if (m && m.done) return { id: d.id, target: d.n[tier], reward: m.reward || 60 + tier * 70, progress: d.n[tier], done: true };
        return { id: d.id, target: d.n[tier], reward: 60 + tier * 70, progress: 0, done: false };
      }).filter(Boolean);
      persist();
    }
    return ms;
  }
  function missionText(m) {
    const d = MISSIONS.find((x) => x.id === m.id);
    return d ? d[lang()].replace('{n}', m.target) : '';
  }
  function renderMissions(el, header) {
    const ms = missions();
    el.innerHTML = (header ? '<div class="mis-h">' + t('missions') + '</div>' : '') + ms.list.map((m) =>
      '<div class="mis' + (m.done ? ' done' : '') + '"><span class="t">' + (m.done ? '✓ ' : '') + missionText(m) + '</span>' +
      '<div class="bar"><i style="width:' + Math.min(100, Math.round((m.progress / m.target) * 100)) + '%"></i></div>' +
      '<span class="r" dir="ltr">+' + m.reward + '</span></div>').join('');
  }
  function updateMissions(res) {
    if (res.mode === 'zen') return;
    const ms = missions();
    const val = (stat) => stat === 'dailyRun' ? (res.mode === 'daily' ? 1 : 0) : res[stat] || 0;
    for (const m of ms.list) {
      if (m.done) continue;
      const d = MISSIONS.find((x) => x.id === m.id);
      if (!d) continue;
      if (d.kind === 'run') m.progress = Math.max(m.progress, val(d.stat));
      else m.progress += val(d.stat);
      if (m.progress >= m.target) {
        m.done = true;
        save.coins += m.reward;
        setTimeout(() => { toast(t('misDone') + '<b>+' + m.reward + '</b>'); sound('line'); }, 400);
      }
    }
    if (!ms.bonus && ms.list.every((m) => m.done)) {
      ms.bonus = true;
      save.coins += 200;
      setTimeout(() => toast(t('allDone') + '<b>+200</b>'), 1200);
      unlockAch('missions3');
    }
  }

  // ------------------------------------------------------------------ game flow
  function startGame(mode, extra) {
    if (FF.wipe) FF.wipe(() => startGameNow(mode, extra));
    else startGameNow(mode, extra);
  }
  function startGameNow(mode, extra) {
    FF.audio.init();
    FF.Editor.close();
    hideHint();
    const opts = Object.assign({
      mode,
      settings: save.settings,
      skin: save.skin,
      trail: save.trail,
      seen: save.seen,
      runs: save.runs,
      best: mode === 'daily' ? (save.daily.date === FF.todayKey() ? save.daily.best : 0) : save.best,
      callbacks: { onEnd, onEvent }
    }, extra || {});
    if (save.owner && save.ownerCfg && !opts.replay && mode !== 'editor') {
      const o = save.ownerCfg;
      if (o.god) opts.god = true;
      if (o.speed && o.speed !== 1) opts.timeScale = o.speed;
      if (o.hit) opts.hitbox = true;
      if ((mode === 'endless' || mode === 'daily') && o.stage > 1 && opts.startX === undefined) opts.startX = (o.stage - 1) * FF.Level.STAGE_LEN;
    }
    // testing the stage book: index.html?stage=7 starts Endless right at stage 7 (such runs never count)
    const qs = +(new URLSearchParams(location.search).get('stage') || 0);
    if (mode === 'endless' && qs > 1 && !opts.replay && !opts.fromMaker) opts.startX = (Math.min(qs, 99) - 1) * FF.Level.STAGE_LEN;
    if (mode === 'daily') {
      opts.seed = FF.hashStr('daily-' + FF.todayKey());
      if (opts.vsSeed && opts.vsSeed !== opts.seed && !opts.replay) { opts.seed = opts.vsSeed; opts.vsPast = true; opts.best = 0; } // ⚔️ a friend's Daily road from another day: a challenge run only
      else if (save.daily.date === FF.todayKey() && save.daily.ghost) opts.ghost = save.daily.ghost;
    }
    if (mode === 'endless' && !opts.replay) opts.bestX = save.bestX || 0; // 🏁 the flag where your longest run ended
    if (mode === 'endless' && opts.weekly && !opts.replay) { // 🗓 this week's road: your week flag + the 🎯 rival's flag + a ghost
      const ws = weekSave();
      opts.seed = FF.weekInfo().seed;
      opts.bestX = ws.x || 0;
      opts.best = ws.best;
      opts.rival = ws.rival && ws.rival.s > ws.best ? ws.rival : null;
      // 👻 the week's #1 (from the proof stored with their verified run) — or, if that's you / not loaded, your own best
      const lg = ws.lead && ws.lead.s > ws.best ? leadGhost(ws.lead) : null;
      if (lg) Object.assign(opts, { ghost: lg, ghostName: '#1 ' + ws.lead.name, ghostLead: ws.lead.name, ghostS: ws.lead.s });
      else if (ws.ghost && ws.ghost.length) opts.ghost = ws.ghost;
    }
    if (mode === 'endless' || mode === 'daily') opts.soonFirst = !save.soonDone; // the ending shows the gift the first time
    if (mode === 'boss' && !opts.replay) { // ⚔️ you ARE the Infinity Void in the duel (the reward lets you wear it everywhere)
      const bw = FF.bossWeek();
      // b42: the ULTIMATE follows the skin you wear (a generic finisher for the others)
      const ULTS = { ivoid: 1, bwarden: 1, wshinobi: 1, ctyrant: 1, jackpot: 1 };
      Object.assign(opts, { seed: bw.seed, boss: bw.id, skin: 'ivoid', trail: 'ivoid', introSeen: !!save.bossIntro, heroOwned: !!save.bossWin, ultSkin: ULTS[save.skin] ? save.skin : 'generic' });
      delete opts.startX;
    }
    UI.lastMode = mode;
    UI.lastOpts = extra || {};
    UI.game = new FF.Game(opts);
    show(null);
    sound('uiGo');
    twistBanner(UI.game, opts);
  }
  UI.startGame = startGame;
  UI.watchEnding = () => startGame('endless', { startX: FF.BOOK.stages.length * FF.Level.STAGE_LEN - 900, god: true, fromMaker: !!FF.MAKER_APP });
  // ⚔️ CHALLENGE LINKS: ?vs=seed.score.name — the friend plays the exact same Endless road and must beat your score
  const SITE = 'https://amir2049.github.io/flipnova/';
  function challengeLink(res) {
    const base = /^https?:/.test(location.protocol) && !/itch\.(io|zone)/.test(location.host) ? location.origin + location.pathname : SITE;
    // a Daily road adds &vm=d (old 3-part links stay exactly as they were: Endless)
    return base + '?vs=' + res.seed.toString(36) + '.' + res.score.toString(36) + '.' + encodeURIComponent(playerName().slice(0, 14)) + (res.mode === 'daily' ? '&vm=d' : '');
  }
  function readChallenge() {
    const v = new URLSearchParams(location.search).get('vs');
    const m = v && v.match(/^([0-9a-z]{1,12})\.([0-9a-z]{1,10})\.(.{1,60})$/);
    if (!m) return null;
    const seed = parseInt(m[1], 36), score = parseInt(m[2], 36);
    let name = '?';
    try { name = decodeURIComponent(m[3]).replace(/[<>&"]/g, '').slice(0, 14); } catch (e) { name = '?'; }
    const daily = new URLSearchParams(location.search).get('vm') === 'd';
    return seed > 0 && score >= 0 ? { seed, score, name, mode: daily ? 'daily' : 'endless' } : null;
  }
  UI.vs = readChallenge();
  // the friend always starts at stage 1 of the same road, so the run is a normal run (no startX = no "assist")
  function playVs() {
    if (UI.vs.mode === 'daily') startGame('daily', { vsSeed: UI.vs.seed, vs: true });
    else startGame('endless', { seed: UI.vs.seed, vs: true });
  }
  // ⏪ watch how you died: the run is replayed from its recorded taps (same seed, same stages),
  // fast-forwarded in silence, then the last 3 seconds play in slow motion. Back to the results after.
  function deathReplay() {
    const r = UI.replayRes;
    if (!r) return;
    const g = new FF.Game({
      mode: r.mode, seed: r.seed, replay: r.inputs, book: r.book || undefined, boss: r.boss ? r.boss.id : undefined, introSeen: r.boss ? r.boss.introSeen : undefined, heroOwned: r.boss ? r.boss.heroOwned : undefined, ultSkin: r.boss ? r.boss.ultSkin : undefined,
      settings: save.settings, skin: r.boss ? 'ivoid' : save.skin, trail: r.boss ? 'ivoid' : save.trail, seen: save.seen, runs: 99, silent: true,
      callbacks: { onEnd: () => { setTimeout(() => { stopClip(); UI.game = null; show('over'); }, 700); }, onEvent: () => {} }
    });
    let n = 0;
    while (!g.dead && g.time < r.time - 3 && n++ < 400000) g.tick(FF.STEP);
    g.popups.length = 0; g.particles.length = 0; // nothing piled up from the fast-forward
    g.stageBanner = 0; g.worldBanner = 0;
    g.opts.timeScale = 0.35;
    UI.game = g;
    show(null);
    toast(t('replayNote'));
    startClip();
  }
  // 🎬 the slow-motion replay is also recorded as a short HD clip with the game's name on it — ready for TikTok
  let clipRec = null;
  function startClip() {
    UI.clip = null;
    const src = $('#screen');
    if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) return;
    const type = ['video/mp4', 'video/webm;codecs=vp9', 'video/webm'].find((m) => MediaRecorder.isTypeSupported(m));
    if (!type) return;
    const big = document.createElement('canvas'); big.width = 1280; big.height = 720;
    const g = big.getContext('2d'); g.imageSmoothingEnabled = false;
    let rec;
    try { rec = new MediaRecorder(big.captureStream(30), { mimeType: type, videoBitsPerSecond: 3000000 }); } catch (e) { return; }
    const chunks = []; let live = true;
    const draw = () => {
      if (!live) return;
      g.drawImage(src, 0, 0, 1280, 720);
      FF.font.draw(g, 'FLIPPO', 1260, 16, { scale: 4, align: 'right', color: '#ffd23f', outline: '#05060d' });
      requestAnimationFrame(draw);
    };
    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    rec.onstop = () => {
      live = false;
      if (!chunks.length) return;
      UI.clip = new Blob(chunks, { type: type.split(';')[0] });
      $('#overClip').classList.remove('hidden');
    };
    draw();
    rec.start(250);
    clipRec = rec;
  }
  function stopClip() { if (clipRec && clipRec.state !== 'inactive') clipRec.stop(); clipRec = null; }
  function shareClip() {
    const b = UI.clip;
    if (!b) return;
    const ext = b.type === 'video/mp4' ? 'mp4' : 'webm', name = 'flippo-clip.' + ext;
    if (window.AndroidBridge && window.AndroidBridge.shareVideo) {
      const fr = new FileReader();
      fr.onload = () => window.AndroidBridge.shareVideo(String(fr.result).split(',')[1], ext, t('clipText'));
      fr.readAsDataURL(b);
      return;
    }
    const f = typeof File === 'function' ? new File([b], name, { type: b.type }) : null;
    if (f && navigator.canShare && navigator.canShare({ files: [f] })) { navigator.share({ files: [f], text: t('clipText') }).catch(() => {}); return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast(t('clipSaved'));
  }
  // 🎓 the first time someone plays, the tutorial comes first (players from before it existed never see it)
  function needsTutorial() {
    if (save.tutDone) return false;
    if (save.runs > 0) { save.tutDone = 1; persist(); return false; }
    return true;
  }
  function startTutorial() {
    // build 33: it only counts as done when finished (or on the 2nd try), so leaving half way brings it back once
    save.tutTries = (save.tutTries || 0) + 1;
    if (save.tutTries >= 2) save.tutDone = 1;
    persist();
    toast(t('tutStart'));
    startGame('campaign', { level: FF.TUTORIAL, tutorial: true, seen: {} });
  }
  // for js/stagemaker.js
  Object.assign(UI, { show, toast, sound, t: (k) => t(k), lang: () => lang() });

  function onEvent(type, data) {
    if (type === 'hint') hint(data);
    else if (type === 'ach') unlockAch(data);
    else if (type === 'stage') {
      if (data.stage > save.bestStage) save.bestStage = data.stage;
      if (data.stage >= 10) unlockAch('stage10');
      const g = UI.game;
      if (data.stage >= 3 && g && !g.opts.god && !g.opts.startX && !g.opts.timeScale && !g.opts.replay) FF.Online.count('stage3'); // anonymous, once a day
    }
    else if (type === 'world') { /* banner is drawn in-canvas */ }
    else if (type === 'banner') stageBanner(data); // Arabic stage name over the canvas
    else if ((type === 'bossBanner' || type === 'bossLine') && lang() === 'ar') { // ⚔️ the fight's lines in Arabic (the pixel font is Latin only)
      stageBanner(type === 'bossBanner' ? '<b>' + data.titleAr + '</b>' + (data.subAr ? '<span>' + data.subAr + '</span>' : '') : '<span>' + data.ar + '</span>');
      clearTimeout(UI.bossBanT);
      UI.bossBanT = setTimeout(() => stageBanner(''), (data.len || 1.5) * 800);
    }
  }

  function onEnd(res) {
    const g = UI.game;
    hideHint();
    if (res.tutorial) {
      // 🎓 the first run is done: from now on the real game
      if (res.finished) { save.tutDone = 1; FF.Online.count('tut'); }
      persist();
      if (res.finished) { setTimeout(() => { UI.game = null; toast(t('tutGo')); sound('record'); if (UI.vs) playVs(); else startGame('endless'); }, 600); return; }
      setTimeout(() => { UI.game = null; refreshHome(); show('home'); toast(t('tutSkip')); }, 0);
      return;
    }
    if (res.assist && !res.replay) {
      // owner powers were on: show the run, record nothing (no scores, stars, Legend or world board)
      toast(t('assistNote'));
      UI.lastRes = res;
      if (UI.lastOpts && UI.lastOpts.fromMaker && FF.StageMaker) { setTimeout(() => { UI.game = null; FF.StageMaker.open(); }, 700); return; }
      setTimeout(() => showResults(res, false, 0, 0), res.finished ? 500 : 0);
      return;
    }
    if (g && g.opts.vsPast && !res.replay) {
      // ⚔️ a friend's Daily road from another day: compare with the friend, record nothing (no daily best, no board)
      res.vsPast = true;
      vsCheck(res);
      UI.lastRes = res;
      res.card = res.vsRes ? 'back' : '';
      setTimeout(() => showResults(res, false, 0, 0), 0);
      UI.game = g;
      return;
    }
    save.runs++;
    if (!res.replay) FF.Online.count('run'); // anonymous, at most 20 a day
    const casual = res.mode === 'zen' || res.mode === 'custom';
    if (res.mode !== 'custom') save.totalDist += res.dist;
    if (!casual) save.coins += res.coins;
    if (res.comingSoon && !save.soonDone) {
      // first time through every stage: 5000 coins and the NOVA skin, put on right away
      save.soonDone = 1;
      save.coins += 5000;
      save.skin = 'nova';
      setTimeout(() => toast(t('soonBonus') + '<b>+5000</b>'), 800);
      setTimeout(() => toast(t('soonSkin')), 1600);
    }
    if (res.mode === 'custom' && res.custom && res.finished) {
      const lv = save.levels.find((l) => l.id === res.custom.id);
      if (lv) { lv.best = Math.max(lv.best || 0, res.score); lv.cleared = true; }
    }
    if (res.dist >= 1000) unlockAch('m1000');
    let isBest = false, prevBest = 0;
    if (res.mode === 'endless') {
      prevBest = save.best;
      if (res.score > save.best) { save.best = res.score; isBest = prevBest > 0; res.firstScore = prevBest === 0 && res.score > 0; }
    } else if (res.mode === 'daily') {
      const today = FF.todayKey();
      if (save.daily.date !== today) save.daily = { date: today, best: 0, ghost: null };
      prevBest = save.daily.best;
      if (res.score > save.daily.best) {
        save.daily.best = res.score;
        save.daily.ghost = res.ghostRec;
        isBest = true;
      }
    }
    weekEnd(res);
    if (res.mode === 'boss') bossEnd(res);
    if (res.mode !== 'custom') updateMissions(res);
    if ((res.mode === 'endless' || res.mode === 'daily') && !res.replay && !res.assist) { // ✦ the earn-only skins
      const before = FF.SKINS.filter((s) => (s.unlock === 'nerve40' || s.unlock === 'secs180') && FF.isUnlocked(s)).map((s) => s.id);
      save.bestNerve = Math.max(save.bestNerve || 0, res.bestNerve || 0);
      save.bestSecs = Math.max(save.bestSecs || 0, res.secs || 0);
      for (const s of FF.SKINS) if ((s.unlock === 'nerve40' || s.unlock === 'secs180') && FF.isUnlocked(s) && before.indexOf(s.id) < 0) setTimeout(() => { toast(t('earnSkin').replace('{n}', s.name)); sound('unlock'); }, 1500);
    }
    res.rank = recordScore(res);
    submitOnline(res);
    const lvBefore = levelInfo().level;
    res.xpGain = casual ? 0 : Math.round(res.score / 20 + res.perfects * 3 + res.nears * 2 + (res.finished ? 60 : 0));
    save.xp += res.xpGain;
    const lvNow = levelInfo().level;
    if (lvNow > lvBefore) {
      setTimeout(() => { toast(t('lvlUp') + '<b>' + lvNow + '</b>'); sound('record'); }, 900);
      for (const it of FF.SKINS.concat(FF.TRAILS)) {
        if (it.unlock === 'lvl' + lvNow) setTimeout(() => toast(t('unlocked') + '<b>' + it.name + '</b>'), 1500);
      }
    }
    if (lvNow >= 10) unlockAch('lvl10');
    let stars = 0;
    if (res.mode === 'campaign' && res.finished) stars = campaignResult(res);
    vsCheck(res);
    res.card = vsCardKind(res, isBest, prevBest);
    if (res.card) { save.vsCards = (save.vsCards || 0) + 1; if (res.card === 'close') save.vsCardRun = save.runs; } // local count only
    persist();
    setTimeout(() => showResults(res, isBest, prevBest, stars), res.finished ? 500 : 0);
    if (isBest) setTimeout(() => sound('record'), 250);
    if (res.mode === 'endless' && !res.assist && !res.replay && !res.comingSoon) save.bestX = Math.max(save.bestX || 0, res.dist * 10);
    UI.lastRes = res;
    UI.game = g;
  }
  // ⚔️ was this run a friend's challenge? (same mode + same road) — the result line, and "challenge them back"
  function vsCheck(res) {
    const v = UI.vs;
    if (!v || res.replay || res.mode !== (v.mode || 'endless') || res.seed !== v.seed) return;
    const won = res.score > v.score;
    res.vsRes = { name: v.name, score: v.score, won };
    setTimeout(() => { toast(t(won ? 'vsWin' : 'vsLose').replace('{n}', v.name).replace('{s}', v.score)); if (won) sound('record'); }, 1400);
    if (won) UI.vs = null;
  }
  // 🃏 the near-miss card: Endless/Daily runs at 90%+ of your best (at most once every 3 runs), a new best, or a friend's challenge
  function vsCardKind(res, isBest, prevBest) {
    if (res.replay || res.assist || res.tutorial || !res.seed || res.score <= 0 || res.comingSoon || res.finished) return '';
    if (res.mode !== 'endless' && res.mode !== 'daily') return '';
    if (res.vsRes) return 'back';
    if (prevBest <= 0) return ''; // the very first score already has its own moment
    if (isBest) return 'best';
    if (res.score >= prevBest * 0.9 && !(save.vsCardRun && save.runs - save.vsCardRun < 3)) return 'close';
    return '';
  }
  UI.vsCardKind = vsCardKind;

  function nextGoal(res) {
    if (res.finished || (res.mode !== 'endless' && res.mode !== 'daily')) return '';
    if ((save.bestStage || 1) < 4) return t('goalStage').replace('{n}', Math.max(2, (res.stage || 1) + 1));
    const b = res.mode === 'daily' ? save.daily.best : save.best;
    if (b > 0 && res.score >= b * 0.8) return ''; // "only N short of your best" already says it
    const m = missions().list.find((x) => !x.done);
    if (m) return t('goalMis').replace('{t}', missionText(m)).replace('{p}', Math.min(m.progress, m.target)).replace('{q}', m.target);
    return t('goalStage').replace('{n}', (save.bestStage || 1) + 1);
  }
  function showResults(res, isBest, prevBest, stars) {
    const L = lang();
    let title = res.finished ? (res.mode === 'custom' ? t('customDone') : res.mode === 'campaign' ? t('levelDone') : t('finished')) : isBest ? t('newBest') : res.firstScore ? t('firstScore') : t('crash');
    const camp = res.mode === 'campaign';
    if (res.comingSoon) title = t('soonTitle');
    $('#overRetry').classList.toggle('hidden', !camp);
    UI.replayRes = res.inputs && !res.finished && !res.replay && res.cause && res.time > 1.5 && (res.mode === 'endless' || res.mode === 'daily' || res.mode === 'boss') ? res : null;
    $('#overReplay').classList.toggle('hidden', !UI.replayRes);
    $('#overClip').classList.add('hidden'); UI.clip = null;
    $('#overMap').classList.toggle('hidden', !camp);
    const nextLv = camp ? FF.CAMPAIGN.list[FF.CAMPAIGN.list.indexOf(res.level) + 1] : null;
    $('#over [data-act=again]').textContent = camp && nextLv ? t('next') : t('again');
    UI.nextLevel = nextLv;
    $('#overEdit').classList.toggle('hidden', !res.fromEditor);
    $('#overTitle').textContent = title;
    $('#overTitle').style.color = isBest || res.finished ? '#ffd23f' : '#ff5a6e';
    $('#overScore').textContent = res.score;
    { // 🎯 the next run's goal: the unfinished mission you're closest to (Jetpack Joyride keeps its missions in view)
      const g = $('#overMis');
      if (g) {
        const ms = res.mode === 'zen' || res.mode === 'custom' ? null : missions();
        const left = ms ? ms.list.filter((m) => !m.done).sort((a, b) => b.progress / b.target - a.progress / a.target) : [];
        g.innerHTML = left.length ? '🎯 ' + missionText(left[0]) + ' <b dir="ltr">' + Math.min(left[0].progress, left[0].target) + '/' + left[0].target + '</b>' : '';
      }
    }
    const sub = $('#overBest');
    sub.className = 'sub' + (isBest ? ' new' : '');
    if (camp) sub.textContent = res.level.label + ' · ' + (L === 'ar' ? res.level.ar : res.level.en);
    else if (res.mode === 'custom') sub.textContent = res.custom.name + ' · ' + Math.min(100, Math.round((res.dist * 10 / res.custom.len) * 100)) + '%';
    else if (res.comingSoon) sub.textContent = t('soonSub');
    else {
      const b = res.mode === 'daily' ? save.daily.best : save.best;
      sub.textContent = res.firstScore ? t('firstScoreSub') : isBest ? t('newBestSub') : !res.assist && b > 0 && res.score >= b * 0.8 ? t('soClose').replace('{n}', b - res.score) : t('bestWas') + b;
    }
    const st = $('#overStars');
    st.classList.toggle('hidden', !camp);
    if (camp) st.innerHTML = starsHtml(stars);
    const chips = [
      ['📏', res.dist + (L === 'ar' ? 'م' : 'm')],
      ['●', res.coins],
      ['✓', res.perfects + ' Perfect']
    ];
    if (res.mode === 'endless' || res.mode === 'daily') chips.push(['↑', t('stageLbl') + res.stage]);
    if (camp) {
      chips.length = 0;
      chips.push(['⏱', Math.floor(res.time / 60) + ':' + String(Math.floor(res.time % 60)).padStart(2, '0')]);
      chips.push(['☠', res.deaths]);
      chips.push(['●', res.coinsTaken + '/' + res.coinTotal]);
    }
    $('#overStats').innerHTML = chips.map((c) => '<span class="chip"><i>' + c[0] + '</i>' + c[1] + '</span>').join('');
    $('#overWhy').innerHTML = res.cause && !res.finished ? WHY[L][res.cause] || '' : '';
    // build 33: a death right after a new obstacle's hint says so, and the run ends with one clear goal for the next one
    const fresh = res.cause && !res.finished && UI.hintAt && performance.now() - UI.hintAt < 6000 && (res.mode === 'endless' || res.mode === 'daily');
    if (fresh) $('#overWhy').innerHTML = t('newObs') + '<br>' + $('#overWhy').innerHTML;
    UI.hintAt = 0;
    $('#overGoal').innerHTML = nextGoal(res);
    { const wl = weekResLine(res); if (wl) $('#overGoal').innerHTML = wl + ($('#overGoal').innerHTML ? '<br>' + $('#overGoal').innerHTML : ''); }
    if (res.vsRes) $('#overGoal').innerHTML = res.vsRes.won ? t('vsWinLine').replace('{n}', res.vsRes.name).replace('{s}', res.vsRes.score)
      : t('vsGap').replace('{d}', res.vsRes.score - res.score + 1).replace('{n}', res.vsRes.name).replace('{s}', res.vsRes.score);
    if (res.vsPast) $('#overGoal').innerHTML += '<br><small>' + t('vsOld').replace('{n}', res.vsRes ? res.vsRes.name : '?') + '</small>';
    if (res.mode === 'boss' && res.boss) {
      const r = res.boss;
      $('#overTitle').textContent = r.win ? t('bossWinT') : t('bossLoseT');
      $('#overTitle').style.color = r.win ? '#ffd23f' : '#ff5a6e';
      $('#overScore').textContent = r.win ? FF.fmtBossTime(r.time) : r.pct + '%';
      sub.className = 'sub' + (res.bossNew ? ' new' : '');
      sub.innerHTML = (r.win ? t('bossResWin').replace('{t}', FF.fmtBossTime(r.time)) : t('bossResLose').replace('{p}', r.pct).replace('{ph}', r.phase)) + (res.bossNew ? ' · ' + t(res.bossNew) : '');
      $('#overStats').innerHTML = [['◎', r.stats.orbs + ' ' + t('bossSeals')], ['✦', r.stats.counters + ' ' + t('bossCounters')], ['⏱', FF.fmtBossTime(Math.max(0, r.time))]].map((c) => '<span class="chip"><i>' + c[0] + '</i>' + c[1] + '</span>').join('');
      $('#overGoal').innerHTML = (res.bossUnlocked ? t('bossSkin') + '<br>' : '') + '<small>' + t('bossHow') + '<br>' + t('bossLocal') + '</small>';
    }
    const vb = $('#overVs');
    vb.classList.toggle('hidden', !res.card);
    vb.classList.toggle('gold', res.card === 'best');
    vb.textContent = res.card ? t(res.card === 'back' ? 'vsBack' : res.card === 'best' ? 'vsBest' : 'vsClose') : '';
    UI.overAt = performance.now();
    const lv = levelInfo();
    $('#overXp').textContent = res.xpGain ? '+' + res.xpGain + ' ' + t('xp') + ' · LV ' + lv.level : '';
    const showBoard = res.mode === 'endless' || res.mode === 'daily';
    $('.overR').classList.toggle('noboard', !showBoard && !res.xpGain); // build 35: the icon row lives here now, so the column stays
    $('.boardTitle').classList.toggle('hidden', !showBoard);
    if (showBoard) boardRows($('#overBoard'), res.mode === 'endless' ? save.scores : save.todayScores.list, res.entryId, 5);
    else $('#overBoard').innerHTML = '';
    show('over');
    UI.sessRuns = (UI.sessRuns || 0) + 1;
    if (UI.streakLater && save.runs > 0) {
      UI.streakLater = false;
      const st = save.streak || { n: 1 };
      setTimeout(() => toast(t('streakDay').replace('{n}', st.n) + ' <b>+' + STREAK_COINS[Math.min(st.n, 7) - 1] + '</b> ●'), 900);
    } else if (UI.sessRuns === 3 && !res.replay) {
      const n = ((save.streak && save.streak.n) || 0) + 1;
      setTimeout(() => toast(t('tmrw').replace('{n}', n).replace('{c}', STREAK_COINS[Math.min(n, 7) - 1])), 1100);
    }
  }

  // ------------------------------------------------------------------ share card
  function shareCard() {
    const res = UI.lastRes;
    if (!res) return;
    const low = FF.makeCanvas(320, 180);
    const g = low.getContext('2d');
    FF.drawWorld(g, FF.WORLDS[0], 300, 1, {});
    g.fillStyle = 'rgba(5,6,13,0.55)';
    g.fillRect(0, 0, 320, 180);
    const C = FF.COLORS;
    FF.font.draw(g, 'FLIPPO', 160, 10, { scale: 2, align: 'center', color: C.coin, outline: '#05060d' });
    FF.drawFlippoBig(g, 22, 44, 4, { skin: save.skin, face: 'joy' });
    FF.font.draw(g, String(res.score), 214, 48, { scale: 4, align: 'center', color: '#fff', outline: '#05060d' });
    FF.font.draw(g, res.dist + 'M   ' + res.perfects + ' PERFECT', 214, 90, { align: 'center', color: C.perfect, outline: '#05060d' });
    FF.font.draw(g, 'BEST CHAIN ' + res.bestChain + '   x' + res.maxMult, 214, 102, { align: 'center', color: C.near, outline: '#05060d' });
    FF.font.draw(g, (res.mode === 'daily' ? 'DAILY ' + FF.todayKey() : res.mode.toUpperCase()) + '   LV ' + levelInfo().level, 214, 114, { align: 'center', color: '#cfd6ff', outline: '#05060d' });
    FF.font.draw(g, 'CAN YOU BEAT IT?', 214, 140, { align: 'center', color: '#fff', outline: '#05060d', scale: 1 });
    const big = document.createElement('canvas');
    big.width = 1280;
    big.height = 720;
    const bg = big.getContext('2d');
    bg.imageSmoothingEnabled = false;
    bg.drawImage(low, 0, 0, 1280, 720);
    let text = t('shareText').replace('{s}', res.score);
    if (res.mode === 'endless' && res.seed && !res.assist && isWeekRun(res)) text = t('weekShare').replace('{s}', res.score) + ' ' + challengeLink(res);
    else if (res.mode === 'endless' && res.seed && !res.assist) text += '\n' + t('vsShare') + ' ' + challengeLink(res); // ⚔️ same road for whoever opens it
    if (window.AndroidBridge) {
      window.AndroidBridge.shareImage(big.toDataURL('image/png').split(',')[1], text);
      return;
    }
    big.toBlob(async (blob) => {
      try {
        const file = new File([blob], 'flippo.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], text, title: 'FLIPPO' });
          return;
        }
      } catch (e) { /* fall back to download */ }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'flippo-' + res.score + '.png';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 3000);
      toast(t('saved'));
    }, 'image/png');
  }

  // ------------------------------------------------------------------ ⚔️ near-miss challenge card (build 34)
  // a 1080x1920 pixel card (fits a story / status) + the same-road ?vs= link. Counted on this device only (save.shares).
  function vsCardCanvas(res) {
    const W = 180, H = 320, C = FF.COLORS;
    const low = FF.makeCanvas(W, H);
    const g = low.getContext('2d');
    const gold = res.card === 'best';
    for (let y = 0; y < H; y++) { g.fillStyle = FF.mix('#1d1150', '#05060d', y / H); g.fillRect(0, y, W, 1); }
    for (let i = 0; i < 70; i++) { g.fillStyle = i % 3 ? 'rgba(124,247,255,0.35)' : 'rgba(255,255,255,0.55)'; g.fillRect((i * 97) % W, (i * 61) % H, 1, 1); }
    const fr = gold ? '#ffd23f' : '#ff3355';
    g.fillStyle = fr; g.fillRect(4, 4, W - 8, 2); g.fillRect(4, H - 6, W - 8, 2); g.fillRect(4, 4, 2, H - 8); g.fillRect(W - 6, 4, 2, H - 8);
    for (const [x, y] of [[4, 4], [W - 10, 4], [4, H - 10], [W - 10, H - 10]]) { g.fillStyle = '#fff'; g.fillRect(x, y, 6, 6); g.fillStyle = fr; g.fillRect(x + 2, y + 2, 2, 2); }
    FF.font.draw(g, 'FLIPPO', W / 2, 16, { scale: 2, align: 'center', color: C.coin, outline: '#05060d' });
    FF.drawFlippoBig(g, W / 2 - 40, 42, 4, { skin: save.skin, face: gold ? 'joy' : 'focus', t: 0.3 });
    const head = gold ? 'NEW BEST!' : res.card === 'back' ? 'YOUR TURN!' : 'SO CLOSE!';
    FF.font.draw(g, head, W / 2, 138, { scale: 2, align: 'center', color: gold ? C.coin : '#ff5a6e', outline: '#05060d' });
    const sc = String(res.score), ss = sc.length <= 4 ? 6 : sc.length <= 5 ? 5 : 4;
    FF.font.draw(g, sc, W / 2, 160, { scale: ss, align: 'center', color: '#fff', outline: '#05060d' });
    const best = res.mode === 'daily' ? save.daily.best : save.best;
    const line2 = (res.mode === 'daily' ? 'DAILY  ' : '') + 'STAGE ' + (res.stage || 1) + (!gold && best > 0 && res.card === 'close' ? '   ' + Math.floor(res.score / best * 100) + '% OF BEST' : '');
    FF.font.draw(g, line2, W / 2, 212, { align: 'center', color: C.perfect, outline: '#05060d' });
    FF.font.draw(g, 'CAN YOU', W / 2, 236, { scale: 2, align: 'center', color: '#fff', outline: '#05060d' });
    FF.font.draw(g, 'BEAT IT?', W / 2, 254, { scale: 2, align: 'center', color: C.coin, outline: '#05060d' });
    FF.font.draw(g, 'SAME ROAD - TAP THE LINK', W / 2, 300, { align: 'center', color: '#cfd6ff', outline: '#05060d' });
    const big = document.createElement('canvas');
    big.width = 1080; big.height = 1920;
    const bg = big.getContext('2d');
    bg.imageSmoothingEnabled = false;
    bg.drawImage(low, 0, 0, 1080, 1920);
    // the challenger's name in a real font (Arabic names too)
    bg.font = '900 84px Cairo, sans-serif';
    bg.textAlign = 'center';
    bg.lineWidth = 10; bg.strokeStyle = '#05060d'; bg.fillStyle = '#ffffff';
    const nm = '⚔ ' + playerName();
    bg.strokeText(nm, 540, 1720); bg.fillText(nm, 540, 1720);
    return big;
  }
  UI.vsCardCanvas = vsCardCanvas;
  function vsShare() {
    const res = UI.lastRes;
    if (!res || !res.card) return;
    save.shares = (save.shares || 0) + 1; // local only — nothing is sent anywhere
    persist();
    const link = challengeLink(res) + '&src=card';
    const text = t('vsCardText').replace('{s}', res.score).replace('{st}', res.stage || 1);
    const big = vsCardCanvas(res);
    UI.lastShare = { text, link };
    if (window.AndroidBridge && window.AndroidBridge.shareImage) { window.AndroidBridge.shareImage(big.toDataURL('image/png').split(',')[1], text + '\n' + link); return; }
    const copy = async () => {
      try { await navigator.clipboard.writeText(text + '\n' + link); toast(t('vsCopied')); UI.lastShare.via = 'copy'; }
      catch (e) { showCode('vsLink', text + '\n' + link); UI.lastShare.via = 'box'; }
    };
    big.toBlob(async (blob) => {
      try {
        const file = new File([blob], 'flippo-challenge.png', { type: 'image/png' });
        if (blob && navigator.canShare && navigator.canShare({ files: [file] })) {
          UI.lastShare.via = 'files';
          await navigator.share({ files: [file], text: text + '\n' + link, title: 'FLIPPO' });
          return;
        }
        if (navigator.share) {
          UI.lastShare.via = 'text';
          await navigator.share({ text, url: link, title: 'FLIPPO' });
          return;
        }
      } catch (e) { if (e && e.name === 'AbortError') return; }
      copy();
    }, 'image/png');
  }

  // ------------------------------------------------------------------ cosmetics
  let skinTab = 'chars';
  // 🎁 build 39: the premium cards play their idle / run loop live while the skins screen is open
  const premCards = [];
  let premLoop = 0;
  function premTick(ts) {
    premLoop = 0;
    if (UI.screen !== 'skins' || !premCards.length) return;
    const tt = ts / 1000;
    for (const c of premCards) {
      if (!c.cv.isConnected) continue;
      const g = c.cv.getContext('2d');
      g.clearRect(0, 0, c.cv.width, c.cv.height);
      if (skinTab === 'chars') FF.drawFlippo(g, 4, 6, { skin: c.it, face: c.eq ? 'joy' : tt % 3.1 < 0.12 ? 'blink' : 'run', foot: Math.floor(tt * 6) & 1, t: tt, aura: 0.3 + 0.3 * Math.sin(tt * 0.8) });
      else {
        for (let i = 0; i < 6; i++) { g.fillStyle = c.it.colors[(i + Math.floor(tt * 8)) % c.it.colors.length]; g.fillRect(i * 2, 11 + Math.round(Math.sin(i + tt * 5) * 2), 2, 2); }
        FF.drawFlippo(g, 8, 6, { skin: save.skin, face: 'run', foot: Math.floor(tt * 6) & 1 });
      }
    }
    premLoop = requestAnimationFrame(premTick);
  }
  function premStart() { if (!premLoop && premCards.length) premLoop = requestAnimationFrame(premTick); }
  function renderSkins() {
    $('#skinCoins').textContent = save.coins;
    { const all = (skinTab === 'chars' ? FF.SKINS : FF.TRAILS).filter((it) => !it.unlock || (it.unlock !== 'owner' && it.unlock.indexOf('code:') !== 0)), have = all.filter((it) => FF.isUnlocked(it)).length;
      $('#skinCount').textContent = t('collected').replace('{a}', have).replace('{b}', all.length).replace('{p}', Math.round(have * 100 / all.length)); }
    $$('#skins .tab').forEach((b) => b.classList.toggle('on', b.dataset.tab === skinTab));
    const grid = $('#skinGrid');
    grid.innerHTML = '';
    premCards.length = 0;
    const secret = (it) => it.unlock && !it.codeShow && (it.unlock === 'owner' || it.unlock.indexOf('code:') === 0); // code skins stay hidden until redeemed
    const items = (skinTab === 'chars' ? FF.SKINS : FF.TRAILS).filter((it) => !secret(it) || FF.isUnlocked(it));
    if (skinTab === 'chars') renderShop(grid);
    // grouped by rarity: ICON first, then DIAMOND, RARE and DIRT
    const sorted = [];
    for (const r of FF.RARITIES) {
      const group = items.filter((it) => FF.rarityOf(it) === r);
      if (!group.length) continue;
      sorted.push({ head: r });
      sorted.push(...group);
    }
    for (const it of sorted) {
      if (it.head) {
        const h = document.createElement('div');
        h.className = 'rarityHead r-' + it.head;
        h.textContent = t('rar_' + it.head);
        grid.appendChild(h);
        continue;
      }
      const owned = FF.isUnlocked(it);
      const eq = skinTab === 'chars' ? save.skin === it.id : save.trail === it.id;
      const card = document.createElement('div');
      card.className = 'card r-' + FF.rarityOf(it) + (eq ? ' equipped' : '') + (owned ? '' : ' locked');
      const cv = FF.makeCanvas(20, 22);
      const g = cv.getContext('2d');
      if (skinTab === 'chars') FF.drawFlippo(g, 4, 6, { skin: it, face: eq ? 'joy' : 'run', foot: 0, t: 0.5, aura: it.prem ? 0.3 : 0 });
      else {
        const cols = it.colors || { none: [], pixel: ['#ff5a3c', '#ff9a6b', '#ffd0b0'], spark: ['#fff', '#ffd23f'], rainbow: ['#ff3355', '#ffb000', '#ffd23f', '#7dffb2', '#27d7ff', '#b45cff'], echo: ['rgba(184,243,255,.5)'], comet: ['#ffffff', '#ffe066', '#ff9a3c', '#ff5a3c'], legend: ['#fff6c2', '#ffd23f', '#ffb000', '#ff6a1a'], matrix: ['#00ff66', '#b8ffd2', '#0f6a30'], infinity: ['#2a8aff', '#7fe8ff', '#b050ff', '#ffffff'] }[it.id] || ['#ffffff'];
        for (let i = 0; i < 5 && cols.length; i++) { g.fillStyle = cols[i % cols.length]; g.fillRect(i * 2, 11 + Math.round(Math.sin(i) * 2), 2, 2); }
        FF.drawFlippo(g, 8, 6, { skin: save.skin, face: 'run', foot: 0 });
      }
      if (it.prem) { cv.dataset.prem = it.id; premCards.push({ cv, it, eq }); }
      card.appendChild(cv);
      const nm = document.createElement('div');
      nm.className = 'nm';
      nm.textContent = it.name;
      card.appendChild(nm);
      const info = document.createElement('div');
      if (eq) { info.className = 'pr'; info.textContent = t('equipped'); }
      else if (owned) { info.className = 'pr'; info.textContent = t('equip'); }
      else if (it.unlock) {
        info.className = 'lk';
        info.textContent = unlockLabel(it);
      } else { info.className = 'pr'; info.textContent = '● ' + it.cost; }
      card.appendChild(info);
      card.onclick = () => {
        if (owned) {
          if (skinTab === 'chars') save.skin = it.id; else save.trail = it.id;
          sound('ui');
          if (it.id === 'ivoid' && skinTab === 'chars') { sound('unlock'); toast(t('bossEquip')); UI.voidBurst = 1; } // ✦ its transformation burst
        } else if (!it.unlock && skinTab === 'chars') {
          if (save.coins >= it.cost) {
            save.coins -= it.cost;
            save.owned[it.id] = 1;
            save.skin = it.id;
            sound('record');
          } else { toast(t('notEnough')); sound('uiBack'); }
        } else if (it.codeShow) { sound('ui'); showCode('redeem'); return; } // 🎁 locked premium: straight to the code box
        else sound('uiBack');
        persist();
        renderSkins();
        if (UI.voidBurst) { UI.voidBurst = 0; grid.classList.remove('voidBurst'); void grid.offsetWidth; grid.classList.add('voidBurst'); }
      };
      grid.appendChild(card);
    }
    premStart();
  }

  // 🛒 TODAY'S SHOP (coins only, everything shown before you buy): 4 skins at -30% and one bundle of 3 at -25%,
  // the same for everyone on a day, new every day. Earn-only skins are never sold.
  function shopToday() {
    const day = FF.todayKey(), r = FF.mulberry32(FF.hashStr('shop-' + day));
    const pool = FF.SKINS.filter((s) => !s.unlock && s.cost > 0);
    const pick = (n, from) => { const a = from.slice(), out = []; while (out.length < n && a.length) out.push(a.splice(Math.floor(r() * a.length), 1)[0]); return out; };
    const deals = pick(4, pool);
    const bundle = pick(3, pool.filter((s) => deals.indexOf(s) < 0));
    const round = (v) => Math.max(10, Math.round(v / 10) * 10);
    return { deals: deals.map((s) => ({ s, price: round(s.cost * 0.7) })), bundle, bundlePrice: round(bundle.reduce((a, s) => a + s.cost, 0) * 0.75) };
  }
  function renderShop(grid) {
    const sh = shopToday();
    const h = document.createElement('div');
    h.className = 'rarityHead r-shop';
    const left = Math.max(1, Math.ceil((new Date(new Date().setHours(24, 0, 0, 0)) - new Date()) / 3600000));
    h.textContent = t('shopToday').replace('{h}', left);
    grid.appendChild(h);
    const buy = (cost, ids) => {
      if (save.coins < cost) { toast(t('notEnough')); sound('uiBack'); return; }
      save.coins -= cost;
      for (const id of ids) save.owned[id] = 1;
      save.skin = ids[0];
      sound('record'); persist(); renderSkins();
    };
    for (const d of sh.deals) {
      const owned = !!save.owned[d.s.id];
      const card = document.createElement('div');
      card.className = 'card deal r-' + FF.rarityOf(d.s) + (owned ? '' : ' locked');
      const cv = FF.makeCanvas(20, 22);
      FF.drawFlippo(cv.getContext('2d'), 4, 6, { skin: d.s, face: 'run', foot: 0, t: 0.5 });
      card.appendChild(cv);
      card.insertAdjacentHTML('beforeend', '<div class="nm">' + d.s.name + '</div><div class="pr">' + (owned ? '✓' : '<s>' + d.s.cost + '</s> ● ' + d.price) + '</div><i class="dealTag">' + t('shopDeal') + '</i>');
      card.onclick = () => { if (owned) { save.skin = d.s.id; sound('ui'); persist(); renderSkins(); } else buy(d.price, [d.s.id]); };
      grid.appendChild(card);
    }
    if (sh.bundle.length === 3) {
      const all = sh.bundle.every((s) => save.owned[s.id]);
      const card = document.createElement('div');
      card.className = 'card bundle r-diamond' + (all ? '' : ' locked');
      const cv = FF.makeCanvas(52, 22), g = cv.getContext('2d');
      sh.bundle.forEach((s, i) => FF.drawFlippo(g, 2 + i * 17, 6, { skin: s, face: 'run', foot: 0, t: 0.5 }));
      card.appendChild(cv);
      const full = sh.bundle.reduce((a, s) => a + s.cost, 0);
      card.insertAdjacentHTML('beforeend', '<div class="nm">' + t('bundle') + '</div><div class="pr">' + (all ? '✓' : '<s>' + full + '</s> ● ' + sh.bundlePrice) + '</div>');
      card.onclick = () => { if (!all) { buy(sh.bundlePrice, sh.bundle.map((s) => s.id)); toast(t('bundleDone')); } };
      grid.appendChild(card);
    }
  }

  function renderAch() {
    $('#achList').innerHTML = ACH.map((a) => {
      const done = !!save.ach[a.id];
      const tx = a[lang()];
      return '<div class="item' + (done ? ' done' : '') + '"><div class="ico">' + (done ? '★' : '?') + '</div><div class="txt">' + tx[0] + '<small>' + tx[1] + '</small></div></div>';
    }).join('');
  }


  function renderHowto() {
    const ar = lang() === 'ar';
    const rows = ar ? [
      ['☝', 'ضغطة واحدة', 'اضغط في أي مكان: تنقلب الجاذبية بين الأرض والسقف.'],
      ['◐', 'عالمان', 'كل قلبة تبدّل العالم: <b style="color:#27d7ff">أزرق</b> عند الأرض و<b style="color:#b45cff">بنفسجي</b> عند السقف. الأشياء الملوّنة صلبة فقط في عالمها.'],
      ['✓', 'Perfect Flip', 'اقلب في آخر لحظة آمنة قبل الخطر. العلامات الخضراء تريك النافذة.'],
      ['≈', 'Near Miss', 'مرّ قريبًا جدًا من الخطر دون لمسه.'],
      ['×3', 'الكومبو', 'كل حركة مهارية ترفع السلسلة: ×2 ثم ×3. تهبط تدريجيًا إن توقفت.'],
      ['⚡', 'Frenzy', 'املأ الشريط لتحصل على 6 ثوانٍ: نقاط ×2 وجذب للعملات.'],
      ['◆', 'المفترق', 'الممر المعلّم بـ x5 خطر وفيه جواهر ×5. اختر بشجاعة… أو بأمان.'],
      ['?', 'سر', 'في الممرات الهادئة قد تظهر بوابة «?» نادرة. مرّ عبرها من المنتصف!'],
      ['↑', 'المراحل', 'كل 400م مرحلة جديدة ومكافأة. من المرحلة 3 كل مرحلة ممكن تجيب مفاجأة: جاذبية خفيفة، جاذبية تقيلة، تيربو، عملات ×2، أو ممرات أضيق. بعد 2.5كم يبدأ الـOverdrive والسرعة تفضل تزيد!'],
      ['▭', 'منصات وعقبات جديدة', 'مصعد، منصة هشّة، جسر وامض، نطّاط، مروحة، بوابة تسريع — ومنشار، شوك قافز، كرة دوّارة، بندول. كل واحدة بتتشرح أول ما تظهر.'],
      ['✎', 'صانع المراحل', 'اصنع مرحلتك بالأدوات، جرّبها، وخلي البوت يتأكد إنها قابلة للعبور، وبعدين ابعت الكود لصحابك.']
    ] : [
      ['☝', 'One tap', 'Tap anywhere: gravity flips between floor and ceiling.'],
      ['◐', 'Two worlds', 'Every flip swaps the world: <b style="color:#27d7ff">blue</b> on the floor, <b style="color:#b45cff">purple</b> on the ceiling. Coloured things are solid only in their own world.'],
      ['✓', 'Perfect Flip', 'Flip at the last safe moment before danger. Green marks show the window.'],
      ['≈', 'Near Miss', 'Pass really close to danger without touching.'],
      ['×3', 'Combo', 'Every skill move grows your chain: x2 then x3. It eases down if you stop.'],
      ['⚡', 'Frenzy', 'Fill the bar for 6 seconds of x2 score and coin magnet.'],
      ['◆', 'Fork', 'The x5 lane is risky with x5 gems. Choose brave… or safe.'],
      ['?', 'Secret', 'Calm stretches may hide a rare “?” portal. Fly through its middle!'],
      ['↑', 'Stages', 'A new stage every 400m with a reward. From stage 3, a stage may bring a twist: low gravity, heavy gravity, turbo, gold x2 or tight spacing. After 2.5km Overdrive kicks in and speed keeps climbing!'],
      ['▭', 'New platforms & obstacles', 'Lift, crumbling platform, blinking bridge, bumper, fan, dash gate — plus saw, pop spikes, orbit ball and pendulum. Each one is explained the first time it shows up.'],
      ['✎', 'Level Maker', 'Build your own level with the tools, test it, let the bot verify it is beatable, then share the code with friends.']
    ];
    $('#howtoList').innerHTML = rows.map((r) => '<div class="item"><div class="ico">' + r[0] + '</div><div class="txt"><b>' + r[1] + '</b><small>' + r[2] + '</small></div></div>').join('');
  }

  let settingsReturn = 'home';
  function renderSettings() {
    const s = save.settings;
    if (s.amb2 === undefined) s.amb2 = false; // b45: the duel's background ambience is OFF by default for everyone (the owner: it was annoying); it can be turned on
    const sw = (k) => '<button class="switch' + (s[k] ? ' on' : '') + '" data-sw="' + k + '">' + (s[k] ? t('on') : t('off')) + '</button>';
    $('#setList').innerHTML =
      '<div class="set"><span>' + t('sfx') + '</span><input type="range" min="0" max="1" step="0.05" value="' + s.sfx + '" data-rg="sfx"></div>' +
      '<div class="set"><span>' + t('ui') + '</span><input type="range" min="0" max="1" step="0.05" value="' + s.ui + '" data-rg="ui"></div>' +
      '<div class="set"><span>' + t('amb') + '</span>' + sw('amb2') + '</div>' +
      '<div class="set"><span>' + t('mute') + '</span>' + sw('muted') + '</div>' +
      '<div class="set"><span>' + t('vib') + '</span>' + sw('vibration') + '</div>' +
      '<div class="set"><span>' + t('reduce') + '</span>' + sw('reduceFx') + '</div>' +
      '<div class="set"><span>' + t('cbMode') + '</span>' + sw('cb') + '</div>' +
      '<div class="set"><span>' + t('guides') + '</span>' + sw('guides') + '</div>' +
      '<div class="set"><span>' + t('hand') + '</span><button class="switch on" data-act2="hand">' + (s.hand === 'left' ? t('handL') : t('handR')) + '</button></div>' +
      '<div class="set"><span>' + t('lang') + '</span><button class="switch on" data-act2="lang">' + (s.lang === 'ar' ? 'العربية' : 'English') + '</button></div>' +
      '<div class="set"><span>' + t('saveRow') + '</span><button class="switch on" data-act2="saveOut">' + t('saveOut') + '</button><button class="switch on" data-act2="saveIn">' + t('saveIn') + '</button></div>' +
      (save.owner ? ownerPanel() : '');
    $$('#setList [data-sw]').forEach((b) => (b.onclick = () => {
      const k = b.dataset.sw;
      s[k] = !s[k];
      afterSettings();
    }));
    $$('#setList [data-rg]').forEach((r) => (r.oninput = () => {
      s[r.dataset.rg] = parseFloat(r.value);
      FF.audio.setVolumes({ sfx: s.sfx, ui: s.ui });
      persist();
    }));
    $$('#setList [data-rg]').forEach((r) => (r.onchange = () => sound(r.dataset.rg === 'ui' ? 'ui' : 'flip') /* b66: test the SFX volume with the flip, not the quietest sound (coin) */));
    $$('#setList [data-act2]').forEach((b) => (b.onclick = () => {
      if (b.dataset.act2 === 'saveOut' || b.dataset.act2 === 'saveIn') { sound('ui'); showCode(b.dataset.act2); return; }
      if (b.dataset.act2 === 'hand') s.hand = s.hand === 'left' ? 'right' : 'left';
      else s.lang = s.lang === 'ar' ? 'en' : 'ar';
      afterSettings();
    }));
  }
  // only the owner's code shows this. Powers are for testing; such runs are never counted.
  function ownerPanel() {
    const o = save.ownerCfg || (save.ownerCfg = { god: false, speed: 1, stage: 1, hit: false });
    const b = (k, on, label) => '<button class="switch' + (on ? ' on' : '') + '" data-own="' + k + '">' + label + '</button>';
    return '<div class="set ownerHead"><span>' + t('ownerT') + '</span></div>' +
      '<div class="set"><span>' + t('oMaker') + '</span>' + b('maker', true, '🛠 ' + t('open')) + '</div>' +
      '<div class="set"><span>' + t('oGod') + '</span>' + b('god', o.god, o.god ? t('on') : t('off')) + '</div>' +
      '<div class="set"><span>' + t('oSpeed') + '</span>' + b('speed', o.speed !== 1, '×' + o.speed) + '</div>' +
      '<div class="set"><span>' + t('oStart') + '</span>' + b('stage', o.stage > 1, String(o.stage)) + '</div>' +
      '<div class="set"><span>' + t('oEnd') + '</span>' + b('ending', true, t('watch')) + '</div>' +
      '<div class="set"><span>' + t('oHit') + '</span>' + b('hit', o.hit, o.hit ? t('on') : t('off')) + '</div>' +
      '<div class="set"><span>' + t('oCoins') + '</span>' + b('coins', true, '+10K') + '</div>' +
      '<p class="note ownerNote">' + t('oNote') + '</p>';
  }
  document.addEventListener('click', (e) => {
    const btn = e.target.closest && e.target.closest('[data-own]');
    if (!btn || !save.owner) return;
    const o = save.ownerCfg;
    const k = btn.dataset.own;
    if (k === 'god') o.god = !o.god;
    else if (k === 'hit') o.hit = !o.hit;
    else if (k === 'speed') { const L = [1, 1.25, 1.5, 0.5, 0.75]; o.speed = L[(L.indexOf(o.speed) + 1) % L.length]; }
    else if (k === 'stage') { const L = [1, 5, 10, 15, 18, 20]; o.stage = L[(L.indexOf(o.stage) + 1) % L.length]; }
    else if (k === 'coins') { save.coins += 10000; toast('+10,000 ●'); }
    else if (k === 'maker') { sound('ui'); FF.StageMaker.open(); return; }
    else if (k === 'ending') {
      // a few seconds before the last stage line, shielded: you see the victory lap + COMING SOON (never counted, no reward)
      UI.watchEnding();
      return;
    }
    persist();
    renderSettings();
    sound('ui');
  });
  function afterSettings() {
    const s = save.settings;
    FF.audio.setVolumes({ sfx: s.sfx, ui: s.ui, muted: s.muted });
    FF.cbMode = !!s.cb;
    persist();
    applyLang();
    renderSettings();
    sound('ui');
  }

  // ------------------------------------------------------------------ level maker
  const E = FF.Editor;
  function lvCanvas(lv) {
    const cv = FF.makeCanvas(64, 24);
    const g = cv.getContext('2d');
    const w = FF.worldById(lv.world);
    g.fillStyle = w.surface.base;
    g.fillRect(0, 0, 64, 24);
    g.fillStyle = w.surface.dark;
    g.fillRect(0, 3, 64, 18);
    for (const it of lv.items) {
      const x = Math.round((it.x / lv.len) * 63);
      const y = it.y === undefined ? 12 : Math.round(((it.y - FF.C) / (FF.F - FF.C)) * 18) + 3;
      g.fillStyle = it.k === 'coin' || it.k === 'gem' ? FF.COLORS.coin : /B$/.test(it.k) ? FF.COLORS.blue : /P$/.test(it.k) ? FF.COLORS.purple : it.k === 'pad' ? '#39ff88' : FF.COLORS.hazard;
      if (it.y === undefined) g.fillRect(x, 3, 1, 18); else g.fillRect(x, y, 1, 1);
    }
    return cv;
  }
  let pendingDelete = null;
  function renderLevels() {
    const list = $('#levelList');
    list.innerHTML = '';
    const add = (lv, mine) => {
      const d = document.createElement('div');
      d.className = 'item lvItem';
      const ico = document.createElement('div');
      ico.className = 'ico';
      ico.style.width = 'calc(var(--u) * 32)';
      const cv = lvCanvas(lv);
      cv.style.width = '100%';
      cv.style.imageRendering = 'pixelated';
      ico.appendChild(cv);
      d.appendChild(ico);
      const tx = document.createElement('div');
      tx.className = 'txt';
      tx.innerHTML = '<b></b>' + (lv.verified ? '<span class="badge">' + t('verified') + '</span>' : '') + (lv.cleared ? '<span class="badge star">★ ' + (lv.best || 0) + '</span>' : '') +
        '<small>' + FF.worldById(lv.world)[lang() === 'ar' ? 'nameAr' : 'name'] + ' · ' + lv.len / 10 + (lang() === 'ar' ? 'م' : 'm') + ' · ' + lv.items.length + '</small>';
      tx.querySelector('b').textContent = lv.name;
      d.appendChild(tx);
      const acts = document.createElement('div');
      acts.className = 'acts';
      const btn = (label, cls, fn) => { const b = document.createElement('button'); b.textContent = label; if (cls) b.className = cls; b.onclick = (e) => { e.stopPropagation(); fn(b); }; acts.appendChild(b); };
      btn('▶', 'play', () => startGame('custom', { custom: lv }));
      btn(mine ? '✎' : t('remix'), '', () => {
        const copy = JSON.parse(JSON.stringify(lv));
        if (!mine) { copy.id = null; copy.featured = false; copy.name = (lv.name + ' RMX').slice(0, 20); copy.verified = false; }
        openEditor(copy);
      });
      btn('⤴', '', () => showCode('share', lv));
      if (mine) btn('🗑', '', (b) => {
        if (pendingDelete !== lv.id) { pendingDelete = lv.id; toast(t('delConfirm')); return; }
        save.levels = save.levels.filter((x) => x.id !== lv.id);
        persist();
        sound('uiBack');
        renderLevels();
      });
      d.appendChild(acts);
      list.appendChild(d);
    };
    const h1 = document.createElement('div');
    h1.className = 'sector';
    h1.textContent = t('mine');
    list.appendChild(h1);
    if (!save.levels.length) {
      const n = document.createElement('p');
      n.className = 'note';
      n.textContent = t('noLevels');
      list.appendChild(n);
    }
    save.levels.forEach((lv) => add(lv, true));
    const h2 = document.createElement('div');
    h2.className = 'sector';
    h2.textContent = t('featured');
    list.appendChild(h2);
    E.FEATURED.forEach((lv) => add(lv, false));
  }

  // The game owner's private code: unlocks every skin, trail, achievement and Adventure level,
  // plus the Legend gear and crown. Nothing about the code lives in the game: the server checks it (ff_admin).
  function becomeOwner() {
    save.owner = true;
    for (const it of FF.SKINS.concat(FF.TRAILS)) save.owned[it.id] = 1;
    for (const a of ACH) save.ach[a.id] = save.ach[a.id] || Date.now();
    save.coins += 99999;
    save.skin = 'emperor';
    save.trail = 'royal';
    persist();
    return true;
  }
  // personal gift codes: only their hashes live here. Each unlocks its own items and equips them.
  const GIFTS = [
    { h1: 1648376504, h2: 1504675043, key: 'ys', skin: 'hacker', trail: 'matrix', msg: 'redeemYs' },
    { h1: 3966399205, h2: 1604992100, key: 'gh', skin: 'sorcerer', trail: 'infinity', msg: 'redeemGh' },
    // 🎁 the four premium ICON skins (each with its trail and an unlock cinematic). Build 41: hashed after norm() below
    // (O→0, I→1), so a code typed with the letter O for zero (or I for one) still works. Both code generations unlock them.
    { h1: 504071472, h2: 4271791909, n: 1, key: 'jp', skin: 'jackpot', trail: 'jackpot', reveal: true },
    { h1: 775055686, h2: 1700711921, n: 1, key: 'bw', skin: 'bwarden', trail: 'bwarden', reveal: true },
    { h1: 1207966891, h2: 2478137702, n: 1, key: 'ws', skin: 'wshinobi', trail: 'wshinobi', reveal: true },
    { h1: 369898089, h2: 4046508062, n: 1, key: 'ct', skin: 'ctyrant', trail: 'ctyrant', reveal: true },
    { h1: 2776645281, h2: 3692093580, n: 1, key: 'jp', skin: 'jackpot', trail: 'jackpot', reveal: true },
    { h1: 583015241, h2: 2429510128, n: 1, key: 'bw', skin: 'bwarden', trail: 'bwarden', reveal: true },
    { h1: 3367622147, h2: 3715569462, n: 1, key: 'ws', skin: 'wshinobi', trail: 'wshinobi', reveal: true },
    { h1: 2505746299, h2: 2308346128, n: 1, key: 'ct', skin: 'ctyrant', trail: 'ctyrant', reveal: true }
  ];
  function giftCode(text) {
    const c = String(text || '').trim().toUpperCase().replace(/\s+/g, '');
    const norm = c.replace(/O/g, '0').replace(/I/g, '1'); // forgiving: O/0 and I/1 mix-ups
    const gft = GIFTS.find((x) => { const k = x.n ? norm : c; return FF.hashStr('ff-code#' + k) === x.h1 && FF.hashStr(k + '#ff-gift') === x.h2; });
    if (!gft) return null;
    save.codes = save.codes || {};
    save.codes[gft.key] = Date.now();
    save.skin = gft.skin;
    save.trail = gft.trail;
    persist();
    if (gft.reveal) return { msg: gft.msg, skin: gft.skin };
    return gft.msg;
  }
  // 🎁 build 39: the premium unlock cinematic (~4 s, tap to skip). Dark stage → light converges → his silhouette rises →
  // a flash (skipped with reduce-effects) → full colour with a squash-and-stretch pop, his aura ramping to full power,
  // his own flourish (777 reel / blood rings / wind spiral / embers), then the name. Sound effects only, no music.
  UI.premiumReveal = function (id) {
    const P = FF.PREMIUM[id], sk = FF.skinById(id);
    if (!P) return;
    const old = $('#premReveal'); if (old) old.remove();
    const W = 320, H = 180, cv = FF.makeCanvas(W, H), ctx = cv.getContext('2d');
    cv.id = 'premReveal';
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated;z-index:60;cursor:pointer';
    $('#stage').appendChild(cv);
    const red = !!save.settings.reduceFx, buf = FF.makeCanvas(56, 48), bg = buf.getContext('2d');
    const sil = FF.makeCanvas(56, 48), sg = sil.getContext('2d');
    const t0 = performance.now(), END = 4.4;
    let done = false, s1 = false, s2 = false, s3 = false;
    const finish = () => { if (done) return; done = true; cv.remove(); UI.revealing = null; };
    UI.revealing = id;
    cv.addEventListener('pointerdown', (e) => { e.stopPropagation(); if ((performance.now() - t0) / 1000 > 0.4) finish(); });
    const easeBack = (k) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
    const frame = () => {
      if (done) return;
      const T = (performance.now() - t0) / 1000;
      if (T > END) { finish(); return; }
      if (!s1 && T > 0.15) { s1 = true; sound('warp'); }
      if (!s2 && T > 1.5) { s2 = true; sound('unlock'); sound('impact'); }
      if (!s3 && T > 2.4) { s3 = true; sound('record'); }
      const fadeOut = T > END - 0.35 ? (END - T) / 0.35 : 1;
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = Math.min(1, T / 0.3) * fadeOut;
      ctx.fillStyle = P.bg; ctx.fillRect(0, 0, W, H);
      const cx = W / 2, cy = 82;
      // light streaks converging on the centre, then bursting outward once he appears
      for (let i = 0; i < 28; i++) {
        const a = i / 28 * Math.PI * 2 + i * 0.37, conv = T < 1.5, ph = conv ? (T * 1.4 + i * 0.13) % 1 : ((T - 1.5) * 0.9 + i * 0.07) % 1;
        const r = conv ? 170 * (1 - ph) : 30 + ph * 170, L = conv ? 10 + 16 * ph : 6 + 20 * (1 - ph);
        ctx.fillStyle = i % 3 ? P.col : P.col2;
        ctx.globalAlpha = (conv ? 0.25 + 0.5 * ph : 0.45 * (1 - ph)) * fadeOut;
        for (let k = 0; k < L; k += 2) ctx.fillRect(Math.round(cx + Math.cos(a) * (r + k)), Math.round(cy + Math.sin(a) * (r + k) * 0.6), 2, 1);
      }
      ctx.globalAlpha = fadeOut;
      // him: drawn small with his live aura, then scaled up ×3, pixel-perfect
      bg.clearRect(0, 0, 56, 48);
      const lit = T >= 1.5, auraK = lit ? Math.min(1.25, (T - 1.5) / 1.1 * 1.25) : 0;
      const face = T < 2.2 && lit ? 'joy' : lit ? (T % 1.2 < 0.6 ? 'run' : 'focus') : 'idle';
      FF.drawFlippo(bg, 22, 20, { skin: sk, face, foot: lit ? Math.floor(T * 7) & 1 : 0, t: T, aura: auraK, perf: id === 'jackpot' && T > 1.7 ? T - 1.7 : undefined });
      let sc = 3, sxk = 1, syk = 1, rise = 0;
      if (!lit) { const k = FF.clamp((T - 0.6) / 0.9, 0, 1); rise = (1 - easeBack(k)) * 24; sc = 3 * (0.6 + 0.4 * k); }
      else if (T < 1.85) { const k = (T - 1.5) / 0.35; sxk = 1 + 0.3 * (1 - easeBack(k)); syk = 1 - 0.3 * (1 - easeBack(k)); }
      ctx.imageSmoothingEnabled = false;
      const dw = 56 * sc * sxk, dh = 48 * sc * syk, dx = Math.round(cx - dw / 2), dy = Math.round(cy - dh / 2 + rise);
      if (T > 0.6 && !lit) {
        // the silhouette: his shape in pure theme colour, rimmed with light
        sg.clearRect(0, 0, 56, 48); sg.globalCompositeOperation = 'source-over'; sg.drawImage(buf, 0, 0);
        sg.globalCompositeOperation = 'source-in'; sg.fillStyle = '#000000'; sg.fillRect(0, 0, 56, 48); sg.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = FF.clamp((T - 0.6) / 0.4, 0, 1) * fadeOut;
        ctx.fillStyle = P.col;
        ctx.drawImage(sil, dx - 2, dy, dw, dh); ctx.drawImage(sil, dx + 2, dy, dw, dh);
        ctx.globalCompositeOperation = 'source-atop'; ctx.fillRect(dx - 2, dy, dw + 4, dh); ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(sil, dx, dy, dw, dh);
        ctx.globalAlpha = fadeOut;
      } else if (lit) {
        if (!red && T < 1.75) { const sh = Math.round((1.75 - T) * 16); ctx.translate((T * 97 % 2 > 1 ? 1 : -1) * sh, 0); } // a short screen shake on the reveal
        ctx.drawImage(buf, dx, dy, dw, dh);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      if (lit && !red && T < 1.8) { ctx.globalAlpha = (1 - (T - 1.5) / 0.3) * 0.9; ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = fadeOut; }
      // the name and the ICON badge
      if (T > 2.0) {
        const k = FF.clamp((T - 2.0) / 0.3, 0, 1);
        ctx.globalAlpha = k * fadeOut;
        FF.font.draw(ctx, 'ICON', cx, 140 - Math.round((1 - k) * 6), { color: '#ffd23f', align: 'center', outline: '#05060d' });
        FF.font.draw(ctx, sk.name, cx, 150 - Math.round((1 - k) * 8), { color: P.col, align: 'center', outline: '#05060d', scale: 2 });
        if (T > 2.4) FF.font.draw(ctx, 'NEW SKIN AND ' + FF.trailById(id).name, cx, 168, { color: '#ffffff', align: 'center', outline: '#05060d' });
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };
  // gifts from the server are kept in the save, so they keep working offline and after updates
  function addRemoteGift(g) {
    const skin = g.skin ? FF.registerSkin(g.skin) : null;
    const trail = g.trail ? FF.registerTrail(g.trail) : null;
    if (!skin && !trail) return null;
    save.codes = save.codes || {};
    save.gifts = (save.gifts || []).filter((x) => !((skin && x.skin && x.skin.id === skin.id) || (trail && x.trail && x.trail.id === trail.id)));
    save.gifts.push({ skin: g.skin || null, trail: g.trail || null });
    if (skin) { save.codes[skin.id] = Date.now(); save.skin = skin.id; }
    if (trail) { save.codes[trail.id] = Date.now(); save.trail = trail.id; }
    persist();
    return [skin, trail].filter(Boolean);
  }
  for (const g of save.gifts || []) { if (g.skin) FF.registerSkin(g.skin); if (g.trail) FF.registerTrail(g.trail); }
  let codeMode = 'share', codeLevel = null;
  function showCode(mode, lv) {
    codeMode = mode;
    codeLevel = lv || null;
    const ta = $('#codeText');
    if (mode === 'saveOut' || mode === 'saveIn') {
      const out = mode === 'saveOut';
      $('#codeTitle').textContent = t(out ? 'saveOutTitle' : 'saveInTitle');
      $('#codeNote').textContent = t(out ? 'saveOutNote' : 'saveInNote');
      ta.value = out ? saveCode() : '';
      ta.readOnly = out;
      $('#codeOk').textContent = out ? t('copy') : t('saveInBtn');
      show('codeBox');
      return;
    }
    if (mode === 'vsLink') { // ⚔️ no share sheet and no clipboard: show the challenge to copy by hand
      $('#codeTitle').textContent = t('vsClose');
      $('#codeNote').textContent = t('vsCopyNote');
      ta.value = lv;
      ta.readOnly = true;
      $('#codeOk').textContent = t('copy');
      show('codeBox');
      return;
    }
    if (mode === 'redeem') {
      $('#codeTitle').textContent = t('redeemTitle');
      $('#codeNote').textContent = t('redeemNote');
      ta.value = '';
      ta.readOnly = false;
      $('#codeOk').textContent = t('redeemBtn');
      show('codeBox');
      return;
    }
    if (mode === 'share') {
      $('#codeTitle').textContent = t('codeShare') + ' — ' + lv.name;
      $('#codeNote').textContent = t('codeShareNote');
      ta.value = E.encode(lv);
      ta.readOnly = true;
      $('#codeOk').textContent = t('copy');
    } else {
      $('#codeTitle').textContent = t('codeImport');
      $('#codeNote').textContent = t('codeImportNote');
      ta.value = '';
      ta.readOnly = false;
      $('#codeOk').textContent = t('importLevel');
    }
    show('codeBox');
  }
  async function codeOk() {
    const ta = $('#codeText');
    if (codeMode === 'saveIn') {
      const d = readSaveCode(ta.value);
      if (!d) { toast(t('saveBad')); sound('uiBack'); return; }
      for (const k of Object.keys(save)) delete save[k];
      Object.assign(save, JSON.parse(JSON.stringify(DEF)), d);
      save.settings = Object.assign({}, DEF.settings, d.settings || {});
      persist();
      toast(t('saveInOk')); sound('record');
      setTimeout(() => location.reload(), 900); // start fresh with the loaded progress
      return;
    }
    if (codeMode === 'redeem') {
      const gift = giftCode(ta.value);
      if (gift && gift.skin) { // 🎁 a premium skin: its unlock cinematic, then the skins screen with it equipped
        const sk = FF.skinById(gift.skin);
        toast(t('redeemGift') + '<b>' + sk.name + ' & ' + FF.trailById(sk.id).name + '</b>');
        show('skins'); skinTab = 'chars'; renderSkins();
        UI.premiumReveal(sk.id);
        return;
      }
      if (gift) { toast(t(gift)); sound('record'); setTimeout(() => sound('record'), 400); renderSettings(); show('settings'); return; }
      // not built in: maybe a gift made later with the gift maker and stored on the server
      if (!FF.Online.enabled() || window.FF_LINK) { toast(t(window.FF_LINK ? 'onLink' : 'redeemBad')); sound('uiBack'); return; }
      toast(t('redeemWait'));
      let g = null;
      try {
        if (await FF.Online.ownerCheck(ta.value)) {
          becomeOwner();
          toast(t('redeemOk')); sound('record'); setTimeout(() => sound('record'), 400);
          renderSettings(); show('settings');
          return;
        }
        g = await FF.Online.redeem(ta.value);
      } catch (e) { toast(t('redeemNet')); sound('uiBack'); return; }
      const got = g && addRemoteGift(g);
      if (!got) { toast(t('redeemBad')); sound('uiBack'); return; }
      const esc = (s) => String(s).replace(/[<>&"]/g, '');
      toast(g.message ? esc(String(g.message).slice(0, 140)) : t('redeemGift') + '<b>' + esc(got.map((x) => x.name).join(' + ')) + '</b>');
      sound('record'); setTimeout(() => sound('record'), 400);
      show('settings');
      return;
    }
    if (codeMode === 'share' || codeMode === 'saveOut' || codeMode === 'vsLink') {
      const text = ta.value;
      if (window.AndroidBridge && window.AndroidBridge.shareText) { window.AndroidBridge.shareText(text); return; }
      try { await navigator.clipboard.writeText(text); toast(t('copied')); }
      catch (e) { ta.focus(); ta.select(); try { document.execCommand('copy'); toast(t('copied')); } catch (e2) { /* manual copy */ } }
      return;
    }
    const lv = E.decode(ta.value);
    if (!lv) { toast(t('importBad')); sound('uiBack'); return; }
    lv.id = 'L' + Date.now().toString(36);
    save.levels.unshift(lv);
    persist();
    toast(t('importOk') + '<b>' + lv.name.replace(/</g, '') + '</b>');
    sound('record');
    renderLevels();
    show('levels');
  }

  function editorMsg(text) {
    const el = $('#edMsg');
    el.textContent = t('ed' + text.charAt(0).toUpperCase() + text.slice(1)) || text;
    clearTimeout(editorMsg.tm);
    editorMsg.tm = setTimeout(() => { el.textContent = ''; }, 2600);
  }
  UI.editorMsg = editorMsg;

  function buildToolbar() {
    const bar = $('#edTools');
    bar.innerHTML = '';
    const cats = Object.keys(FF.EDITOR_CATS);
    const cb = document.createElement('button');
    cb.className = 'tool cat';
    cb.innerHTML = '<b>' + { danger: '⚠', platform: '▭', reward: '●' }[E.cat] + '</b><span></span>';
    cb.querySelector('span').textContent = t('cats')[E.cat] + ' ⇄';
    cb.onclick = () => { E.cat = cats[(cats.indexOf(E.cat) + 1) % cats.length]; E.tool = FF.EDITOR_CATS[E.cat][0]; sound('ui'); buildToolbar(); };
    bar.appendChild(cb);
    for (const tool of FF.EDITOR_CATS[E.cat]) {
      const b = document.createElement('button');
      b.className = 'tool' + (E.tool === tool ? ' on' : '');
      b.dataset.tool = tool;
      const cv = FF.makeCanvas(16, 16);
      E.drawIcon(cv.getContext('2d'), tool);
      b.appendChild(cv);
      const sp = document.createElement('span');
      sp.textContent = t('tools')[tool];
      b.appendChild(sp);
      b.onclick = () => { E.tool = tool; sound('ui'); buildToolbar(); };
      bar.appendChild(b);
    }
  }
  function refreshEdTop() {
    const d = E.data;
    $('#edName').value = d.name;
    $('#edWorld').textContent = FF.worldById(d.world).idx + ' ' + FF.worldById(d.world)[lang() === 'ar' ? 'nameAr' : 'name'].split(' ')[0];
    $('#edSpeed').textContent = '⚡' + d.speed;
    $('#edVerify').classList.toggle('done', !!d.verified);
  }
  function openEditor(lv) {
    E.open(lv);
    UI.game = null;
    hideHint();
    show('editor');
    buildToolbar();
    refreshEdTop();
    editorMsg('help');
  }
  UI.openEditor = openEditor;
  function saveLevel() {
    const d = E.data;
    d.name = ($('#edName').value || 'MY LEVEL').slice(0, 20);
    if (!d.id) d.id = 'L' + Date.now().toString(36);
    const i = save.levels.findIndex((l) => l.id === d.id);
    const copy = JSON.parse(JSON.stringify(d));
    if (i >= 0) save.levels[i] = Object.assign(save.levels[i], copy); else save.levels.unshift(copy);
    if (d.verified && d.items.length) unlockAch('maker');
    persist();
  }
  const ED = {
    exit: () => { saveLevel(); E.close(); renderLevels(); show('levels'); },
    world: () => {
      const i = FF.WORLDS.findIndex((w) => w.id === E.data.world);
      E.data.world = FF.WORLDS[(i + 1) % FF.WORLDS.length].id;
      E.dirty = true;
      refreshEdTop();
    },
    speed: () => {
      const sp = [100, 120, 140, 160];
      E.data.speed = sp[(sp.indexOf(E.data.speed) + 1) % sp.length] || 120;
      E.data.verified = false;
      refreshEdTop();
    },
    undo: () => { if (E.undoLast()) refreshEdTop(); },
    clear: () => {
      if (!E.data.items.length) return;
      E.undo.push(JSON.stringify(E.data));
      E.data.items = [];
      E.data.verified = false;
      E.dirty = true;
      editorMsg('clear');
      refreshEdTop();
    },
    verify: () => {
      if (!E.data.items.length) { editorMsg('empty'); return; }
      editorMsg('verifying');
      setTimeout(() => {
        const r = E.verify(E.data);
        E.data.verified = r.ok;
        if (r.ok) { E.mark = null; editorMsg('ok'); sound('record'); }
        else {
          E.mark = r;
          E.camX = FF.clamp(r.x - FF.W / 2, -FF.PLAYER_X - 20, E.data.len);
          editorMsg('fail');
          sound('crash');
        }
        refreshEdTop();
      }, 60);
    },
    test: () => { saveLevel(); startGame('custom', { custom: JSON.parse(JSON.stringify(E.data)), fromEditor: true }); },
    testHere: () => {
      saveLevel();
      const sx = Math.max(0, Math.floor((E.camX + FF.PLAYER_X) / 8) * 8);
      startGame('custom', { custom: JSON.parse(JSON.stringify(E.data)), fromEditor: true, startX: sx });
    },
    save: () => { saveLevel(); editorMsg('saved'); sound('line'); }
  };

  // ------------------------------------------------------------------ actions
  const ACT = {
    play: () => (needsTutorial() ? startTutorial() : UI.vs ? playVs() : startGame('endless')),
    vsShare: () => { FF.Online.count('share'); vsShare(); },
    vsPlay: () => ACT.play(),
    tutorial: () => startTutorial(),
    deathReplay: () => deathReplay(),
    shareClip: () => { FF.Online.count('share'); shareClip(); },
    daily: () => (needsTutorial() ? startTutorial() : startGame('daily')),
    boss: () => (needsTutorial() ? startTutorial() : startGame('boss')),
    weekLastGo: () => { $('#weekLast').classList.add('hidden'); ACT.boss(); }, // build 37: this week's challenge is the boss duel
    weekLastClose: () => { $('#weekLast').classList.add('hidden'); },
    zen: () => startGame('zen'),
    skins: () => { renderSkins(); show('skins'); },
    ach: () => { renderAch(); show('ach'); },
    howto: () => { renderHowto(); show('howto'); },
    settings: () => { settingsReturn = UI.screen === 'pause' ? 'pause' : 'home'; renderSettings(); show('settings'); },
    settingsBack: () => { if (UI.game && UI.game.settings) UI.game.settings = save.settings; show(settingsReturn); if (settingsReturn === 'home') refreshHome(); },
    home: () => {
      // in the FLIPNOVA Maker app there is no game menu: "home" is the Stage Maker
      const go = () => { UI.game = null; E.close(); hideHint(); if (FF.MAKER_APP) { FF.StageMaker.open(); return; } refreshHome(); show('home'); };
      if (UI.game && FF.wipe) FF.wipe(go); else go();
    },
    resume: () => { if (UI.game) UI.game.paused = false; show(null); },
    restart: () => startGame(UI.lastMode, UI.lastOpts),
    langToggle: () => { save.settings.lang = lang() === 'ar' ? 'en' : 'ar'; afterSettings(); },
    again: () => {
      if (UI.lastMode === 'campaign' && UI.lastRes && UI.lastRes.finished && UI.nextLevel) startGame('campaign', { level: UI.nextLevel });
      else startGame(UI.lastMode, UI.lastOpts);
    },
    share: () => { FF.Online.count('share'); shareCard(); },
    levels: () => { E.close(); renderLevels(); show('levels'); },
    board: () => { renderBoard(); show('board'); },
    camp: () => {
      if (!UI.game && needsTutorial()) { startTutorial(); return; }
      const go = () => { UI.game = null; hideHint(); renderCamp(); show('camp'); };
      if (UI.game && FF.wipe) FF.wipe(go); else go();
    },
    retry: () => startGame(UI.lastMode, UI.lastOpts),
    redeem: () => showCode('redeem'),
    codeBack: () => { if (codeMode === 'vsLink') show('over'); else if (codeMode === 'redeem' || codeMode === 'saveOut' || codeMode === 'saveIn') show('settings'); else { renderLevels(); show('levels'); } },
    missionsBox: () => { renderMissions($('#missions'), false); show('missionsBox'); },
    newLevel: () => openEditor(null),
    importLevel: () => showCode('import'),
    backToEditor: () => {
      const lv = UI.lastRes && UI.lastRes.custom;
      UI.game = null;
      const saved = lv && save.levels.find((l) => l.id === lv.id);
      openEditor(saved || lv);
    }
  };
  UI.pause = function () {
    if (!UI.game || UI.game.ended || UI.screen) return;
    UI.game.paused = true;
    hideHint();
    show('pause');
    sound('uiBack');
  };
  // Android back button (called from the APK wrapper). Returns true when handled.
  UI.back = function () {
    if (FF.MAKER_APP) {
      if (UI.game && !UI.screen && !UI.game.ended) { UI.pause(); return true; }
      if (UI.screen === 'pause') { UI.act('resume'); return true; }
      if (UI.screen === 'stageMaker') return FF.StageMaker.back(); // false → leave the app
      UI.act('home'); return true;
    }
    if (UI.game && !UI.screen && !UI.game.ended) { UI.pause(); return true; }
    if (UI.screen === 'pause') { UI.act('resume'); return true; }
    if (UI.screen === 'settings') { UI.act('settingsBack'); return true; }
    if (UI.screen === 'editor') { ED.exit(); return true; }
    if (UI.screen === 'codeBox') { UI.act(codeMode === 'redeem' || codeMode === 'saveOut' || codeMode === 'saveIn' ? 'settings' : codeMode === 'vsLink' ? 'codeBack' : 'levels'); return true; }
    if (UI.screen === 'over' && UI.lastMode === 'campaign') { UI.act('camp'); return true; }
    if (UI.screen && UI.screen !== 'home') { UI.act('home'); return true; }
    return false;
  };
  UI.act = function (name) {
    FF.audio.init();
    if (ACT[name]) {
      if (name !== 'play' && name !== 'vsPlay' && name !== 'again' && name !== 'restart' && name !== 'daily' && name !== 'zen') sound(name === 'home' ? 'uiBack' : 'ui');
      ACT[name]();
    }
  };

  UI.init = function () {
    FF.cbMode = !!(save.settings && save.settings.cb);
    if (UI.vs && !FF.MAKER_APP) setTimeout(() => toast(t('vsHello').replace('{n}', UI.vs.name).replace('{s}', UI.vs.score)), 1500);
    setInterval(() => { if (UI.screen === 'home') { weekCard(); bossCard(); } }, 30000); // ⏳ the weekly countdown stays live
    restoreBackup((restored) => { if (FF.MAKER_APP) return; if (restored) { toast(t('savedBack')); refreshHome(); } checkStreak(); });
    // anonymous counter: 'open' (+ 'back' on a later day than this device's first), 'vs_open' for a challenge link
    if (!FF.MAKER_APP) setTimeout(() => { FF.Online.countOpen(); if (UI.vs) FF.Online.count('vs_open'); }, 2000);
    if (!FF.MAKER_APP) setTimeout(legacyAch, 3000); // build 36: the old Legend / 1% achievements come from the Adventure now
    document.addEventListener('visibilitychange', () => { if (!document.hidden && !UI.game && !FF.MAKER_APP) checkStreak(); });
    FF.Online.onSent = (e) => { toast(t('onSent')); if (UI.screen === 'board') renderBoard(); };
    setTimeout(() => FF.Online.flush(), 1500);
    if (!window.FF_LINK && !FF.MAKER_APP) setTimeout(checkUpdate, 2500);
    if (FF.Online.cachedBook()) FF.Online.useBook(FF.Online.cachedBook());
    if (!window.FF_LINK && FF.Online.enabled()) FF.Online.loadBook().catch(() => {});
    window.addEventListener('online', () => FF.Online.flush());
    // ask the browser to keep the save for good (it may otherwise clear site data when space runs low)
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (e) { /* not supported */ }
    FF.audio.setVolumes({ sfx: save.settings.sfx, ui: save.settings.ui, muted: save.settings.muted });
    $$('[data-act]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); UI.act(b.dataset.act); }));
    $$('#skins .tab').forEach((b) => (b.onclick = () => { skinTab = b.dataset.tab; sound('ui'); renderSkins(); }));
    $('#pauseBtn').addEventListener('pointerdown', (e) => { e.stopPropagation(); UI.pause(); });
    $$('[data-ed]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); FF.audio.init(); if (ED[b.dataset.ed]) { if (b.dataset.ed !== 'test' && b.dataset.ed !== 'testHere') sound('ui'); ED[b.dataset.ed](); } }));
    $('#edName').addEventListener('input', () => { if (E.data) E.data.name = $('#edName').value.slice(0, 20); });
    $('#codeOk').addEventListener('click', codeOk);
    let scrollTimer = 0;
    const stopScroll = () => { clearInterval(scrollTimer); scrollTimer = 0; };
    $$('.edArrow').forEach((b) => {
      b.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        const dir = parseInt(b.dataset.scroll, 10);
        E.scroll(dir * 24);
        stopScroll();
        scrollTimer = setInterval(() => E.scroll(dir * 7), 16);
      });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => b.addEventListener(ev, stopScroll));
    });
    const sl = $('#edScroll');
    sl.addEventListener('input', () => { E.sliding = true; E.setScrollFrac(sl.value / 1000); });
    sl.addEventListener('change', () => { E.sliding = false; });
    sl.addEventListener('pointerdown', (e) => e.stopPropagation());
    $$('#boardTabs .tab').forEach((b) => b.addEventListener('click', () => { boardTab = b.dataset.btab; sound('ui'); renderBoard(); }));
    $('#playerName').addEventListener('input', () => {
      save.name = $('#playerName').value.trim().slice(0, 14);
      for (const e of save.scores.concat(save.todayScores.list)) if (!e.custom) e.name = playerName();
      persist();
    });
    $('#playerName').addEventListener('change', () => renderBoard());
    $('#nameSave').addEventListener('click', () => { sound('ui'); saveName(); });
    let toldName = false;
    FF.Online.onNeedName = () => { if (!toldName) { toldName = true; setTimeout(() => toast(t('nameNeedToast')), 1200); } };
    applyLang();
    if (FF.MAKER_APP) {
      document.body.classList.add('makerApp');
      if (!save.makerInit) { save.makerInit = 1; save.settings.lang = 'ar'; persist(); applyLang(); } // the Maker app speaks Egyptian Arabic first
      FF.StageMaker.open(); return;
    }
    show('home');
  };
  UI.persist = persist;
  UI.toast = toast;
  UI.applyLang = () => applyLang();
})(window.FF);
