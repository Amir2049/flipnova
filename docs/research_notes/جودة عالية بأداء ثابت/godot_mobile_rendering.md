# Godot 4.7 Mobile Rendering Playbook: Console-Like Football Visuals at Stable FPS on Mid/Low-End Android

Scope: an 11v11 match (22 skinned players at about 10k tris each), a grass pitch with mowing stripes, four stands with a MultiMesh crowd, floodlights, and a broadcast camera. The target is the GL Compatibility renderer, with notes on when the Mobile (Vulkan) renderer is worth it. Research date: Nov 2026, Godot 4.7 stable (released June 2026; 4.7.1 followed).

Method note: I made about 15 search and fetch calls. Primary sources were Godot docs ("latest" branch, which tracks 4.7+), Godot release pages, Godot GitHub issues, the Arm community blog, and Android developer docs. I found very few measured numbers for Godot on Android, and the gaps are listed in each section.

---

## 1. Renderer choice: Compatibility vs Mobile (Vulkan)

### Takeaway
Compatibility (OpenGL ES 3 / GLES3) is the safe default for low-end and mid Android. It gets glow, tonemapping, adjustments, fog, SSAO, decals and baked-lightmap rendering, but no FXAA, no FSR, no mipmap bias, no ASTC "High Quality" textures, and only an LDR (RGBA8) buffer. Mobile (Vulkan) adds HDR-ish precision (RGB10A2), FXAA/SMAA, DoF, ASTC and debanding, and it got significant Android crash and performance fixes in 4.4–4.6. On older or low-end GPUs it is still documented as slower than Compatibility. A two-tier build (Compatibility as the default, Mobile opt-in for known-good high-tier devices) is the pragmatic answer.

### Cited Findings
- Compatibility is recommended for older and low-end mobile devices and has the widest hardware support. Mobile requires Vulkan, D3D12 or Metal, and on older hardware it is "slower than Compatibility". Forward+ is poorly optimized for mobile. — [Godot docs: Overview of renderers](https://docs.godotengine.org/en/latest/tutorials/rendering/renderers.html)
- Feature matrix, Compatibility vs Mobile:
  - Glow: both.
  - Tonemapping: both.
  - Adjustments: both.
  - Depth/height fog: both.
  - Volumetric fog: neither.
  - SSAO: Compatibility yes, Mobile **no**.
  - SSIL and SSR: neither.
  - DoF blur: Compatibility **no**, Mobile yes.
  - Decals: both. Compatibility allows 8 per surface and 64 per view (adjustable).
  - PCSS for omni/spot: Compatibility no, Mobile yes.
  - Contact shadows: neither.
  - LightmapGI: Compatibility renders baked lightmaps, but baking needs a RenderingDevice GPU. Mobile has full support.
  - VoxelGI and SDFGI: neither.

  — [Godot docs: Overview of renderers](https://docs.godotengine.org/en/latest/tutorials/rendering/renderers.html)
- Antialiasing:
  - MSAA 3D: Mobile yes. Compatibility yes, but with no alpha-to-coverage.
  - FXAA, SMAA and MSAA 2D: Mobile only, not Compatibility.
  - TAA: neither.
  - SSAA: all.
  - FSR2: Forward+ only.

  — [Godot docs: Overview of renderers](https://docs.godotengine.org/en/latest/tutorials/rendering/renderers.html)
- Color precision: Compatibility uses RGBA8 (LDR). Mobile uses RGB10A2, or RGBA16F with HDR 2D. Forward+ uses RGBA16F. — [Godot docs: Overview of renderers](https://docs.godotengine.org/en/latest/tutorials/rendering/renderers.html)
- Light limits:
  - Compatibility: 8 omni and 8 spot per mesh by default. Raise them via Rendering > Limits > OpenGL > Max Renderable Elements / Max Lights per Object, at a cost in performance and shader compile time.
  - Mobile: 8 omni and 8 spot per mesh and 256 of each per view, not adjustable.

  — [Godot docs: Lights and shadows](https://docs.godotengine.org/en/latest/tutorials/3d/lights_and_shadows.html)
- Compatibility draws lights *with shadows* with a multi-pass approach. Lit and shadowed surfaces are computed in sRGB rather than linear space, which "can noticeably change the look", so compensate with light Energy. — [Godot docs: Lights and shadows](https://docs.godotengine.org/en/latest/tutorials/3d/lights_and_shadows.html)
- Reflection probes: Compatibility allows 2 per mesh, Mobile 8 per mesh. — [Godot docs: Overview of renderers](https://docs.godotengine.org/en/latest/tutorials/rendering/renderers.html)
- Godot 4.6 fixed Vulkan Mobile crashes on certain Mali and Adreno GPUs (from Rift Riff and Kamaeru crash logs). It also added debanding and HDR precision improvements, and Godot describes Mobile as "a strong choice for high-performance 3D on mobile". No benchmark numbers were given. — [Godot 4.6 release page](https://godotengine.org/releases/4.6/)
- Godot Foundation mobile update (Apr 2026):
  - GPU driver diversity is "a major source of mobile stability issues". Android spans more than 12,000 devices.
  - Vulkan usage fixes and driver workarounds cut crash rates in two shipped games from about 4% to under 1%.
  - 4.6 added Perfetto tracing for Android and in-editor device mirroring.

  — [Godot blog: mobile update Apr 2026](https://godotengine.org/article/godot-mobile-update-apr-2026/)
- Godot 4.7 added Vulkan subsampled images (foveated rendering, XR-oriented) to the Mobile renderer. 4.7 HDR output excludes Compatibility and Android. — [Phoronix: Godot 4.7 released](https://phoronix.com/news/godot-4.7-released); [Digital Production: Godot 4.7](https://digitalproduction.com/2026/06/23/godot-4-7-turns-up-hdr/); [Godot 4.7 release page](https://godotengine.org/releases/4.7/)
- Arm (Pixel 8 Pro, Mali) found the Vulkan Mobile renderer was bandwidth-bound by unnecessary attachment load/store, with MSAA color and resolve targets written to main memory.
  - Baseline: a cube scene at 2688×5984 with 4x MSAA ran at 50 FPS.
  - After the render-graph-driven load/store fix (PR #98670, in 4.4): v-sync locked, 26% GPU utilization, and about 300x less external write bandwidth.

  — [Arm: Optimizing 3D scenes in Godot on Arm GPUs](https://developer.arm.com/community/arm-community-blogs/b/mobile-graphics-and-gaming-blog/posts/optimizing-3d-scenes-in-godot-on-arm-gpus)
- Regression report: a simple 3D scene on a Mali-G52 MC2 dropped from about 60 to about 45 FPS starting with 4.4 dev4 and continuing into 4.5 snapshots. — [GitHub issue #109251](https://github.com/godotengine/godot/issues/109251) (seen via search snippet; I did not verify whether it was resolved)

### Inferences
- **Compatibility as default tier.** The pitch and crowd scene is mostly static and fits baked lighting plus a single directional or "fake" light rig, which Compatibility handles well. The LDR buffer limits glow and tonemap headroom, so author emissives and floodlight halos to look right in LDR.
- **Mobile renderer as a "High" tier** on Vulkan-reliable devices (recent Adreno 6xx/7xx and Mali-G7x+), mainly for FXAA, ASTC textures, mipmap bias, DoF on replays, and better tonemap precision. Gate it with a device allowlist and fall back on crash or first-launch failure.
- Godot supports `rendering/rendering_device/fallback_to_opengl3` (and Compatibility as an Android fallback). Verify the exact setting name in the 4.7 ProjectSettings reference.
- Switching renderer requires a restart. The `--rendering-method` command-line flag or the project setting is read at startup, so implement tier switching as "save choice, restart app".

### Gaps
- I found no controlled Compatibility-vs-Mobile FPS benchmark on the same Adreno and Mali devices for Godot 4.6/4.7. The only numbers are anecdotal GitHub issues. The team must measure on its own device matrix.
- No Godot source confirms whether the Mali-G52 regression (#109251) was fixed by 4.7.

---

## 2. Grass and pitch: EA FC-like look on a cheap shader

### Takeaway
Do the pitch as **one large mesh (or a few tiles) with one custom shader**. Compute the mowing stripes procedurally from world-space XZ, with view-dependent brightness. Add a tiled detail albedo and normal at two scales for close-up breakup, plus a low-frequency macro noise or wear mask texture. Use baked lightmap or "stadium shadow mask" textures for stand and roof shadows instead of real-time shadow coverage, and put lines in a separate mask texture or a signed-distance (SDF) field. This is a handful of texture samples and ALU in one draw call, which is cheap even on low-end GPUs. The physics of real stripes (blade tilt toward or away from the viewer) argues for shading by view direction, not by geometry.

### Cited Findings
- Real lawn stripes are an optical effect of grass blades bent in opposite directions. Seen from behind the mowing direction, blades lean away and look lighter. Seen facing the mowing direction, they look darker. The cause is reflection angle, not color or height. — [University of Minnesota Turfgrass: Light reflection and mowing patterns](https://turf.umn.edu/light-reflection-and-mowing-patterns); [LawnStarter](https://www.lawnstarter.com/blog/?p=15259); [BrightView](https://www.brightview.com/resources/article/secret-getting-lawn-stripes-your-athletic-field)
- Common pro patterns are straight stripes, checkerboard, and diagonal. — [Art of Manliness](https://www.artofmanliness.com/skills/homeownership/make-your-yard-look-like-wrigley-field/)
- One source cites stripe width of about 5.5 m (World Cup pitch). This is a single source, so treat it as indicative. — [Mammotion](https://uk.mammotion.com/blogs/news/world-cup-pitch-real-or-fake-grass)
- Godot docs advise keeping transparent objects to a minimum (they cannot be sorted like opaque ones). This argues against layered alpha "grass card" fur on the pitch. — [Godot docs: Optimizing 3D performance](https://docs.godotengine.org/en/latest/tutorials/performance/optimizing_3d_performance.html)
- Normal maps: only the R and G channels are needed. RGTC compression preserves normal detail better than standard VRAM compression at equal memory, and Godot auto-detects normal maps on import. — [Godot docs: Importing images](https://docs.godotengine.org/en/latest/tutorials/assets_pipeline/importing_images.html)
- Decals are supported in Compatibility, with 8 per surface and 64 per view. — [Godot docs: Overview of renderers](https://docs.godotengine.org/en/latest/tutorials/rendering/renderers.html)

### Inferences (shader recipe, my synthesis; not from a single source)
- **Stripes:**
  - `band = step(0.5, fract(world.z / STRIPE_W))` gives straight stripes. Multiply two such terms for a checkerboard.
  - Brightness factor: `mix(dark, light, band)`, modulated by `dot(normalize(view_dir.xz), mow_dir) * sign(band - 0.5)`. Stripes then swap light and dark as the broadcast camera pans, like real TV footage.
  - Use `smoothstep` with an `fwidth()`-based edge to avoid aliasing at distance, which matters because Compatibility has no FXAA.
- **Detail:**
  - One 512–1024 px tiling grass albedo plus normal, sampled at two UV scales (e.g. 1x and 7.3x) and blended to kill tiling repetition.
  - A low-res (e.g. 256–512 px) macro noise or wear texture over the whole pitch, covering goalmouths, the centre circle and touchline wear.
  - Mipmaps and anisotropic filtering on the tiling textures (anisotropy x4 is a moderate cost on mobile). Grazing broadcast angles otherwise blur or shimmer.
- **Lines:**
  - Bake pitch markings into a single-channel mask texture covering the pitch (2048 px along the length is enough if sampled with smoothstep), or compute analytic SDF lines in the shader. Analytic lines are resolution-independent and alias-free with `fwidth`.
  - Avoid decals or separate transparent line meshes, which add overdraw and z-fighting.
- **Stand shadow on pitch:** sample a baked shadow mask texture (a lightmap or a hand-painted mask in pitch UV space) for the stands and roof shadow. For a time-of-day or match-time change, keep two masks and lerp. This replaces a large-radius real-time directional shadow.
- **Specular and "sheen":** low roughness variation driven by the stripe band, plus a cheap rim/Fresnel term toward the horizon, sells the "TV grass" look without SSR.
- Set `render_mode` to avoid unused features on the pitch shader (e.g. `specular_schlick_ggx` or cheaper, no `ambient_light_disabled` unless baked). Keep the shader opaque.

### Gaps
- I found no published Godot (or other engine) mobile football-pitch shader with measured cost, and no EA FC / eFootball mobile rendering postmortem. The recipe above is engineering synthesis.
- There is no measured cost of anisotropic filtering in Godot Compatibility on Mali or Adreno.

---

## 3. Lighting: lightmaps, AO, fake shadows, directional shadow settings, night floodlights

### Takeaway
Bake everything static (stands, roof, pitch, perimeter) with LightmapGI, using Static bake mode for floodlights and stadium lights. Keep **one** DirectionalLight3D in Dynamic mode for player shadows, with a short shadow distance (about 30–60 m around the broadcast camera's focus) and 2 PSSM splits or orthogonal. Use a shadowmask in Replace or Overlay mode so baked shadows cover the rest. Fake floodlight multi-shadows with blob or decal "shadow stars" under players instead of 4–8 dynamic shadowed lights. Night look comes from baked floodlight illumination, emissive light heads, LDR-safe glow, and fog/haze, not dynamic omni lights.

### Cited Findings
- Light bake modes:
  - **Static** bakes direct and indirect light ("best performance"), but the light no longer affects baked surfaces.
  - **Dynamic** (the default) bakes indirect only.
  - **Disabled** ignores the light during baking.

  Docs suggest keeping DirectionalLight3D Dynamic and most omni and spot lights Static. Static lights cannot cast shadows onto baked meshes. — [Godot docs: Using LightmapGI](https://docs.godotengine.org/en/latest/tutorials/3d/global_illumination/using_lightmap_gi.html); [Godot docs: Optimizing 3D performance](https://docs.godotengine.org/en/latest/tutorials/performance/optimizing_3d_performance.html)
- Baked lightmaps "use almost no runtime resources" and "typically offer both the best quality *and* performance at the same time in (mostly) static scenes". Dynamic objects get indirect light from LightmapProbes (auto-generated, subdiv default 8). Direct light is not stored in probes. — [Godot docs: Using LightmapGI](https://docs.godotengine.org/en/latest/tutorials/3d/global_illumination/using_lightmap_gi.html)
- Shadowmask modes apply to the first Dynamic DirectionalLight3D:
  - **None:** no shadows beyond max distance.
  - **Replace:** baked shadows beyond max distance, real-time within.
  - **Overlay:** baked shadows over the whole scene with real-time shadows layered on top. It can smear.

  Switching between Replace and Overlay needs no rebake. — [Godot docs: Using LightmapGI](https://docs.godotengine.org/en/latest/tutorials/3d/global_illumination/using_lightmap_gi.html)
- Godot 4.4 added LightmapGI shadowmasks, described as "shortening the dynamic shadow range is an important optimization, especially on mobile". 4.4 also added bicubic lightmap sampling (small runtime cost, can be disabled), transparent-object baking (tinted shadows), and the Light3D **Shadow Caster Mask** to choose which render layers cast shadows. — [Godot 4.4 release page](https://godotengine.org/releases/4.4/)
- Lightmap texel size defaults to 0.2. Larger scenes can use 0.5 or more. Directional lightmaps improve normal-mapped surfaces but are "slightly more expensive" to render. Only 8 LightmapGI nodes can render at once. Lightmaps need UV2 and heavy VRAM at bake time. They provide no reflections, so pair them with a probe or sky. — [Godot docs: Using LightmapGI](https://docs.godotengine.org/en/latest/tutorials/3d/global_illumination/using_lightmap_gi.html)
- Compatibility can render baked lightmaps, but baking requires RenderingDevice hardware. Bake in the editor using Forward+ or Mobile, then ship with Compatibility. — [Godot docs: Overview of renderers](https://docs.godotengine.org/en/latest/tutorials/rendering/renderers.html)
- Directional shadow settings and costs:
  - PSSM 4 splits is the default. An object spanning all four splits is "rendered five times in total".
  - Lower Max Distance gives "better-looking shadows and better performance".
  - Blend Splits costs detail and performance.
  - Soft filter presets run Very Low < Low (default) < Medium < High < Ultra, with more samples costing more.
  - 16-bit shadow depth is the default. 32-bit has a significant cost for little gain.
  - For low-end GPUs, reduce shadow map size to 2048.

  — [Godot docs: Lights and shadows](https://docs.godotengine.org/en/latest/tutorials/3d/lights_and_shadows.html)
- Real-time lighting, multiple shadow-casting lights and GI "may simply be too much for lower power mobile devices". Baked lighting is recommended especially for mobile. — [Godot docs: Optimizing 3D performance](https://docs.godotengine.org/en/latest/tutorials/performance/optimizing_3d_performance.html)
- Positional shadow atlas defaults to 4096 and supports up to 88 shadowed omni and spot lights in view. In Compatibility, each shadowed light adds a pass (multi-pass). — [Godot docs: Lights and shadows](https://docs.godotengine.org/en/latest/tutorials/3d/lights_and_shadows.html)

### Inferences
- **Recommended player shadow setup (Compatibility):**
  - DirectionalLight3D with `directional_shadow_mode = SHADOW_ORTHOGONAL` (one pass) or `PARALLEL_2_SPLITS`.
  - `directional_shadow_max_distance` of about 40–60 m. The broadcast camera sees about half the pitch, and the max distance is measured from the camera, so tune it per camera height.
  - `rendering/lights_and_shadows/directional_shadow/size` = 2048 (Low tier 1024).
  - Soft shadow quality Very Low or Hard on the Low tier.
  - Use `shadow_caster_mask` so only the player and ball layer casts real-time shadows. The pitch and stands rely on the baked shadowmask.
  - This yields 1–2 extra depth passes of about 22×10k tris plus the ball. Mesh LOD also applies to shadow passes, which needs device verification.
- **Low tier:** disable real-time shadows entirely. Use a blob shadow per player (one projected quad or Decal with a soft radial texture) plus 4 faint "floodlight star" blobs offset by the four floodlight directions for the night look. These are 5 small decals per player, about 110 in total. That exceeds the 64-per-view decal default in Compatibility, so either raise the limit or use **one MultiMesh of alpha-blended quads** for all blob shadows (a single draw call).
- **Baked AO:** bake AO into the stands and stadium textures (DCC or the lightmap). Avoid runtime SSAO on mobile, even though Compatibility lists SSAO support, because it is a full-screen pass at native res. For players, bake AO into the albedo or ORM texture.
- **Night floodlights:**
  - Bake 4 floodlight banks as Static SpotLights into the lightmap.
  - Use emissive materials on the light heads plus glow.
  - Add billboard lens-flare or halo sprites (additive, few).
  - Use mild depth fog or haze for atmosphere.
  - Keep only the one dynamic directional "key" (positioned as the dominant floodlight) for player shadows and specular.
  - Optionally add a static "rim" from a second directional light without shadows (8 directional lights is the max; a non-shadowed directional light is cheap in a forward renderer).

### Gaps
- I found no Godot-specific measured ms costs for shadow cascades, map size or filter quality on Android GPUs.
- Whether Compatibility supports the LightmapGI *shadowmask* and bicubic modes (vs only Forward+/Mobile) is not explicitly stated on the pages I read. Verify in 4.7 before committing.

---

## 4. Post-processing: what is available and what costs what

### Takeaway
In Compatibility you get tonemapping (incl. AgX since 4.4, configurable since 4.6), a lower-end glow implementation, adjustments (brightness, contrast, saturation, color-correction LUT), fog, MSAA (no alpha-to-coverage) and bilinear 3D render scale. You do **not** get FXAA, FSR1/2 or mipmap bias. Glow in Compatibility is cheap. In the Mobile renderer, glow was historically extremely slow on Android (120 → 37 FPS on a Galaxy A35); fixes landed for 4.5 and 4.6. The cheapest big win for both renderers is 3D render scale (0.75 gives about 44% fewer pixels) combined with careful aliasing control.

### Cited Findings
- Tonemapping, glow and adjustments are supported in Compatibility and Mobile. DoF is Mobile only. — [Godot docs: Overview of renderers](https://docs.godotengine.org/en/latest/tutorials/rendering/renderers.html)
- AgX tonemapping was added in 4.4 as "a simplified version of Blender's AgX… much more suitable for real time". In 4.6, `agx_white` and `agx_contrast` became configurable. — [Godot 4.4 release](https://godotengine.org/releases/4.4/); [Godot 4.4 beta 1](https://godotengine.org/article/dev-snapshot-godot-4-4-beta-1/); [Godot 4.6 release](https://godotengine.org/releases/4.6/)
- 4.6 changed glow to blend *before* tonemapping, with Screen as the new default blend mode, across renderers. The change is described as performing at least as well as before. 4.6 also added a material debanding option (relevant to LDR banding in skies and grass gradients). — [Godot 4.6 release](https://godotengine.org/releases/4.6/)
- Mobile renderer glow (GitHub #98531, Galaxy A35):
  - No glow: about 120 FPS.
  - Glow on: about 37 FPS (and invisible).
  - Compatibility with glow: about 120 FPS.
  - 3D scale 0.5 made it *worse* (28–30 FPS).

  Mobile glow mirrors Forward+ using fragment shaders, while Compatibility uses "a separate, lower-end glow implementation with fewer options". Partial fix PR #109994 (Aug 2025); closed via PR #110077 (Oct 2025, 4.6 milestone). One tester still saw poor performance after the first fix. — [GitHub issue #98531](https://github.com/godotengine/godot/issues/98531)
- Resolution scaling:
  - Bilinear works in all renderers.
  - FSR 1.0 and 2.2 are Forward+ only.
  - Mipmap bias is Forward+ and Mobile only, not Compatibility.

  Scale is per axis: 0.5 at 1080p gives 0.52 MPix vs 2.07 native (4x fewer pixels), and 0.75 gives 1.17 MPix. If scaling does not help, the bottleneck is elsewhere (draw calls or CPU). Settings: Rendering > Scaling 3D > Mode/Scale, and `Viewport.scaling_3d_scale` at runtime. — [Godot docs: Resolution scaling](https://docs.godotengine.org/en/latest/tutorials/3d/resolution_scaling.html)
- MSAA on tile-based GPUs: Arm showed the MSAA color plus resolve being written back to main memory as the dominant cost in the Vulkan Mobile renderer before the 4.4 fix. After the fix, a 2x-native-res 4x MSAA scene became v-sync locked. — [Arm blog](https://developer.arm.com/community/arm-community-blogs/b/mobile-graphics-and-gaming-blog/posts/optimizing-3d-scenes-in-godot-on-arm-gpus)
- MSAA 3D is supported in Compatibility without alpha-to-coverage. FXAA is not supported in Compatibility. — [Godot docs: Overview of renderers](https://docs.godotengine.org/en/latest/tutorials/rendering/renderers.html)

### Inferences (ranked by visual gain per cost for Compatibility)
1. **Tonemap (AgX or Filmic) plus Adjustments with a color-correction LUT.** This is almost free (folded into the final pass) and gives the biggest "broadcast grade" gain. Author one LUT per stadium/time-of-day.
2. **3D render scale 0.75–0.85 with MSAA 2x/4x.** On tile-based GPUs, MSAA is resolved on-chip and is relatively cheap when Godot does not store the MSAA buffer (fixed for Vulkan in 4.4; GLES behavior is driver-dependent). Thin pitch lines and player edges benefit the most. Render scale reclaims fill-rate.
3. **Glow (Compatibility implementation)** at low intensity, for floodlight heads and the night look. It is cheap per #98531. Keep the level count low and the threshold suited to LDR.
4. **Depth fog / height fog.** Very cheap haze for night games and stand depth.
5. **Vignette.** Not a built-in Environment feature. Add it as a tiny full-screen quad or CanvasLayer shader, or bake it into the LUT/overlay. It is cheap but costs a full-screen blend.
6. **Avoid:** SSAO (full-screen, little gain over baked AO), DoF (Mobile only; reserve it for replays and cutscenes on the High tier), and any extra full-screen custom passes on the Low tier.
- On Mobile renderer devices: FXAA is available as a cheap alternative to MSAA. Verify glow cost on 4.7 before enabling it on mid-tier devices.

### Gaps
- There are no measured per-effect millisecond costs for Godot post-processing on Android in 4.6/4.7.
- I did not confirm whether 4.7 Compatibility exposes all tonemappers (AgX) identically to Mobile. The renderer page lists only a generic "Tonemapping" row.
- MSAA load/store behavior in the GLES3 (Compatibility) backend on Mali/Adreno was not documented in what I found.

---

## 5. Characters and crowd: LOD, skinning cost, impostors, MultiMesh, shadows

### Takeaway
Players and crowd dominate CPU and vertex cost:

- **Skinning:** 22 skinned characters at about 10k tris each is about 220k skinned tris before shadows. Use import-generated mesh LOD (screen-space driven, so it works with the broadcast camera automatically), a modest `lod_bias`, a reduced bone count, and throttled animation updates for off-focus players.
- **Crowd:** render the crowd as MultiMesh cards or impostors (one draw call per stand section) with alpha-scissor (not blend), animated in the vertex shader.
- **Shadows:** blob or decal shadows on low tier; on higher tiers, real shadows only from players.

### Cited Findings
- Mesh LOD is auto-generated on import (glTF, .blend, FBX) via meshoptimizer. It works on MeshInstance3D, MultiMeshInstance3D and particles. It is screen-space based (accounts for FOV and resolution). It "may occasionally introduce rendering issues (especially in skinned meshes)", and LOD generation can be disabled per mesh. `lod_bias` on GeometryInstance3D (>1 is higher quality, <1 is faster). Project setting Rendering > Mesh LOD > LOD Change > Threshold Pixels defaults to 1 ("perceptually lossless"); at runtime use `get_tree().root.mesh_lod_threshold = 4.0`. — [Godot docs: Mesh LOD](https://docs.godotengine.org/en/latest/tutorials/3d/mesh_lod.html)
- Godot 4.6 improved LOD generation to better preserve the shape of multi-part objects. — [Godot 4.6 release](https://godotengine.org/releases/4.6/)
- For MultiMesh: all instances share one LOD level, chosen from the AABB point closest to the camera. Split far-apart instances into separate MultiMeshInstance3D nodes so per-node culling and LOD work. — [Godot docs: Mesh LOD](https://docs.godotengine.org/en/latest/tutorials/3d/mesh_lod.html)
- Automatic instancing "is only implemented in the Forward+ renderer, not Mobile or Compatibility". Use MultiMesh for many identical objects. Impostors and billboards are recommended for distant objects, but overlapping transparent quads cost fill rate. — [Godot docs: Optimizing 3D performance](https://docs.godotengine.org/en/latest/tutorials/performance/optimizing_3d_performance.html)
- Animation and skinning "can be very expensive on some platforms". Lower the polycount of animated models, reduce the animation rate for distant or occluded meshes, and pause unnoticed animation. Use VisibleOnScreenEnabler3D or VisibleOnScreenNotifier3D. — [Godot docs: Optimizing 3D performance](https://docs.godotengine.org/en/latest/tutorials/performance/optimizing_3d_performance.html)
- Visibility ranges (HLOD) let you author manual LOD swaps, and Distance Fade is available on decals and lights. — [Godot docs: Optimizing 3D performance](https://docs.godotengine.org/en/latest/tutorials/performance/optimizing_3d_performance.html); [Godot docs: Mesh LOD](https://docs.godotengine.org/en/latest/tutorials/3d/mesh_lod.html)
- Physics interpolation (4.4) decouples the physics tick from the frame rate, so mobile games can lower the tick rate without losing smoothness. — [Godot 4.4 release](https://godotengine.org/releases/4.4/)
- Alpha-tested materials: enable "Preserve Alpha Test Coverage" on textures with alpha so mipmapped cutouts (crowd cards) do not vanish at distance. — [Godot docs: Importing images](https://docs.godotengine.org/en/latest/tutorials/assets_pipeline/importing_images.html)
- MSAA in Compatibility has no alpha-to-coverage, so alpha-scissor crowd edges will alias. — [Godot docs: Overview of renderers](https://docs.godotengine.org/en/latest/tutorials/rendering/renderers.html)

### Inferences
- **Player budget:** LOD0 about 10k tris (close-ups and replays), auto LODs down to about 2–3k tris at broadcast distance. With the default 1 px threshold, set the root viewport `mesh_lod_threshold` to about 2–4 px on Low tier.
- **Skinning in Godot 4 runs on the GPU** (a compute pass in RenderingDevice renderers; a transform-feedback/vertex path in Compatibility). Cost scales with vertices × influences, so reduce bones (football players need about 40–60 bones; strip fingers and face bones for gameplay LODs) and keep max 4 weights.
- **Animation update throttling:**
  - Set `AnimationMixer.callback_mode_process = ANIMATION_CALLBACK_MODE_PROCESS_MANUAL` (AnimationPlayer/AnimationTree inherit from AnimationMixer) and call `advance(delta_accum)` at 30 Hz for players far from the ball or out of the camera frustum, and every frame for the 4–6 players near the ball.
  - Stagger updates across frames (`player_index % N == frame % N`).
  - API names are from the Godot 4.x class reference, which I did not fetch in this session.

  ```gdscript
  # Per-player animation LOD (sketch)
  @onready var tree: AnimationTree = $AnimationTree
  var acc := 0.0
  func _ready(): tree.callback_mode_process = AnimationMixer.ANIMATION_CALLBACK_MODE_PROCESS_MANUAL
  func _process(dt):
      acc += dt
      var hz := 60.0 if near_ball else 20.0
      if acc >= 1.0 / hz:
          tree.advance(acc); acc = 0.0
  ```
- **Crowd:**
  - Use one MultiMeshInstance3D per stand section (e.g. 8–16 sections, so frustum culling works). Each instance is a quad or very low-poly (<100 tris) card using alpha scissor, with a texture atlas of 8–16 fan variations plus per-instance color (`use_colors`/`custom_data`) for shirt tint.
  - Animate with a vertex-shader bob or jump driven by `INSTANCE_CUSTOM` and TIME, not skeletons.
  - Near the pitch (front rows seen in close-ups), optionally use a few low-poly 3D fans as MultiMesh with baked vertex animation (VAT).
  - Turn off shadow casting on the crowd (`cast_shadow = OFF`). Bake crowd occlusion into the stand lightmap instead.
- **Shadows:**
  - Low tier: blob shadows (a MultiMesh of quads under 22 players plus the ball, one draw call).
  - Mid/High tier: real directional shadows only for the player and ball layer via `shadow_caster_mask`, short distance, 1–2 splits.
  - The ball needs a contact shadow for readability. A blob is fine even on the High tier.

### Gaps
- There are no measured Godot numbers for skinned-mesh cost per character on Android, or for how Compatibility performs skinning (CPU vs GPU) in 4.7. Profile it.
- I found no Godot-specific crowd impostor sample with numbers.
- I did not verify that mesh LOD also reduces shadow-pass cost in Compatibility.

---

## 6. Stability: frame pacing, 30 vs 60, thermals, adaptive quality, textures, draw calls, profiling

### Takeaway
Godot 4.4+ integrates Android Frame Pacing (Swappy) automatically. Ship a locked **30 FPS default for Low/Mid tiers** and a 60 FPS option for High, with physics interpolation and a fixed physics tick. Adaptive quality must be custom built: Godot has no built-in ADPF or thermal API, so either poll frame time and adjust `scaling_3d_scale` and shadow tiers, or write an Android plugin for ADPF thermal headroom. Use ETC2 (Compatibility) or ASTC (Mobile, "High Quality") compressed textures with mipmaps. Keep draw calls low via MultiMesh and merged static stadium meshes. Profile with Godot's remote profiler and monitors, Perfetto (4.6+), and Arm Streamline / Android GPU Inspector.

### Cited Findings
- Godot 4.4 integrated the Android Frame Pacing library (Swappy) for "smooth rendering and correct frame pacing on Android". It handles multiple refresh rates and is automatic with no setup. — [Godot 4.4 release](https://godotengine.org/releases/4.4/)
- Godot 4.4 ubershaders are precompiled and used as a fallback while specialized shaders compile, said to "completely avoid shader stutter". This applies to RenderingDevice renderers. — [Godot 4.4 release](https://godotengine.org/releases/4.4/)
- Godot 4.6 added tracing profiler support (Perfetto on Android, Instruments on Apple), Android instrumented tests (Firebase Test Lab), and device mirroring. — [Godot blog: mobile update Apr 2026](https://godotengine.org/article/godot-mobile-update-apr-2026/); [Godot 4.6 release](https://godotengine.org/releases/4.6/)
- Arm recommends profiling a debug-exported Godot build with Arm Performance Studio (Streamline and Performance Advisor via `streamline_me.py --lwi-mode counters`) and checking for disproportionate read and write bandwidth. — [Arm blog](https://developer.arm.com/community/arm-community-blogs/b/mobile-graphics-and-gaming-blog/posts/optimizing-3d-scenes-in-godot-on-arm-gpus)
- ADPF:
  - Reads thermal headroom (preferred over discrete thermal status) and provides performance hint sessions that report target and actual frame durations.
  - The Unreal plugin maps thermal levels to quality tiers: Light → 2, Moderate → 1, Severe/Critical → 0, changing resolution scale, view distance, AA and post.
  - Netmarble's Kingsroad lowered resolution and frame rate when hot and kept thermal headroom ≤ 1.0.

  — [Android: ADPF Unreal plugin](https://developer.android.com/games/engines/unreal/unreal-adpf); [Android: ADPF best practices](https://developer.android.com/games/optimize/adpf/best-practices-adpf); [Android: Netmarble GoT ADPF story](https://developer.android.com/stories/games/netmarble-got-adpf?hl=en)
- I found no Godot ADPF plugin in search. It would need a custom Android plugin or GDExtension. — (negative search result; [Android ADPF overview](https://developer.android.com/games/optimize/adpf))
- Texture compression:
  - VRAM Compressed uses ETC2 on mobile.
  - "High Quality" uses ASTC on mobile, but only in Forward+ and Mobile. In Compatibility it is always treated as disabled, so you get ETC2.
  - 4096² RGBA with mipmaps drops from 85.33 MiB to 21.33 MiB (4:1).
  - Mipmaps add about 33%.
  - Normal maps use RGTC.
  - Basis Universal gives small files but lower quality.

  — [Godot docs: Importing images](https://docs.godotengine.org/en/latest/tutorials/assets_pipeline/importing_images.html)
- 4.6 imports GPU-compressed 3D textures up to 2x faster. — [Godot 4.6 release](https://godotengine.org/releases/4.6/)
- Frame time equals the slower of CPU and GPU. Profile, fix the biggest bottleneck, and repeat, testing on multiple real mobile devices. — [Godot docs: General optimization](https://docs.godotengine.org/en/latest/tutorials/performance/general_optimization.html)
- If render scale does not improve FPS, the bottleneck is draw calls or CPU. — [Godot docs: Resolution scaling](https://docs.godotengine.org/en/latest/tutorials/3d/resolution_scaling.html)
- An anecdotal Godot forum thread reports a web-export-on-mobile scene going from 31 to 60 FPS by fixing the art pipeline (textures and assets) rather than code. — [Godot Forum thread](https://forum.godotengine.org/t/godot-4-web-export-stutters-on-mobile-its-probably-your-art-pipeline-not-your-code-31fps-to-60fps-benchmarks-inside/143268) (not fetched; title-level evidence only)

### Inferences
- **30 vs 60:** for low and mid devices, a locked 30 with consistent pacing beats a fluctuating 40–60 (Swappy handles the swap interval). Set `Engine.max_fps = 30` (or display refresh/2) and `physics/common/physics_ticks_per_second = 30` with physics interpolation on. Offer 60 only on the High tier, and drop to 30 automatically if the rolling 95th-percentile frame time exceeds about 15 ms for several seconds.
- **Device tier detection at first launch:**
  - Read `RenderingServer.get_video_adapter_name()` and `OS.get_processor_count()`, plus a short (2–3 s) in-menu benchmark scene. Map Adreno/Mali model strings to tiers via a JSON allowlist.
  - Persist the choice and let players override it.
  - Renderer switch (Compatibility ↔ Mobile) requires a restart.
- **Dynamic resolution (no built-in in Godot):** a controller in `_process` measuring `Performance.get_monitor(Performance.TIME_PROCESS)` is CPU only, so use the GPU frame time via `RenderingServer.viewport_get_measured_render_time_gpu(get_viewport().get_viewport_rid())` after `viewport_set_measure_render_time(rid, true)`. Adjust `get_viewport().scaling_3d_scale` within [0.6, 1.0] in 0.05 steps with hysteresis.
  ```gdscript
  # Dynamic resolution sketch (verify API names against 4.7 class reference)
  var rid := get_viewport().get_viewport_rid()
  func _ready(): RenderingServer.viewport_set_measure_render_time(rid, true)
  func _process(_dt):
      var gpu_ms := RenderingServer.viewport_get_measured_render_time_gpu(rid)
      var budget := 1000.0 / Engine.max_fps * 0.85
      var vp := get_viewport()
      if gpu_ms > budget: vp.scaling_3d_scale = max(0.6, vp.scaling_3d_scale - 0.05)
      elif gpu_ms < budget * 0.7: vp.scaling_3d_scale = min(1.0, vp.scaling_3d_scale + 0.05)
  ```
- **Thermals:** without an ADPF plugin, approximate throttling by detecting a sustained rise in GPU frame time at constant scene load and stepping down tiers (shadows off → render scale → glow off).
- **Draw-call budget (not from a Godot source):** common mobile guidance is about 100–300 draw calls for low/mid Android. For this scene:
  - About 22 player draws, plus shadow-pass draws.
  - About 1–3 pitch draws.
  - About 8–16 crowd MultiMesh draws.
  - About 10–30 for merged stadium geometry.
  - UI.

  Budget roughly 150 total. Check `Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME` and `RENDER_TOTAL_PRIMITIVES_IN_FRAME` monitors on the device via the remote debugger.
- **Textures:** in Compatibility, everything becomes ETC2. Keep player kit textures at 512–1024, stadium atlases at 2048, and the pitch detail at 1024 tiling. Use mipmaps on all 3D textures. Use RGTC for normals.

### Gaps
- I found no Godot-specific published draw-call or triangle budgets for Android tiers, and no Arm or Qualcomm numbers fetched in this session.
- There is no Godot built-in ADPF, thermal or dynamic-resolution feature, and I found no community plugin.
- I did not verify whether Swappy also applies to the Compatibility (GLES) backend or only Vulkan. The 4.4 notes do not specify.
- I could not access r/godot measurement threads in this session.

---

## Summary ranking: visual gain per performance cost (for this scene, Compatibility tier)

| Rank | Technique | Gain | Cost | Evidence basis |
|---|---|---|---|---|
| 1 | LightmapGI bake of stadium + pitch (Static floodlights, baked AO) | Very high | ~0 runtime | Godot LightmapGI docs |
| 2 | Tonemap (AgX/Filmic) + Adjustments + LUT grade | High | ~0 | Renderer docs, 4.4/4.6 notes |
| 3 | Procedural world-space stripes + 2-scale detail + macro/wear mask + analytic lines (single opaque shader) | High | Low (a few samples) | Synthesis + turf physics |
| 4 | Mesh LOD (auto) + `mesh_lod_threshold` 2–4 on Low | Medium (frees budget) | Negative (saves) | Mesh LOD docs |
| 5 | MultiMesh crowd cards (alpha scissor, vertex-anim, sectioned) | High (full stands) | Low | Optimization docs |
| 6 | 3D render scale 0.75–0.85 + MSAA 2x | Medium (stability, AA) | Saves fill | Resolution scaling docs, Arm |
| 7 | One dynamic directional light, short distance, 1–2 splits, caster mask = players | Medium-high | Medium | Shadow docs, 4.4 notes |
| 8 | Compatibility glow (floodlight heads) + fog haze | Medium (night look) | Low in Compat; historically high in Mobile | Issue #98531 |
| 9 | Animation update throttling for off-ball players | None visible | Saves CPU | Optimization docs |
| 10 | Blob/star shadows via MultiMesh (Low tier) | Medium | Very low | Synthesis |
| Avoid | SSAO, DoF, multiple shadowed lights, alpha-blended grass fur, many decals | Low per cost | High | Docs |
