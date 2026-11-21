class_name BallView
extends Node3D
## The ball: panels texture, rolling spin from its velocity, a soft blob shadow for depth.

var mesh: MeshInstance3D
var blob: MeshInstance3D
var spin_q := Quaternion.IDENTITY


func _ready() -> void:
	mesh = MeshInstance3D.new()
	var sm := SphereMesh.new()
	sm.radius = BallPhysics.RADIUS
	sm.height = BallPhysics.RADIUS * 2.0
	sm.radial_segments = 24
	sm.rings = 12
	mesh.mesh = sm
	var mat := StandardMaterial3D.new()
	mat.albedo_texture = _ball_texture()
	mat.roughness = 0.35
	mesh.material_override = mat
	add_child(mesh)
	blob = MeshInstance3D.new()
	var pm := PlaneMesh.new()
	pm.size = Vector2(0.5, 0.5)
	blob.mesh = pm
	var bm := StandardMaterial3D.new()
	bm.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	bm.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	bm.albedo_texture = _blob_texture()
	bm.albedo_color = Color(0, 0, 0, 0.55)
	blob.material_override = bm
	blob.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(blob)


func update_view(b: BallPhysics, dt: float) -> void:
	mesh.position = b.pos
	var v := Vector3(b.vel.x, 0, b.vel.z)
	var s := v.length()
	if s > 0.05 and dt > 0.0:
		var axis := Vector3.UP.cross(v / s)
		spin_q = Quaternion(axis, s / BallPhysics.RADIUS * dt) * spin_q
	if b.spin.length() > 0.5 and dt > 0.0:
		spin_q = Quaternion(b.spin.normalized(), b.spin.length() * dt) * spin_q
	mesh.quaternion = spin_q.normalized()
	blob.position = Vector3(b.pos.x, 0.012, b.pos.z)
	var hgt := maxf(0.0, b.pos.y - BallPhysics.RADIUS)
	blob.scale = Vector3.ONE * (1.0 + hgt * 0.35)
	(blob.material_override as StandardMaterial3D).albedo_color = Color(0, 0, 0, 0.5 / (1.0 + hgt * 0.8))


func _ball_texture() -> ImageTexture:
	var w := 256
	var h := 128
	var img := Image.create(w, h, true, Image.FORMAT_RGB8)
	img.fill(Color(0.97, 0.97, 0.97))
	# dark panels scattered on the sphere (equirectangular)
	var centers := [Vector2(0.0, 0.5), Vector2(0.25, 0.2), Vector2(0.5, 0.5), Vector2(0.75, 0.8), Vector2(0.25, 0.8), Vector2(0.75, 0.2), Vector2(0.5, 0.05), Vector2(0.0, 0.95), Vector2(1.0, 0.5)]
	for y in h:
		for x in w:
			var u := x / float(w)
			var vv := y / float(h)
			for c in centers:
				var dx := absf(u - c.x)
				dx = minf(dx, 1.0 - dx) * sin(vv * PI) * 2.0
				var d := Vector2(dx, (vv - c.y) * 1.0).length()
				if d < 0.075:
					img.set_pixel(x, y, Color(0.12, 0.12, 0.14) if d < 0.065 else Color(0.85, 0.2, 0.1))
	img.generate_mipmaps()
	return ImageTexture.create_from_image(img)


func _blob_texture() -> ImageTexture:
	var n := 64
	var img := Image.create(n, n, false, Image.FORMAT_RGBA8)
	for y in n:
		for x in n:
			var d := Vector2(x - n * 0.5 + 0.5, y - n * 0.5 + 0.5).length() / (n * 0.5)
			img.set_pixel(x, y, Color(0, 0, 0, clampf(1.0 - d, 0.0, 1.0) ** 1.5))
	return ImageTexture.create_from_image(img)
