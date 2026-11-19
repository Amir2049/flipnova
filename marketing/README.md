# FLIPNOVA — مساحة التسويق

فولدر واحد فيه كل اللي Claude يحتاجه عشان يشتغل كمدير تسويق للعبة: مين اللعبة، مين الجمهور، الصوت بتاعها، التقويم، والتجارب.

## الفكرة
```
Claude يقترح  ←  ينتج  ←  إنت توافق  ←  تنشر بإيدك  ←  تسجّل الأرقام  ←  Claude يعدّل الخطة
```
**مفيش نشر تلقائي.** كل بوست بتنشره إنت بنفسك. ده بيحميك من إن حاجة تتنشر باسمك من غير ما تشوفها.

## الفولدرات
| الفولدر | فيه إيه |
|---|---|
| `brand/` | عن اللعبة، الجمهور، الصوت، الشكل. Claude بيقراها قبل أي اقتراح |
| `state/content-calendar.md` | أول 14 يوم: فيديو لكل يوم، الهوك، الأصل الجاهز، الـCTA، الرقم اللي هنقيسه |
| `state/creator-outreach.csv` | قايمة صنّاع المحتوى اللي هتتواصل معاهم |
| `analytics/weekly/` | ملف لكل أسبوع بالأرقام (من التطبيقات نفسها، بإيدك) |
| `analytics/experiments/` | تجربة لكل فرضية |
| `prompts/` | البرومبتات الجاهزة: الرئيسي والأسبوعي |
| `.env.example` | أماكن المفاتيح لو ربطت أدوات بعدين (الـ`.env` الحقيقي مبيتحطش على GitHub) |

## قواعد ثابتة
- **مفيش إعلانات جوه اللعبة.** ده قرارك ونقطة بيع («Free, no ads»). الإعلانات المدفوعة للتسويق مسموحة، بس بعد ما الفيديوهات العضوية تثبت إنها شغالة، وبحد صرف بتحدده إنت.
- **الأرقام بتاعتك بس.** مفيش محاولات ولا تقييمات ولا متابعين مزيفين.
- **الفيديوهات اللي البوت بيلعبها:** اكتب «challenge video» مش «أنا عدّيتها». اللعبة نفسها بتسجّل محاولاتك الحقيقية لو عاوز تصوّرها.
- **مفيش موسيقى، ومفيش رموز دينية** في أي مادة تسويقية.
- **المتاجر والرسوم:** لما تيجي لجوجل بلاي أو أي بوابة، اتأكد من الشروط الحالية من موقعهم نفسه قبل ما تلتزم بحاجة.

## الاسم
اللعبة اسمها **FLIPNOVA**. صفحة itch اسمها `flipnovax` بس ده الـslug بتاعها.

## الـSkills المتركّبة (في الريبو)
**Plugins** (في `.claude/settings.json`، بيتنزّلوا لوحدهم أول ما تفتح الريبو في Claude Code وتوافق):
| Plugin | المصدر | ملاحظة |
|---|---|---|
| marketing | anthropics/knowledge-work-plugins | الرسمي من Anthropic |
| customer-support | anthropics/knowledge-work-plugins | الرسمي |
| marketing-skills | coreyhaines31/marketingskills | 53 skill: A/B، launch، ASO، pricing، social |
| marketing-skill | marcosmodly/marketing-skill | 14 skill: calendar، فيديو قصير، Reddit/Discord، النشر (بموافقتك) |
| hypeauditor-marketing | hypeauditor/hypeagent-plugin | **محتاج حساب HypeAuditor مدفوع**، وبيضيف اتصالات MCP بتطلب تسجيل دخول |

**Skills** (في `.claude/skills/`): 56 من thatrebeccarae/claude-marketing (GA4، Meta/TikTok Ads، UTM…) و2 من begezavr2/claude-game-skills (`game-store-page`، `steam-demo`).

**Discord** (مش متركّب لأنه محتاج bot token): `/plugin install discord@claude-plugins-official` وبعدها `/discord:configure TOKEN`.
