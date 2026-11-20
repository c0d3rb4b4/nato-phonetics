"""Check installed RN source and the iOS-facing tokens of Android's shared files.

Run from the app root with an RN registry tarball, a clean installed app root,
and a Clang executable. The tarball must match package-lock.json integrity.
This compares source tokens and include spellings, without loading Apple SDK
headers. It does not compile iOS or make a binary/ABI equivalence claim.
"""
import argparse
import base64
import hashlib
import json
from pathlib import Path
import re
import subprocess
import tarfile


def digest(data):
    return hashlib.sha256(data).hexdigest()


def compiler_tokens(clang, source, android):
    # Make include names visible to the token comparison without expanding
    # transitive dependencies. Leave conditional directives to real Clang.
    source = re.sub(r"(?m)^\s*#\s*include\s+([^\n]+)",
                    lambda m: "\nNATO_INCLUDE " + json.dumps(m[1].strip()), source)
    flags = ["-DANDROID=1"] if android else []
    result = subprocess.run([clang, "-target", "arm64-apple-ios15.1", *flags,
                             "-x", "c++", "-std=c++20", "-Wno-pragma-once-outside-header",
                             "-fsyntax-only", "-Xclang", "-dump-tokens", "-"],
                            input=source, encoding="utf-8", capture_output=True)
    if result.returncode:
        raise RuntimeError(result.stderr)
    tokens = []
    for line in result.stderr.splitlines():
        if "Loc=<" not in line:
            raise ValueError(f"Unexpected compiler output: {line}")
        # Locations, start-of-line and whitespace change even for equal tokens.
        tokens.append(line.split("\t", 1)[0])
    if not tokens or tokens[-1] != "eof ''":
        raise ValueError("Missing Clang token stream")
    return tokens


def main():
    args = argparse.ArgumentParser(description=__doc__)
    args.add_argument("tarball", type=Path)
    args.add_argument("installed_root", type=Path)
    args.add_argument("clang")
    options = args.parse_args()
    root = options.installed_root
    lock = json.loads((root / "package-lock.json").read_text())
    integrity = lock["packages"]["node_modules/react-native"]["integrity"]
    calculated = "sha512-" + base64.b64encode(
        hashlib.sha512(options.tarball.read_bytes()).digest()).decode()
    if integrity != calculated:
        raise ValueError("Registry tarball differs from lock")
    patches = root / "scripts/patches"
    manifests = [json.loads((patches / f"react-native-0.81.5-{name}.json").read_text())
                 for name in ("source-build", "font-environment", "yoga-pixel-grid")]
    yoga = manifests[-1]
    entries = [*manifests[0]["files"], *manifests[1]["files"],
               dict(yoga, path=yoga["sourcePath"])]
    expected_shared = {"LayoutContext.h", "TextMeasureCache.h",
                       "YogaLayoutableShadowNode.cpp", "YogaLayoutableShadowNode.h"}
    shared = {}
    hashes = {}
    with tarfile.open(options.tarball) as archive:
        for entry in entries:
            name = entry["path"]
            original = archive.extractfile("package/" + name).read()
            prepared = (root / "node_modules/react-native" / name).read_bytes()
            if (digest(original), digest(prepared)) != (entry["originalSha256"], entry["patchedSha256"]):
                raise ValueError(f"Package/installed source drift: {name}")
            hashes[name] = {"original": digest(original), "installed": digest(prepared)}
            if name.startswith("ReactAndroid/") or "/platform/android/" in name or name == yoga["sourcePath"]:
                continue
            old, new = (compiler_tokens(options.clang, source.decode(), False)
                        for source in (original, prepared))
            includes_added = []
            if name.endswith("/LayoutContext.h"):
                include = ["identifier 'NATO_INCLUDE'", """string_literal '"<cstdint>"'"""]
                if sum(new[i:i + 2] == include for i in range(len(new))) != 1:
                    raise ValueError("Expected one additional cstdint include")
                offset = new.index(include[1]) - 1
                del new[offset:offset + 2]
                includes_added.append("<cstdint>")
            if old != new:
                raise ValueError(f"iOS-facing C++ tokens changed: {name}")
            if compiler_tokens(options.clang, original.decode(), True) == compiler_tokens(options.clang, prepared.decode(), True):
                raise ValueError(f"Android conditional positive control failed: {name}")
            shared[Path(name).name] = {"equalTokensIncludingEof": len(old),
                                      "additionalStandardIncludes": includes_added,
                                      "androidConditionalDiffers": True}
    if set(shared) != expected_shared:
        raise ValueError("Shared source coverage differs from reviewed set")
    print(json.dumps({"lockIntegrity": calculated, "sourceHashes": hashes,
                      "clang": subprocess.check_output([options.clang, "--version"], text=True).splitlines()[0],
                      "target": "arm64-apple-ios15.1", "sharedFiles": shared,
                      "appleCompileOrRuntime": False}, indent=2))


if __name__ == "__main__":
    main()
