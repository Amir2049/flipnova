class_name GFData
extends RefCounted
## The data Google Research Football's engine reads (animations, models) ships zipped in the game; the engine
## needs real files, so the zip is unpacked into user:// once (again when the game version changes).

const ZIP := "res://assets/gfdata.zip"


## Unpacks into `dir` unless it is already there for this version; returns the number of files written.
static func unpack(dir: String) -> int:
	var stamp := dir + "/.version"
	var ver := str(ProjectSettings.get_setting("application/config/version", "")) + "|" + str(FileAccess.get_size(ZIP)) if FileAccess.file_exists(ZIP) else ""
	if FileAccess.file_exists(stamp) and FileAccess.get_file_as_string(stamp) == ver:
		return 0
	var z := ZIPReader.new()
	if z.open(ZIP) != OK:
		push_error("GFData: cannot open " + ZIP)
		return -1
	var n := 0
	for f in z.get_files():
		var path := dir + "/" + f
		if f.ends_with("/"):
			DirAccess.make_dir_recursive_absolute(path)
			continue
		DirAccess.make_dir_recursive_absolute(path.get_base_dir())
		var out := FileAccess.open(path, FileAccess.WRITE)
		if out:
			out.store_buffer(z.read_file(f))
			out.close()
			n += 1
	z.close()
	var sf := FileAccess.open(stamp, FileAccess.WRITE)
	if sf:
		sf.store_string(ver)
	return n
