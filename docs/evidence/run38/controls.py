import json
import runpy
import struct
import subprocess
import sys
from pathlib import Path
from zipfile import ZipFile

sys.path.insert(0, "scripts")
inspector = runpy.run_path("scripts/verify-android-product.py")
out = Path("artifacts/run38/replay")
out.mkdir(parents=True, exist_ok=True)
products = [
    ("artifacts/run37/before.apk", "", True),
    ("android/app/build/outputs/apk/develop/app-develop.apk", "", False),
    ("artifacts/run38/scoped-unsigned.apk", "", False),
    ("artifacts/run38/scoped.aab", "base/", False),
]
results = []
for path, prefix, negative in products:
    with ZipFile(path) as archive:
        try:
            payload = inspector["payload"](archive, prefix, ["x86_64"], True)
        except ValueError as error:
            if not negative or not str(error).startswith(
                "Missing packaged speech classes:"
            ):
                raise
            status = {"expectedRejection": str(error)}
        else:
            assert not negative
            status = {"definitions": payload["speechClasses"]}
        results.append(
            dict(input=path, sha256=inspector["sha"](Path(path).read_bytes()), **status)
        )

with (
    ZipFile(products[2][0]) as original,
    ZipFile("artifacts/run38/scoped-test.apk") as signed,
):
    assert all(original.read(n) == signed.read(n) for n in original.namelist())
    matched = len(original.namelist())
    dex = bytearray(original.read("classes.dex"))
    assert inspector["speech_classes"](bytes(dex)) == inspector["SPEECH_CLASSES"]
    struct.pack_into("<I", dex, 96, 0)
    assert all(marker in dex for marker in inspector["SPEECH_CLASSES"])
    assert not inspector["speech_classes"](bytes(dex))

archive = Path("artifacts/run33/retrieved/44783763574")
historical = []
for mode in ["android-debug", "android-develop", "android-release"]:
    directory = archive / mode
    args = [
        sys.executable,
        "scripts/verify-android-product.py",
        mode,
        *directory.glob("*.apk"),
        *directory.glob("*.aab"),
    ]
    report = json.loads(subprocess.check_output(args))
    historical.append(
        {
            field: report[field]
            for field in ["mode", "abis", "files", "signing", "speechClasses"]
        }
    )
report = dict(
    products=results,
    unchangedSignedEntries=matched,
    descriptorsWithoutDefinitionsIgnored=True,
    historicalFourAbiCliControls=historical,
)
(out / "controls.json").write_text(json.dumps(report, indent=2) + "\n")
