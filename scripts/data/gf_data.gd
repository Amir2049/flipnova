class_name GFData
extends RefCounted
## The data Google Research Football's engine reads (animations, models) ships zipped in the game; the engine
## needs real files, so the zip is unpacked into user:// once (again when the game version changes).
##
## The native engine crashes the whole app if a file it needs is missing, so nothing may start it unless
## prepare() returned true: the zip is in the game and every one of its files is on disk.

const ZIP := "res://assets/gfdata.zip"

static var _ready_dir := ""   # the folder prepare() last found complete (checked once per run)


static func _version() -> String:
	if not FileAccess.file_exists(ZIP):
		return ""
	return str(ProjectSettings.get_setting("application/config/version", "")) + "|" + str(FileAccess.get_size(ZIP))


## The data is unpacked for this version of the game and none of its files has gone (stamp: version, then the files).
static func complete(dir: String) -> bool:
	var ver := _version()
	if ver == "":
		return false
	var stamp := dir + "/.version"
	if not FileAccess.file_exists(stamp):
		return false
	var lines := FileAccess.get_file_as_string(stamp).split("\n", false)
	if lines.size() < 2 or lines[0] != ver:
		return false
	for i in range(1, lines.size()):
		if not FileAccess.file_exists(dir + "/" + lines[i]):
			return false
	return true


## Unpacks into `dir` unless it is already complete; returns the number of files written (0: already there),
## or -1 when the data cannot be made ready (no zip in the game, storage full).
static func unpack(dir: String) -> int:
	if complete(dir):
		return 0
	var ver := _version()
	if ver == "":
		push_error("GFData: no " + ZIP)
		return -1
	# Read the zip from the game in ONE pass into a real file, and unzip that. Inside an Android APK the zip is a
	# compressed asset: every seek of ZIPReader there (386 files, a header each) decompresses the asset again from
	# its start, which took minutes on phones - the start looked stuck at "Loading" (2.27-2.36).
	var local := dir.get_base_dir() + "/gfdata_unpack.zip"
	var raw := FileAccess.get_file_as_bytes(ZIP)
	var lf := FileAccess.open(local, FileAccess.WRITE)
	if raw.is_empty() or lf == null:
		push_error("GFData: cannot copy " + ZIP)
		return -1
	lf.store_buffer(raw)
	lf.close()
	raw = PackedByteArray()
	var z := ZIPReader.new()
	if z.open(local) != OK:
		push_error("GFData: cannot open " + local)
		DirAccess.remove_absolute(local)
		return -1
	# no stamp while files are being rewritten: an unpack cut off half way (app killed) must not look complete
	DirAccess.remove_absolute(dir + "/.version")
	_ready_dir = ""
	var n := 0
	var failed := 0
	var written := PackedStringArray()
	for f in z.get_files():
		var path := dir + "/" + f
		if f.ends_with("/"):
			DirAccess.make_dir_recursive_absolute(path)
			continue
		DirAccess.make_dir_recursive_absolute(path.get_base_dir())
		var out := FileAccess.open(path, FileAccess.WRITE)
		if out == null:
			failed += 1
			continue
		var buf := z.read_file(f)
		out.store_buffer(buf)
		out.flush()   # a full disk may only show up when the buffer is written out
		var err := out.get_error()
		var length := out.get_length()
		out.close()
		if err == OK and length == buf.size():
			n += 1
			written.append(f)
		else:
			failed += 1
	z.close()
	DirAccess.remove_absolute(local)
	if failed > 0:
		# no stamp: the next start tries again instead of running on half the files forever (a full disk)
		push_error("GFData: %d files could not be written into %s" % [failed, dir])
		return -1
	var sf := FileAccess.open(dir + "/.version", FileAccess.WRITE)
	if sf:
		sf.store_string(ver + "\n" + "\n".join(written))
		sf.close()
	return n


## Makes the engine's data ready; false means the native engine must not be started.
## unpack() returns 0 only after complete() said yes, and > 0 only when every file was written in full.
static func prepare(dir: String) -> bool:
	if _ready_dir == dir:
		return true
	if unpack(dir) < 0:
		return false
	_ready_dir = dir
	return true
