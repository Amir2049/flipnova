# تجهيز FLIPPO لجوجل بلاي (build 65 / 14.0)

> اتحدّث 19 نوفمبر 2026. **الشروط بتتغيّر:** اتأكد من كل حاجة من Play Console نفسه قبل ما تدفع أو تلتزم بحاجة.
> الملف ده بيحل محل نسخة FLIPNOVA القديمة. `company/google-play-listing.md` قديم (فيه أوضاع اتشالت)، متستخدموش.

## 1) شروط جوجل دلوقتي (اتراجعت بالبحث)
| الشرط | حالة اللعبة |
|---|---|
| الألعاب والتحديثات الجديدة لازم `targetSdk 36` (Android 16) من 31 أغسطس 2026 | ✅ build 65 بقت `targetSdk 36` و`compileSdk 36` |
| الرفع بصيغة Android App Bundle (`.aab`) | ✅ `tools/build-aab.sh` بيطلّعها |
| جوجل **بترفض** أي نسخة متوقّعة بمفتاح الـ debug | ⚠️ النسخ اللي بتتبعت (APK) متوقّعة بمفتاح debug. للمتجر لازم **مفتاح الرفع بتاعك** (upload key) |
| حساب مطوّر شخصي جديد (بعد نوفمبر 2023): اختبار مغلق بـ **12 مختبر لمدة 14 يوم ورا بعض** قبل النشر | ⏳ عليك. اختار مختبرين حقيقيين أكتر من 12 |
| سياسة خصوصية على لينك عام | ✅ المسودة في `company/privacy-policy.md`، ارفعها صفحة (GitHub Pages أو Replit) |
| استمارة Data safety وتقييم المحتوى (IARC) | ✅ الإجابات تحت |

**ملحوظة مهمة عن التقدّم:** اللي منزّل الـ APK من بره المتجر عنده نسخة بمفتاح debug. نسخة المتجر هتتوقّع بمفتاح تاني، فأندرويد مش هيقبلها كتحديث فوق القديمة. اللاعب يقدر ينقل تقدّمه بكود التقدّم: **الإعدادات ← 💾 تقدّمك ← نسخ**، وبعد ما ينزّل نسخة المتجر يعمل **استرجاع**. لو مفيش داعي للمتجر، الـ APK بيفضل يتحدّث عادي فوق القديم.

## 2) بناء نسخة المتجر
```
export FLIPNOVA_KEYSTORE_PROPS=/مكان/أمين/keystore.properties   # storeFile, storePassword, keyAlias, keyPassword
bash tools/build-aab.sh      # → dist/Flippo.aab
```
- المفتاح وكلمات السر **مبتدخلش الريبو أبدًا**.
- فعّل **Play App Signing** (جوجل بتمسك مفتاح التوقيع النهائي، وإنت بتمسك مفتاح الرفع). لو مفتاح الرفع ضاع، جوجل تقدر تغيّره، أما مفتاح التوقيع لو ضاع منك من غير Play App Signing فمش هتعرف تحدّث اللعبة أبدًا.
- `applicationId` = `com.flipfrenzy.game`، **مبيتغيّرش** بعد أول رفع.
- `android:appCategory="game"`: أندرويد 16 بيعفي الألعاب من إجبار تغيير الاتجاه على التابلت، فاللعبة بتفضل بالعرض.

## 3) صفحة المتجر

### English
- **Title (27/30):** `Flippo: Gravity Flip Runner`
- **Short description (70/80):** `One tap flips gravity. 28 stages, 12 worlds, faster every run. No ads.`
- **Full description:**
```
Flippo is a pixel gravity-flip runner. One tap flips you between the floor and the ceiling. Dodge spikes, saws, lasers and crushers while the speed keeps climbing — every run is a new road, so you can't just memorise it.

• Endless: 28 stages across 12 worlds, each one faster than the last
• New worlds with their own rules: sandstorm winds that speed you up or hold you back, light and heavy gravity in deep space, and jungle totems that flip you by themselves
• Rhythm-tight beats: chains of quick taps, PERFECT timing bonuses and a NERVE streak for flying close to danger
• Adventure: 50 hand-made levels with 150 stars to collect
• Weekly Boss: Infinity Void vs The Crimson Tyrant — a 3-phase duel with seal orbs, counters and an ultimate
• Daily Remix, daily missions and a 7-day streak reward
• Watch your last 3 seconds in slow motion and share the clip
• Challenge a friend to the exact same road with a link
• 55 characters and 20 trails to collect — cosmetic only, same game for everyone
• No ads. No in-app purchases. Sharp sound effects, no music.

Easy to learn, hard to master: the first stages teach you, the last ones test the best players.

Made by one independent developer, Amir.
```

### العربي
- **الاسم (20/30):** `فليبو: اقلب الجاذبية`
- **الوصف القصير (72/80):** `ضغطة واحدة تقلب الجاذبية. 28 مرحلة و12 عالم، وكل مرة أسرع. بدون إعلانات.`
- **الوصف الكامل:**
```
فليبو لعبة جري بكسل بتقلب فيها الجاذبية. ضغطة واحدة بتنقلك بين الأرض والسقف. اتفادى الأشواك والمناشير والليزر والكسّارات والسرعة بتزيد — وكل جولة طريق جديد، فمش هتقدر تحفظه.

• Endless: ‏28 مرحلة في 12 عالم، كل مرحلة أسرع من اللي قبلها
• عوالم جديدة بقوانينها: ريح صحرا بتسرّعك أو تشدّك لورا، جاذبية خفيفة وتقيلة في الفضاء، وتماثيل في الغابة بتقلبك لوحدها
• إيقاع سريع: ضغطات ورا بعض، مكافأة PERFECT للتوقيت المظبوط، وعدّاد NERVE لما تعدّي جنب الخطر بشعرة
• المغامرة: 50 مرحلة متصممة بالإيد و150 نجمة تجمعها
• بوس الأسبوع: Infinity Void ضد The Crimson Tyrant — مبارزة من 3 مراحل فيها أختام وهجمات مضادة وضربة خارقة
• ريمكس يومي ومهام يومية ومكافأة 7 أيام ورا بعض
• شوف آخر 3 ثواني بالبطيء وشاركها
• تحدّى صاحبك على نفس الطريق بالظبط بلينك
• 55 شخصية و20 أثر تجمعهم — شكل بس، نفس اللعبة للكل
• من غير إعلانات ومن غير شراء جوه اللعبة. مؤثرات صوت حادة، من غير موسيقى.

سهلة تتعلمها وصعبة تحترفها: أول المراحل بتعلّمك، وآخرها بتختبر أحسن اللاعبين.

صنعها مطوّر واحد مستقل: أمير.
```

- **التصنيف:** Games ← Arcade
- **الوسوم:** Arcade, Casual, Offline, Single player, Pixel
- **الصور (في `store-assets/`):** أيقونة `icon-512.png`، الغلاف `feature-1024x500.png` (FLIPPO + العوالم الجديدة)، و6 لقطات بالعرض 1920×1080 في `store-assets/screenshots/` (الرئيسية، المرحلة 1، الخلل، الصحرا، السديم، الغابة).

## 4) تقييم المحتوى (IARC) — جاوب بصراحة
- عنف: **كارتوني/خيالي خفيف** (مكعب بكسل بيتفادى أشواك، وبوس خيالي). مفيش دم ولا عنف حقيقي.
- مفيش كلام وحش، ولا مخدرات، ولا مقامرة، ولا محتوى جنسي.
- **مفيش شراء جوه اللعبة** (العملات بتتكسب باللعب بس).
- تفاعل بين اللاعبين: **أسماء ونتايج بتظهر في لوحة الترتيب** (مفيش شات).
- المتوقع: PEGI 3–7 / Everyone.

## 5) Data safety
- **بيانات بتتجمع:** اسم اللاعب اللي بيختاره، والنتايج وتفاصيل الجولة (منها الضغطات عشان نتأكد إنها حقيقية)، ومعرّف جهاز عشوائي بتعمله اللعبة. الغرض: لوحات الترتيب. بتتخزن في Supabase. **مبتتشاركش ومبتتبعش.**
- **مش بنجمع:** إيميل، ولا موقع، ولا جهات اتصال، ولا صور، ولا رقم تليفون.
- **إعلانات وتتبّع:** مفيش.
- **التشفير أثناء النقل:** أيوه (HTTPS).
- **طلب حذف البيانات:** بالإيميل المكتوب في سياسة الخصوصية.
- **الجمهور:** اختار **13+** عشان تتجنب شروط Families الزيادة، إلا لو قررت تستهدف الأطفال.

## 6) قبل ما تضغط Publish
- [ ] حساب المطوّر اتعمل واتأكدت الهوية
- [ ] `dist/Flippo.aab` متوقّعة بمفتاح الرفع بتاعك (مش debug)
- [ ] صفحة سياسة الخصوصية على لينك عام
- [ ] اختبار مغلق: 12 مختبر حقيقي × 14 يوم ورا بعض
- [ ] صفحة المتجر بالعربي والإنجليزي + الصور
- [ ] IARC + Data safety + الجمهور المستهدف
- [ ] جرّبت نسخة المتجر على موبايل حقيقي (تابلت كمان لو عندك)
