extends SceneTree
# Ball-collection check (no rendering). CPU v CPU matches plus matches with a scripted human who just holds the
# stick at the ball with sprint on (what a player does with a loose ball). Counts:
#  - orbits: a player 0.5-3 m from a loose ball goes more than 120 degrees round it without touching it
#  - loose time: how long the ball stays nobody's
#  - first touches: controlled / miscontrolled receptions
#   RUNS=6 HALF=150 godot --headless -s tests/orbit_test.gd
var runs := 6
var half := 150.0

func _initialize():
	if OS.get_environment("RUNS") != "":
		runs = int(OS.get_environment("RUNS"))
	if OS.get_environment("HALF") != "":
		half = float(OS.get_environment("HALF"))
	var tot := {"orbits_ai": 0, "orbits_human": 0, "loose_t": 0.0, "loose_n": 0, "control": 0, "miscontrol": 0, "play_t": 0.0, "goals": 0, "passes": 0, "human_loose_wait": 0.0, "human_loose_n": 0}
	var t0 := Time.get_ticks_msec()
	for run in runs:
		var human := 0 if run % 2 == 1 else -1
		var r := _match(run, human)
		for k in r:
			tot[k] += r[k]
	var mins: float = tot["play_t"] / 60.0
	print("RESULT runs %d play %.1f min | orbits AI %d (%.2f / 10 min) human %d | loose avg %.2f s | first touch %d ok %d bad (%.0f %%) | human gets a loose ball in %.2f s | goals %d passes %d | %d ms" % [
		runs, mins, tot["orbits_ai"], tot["orbits_ai"] / maxf(mins, 0.01) * 10.0, tot["orbits_human"],
		tot["loose_t"] / maxf(tot["loose_n"], 1), tot["control"], tot["miscontrol"],
		100.0 * tot["control"] / maxf(tot["control"] + tot["miscontrol"], 1),
		tot["human_loose_wait"] / maxf(tot["human_loose_n"], 1), tot["goals"], tot["passes"], Time.get_ticks_msec() - t0])
	quit()


func _match(run: int, human: int) -> Dictionary:
	var m := MatchSim.new()
	m.setup([GameData.team_def(run % 6, "4-3-3", false), GameData.team_def((run + 3) % 6, "4-4-2", true)],
		[GameData.FORMATIONS["4-3-3"], GameData.FORMATIONS["4-4-2"]], human)
	m.half_seconds = half
	m.wait_halftime = false
	var r := {"orbits_ai": 0, "orbits_human": 0, "loose_t": 0.0, "loose_n": 0, "control": 0, "miscontrol": 0, "play_t": 0.0, "goals": 0, "passes": 0, "human_loose_wait": 0.0, "human_loose_n": 0}
	var acc := {}      # pid -> [last angle, accumulated]
	var loose_since := -1.0
	var hl_since := -1.0
	var rng := RandomNumberGenerator.new()
	rng.seed = run
	while m.phase != "fulltime" and m.time < half * 2.0 + 120.0:
		# the scripted human
		if human >= 0 and not m.humans.is_empty() and m.humans[0]["pid"] >= 0:
			var p: PlayerSim = m.players[m.humans[0]["pid"]]
			if m.phase in ["kickoff", "restart"] and m.restart.get("taker", -1) == p.id and m.phase_t > 0.6:
				m.human_action(0, "pass", 0.45, p.facing)
			elif m.phase == "play":
				if m.owner == p.id:
					p.move = Vector2(m.attack_dir(p.team), rng.randf_range(-0.3, 0.3)).normalized()
					p.sprint = 0.0
					if rng.randf() < 0.012:
						m.human_action(0, "pass", 0.5, p.facing)
				elif m.owner < 0:
					var to := m.ball2() - p.pos
					p.move = to.normalized() if to.length() > 0.1 else Vector2.ZERO
					p.sprint = 1.0
				else:
					var to2 := m.players[m.owner].pos - p.pos
					p.move = to2.normalized() if to2.length() > 0.5 else Vector2.ZERO
					p.sprint = 0.0
		m.step()
		for e in m.events:
			match e["type"]:
				"control":
					r["control"] += 1
				"miscontrol":
					r["miscontrol"] += 1
				"goal":
					r["goals"] += 1
				"kick":
					r["passes"] += 1
		m.events.clear()
		if m.phase != "play":
			acc.clear()
			loose_since = -1.0
			hl_since = -1.0
			continue
		r["play_t"] += MatchSim.DT
		var loose := m.owner < 0 and not m.in_hands and m.ball.pos.y < 1.2
		if loose:
			if loose_since < 0.0:
				loose_since = m.time
		elif loose_since >= 0.0:
			r["loose_t"] += m.time - loose_since
			r["loose_n"] += 1
			loose_since = -1.0
		# the human's own loose balls: within 4 m of him when it went loose
		if human >= 0 and m.humans[0]["pid"] >= 0:
			var hp: PlayerSim = m.players[m.humans[0]["pid"]]
			if loose and hl_since < 0.0 and hp.pos.distance_to(m.ball2()) < 4.0:
				hl_since = m.time
			elif not loose and hl_since >= 0.0:
				r["human_loose_wait"] += m.time - hl_since
				r["human_loose_n"] += 1
				hl_since = -1.0
		var bv := Vector2(m.ball.vel.x, m.ball.vel.z).length()
		for p in m.players:
			var dd := p.pos.distance_to(m.ball2())
			if not loose or bv > 7.0 or p.role == "GK" or dd > 3.0 or dd < 0.5 or p.immune > 0.0 or p.action != "":
				acc.erase(p.id)
				continue
			var rel := p.pos - m.ball2()
			var a := rel.angle()
			if not acc.has(p.id):
				acc[p.id] = [a, 0.0]
				continue
			var st: Array = acc[p.id]
			st[1] += absf(wrapf(a - st[0], -PI, PI))
			st[0] = a
			if st[1] > deg_to_rad(120.0):
				if p.human >= 0:
					r["orbits_human"] += 1
					if OS.get_environment("DEBUG") != "":
						print("orbit human t %.1f d %.2f spd %.1f ball %.1f move %s clip %s immune %.2f cap %.1f last %d" % [m.time, p.pos.distance_to(m.ball2()), p.vel.length(), bv, str(p.move), p.clip, p.immune, p.cap, m.last_touch])
				else:
					r["orbits_ai"] += 1
				st[1] = 0.0
	return r
