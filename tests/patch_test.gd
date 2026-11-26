extends SceneTree
# Club edits and patches: a renamed club with a new kit shows everywhere (GameData.CLUBS), a patch exported from one
# profile and imported into another carries names, numbers and kits; junk text is refused.
var fails := 0

func check(ok: bool, what: String) -> void:
	print(("ok   " if ok else "FAIL ") + what)
	if not ok:
		fails += 1

func _initialize():
	var pr = get_root().get_node_or_null("Profile")
	var kept: Dictionary = pr.data.duplicate(true)   # the real profile comes back at the end (import_patch saves)
	pr.data = {"settings": {}, "squads": {}, "career": {}, "cup": {}, "records": {}}
	var id: String = GameData.CLUBS_BASE[0]["id"]
	pr.data["squads"][id] = {"club": {"name": "Cairo Kings", "short": "ckg", "kit": {"shirt": 0x112233, "pattern": "hoops"}},
		"players": {"3": {"name": "Test Player", "short": "Player", "number": 77}}}
	GameData.apply_club_edits(pr.data["squads"])
	check(GameData.CLUBS[0]["name"] == "Cairo Kings", "the club is renamed")
	check(GameData.CLUBS[0]["short"] == "CKG", "short name upper-cased")
	check(int(GameData.CLUBS[0]["kit"]["shirt"]) == 0x112233 and GameData.CLUBS[0]["kit"]["pattern"] == "hoops", "the kit changes")
	check(GameData.CLUBS_BASE[0]["name"] != "Cairo Kings", "the shipped club is untouched")
	var td := GameData.team_def(0, "", false, pr.data["squads"])
	check(td["name"] == "Cairo Kings", "matches use the new name")
	var t: String = pr.export_patch()
	pr.data["squads"] = {}
	GameData.apply_club_edits(pr.data["squads"])
	check(GameData.CLUBS[0]["name"] == GameData.CLUBS_BASE[0]["name"], "reset back to the shipped club")
	check(pr.import_patch("hello") == -1, "junk text is refused")
	check(pr.import_patch(t) == 1, "the patch loads one club")
	check(GameData.CLUBS[0]["name"] == "Cairo Kings", "the patch brings the name back")
	var sq := GameData.squad(0, pr.data["squads"])
	var found := false
	for p in sq:
		if p["name"] == "Test Player" and int(p["number"]) == 77:
			found = true
	check(found, "the patch brings the player's name and number")
	pr.data = kept
	GameData.apply_club_edits(pr.data.get("squads", {}))
	pr.save()
	quit(1 if fails > 0 else 0)
