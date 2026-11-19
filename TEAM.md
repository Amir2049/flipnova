# مساعدينك في FLIPNOVA

انت شغال لوحدك. دول مش شركة، دول مساعدين بتطلب منهم شغل لما تحتاج، وكلهم جوه `.claude/` في الريبو.

| الشغل | تكلّم مين / تستخدم إيه |
|---|---|
| 🎮 **تصميم وتوازن اللعبة** | `game-designer`، `systems-designer`، `economy-designer`، `level-designer` · `/balance-check`، `/brainstorm`، `/quick-design` |
| 🧪 **اختبار وبجز** | `qa-tester`، `qa-lead` · `/bug-report`، `/playtest-report`، `/smoke-check` |
| ⚡ **الأداء والكود** | `performance-analyst`، `gameplay-programmer`، `lead-programmer` · `/perf-profile`، `/code-review` |
| 🎨 **الشكل والواجهة** | `art-director`، `ux-designer`، `UI Designer` · `/ux-review` |
| 🔊 **المؤثرات** | `sound-designer`، `audio-director` |
| 🚀 **الإصدار** | `release-manager` · `/release-checklist`، `/patch-notes`، `/changelog` |
| 📅 **تنظيم وقتك** | `producer`، `Sprint Prioritizer` · `/sprint-plan`، `/scope-check`، `/help` |
| 📣 **تيك توك وريلز وشورتس** | `TikTok Strategist`، `Short-Video Editing Coach`، `Video Optimization Specialist` · `marketing-skill:short-form-video`، `marketing-skill:content-calendar` |
| 🌍 **السوشيال والمجتمع** | `Reddit Community Builder`، `Instagram Curator`، `community-manager` · `marketing-skills:community-marketing` |
| 📈 **النمو والأرقام** | `Growth Hacker`، `Analytics Reporter`، `App Store Optimizer` · `marketing-skills:aso`، `marketing-skills:ab-testing` |
| 🤝 **صنّاع المحتوى** | `hypeauditor-marketing` (محتاج حساب مدفوع) · `marketing-skills:influencer-marketing` |
| 💬 **الرد على اللاعيبة** | `Support Responder`، plugin customer-support |
| ⚖️ **سياسة الخصوصية للمتجر** | `Legal Compliance Checker` |

## كل اللي متركّب
- **333 مساعد** في `.claude/agents/`: كل الاستوديو (49، ومعاهم Godot وUnity وUnreal) وكل أقسام agency-agents.
- **145 skill** في `.claude/skills/`: الاستوديو، وclaude-marketing كلها، وskills الألعاب.
- **19 plugin** في `.claude/settings.json`: التسويق والدعم والمنتج والمالية والقانوني والعمليات والأعمال الصغيرة والمبيعات والتصميم والبيانات والهندسة والموارد البشرية والإنتاجية والبحث والـbrand voice، وmarketing-skills وmarketing-skill وHypeAgent وDiscord.
- **قواعد الاستوديو** في `.claude/rules/`.

## hooks الاستوديو (موجودة بس مقفولة)
الـ18 سكربت في `.claude/studio-hooks/`. بيشتغلوا لوحدهم في كل جلسة، وفيهم اللي بيمنع push وcommit لو مش على شكلهم، وواحد بيتصل بالنت يدوّر على تحديثات. عشان كده متوصّلين. لو عاوزهم يشتغلوا: انسخ `hooks` و`statusLine` من `.claude/studio-hooks/settings.studio.json` لـ`.claude/settings.json`، وانقل السكربتات لـ`.claude/hooks/`.

## Console skill (ألعاب PS2)
11 skill من `console-*` (Jake Schincariol، MIT) بتنقل لعبة PS2 **انت مالك الديسك بتاعها** للكمبيوتر وتعدّل فيها: `/console-reverse` يبدأ الشغل، و`/console-mod` و`/console-graphics` و`/console-sound` و`/console-physics` و`/console-controller`… محتاجة PS2Recomp وGhidra على جهازك. متشاركش ISO ولا BIOS ولا ملفات من اللعبة.

## Discord
محتاج bot token: `/discord:configure TOKEN`.

## ابدأ منين
- `/help`: لو مش عارف تعمل إيه دلوقتي.
- `/project-stage-detect`: يفحص اللعبة ويقولك الخطوة الجاية.
- `marketing/`: التسويق.

## القواعد
- **مفيش إعلانات جوه اللعبة.** الإعلانات المدفوعة للتسويق بموافقتك وبحد صرف.
- **مفيش نشر ولا صرف ولا إرسال** من غير موافقتك.
- **مفيش أرقام أو تقييمات مزيفة.**
