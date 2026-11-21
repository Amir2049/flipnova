"""Sign a Godot-exported (unsigned) APK with the AFC key (APK signature scheme v2).
usage: python3 tools/sign_apk.py in.apk out.apk [key.pem]
The key must stay the same for every release, or Android refuses to install the update over the old app."""
import shutil, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_apk as b

src, dst = sys.argv[1], sys.argv[2]
keydir = Path(sys.argv[3]).parent if len(sys.argv) > 3 else Path(__file__).resolve().parent.parent / "signing"
shutil.copy(src, dst)
key, cert = b.make_key(str(keydir))
b.v2_sign(dst, key, cert)
print("signed", dst)
