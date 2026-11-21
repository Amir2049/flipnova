# Engine choice for a solo-dev 3D Android football game (DLS competitor): Godot 4.x vs Unity 6 vs Unreal 5

Context checked locally (not web-sourced): the existing project `/home/user/flipnova/AFC` has about 17.3k lines of GDScript, targets Godot 4.7 (`config/features=("4.7","GL Compatibility")`), uses `renderer/rendering_method="gl_compatibility"` for desktop and mobile, and already ships a C++ GDExtension (`native/afcgf.gdextension`, `compatibility_minimum = "4.5"`) with an `android.arm64` library entry (`res://native/bin/libafcgf.android.arm64.so`). So GDExtension on Android is already set up in this project.

## Godot 4.5–4.7 on Android in 2026 (renderers, skinned animation, issues, APK size, GDExtension, shipped games)

### Takeaway
Godot 4.7 (released June 2026) is workable for Android 3D. The official docs say Compatibility (OpenGL) is the choice for old/low-end phones and Mobile (Vulkan) for newer ones. The main risk for 22 skinned players is CPU cost in AnimationPlayer/AnimationTree, not GPU. There are few shipped commercial 3D mobile Godot games to point to, and none in sports.

### Cited Findings
- Godot 4.7 was released on 2026-06-18. Its headline Android item is GABE, the Godot Android Build Environment, which does Gradle export (APK/AAB) from an Android device. Maintenance releases 4.7.1 and 4.7.2 have since shipped. — [Godot 4.7 release page](https://godotengine.org/releases/4.7/); [Phoronix](https://phoronix.com/news/godot-4.7-released)
- Renderer guidance in the 4.7 docs:
  - Mobile is "Fewer features, but renders simple scenes faster", is the default on mobile, and suits newer/high-end devices.
  - Compatibility "supports the widest range of hardware" and is the pick for old/low-end mobile. On old and low-end hardware, Mobile is listed as slower than Compatibility.
  - Cost model: Compatibility has a low base cost but a high scaling cost; Mobile is medium on both.
  - Since 4.4, Mobile can fall back to Compatibility when Vulkan isn't available.
  — [Godot docs: Overview of renderers](https://docs.godotengine.org/en/stable/tutorials/rendering/renderers.html)
- Feature differences between the two renderers:
  - Both allow 8 Omni and 8 Spot lights per mesh (Mobile also caps at 256 per view).
  - Compatibility uses multi-pass shadowed lights and has no light projectors, only 2 reflection probes per mesh, and no compute shaders.
  - Compatibility can render baked lightmaps, but baking needs RenderingDevice-capable hardware (bake on desktop).
  - Compatibility supports SSAO; Mobile doesn't.
  — [Godot docs: renderers](https://docs.godotengine.org/en/stable/tutorials/rendering/renderers.html)
- Arm's Mobile-renderer case study (Pixel 8 Pro, modified TPS demo with several animated characters, dynamic shadows and particles):
  - Baseline was about 33 fps. Specialization constants and light culling raised it to about 43 fps (about 7 ms saved), and the scene stayed fragment-bound.
  - FP16 work later landed in 4.5-beta1.
  - The author says directional/soft shadows are "currently a large performance hit on mobile".
  — [Arm community blog, part 2](https://developer.arm.com/community/arm-community-blogs/b/mobile-graphics-and-gaming-blog/posts/optimizing-3d-scenes-in-godot-on-arm-gpus-part-2)
- Google/The Forge Vulkan work on Godot for Android replaced push constants larger than 16 bytes with uniform buffers to improve Android performance. — [Android Developers story](https://developer.android.com/stories/games/godot-vulkan)
- Godot Mobile update (April 2026):
  - Foundation contractors fixed Vulkan API usage and worked around broken GPU drivers, which cut crash rates for two shipped games from about 4% to under 1%.
  - Android has more than 12,000 device models, and GPU driver diversity is named as a major stability problem.
  - 4.5 added native debug symbols for Play Console and Perfetto tracing. 4.6 added Android instrumented tests and device mirroring.
  - Official plugins exist for Play Billing and Play Games Services.
  — [Godot Mobile update Apr 2026](https://godotengine.org/article/godot-mobile-update-apr-2026/)
- Shipped mobile games named by the Foundation are Kamaeru: A Frog Refuge and Rift Riff (both December 2025), and both are 2D/stylized. — [Godot Mobile update Apr 2026](https://godotengine.org/article/godot-mobile-update-apr-2026/)
  - A search of the showcase forum found only small 3D Android titles, such as "Planet Coolkee", a 3D marble puzzle made in 4.7. — [Godot forum showcase](https://forum.godotengine.org/c/showcase/games/15)
- Skinned animation cost:
  - A GodotCon Amsterdam 2026 talk ("1000 rigged AnimationPlayers in 3D, impossible?") says AnimationPlayers are CPU-heavy and about 100 rigged, animated characters "can already lag a lot". It also says a recently merged PR plus extra effort makes 1,000 feasible. The PR isn't named in the abstract. — [GodotCon talk](https://talks.godotengine.org/godotcon-ams-2026/talk/RXLHDR/)
  - Forum benchmark (Godot 4.2–4.3, Ryzen 5 2400G iGPU): almost 300 units at 36 fps. The biggest gain came from disabling AnimationPlayers for off-screen or far units. — [Godot forum thread](https://forum.godotengine.org/t/performance-of-crowds-of-animated-rigged-characters-in-3d/130409)
  - Other advice in that thread: prefer AnimationPlayer over the "resource-heavy" AnimationTree, use fewer bones, and use billboards for distant characters. — same thread
  - An r/godot thread reports AnimationTree hitting a single-thread CPU bottleneck. — [r/godot "Animation tree killing fps"](https://lr.sudovanilla.org/r/godot/comments/1fivfwd/animation_tree_killing_fps)
- APK size:
  - The default export includes both ARMv7 and ARMv8 libraries, which "increases its size significantly"; use arm64 only. — [Godot docs: Exporting for Android 4.6](https://docs.godotengine.org/en/4.6/tutorials/export/exporting_for_android.html)
  - Custom templates with build profiles and `size_extra` (new in 4.5) cut engine size further; GodotPhysics3D can be disabled when using Jolt. — [Godot docs: Optimizing a build for size (4.7)](https://docs.godotengine.org/en/4.7/engine_details/development/compiling/optimizing_for_size.html)
  - Forum figures: about 19 MB stock Godot 4 template, about 13 MB with modules stripped (2023 post). — [Godot forum](https://forum.godotengine.org/t/how-to-reduce-android-apk-size-reduce-startup-time-too/25779)
  - Counter-reports: a 4.5.1 user got a 114 MB APK from a tiny project, likely from dual-arch builds and defaults. — [Godot forum](https://forum.godotengine.org/t/absurd-file-size-increase-when-my-project-is-exported-to-apk/130000)
- GDExtension on Android: building it requires the Android SDK/NDK and SCons. — [Godot docs: Compiling for Android 4.7](https://docs.godotengine.org/en/4.7/engine_details/development/compiling/compiling_for_android.html)
  - One forum report of a godot-cpp Android arm64 link error on 4.3 ("Argument list too long"), marked solved. — [Godot forum](https://forum.godotengine.org/t/solved-experiencing-compilation-issues-with-godot-4-3-c-android-build-lets-figure-it-out-together/78430)

### Inferences
- The current project choice (Compatibility renderer, arm64 GDExtension) matches the docs' guidance for low/mid-end Android. Keep it, but A/B test the Mobile renderer on 2–3 mid-range Vulkan devices.
- 22 players is well under the roughly 100-character threshold where the GodotCon speaker reports lag. It's feasible if each player uses a lean AnimationTree, or an AnimationPlayer with blend logic in code, about 30–40 bones, and off-screen/low-LOD animation throttling.
- The crowd should not be skinned. Use MultiMesh with impostor or vertex-animated cards; billboards are recommended in the thread above.
- A small APK (about 30–60 MB with content) looks feasible: arm64-only, custom stripped template, ETC2/ASTC textures.

### Gaps
- No public Godot benchmark of exactly 22 skinned characters on a low-end Android phone. You need to profile this yourself.
- The GodotCon PR enabling 1,000 AnimationPlayers isn't identified, so I couldn't check whether it's in 4.7.
- No shipped commercial 3D sports game on Godot mobile was found.

## Unity 6 for mobile sports games: pricing, performance, soccer starter kits, which football games use Unity

### Takeaway
The Runtime Fee is cancelled, and Unity Personal is free under $200K revenue/funding. The empty-APK overhead is modest (about 30–40 MB). But the Asset Store has no high-quality, proven 11v11 "DLS-like" kit. Most soccer kits are casual (finger, head, penalty), and the one 11v11 template is $69 with no ratings.

### Cited Findings
- Unity cancelled the Runtime Fee for all versions ahead of Unity 6, and raised the Unity Personal ceiling from $100K to $200K. — [Unity blog: canceling the Runtime Fee](https://unity.com/en/blog/unity-is-canceling-the-runtime-fee); [Unity pricing updates](https://unity.com/products/pricing-updates)
- Unity Pro and Enterprise prices rise 5% from 2026-01-12, and Enterprise is required above $25M revenue. — [Unity pricing updates](https://unity.com/products/pricing-updates)
  - The page shows Pro at about $2,310/yr per seat. This figure comes from a jumbled page layout, so verify it.
- Havok Physics for Unity loses first-party entitlement and support from Unity 6.3 LTS. — [Unity pricing updates](https://unity.com/products/pricing-updates)
- Empty-APK size (all forum figures):
  - About 31.8 MB for an empty Unity 6000.0.38 APK with ARM64 only and stripping on. — [Unity Discussions](https://discussions.unity.com/t/libil2cpp-so-is-too-big/1603857)
  - Size grew from 33.4 MB (2022.3) to 37.1 MB (Unity 6 LTS) with no content. — [Unity Discussions](https://discussions.unity.com/t/android-the-package-size-increased-by-10-when-using-unity-6/1539185)
  - Unity 6 IL2CPP builds take 25–50% longer than in 2022.3. — [Unity issue tracker](https://issuetracker-mig.prd.it.unity3d.com/issues/building-the-player-takes-25-50-percent-more-time-in-unity-6-compared-to-2022-dot-3-when-the-il2cpp-scripting-backend-is-selected)
- Soccer kits on the Asset Store / Marketplace, with listed prices (check current store values):

| Kit | Format | Listed price | Notes |
|---|---|---|---|
| Soccer League 3D | 11v11, 7 stadiums, league and cup modes | $69 | "Not enough ratings". Its itch.io page targets HTML5. |
| Soccer Project Plus | Full-match AI, CPU vs CPU | $20 | One reviewer: "AI player movement is so bad". |
| Soccer AI (#63743) | Not described in results | — | v2.0.8, last updated Apr 2022 |
| Football Game Engine Basic (#153048) | Not described in results | — | — |
| Soccer Football Kit | — | $29.99 | Built for Unity 2022.2 |
| 3D Soccer Football | — | $7.99 | Last updated 2019 |
| Finger Soccer, Head Soccer, One Tap Soccer, TrickShot Arena | Casual / flick | $49.99–$69 | Not 11v11 sims |
| Outdoor Soccer 3D, Fence Soccer | 3v3 / 4v4 | — | Not 11v11 |

  Sources:
  - Soccer League 3D: [Asset Store slug 312552](https://assetstore.unity.com/packages/slug/312552); [itch.io](https://blackrosedevelopers.itch.io/soccer-league)
  - Soccer Project Plus: [listing](https://assetstore.unity.com/packages/templates/packs/soccer-project-plus-154230); [reviews](https://assetstore.unity.com/packages/templates/packs/soccer-project-plus-154230/reviews)
  - [Soccer AI](https://assetstore.unity.com/packages/templates/systems/soccer-ai-63743)
  - [Football Game Engine Basic](https://assetstore-fallback.unity.com/packages/templates/packs/football-game-engine-basic-153048)
  - [Soccer Football Kit](https://assetstore.unity.com/packages/templates/packs/soccer-football-kit-190729)
  - [3D Soccer Football](https://assetstore.unity.com/packages/templates/packs/3d-soccer-football-137041)
  - Casual kits: [Finger Soccer](https://marketplace.unity.com/packages/templates/packs/finger-soccer-game-kit-soccer-stars-45611), [Head Soccer](https://assetstore.unity.com/packages/templates/packs/head-soccer-game-kit-67403), [One Tap Soccer](https://assetstore.unity.com/packages/templates/packs/one-tap-soccer-addictive-physics-game-kit-107368), [TrickShot Arena](https://marketplace.unity.com/packages/templates/packs/trickshot-arena-football-game-kit-146088)
  - Small-sided kits: [Outdoor Soccer 3D](https://assetstore.unity.com/packages/templates/packs/outdoor-soccer-3d-game-template-307986)
- No Asset Store listing named exactly "Soccer Game Kit", "Football Game Template" or "Ultimate Soccer" was found. No listing mentions career mode. — searches above
- Unity Learn's "Team Ball" template is no longer supported. — [Unity Learn](https://learn.unity.com/project/team-ball-game-template)
- Dream League Soccer and Score! Hero (First Touch Games):
  - At DLS's launch, coverage said it used an updated version of First Touch's own "First Touch Soccer engine" ("our new 2012 engine"). — [Pocket Gamer](https://www.pocketgamer.com/articles/035894/first-touch-games-kicks-off-with-free-to-play-dream-league-soccer-for-ios)
  - Score! Hero advertises a "New Score! Engine". — [App Store](https://apps.apple.com/gb/app/score-hero/id847492141)
  - I found no primary source confirming that either game uses Unity.

### Inferences
- Unity's real advantages for this case are:
  - Mature mobile GPU skinning, LOD groups and profiling tools.
  - Many paid character, animation and stadium assets.
  - A large hiring and tutorial ecosystem.
- None of the soccer kits replace the project's existing GRF-based match engine. At best they are asset sources (stadiums, kits, UI).
- The common claim that "DLS is made in Unity" is unverified. Don't use it as a decision factor.

### Gaps
- No independent 2026 benchmark of Unity 6 URP versus Godot on the same low-end Android device with about 22 skinned characters.
- I couldn't fetch full listings or reviews for Soccer AI or Football Game Engine Basic.
- The engine behind current DLS and Score! Hero builds is unconfirmed. An APK teardown (looking for `libunity.so` or `libil2cpp.so`) would settle it.

## Unreal Engine 5 for mobile football: feasibility, APK size, royalty

### Takeaway
UE5 is technically capable but a poor fit for a solo dev targeting low-end Android with a small APK. Empty projects are about 100–150 MB, getting below 40 MB takes heavy manual work, and a 5% royalty applies above $1M lifetime gross per product.

### Cited Findings
- Royalty is 5% of gross revenue above $1M lifetime per product, and the first $1M is royalty-free. — [Unreal Engine license](https://www.unrealengine.com/en-US/license); [PC Gamer](https://pcgamer.com/unreal-engine-games-no-longer-owe-royalties-on-their-first-dollar1m-in-revenue)
  - Epic Games Store sales are royalty-free. A reduced-rate program reportedly reverts to 5% if the game ships on Android without EGS. This comes from a secondary Russian source. — [3dnews](https://3dnews.ru/1111844/epic-games-snigaet-royalti-dlya-razrabotchikov-igr-na-unreal-engine)
- Empty-project size (forum figures, mostly UE4 or early UE5):
  - About 140 MB empty-project APK. — [Unreal answers](https://answers.unrealengine.com/t/why-is-a-compiled-mobile-project-so-huge/425988)
  - About 200 MB in one engine-version bug report. — [UE-79150](https://issues.unrealengine.com/issue/UE-79150)
  - Can be cut to about 19–25 MB with package blacklists, compression and ProGuard, described as "advanced". — [Unreal forum](https://forums.unrealengine.com/t/reducing-build-size-an-attempt-to-get-the-smallest-size-empty-project-packaged/121027)
  - A 39 MB APK installed as 152 MB. — [Unreal forum](https://forums.unrealengine.com/t/why-does-the-apk-take-up-26mb-but-when-installed-the-app-takes-up-116mb/71651)

### Inferences
- UE5's flagship features (Nanite, Lumen) don't target low-end Android, so you'd lose most of UE's advantage.
- Using UE5 would also mean rewriting the GRF integration as a UE module, with C++/Blueprint and longer iteration times. Not recommended.

### Gaps
- No current UE 5.6/5.7 Android empty-APK figure from Epic docs was found.

## Cost/benefit: rewrite ~15–17k-line GDScript + C++ GDExtension (GRF) vs continue in Godot

### Takeaway
Continue in Godot. Nothing found shows a Godot limitation that blocks 22 players, a stadium and a crowd at 60 fps on mid-range Android, and the costly parts (GRF wrapper, match logic) are already built for Android arm64. Do a time-boxed device benchmark first. Only consider Unity if that benchmark fails after the standard optimizations.

### Cited Findings
- The forum benchmark and GodotCon talk show Godot's character-animation bottleneck is CPU-side AnimationPlayer/AnimationTree work, with known mitigations (culling, AnimationPlayer instead of AnimationTree, fewer bones). — [Godot forum](https://forum.godotengine.org/t/performance-of-crowds-of-animated-rigged-characters-in-3d/130409); [GodotCon talk](https://talks.godotengine.org/godotcon-ams-2026/talk/RXLHDR/)
- In one case, a 2D-skeleton user with about 900 characters got 20–40 fps in Godot against 130–160 fps in Unity and switched engines. This shows Unity can be much faster for mass skeletal animation. — [Godot forum](https://forum.godotengine.org/t/low-performance-with-a-lot-of-skeleton2d/109896)
- Godot 4.5–4.7 Android stability and tooling are improving. Crash rate fell from about 4% to under 1% for two games, and debug symbols and Perfetto are available. — [Godot Mobile update](https://godotengine.org/article/godot-mobile-update-apr-2026/)

### Inferences
- A rewrite means porting about 17k lines of GDScript to C# and re-wrapping GRF as a Unity native plugin with P/Invoke. As a rough, unsourced estimate, that's 3–6 months solo before reaching feature parity, with no gameplay gained.
- Unity's gains (GPU skinning, LOD tooling, asset ecosystem) mostly help with art and performance headroom, and Godot can partly cover those with LOD, impostors and animation throttling.
- Suggested go/no-go benchmark, about 1 week:
  - Test scene: 22 skinned players (about 3–5k tris and about 40 bones each, one material each), a lightmapped stadium, and a MultiMesh crowd.
  - Devices: one low-end and one mid-range Android phone (for example a Mali-G52 class and an Adreno 6xx class).
  - Renderers: both Compatibility and Mobile.
  - Pass if it holds 60 fps mid / 30–45 fps low, with frame time under 16.6 ms on the mid device.

### Gaps
- No postmortem was found of a team porting a Godot 3D game to Unity, or the reverse, with time or cost figures.
- The rewrite time estimate is an inference, not sourced.

## Tooling: Blender to Godot/Unity (glTF), LODs, crowd impostors/MultiMesh, baked lighting on mobile

### Takeaway
Godot's pipeline (Blender, then glTF, with automatic mesh LOD, MultiMesh crowds and desktop-baked LightmapGI) covers this case. The important limits are that real-time directional/soft shadows are expensive on mobile, and lightmaps have to be baked on a RenderingDevice-capable machine.

### Cited Findings
- Compatibility can render LightmapGI but can't bake it without RenderingDevice hardware, while Mobile fully supports LightmapGI. — [Godot docs: renderers](https://docs.godotengine.org/en/stable/tutorials/rendering/renderers.html)
- Directional and soft shadows are a large performance hit on mobile; long-range light culling helps. — [Arm blog part 2](https://developer.arm.com/community/arm-community-blogs/b/mobile-graphics-and-gaming-blog/posts/optimizing-3d-scenes-in-godot-on-arm-gpus-part-2)
- Mobile bandwidth is limited and must be used efficiently. — [Arm blog part 1](https://developer.arm.com/community/arm-community-blogs/b/mobile-graphics-and-gaming-blog/posts/optimizing-3d-scenes-in-godot-on-arm-gpus)
- MultiMesh, visibility culling and object pooling are Godot's standard draw-call reducers. — [Godot docs: GPU optimization 4.6](https://docs.godotengine.org/en/4.6/tutorials/performance/gpu_optimization.html)
- Billboard sprites are suggested for distant characters, and VisibleOnScreenEnabler3D for culling animation. — [Godot forum](https://forum.godotengine.org/t/performance-of-crowds-of-animated-rigged-characters-in-3d/130409)

### Inferences
- Recommended setup:
  - Stadium: one lightmapped mesh set with an atlas texture, baked on desktop.
  - Lighting: one directional light, with a blob shadow decal or a low-res single-cascade shadow for players.
  - Crowd: a MultiMesh of quads with an animated atlas or vertex-shader sway, with no skinning.
  - Players: 2–3 LODs from Blender (Decimate) or Godot's automatic mesh LOD, plus a shared skeleton and animation library.
- Blender glTF exports to both Godot and Unity, so building assets in glTF keeps a later engine switch possible.

### Gaps
- No sourced mobile benchmark of Godot automatic LOD or lightmaps for stadium-scale scenes.
- No sourced comparison of Godot vs Unity crowd impostor tooling (for example Unity's Amplify Impostors).
