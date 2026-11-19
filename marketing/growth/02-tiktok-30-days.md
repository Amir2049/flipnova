# FLIPNOVA على TikTok: خطة 30 يوم (من 4 نوفمبر 2026)

الملف ده مبني على `marketing/TIKTOK-PLAYBOOK.md` و`marketing/TIKTOK-QUALITY.md`. أي فيديو هنا لازم يعدّي الـquality bar كلها:
هوك من أول فريم، اللعبة كبيرة ومنوّرة، 15-25 ثانية، رقم واحد بس على الشاشة، SFX بس، end card أقل من 2.5 ثانية، وكل حاجة حقيقية.

**ليه القديم كان وحش؟** اللعبة كانت شريط رفيع، اللاعب صغير، الألوان غامقة، العداد متكرر، 40-48 ثانية، وصوت AI. الخطة دي بتعالج ده:
كل يوم فورمات واضح، هوك مكتوب، لحظة لعب محددة، ورقم واحد بيقرر إذا كنا هنكرر ولا لأ.

## قواعد ثابتة قبل الجدول
- **النص على الشاشة إنجليزي** (الخط pixel وحروفه لاتيني). السطر الكبير 11 حرف بالكتير، الصغير 17 حرف بالكتير، كله CAPS، ومفيش علامة `=`. كل الهوكات تحت اتعدّت بالعدد.
- **الأرقام في الهوك لازم تبقى حقيقية.** لو الهوك فيه "47 TRIES" والمحاولة الحقيقية كانت 52، غيّر الرقم في الكونفيج قبل الرندر. مفيش رقم مفبرك.
- **مفيش engagement مزيف:** لا شراء لايكات/فيوز/فولو، لا حسابات تانية بتعلّق، لا تعليقات "من صاحبي"، لا engagement pods، ولا "follow to win".
- **Caption** = سؤال واحد + 4-5 هاشتاجات. تعليق مثبّت ثابت: `Free, no ads. Link in bio.`
- **الرندر:** `node tools/video/make-tiktok-v3.js <game-root> out.mp4 tools/video/configs/<file>.json`. الكونفيج بياخد `vid` (v3 SAW HELL، v4 DON'T BLINK، v6 THE FLOOR IS LAVA، v8 THE IMPOSSIBLE)، `hook1`، `hook2`، `skin` (زي `flippo`، `gold`، `ghost`، `shadow`)، و`seg`.
  الأيام اللي فيها تسجيل شاشة (Maker، Endless، devlog) بتتسجل يدوي، بس بنفس القواعد: كروب كبير، هوك فريم 1، أقل من 25 ثانية.
- **سجّل بعد 48 ساعة** في `marketing/state/video-results.md`: views، 2s view %، avg watch، finished %، likes، comments، shares، profile visits، والفورمات.
- **ميعاد النشر:** 7-10 بالليل بتوقيت القاهرة كبداية، وغيّره لو الـAnalytics قالت إن المتابعين في وقت تاني.

## الفورمات (10)
| كود | الفورمات | الفكرة باختصار |
|---|---|---|
| F1 | Cold-open 98% fail | نبدأ في نص الخطر عند 95%، موتة 98% بالبطيء مع freeze و"NOOO"، مونتاج فشل، وبعدين الفوز |
| F2 | Rate my run | جرية نضيفة أو مجنونة، والمشاهد يقيّمها من 1 لـ 10 في التعليقات |
| F3 | Comment a number | "اكتب رقم وهحاول العدد ده"، وبعدين فيديو النتيجة الحقيقية |
| F4 | Series: Day N trying THE IMPOSSIBLE | حلقة كل كام يوم، الرقم بيزيد، والمشاهد يرجع يشوف هنعدّيها إمتى |
| F5 | Skin comparison | نفس الحتة بـ3 سكنات: أنهي واحد أصعب في الرؤية / أحلى؟ |
| F6 | Devlog: solo dev from Egypt | Amir بصوته الحقيقي، قصيرة وصريحة، والجيم بلاي في الخلفية |
| F7 | Level Maker reveal | بناء مستوى في Maker بسرعة وبعدين تجربته |
| F8 | Duet / Stitch bait | فيديو معمول عشان الناس تعمل عليه Duet أو Stitch (رد فعل، أو "عدّيها انت") |
| F9 | Weekly challenge reveal / results | تحدي أسبوعي بنعمله على TikTok على مستوى في اللعبة، والنتيجة من الـleaderboard الأونلاين |
| F10 | Arabic version | نفس الفيديو بكابشن وتكست عربي مصري وصوت Amir، موجّه لمصر والخليج |

> **ملحوظة على F9:** مفيش "weekly challenge" جوه اللعبة دلوقتي. التحدي ده بنعمله إحنا على TikTok: نختار مستوى، والناس تلعبه، وفي الآخر نعرض الـleaderboard الحقيقي. مبنقولش إنه feature في اللعبة.
> **ملحوظة على F10:** الخط pixel مش بيكتب عربي، فالهوك الـpixel بيفضل إنجليزي، والسطر العربي يتضاف بأداة Text في TikTok فوق الفيديو.

## الجدول: 30 يوم
"المقياس" هو الرقم اللي بيقرر إذا الفورمات ده هيتكرر، وبنقارنه بالـmedian بتاع آخر 7 فيديوهات (شوف قاعدة الـ48 ساعة تحت).

| يوم | فورمات | هوك سطر 1 | هوك سطر 2 | لحظة اللعب اللي تظهر | سؤال الكابشن | هاشتاجات | المقياس |
|---|---|---|---|---|---|---|---|
| 1 | F1 | `98%. AGAIN.` | `47 TRIES LATER...` | SAW HELL: موتة 98% بالبطيء + freeze "NOOO"، مونتاج TRY 1→12→27→39، وبعدين TRY 47 CLEARED (كونفيج `saw-hookA.json`) | Would you rage quit at 98%? | #flipnova #indiegame #ragegame #mobilegame #fyp | 2s view % + avg watch (ده الـbaseline بتاعنا) |
| 2 | F2 | `RATE MY RUN` | `1 TO 10` | THE FLOOR IS LAVA: جرية واحدة نضيفة من غير موت، و3 flips قريبين جدًا من الحمم بالبطيء | Be honest. What's my score? | #flipnova #ratemyrun #pixelgame #gaming | تعليقات لكل 1000 مشاهدة |
| 3 | F4 | `DAY 1` | `THE IMPOSSIBLE` | THE IMPOSSIBLE (v8): أحسن 5 محاولات من اليوم، آخر لقطة أبعد نقطة وصلناها + "TRY n" الحقيقي | How many days will this take me? | #flipnova #impossiblelevel #indiegame #ragegame | finished % + follows من الفيديو |
| 4 | F6 | `SOLO DEV` | `FROM EGYPT` | Amir بيتكلم 15 ثانية (بالإنجليزي البسيط) فوق جيم بلاي SAW HELL: عملتها لوحدي، مجانية، من غير إعلانات | What should I add next? | #flipnova #indiedev #gamedev #solodev #egypt | profile visits لكل 1000 مشاهدة |
| 5 | F5 | `WHICH SKIN` | `IS HARDEST?` | نفس حتة المناشير في SAW HELL 3 مرات: `flippo`، `ghost`، `shadow` (3 رندرات بنفس الـseg، 5 ثواني لكل واحد) | 1, 2 or 3? | #flipnova #pixelart #mobilegame #gaming | تعليقات + shares |
| 6 | F4 | `DAY 2` | `THE IMPOSSIBLE` | THE IMPOSSIBLE: بنفس شكل يوم 3، والنقطة الجديدة اللي وصلناها | Closer or worse than yesterday? | #flipnova #impossiblelevel #indiegame #ragegame | نسبة المشاهدين اللي جم من Day 1 (returning) + finished % |
| 7 | F9 | `WEEK 1` | `BEAT MY TIME` | SAW HELL: أحسن وقت لـAmir على الشاشة، وبعدين لقطة من الـleaderboard الأونلاين الحقيقي | Can you beat it before Sunday? | #flipnova #challenge #mobilegame #ragegame | تعليقات فيها نتايج + ضغطات اللينك |
| 8 | F3 | `PICK A` | `NUMBER 1-100` | DON'T BLINK (v4): 3 موتات سريعة، وبعدين النص "I TRY THAT MANY" في الآخر | Comment a number. I'll try that many times. | #flipnova #commentanumber #ragegame #gaming | عدد التعليقات اللي فيها أرقام |
| 9 | F10 | `98%. AGAIN.` | `47 TRIES LATER...` | نفس فيديو يوم 1 بالظبط، + تكست TikTok عربي: «٩٨٪ وتاني؟!» + صوت Amir بالمصري في أول ثانيتين | كنت هتكمّل ولا ترمي الموبايل؟ | #flipnova #العاب #جيمر #مصر #ragegame | % مشاهدات من مصر/السعودية + تعليقات عربي |
| 10 | F8 | `STITCH THIS` | `IF YOU PASS IT` | SAW HELL: الفيديو بيقف عند 97% قبل الموتة بفريم، والنص "YOUR TURN" | Stitch me with your best try. | #flipnova #stitch #ragegame #indiegame | عدد الـStitches + shares |
| 11 | F4 | `DAY 3` | `THE IMPOSSIBLE` | THE IMPOSSIBLE: أبعد نقطة جديدة، ولو فيه موتة غبية خليها بالبطيء | What am I doing wrong? | #flipnova #impossiblelevel #indiegame #gaming | finished % مقارنة بـDay 1 و2 |
| 12 | F7 | `I MADE THIS` | `IN 2 MINUTES` | تسجيل Maker متسرّع (×4): أول تايل لحد آخر منشار، وبعدين جرية الاختبار والموتة | Should I make it harder? | #flipnova #leveldesign #gamedev #indiegame | saves + profile visits |
| 13 | F1 | `99%. WHY.` | `DONT BLINK` | DON'T BLINK: cold open عند 95%، موتة 99% بالبطيء + freeze، مونتاج، وبعدين الفوز | Was that my fault or the game's? | #flipnova #ragegame #mobilegame #fyp | avg watch مقارنة بيوم 1 |
| 14 | F9 | `WEEK 1` | `YOUR BEST RUNS` | لقطة الـleaderboard الحقيقي لتحدي SAW HELL (أسماء المستخدمين اللي ظاهرة في اللعبة بس)، ومين كسر وقت Amir | Next week's level? You choose. | #flipnova #challenge #leaderboard #indiegame | تعليقات + اقتراحات مستويات · **يوم مراجعة الأسبوعين** |
| 15 | F3 | `YOU SAID 50` | `SO I TRIED 50` | نتيجة يوم 8: الرقم اللي اتطلب فعلًا (غيّره للرقم الحقيقي الأكثر تكرارًا)، مونتاج كل المحاولات بسرعة، وآخر محاولة بالبطيء | Should I do 100 next? | #flipnova #commentanumber #ragegame #gaming | finished % + تعليقات |
| 16 | F2 | `RATE MY RUN` | `ENDLESS STAGE 20` | Endless: تسجيل شاشة لجرية وصلت لمرحلة 20 (لو مش وصلت حقيقي، حط المرحلة اللي وصلتها) | Out of 10? And what stage are you on? | #flipnova #endless #ratemyrun #mobilegame | تعليقات لكل 1000 + تعليقات فيها مراحل |
| 17 | F4 | `DAY 4` | `THE IMPOSSIBLE` | THE IMPOSSIBLE: أبعد نقطة، وprogress bar أحمر واضح | Will Day 5 be the one? | #flipnova #impossiblelevel #indiegame #ragegame | returning viewers + follows |
| 18 | F6 | `NO ADS.` | `HERE IS WHY` | Amir 15 ثانية: ليه مفيش إعلانات في اللعبة (كلام صادق، من غير وعود)، فوق جيم بلاي LAVA | Would you play a game with ads? | #flipnova #indiedev #noads #gamedev | saves + profile visits |
| 19 | F5 | `FREE SKIN` | `VS GOLDEN` | نفس حتة THE FLOOR IS LAVA بسكن `flippo` وبعدين `gold`، شاشة متقسمة أو ورا بعض | Which one do you pick? | #flipnova #skins #pixelart #mobilegame | shares + تعليقات |
| 20 | F10 | `1 DEV` | `MADE IN EGYPT` | devlog يوم 4 بس Amir بيتكلم مصري، وكابشن وتكست TikTok عربي: «لعبة مصرية، مجانية، من غير إعلانات» | تحب أضيف إيه في اللعبة؟ | #flipnova #مصر #مطور_العاب #العاب #جيمر | profile visits من مصر/الخليج + تعليقات عربي |
| 21 | F9 | `WEEK 2` | `LAVA FLOOR RACE` | THE FLOOR IS LAVA (أو المستوى اللي الناس اختارته يوم 14): وقت Amir + لقطة الـleaderboard | Can you beat it by Sunday? | #flipnova #challenge #mobilegame #ragegame | تعليقات فيها نتايج + ضغطات اللينك |
| 22 | F8 | `DUET THIS` | `SHOW YOUR FACE` | SAW HELL: آخر 6 ثواني قبل موتة 98%، مساحة فاضية واضحة للـduet، النص "WAIT FOR IT" | Duet me with your reaction. | #flipnova #duet #ragegame #gaming | عدد الـDuets + shares |
| 23 | F4 | `DAY 5` | `THE IMPOSSIBLE` | THE IMPOSSIBLE: لو عدّيناها حقيقي = TRY n بالبطيء + CLEARED. لو لأ = أبعد نقطة + "DAY 6 SOON" | Did I finally do it? | #flipnova #impossiblelevel #indiegame #ragegame | finished % + rewatch (avg watch > 100%) |
| 24 | F7 | `YOUR IDEA` | `I BUILD IT` | Maker: Amir بيبني مستوى من فكرة كتبها متابع في التعليقات (اذكر اسمه بس لو وافق)، وبعدين يجرّبه | Drop your level idea below. | #flipnova #leveldesign #gamedev #indiegame | تعليقات فيها أفكار + saves |
| 25 | F1 | `SO CLOSE.` | `THE FLOOR IS LAVA` | THE FLOOR IS LAVA: cold open عند 95%، موتة 98% في الحمم بالبطيء + freeze، مونتاج، فوز | How many tries would you need? | #flipnova #floorislava #ragegame #mobilegame | 2s view % مقارنة بيوم 1 و13 |
| 26 | F10 | `RATE MY RUN` | `1 TO 10` | نفس فيديو يوم 2 + تكست TikTok عربي «قيّمني من ١ لـ ١٠» + صوت Amir مصري | من ١ لـ ١٠ بصراحة؟ | #flipnova #العاب #جيمر #مصر #السعودية | تعليقات عربي لكل 1000 مشاهدة |
| 27 | F3 | `COMMENT A` | `LEVEL NAME` | لقطات 2 ثانية من 4 مستويات (SAW HELL، DON'T BLINK، LAVA، PENDULUM PANIC)، والأكتر تعليقات هيتعمل بكرة أو بعده | Which one should I try 50 times? | #flipnova #commentbelow #ragegame #gaming | تعليقات + تنوع الإجابات |
| 28 | F9 | `WEEK 2` | `RESULTS` | لقطة الـleaderboard الحقيقي لتحدي LAVA، وبعدين reveal المستوى بتاع أسبوع 3 | Ready for week 3? | #flipnova #challenge #leaderboard #indiegame | تعليقات + follows |
| 29 | F6 | `30 DAYS` | `OF POSTING` | Amir 20 ثانية: أرقام حقيقية من الشهر (أحسن فيديو، اللي فشل، اللي اتعلمه) فوق أحسن لقطات الشهر | What should I post more of? | #flipnova #indiedev #gamedev #solodev | follows + profile visits |
| 30 | الأفضل | `ONLY 1%` | `CAN BEAT THIS` | إعادة أحسن فورمات في الشهر (حسب قاعدة الـ48 ساعة) بهوك جديد ومستوى مختلف. لو مفيش فائز واضح: F1 على THE IMPOSSIBLE | Are you the 1%? | #flipnova #ragegame #indiegame #mobilegame #fyp | نفس مقياس الفورمات الفائز، مقابل نسخته الأصلية |

**توزيع الفورمات:** F1 ×3، F2 ×2، F3 ×3، F4 ×5، F5 ×2، F6 ×3، F7 ×2، F8 ×2، F9 ×4، F10 ×3، + يوم 30 للفائز. ده عشان كل فورمات ياخد فرصتين على الأقل قبل ما نحكم عليه.

## قاعدة الـ48 ساعة: نكمّل ولا نوقف؟
**بعد 48 ساعة من النشر** سجّل الأرقام، وقارن كل فيديو بالـ**median بتاع آخر 7 فيديوهات** (أول أسبوع: قارن بيوم 1).
كل فورمات له مقياس أساسي (العمود الأخير). وفيه مقياسين لازم يتشافوا دايمًا: **2s view %** (الهوك) و**avg watch %** (جسم الفيديو).

| النتيجة | القرار |
|---|---|
| المقياس الأساسي ≥ 1.5× الـmedian **و** avg watch مش أقل من الـmedian | **Double down:** اعمل نسختين جداد من نفس الفورمات في الـ5 أيام الجاية (هوك جديد أو مستوى جديد، مش نفس الفيديو). خد مكان أضعف فورمات في الجدول |
| بين 0.8× و1.5× | **كمّل:** الفورمات ياخد فرصته الجاية في الجدول عادي |
| أقل من 0.8× | **فرصة تانية بهوك مختلف** (غيّر أول 3 ثواني بس، الجسم زي ما هو). هوك وحش مش معناه فورمات وحش |
| أقل من 0.8× **مرتين ورا بعض** بهوكين مختلفين | **Drop:** الفورمات يطلع من الجدول، وخلّي مكانه لأحسن فورمات |

**قواعد عشان منضحكش على نفسنا:**
- لو الفيديو جاب أقل من 500 مشاهدة، النسب مش موثوقة. متحكمش عليه لوحده؛ استنى الفرصة الجاية.
- **2s view % واطي = الهوك المشكلة.** avg watch واطي والهوك كويس = الجسم ممل؛ افتح retention graph وشوف الثانية اللي الناس بتمشي فيها واقطعها.
- متمسحش فيديوهات ضعيفة، ومتعيدش رفع نفس الفيديو بالظبط. اعمل نسخة جديدة بهوك جديد.
- القرار من الأرقام بس، مش من الإحساس. لو فيديو حلو بس أرقامه واطية، بيطلع برضه.
- يوم 14 ويوم 29: راجع كل الأرقام وحدّث الجدول للأيام الجاية.

## Playbook الرد على التعليقات
**أول 60 دقيقة بعد النشر هي الأهم.** رد على كل تعليق في الساعة الأولى، والرد يكون سؤال لما ينفع عشان المحادثة تكمّل.
كل الردود من Amir نفسه، بأسلوبه. ممنوع حسابات تانية أو ردود من ناس "معانا".

| نوع التعليق | الرد | رد بفيديو؟ |
|---|---|---|
| "too easy" / "I'd beat it first try" | `Free, link in bio. Send me your time.`، وبعدين اعرض أحسن وقت ليه لو بعته فعلًا | آه، لو كذا واحد قالوا كده: "YOU SAID EASY" + جرية حقيقية |
| "what game is this?" / "name?" | `FLIPNOVA. Free, no ads. Link in bio.` | لأ، رد كتابة بسرعة |
| رقم (فيديوهات F3) | `Locked in. Video coming.` ولازم تعمل الفيديو فعلًا | آه، فيديو النتيجة نفسه |
| تقييم (F2) | `A 4?! Rate my next one then.` | لو التقييم واطي ومضحك: آه |
| سؤال عن التطوير / مصر / الأدوات | رد قصير وصادق | آه: ده أحسن مصدر لفيديوهات F6 |
| bug / شكوى | `Thanks, I'm on it. Which phone?` وسجّله | لأ، إلا لو صلّحته: "YOU FOUND IT / I FIXED IT" |
| فكرة مستوى أو سكن | `Saving this. Maybe next Maker video.` | آه في F7 (اذكر اسمه بس لو وافق) |
| تعليق عربي | رد بالمصري | آه، لو كتير: فيديو F10 |
| hate / سخرية | رد واحد خفيف ولطيف أو تجاهل. متتخانقش | لأ |
| spam / إساءة | Delete أو Restrict | لأ |

- **ردود بالفيديو:** 1-2 في اليوم بالكتير، وبتتحسب كفيديو إضافي مش بدل فيديو الجدول. نفس الـquality bar.
- **الـpin:** التعليق المثبت دايمًا `Free, no ads. Link in bio.`. لو فيه تعليق حقيقي من متابع أحسن منه (سؤال مضحك مثلًا)، ثبّته هو.
- **متوعدش بحاجة مش هتعملها:** لا shoutout ولا جوايز. لو قلت "هجرّب رقمك"، لازم تجرّبه.

## الأصوات الـtrending (جوه TikTok بس)
- **الفيديو اللي بيطلع من `make-tiktok-v3.js` فيه SFX بس** (flip ticks، crash، win chime). مفيش أغاني في اللعبة، ولا في ريبو المشروع، ولا في ملف الفيديو.
- **الصوت الـtrending بيتضاف جوه محرر TikTok** وقت النشر بس (Add sound). كده الصوت مترخّص من TikTok جوه المنصة، واللعبة نفسها نضيفة.
- **إزاي تختار:** TikTok Creative Center → Trends → Songs، فلتر Egypt وSaudi Arabia وUS، آخر 7 أيام، واختار صوت **طالع** (مش في قمته). لأيام F10 خد من ترند مصر/السعودية.
- **الصوت والـSFX مع بعض:** خلّي Original sound عالي (حوالي 100%) والصوت المضاف واطي (20-35%)، عشان صوت الموتة والفوز يتسمع. حاول تخلّي الـbeat drop ييجي على الـfreeze بتاع "NOOO" أو على CLEARED.
- **لو الحساب اتحوّل لـBusiness:** استخدم Commercial Music Library بس.
- **Reels وShorts:** ارفع ملف المصدر الأصلي (من غير watermark ومن غير صوت TikTok)، وضيف صوت من مكتبة كل منصة لو حبيت.
- **اختبار:** مرة كل أسبوع انشر فيديو بصوت trending وفيديو قريب منه بـOriginal sound بس، وقارن 2s view % وavg watch. الأرقام هي اللي تقرر إذا الأصوات بتفرق معانا.

## قبل ما تدوس Post (checklist)
1. الهوك ظاهر من أول فريم وجوه الإطار؟ السطر الكبير ≤ 11 حرف والصغير ≤ 17، ومفيش `=`؟
2. شوفت strip من 8 فريمات: اللاعب باين، ومفيش حاجة مقطوعة؟
3. 15-25 ثانية؟ رقم واحد بس على الشاشة؟ end card ≤ 2.5 ثانية؟
4. كل رقم في الفيديو والكابشن حقيقي؟
5. الكابشن = سؤال + 4-5 هاشتاجات؟ الـpin جاهز؟ اللينك في البايو شغّال؟
6. فاضي الساعة الجاية عشان ترد على التعليقات؟
