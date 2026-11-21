extends SceneTree
# Dribble feel: a human carrier in open space follows a scripted stick. Reports how fast the ball follows a
# change of direction, how far it gets from the feet, and how often it is lost.
var m: MatchSim
var p: PlayerSim
var far := {}

func _initialize():
	m = MatchSim.new()
	m.setup([GameData.team_def(0, "4-3-3", false), GameData.team_def(1, "4-4-2", true)], [GameData.FORMATIONS["4-3-3"], GameData.FORMATIONS["4-4-2"]], 0)
	m.phase = "play"
	p = m.team_players(0)[9]
	for q in m.players:
		if q != p:
			far[q.id] = Vector2(-50.0 + 4.0 * q.id, 33.0)
	p.pos = Vector2(-30, 0)
	p.facing = Vector2(1, 0)
	m.ball.pos = Vector3(-29.6, BallPhysics.RADIUS, 0)
	m.ball.vel = Vector3.ZERO
	m._set_owner(p)
	m.humans[0]["pid"] = p.id
	p.human = 0
	# script: [t_start, stick angle deg, length, sprint]
	var script := [[0.0, 0, 0.7, 0], [2.0, 90, 0.7, 0], [3.2, 180, 0.7, 0], [4.4, 0, 1.0, 1], [7.0, 135, 1.0, 1], [8.5, -45, 0.7, 0], [9.7, 0, 0.0, 0], [10.7, 60, 0.6, 0], [12.0, 0, 1.0, 1], [14.0, 0, 0.0, 0]]
	var seg := 0
	var change_t := 0.0
	var aligned := true
	var lat := []
	var maxd := 0.0
	var losses := 0
	var was_owner := true
	var t := 0.0
	var sum_d := 0.0
	var n := 0
	while t < 15.0:
		if seg + 1 < script.size() and t >= script[seg + 1][0]:
			seg += 1
			change_t = t
			aligned = false
		var sc: Array = script[seg]
		var dir := Vector2.from_angle(deg_to_rad(sc[1]))
		p.move = dir * sc[2]
		p.sprint = float(sc[3])
		for id in far:
			m.players[id].pos = far[id]
			m.players[id].vel = Vector2.ZERO
		m.step()
		t += m.DT
		var bp := Vector2(m.ball.pos.x, m.ball.pos.z)
		var d := bp.distance_to(p.pos)
		var bv := Vector2(m.ball.vel.x, m.ball.vel.z)
		if not aligned and sc[2] > 0.0 and bv.length() > 0.5 and absf(bv.angle_to(dir)) < deg_to_rad(25.0) and m.owner == p.id:
			aligned = true
			lat.append(snappedf(t - change_t, 0.01))
		if m.owner == p.id:
			maxd = maxf(maxd, d)
			sum_d += d
			n += 1
		if was_owner and m.owner != p.id:
			losses += 1
			print("  lost at t=%.2f d=%.2f" % [t, d])
			# give it back so the run continues
		if m.owner < 0 and d < 1.0:
			m._set_owner(p)
		was_owner = m.owner == p.id
		if t > 9.7 and t < 10.3 and int(t * 60.0) % 5 == 0:
			print("   dbg move %s vel %s act %s style %d tgt %.2f sprint %.1f" % [p.move, p.vel, p.action, p.style, p.target_speed(true), p.sprint])
		if int(t * 60.0) % 15 == 0:
			print("t=%5.2f stick %4d spd %4.1f  ball d %.2f  bv %4.1f  ang %4d  touches" % [t, sc[1], p.vel.length(), d, bv.length(), int(rad_to_deg(bv.angle_to(dir))) if bv.length() > 0.3 else 0])
	print("latency per change (s): ", lat)
	print("mean dist %.2f  max %.2f  losses %d" % [sum_d / maxf(1, n), maxd, losses])
	quit()
