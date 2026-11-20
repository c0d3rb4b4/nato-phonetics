#!/usr/bin/env python3
"""Filesystem-only Run 05 consistency audit.

Default --preview reports work in progress without writing candidate identity.
Use --finalize only after the root agent confirms maintained source/docs stable.
--verify checks the existing frozen source manifest without replacing it.
Evidence and generated products are excluded from source identity, avoiding a
circular hash when this script writes its own reports.
"""
import argparse
import collections
import datetime
import hashlib
import json
from pathlib import Path
import plistlib
import re
import struct
import subprocess
import sys
import urllib.parse
import zipfile

RUN = Path(__file__).resolve().parent
ROOT = RUN.parents[2]
VALID_STATUSES = ("open", "in-progress", "implemented-awaiting-M11", "resolved", "blocked", "scope-change-approved")
EXCLUDED_PARTS = {"node_modules", ".git", ".gradle", ".cxx", ".kotlin", "Pods", "xcuserdata"}
EXCLUDED_PREFIXES = ("docs/evidence/", "artifacts/", "dist/", "web-build/", "ios/build/", "vendor/", ".bundle/")


def digest(path):
    result = hashlib.sha256()
    with Path(path).open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            result.update(chunk)
    return result.hexdigest()


def git(*args):
    return subprocess.check_output(["git", *args], cwd=ROOT)


def relative(path):
    try:
        return str(Path(path).resolve().relative_to(ROOT))
    except ValueError:
        return str(Path(path).resolve())


def write_json(path, value):
    Path(path).write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n")


def source_inventory():
    names = set(git("ls-files", "--cached", "--others", "--exclude-standard", "-z").decode().split("\0"))
    files = []
    for name in sorted(names - {""}):
        parts = Path(name).parts
        if name.startswith(EXCLUDED_PREFIXES) or any(part in EXCLUDED_PARTS for part in parts):
            continue
        if parts[0] == "android" and "build" in parts:
            continue
        path = ROOT / name
        if path.is_file():
            entry = {"file": name, "sha256": digest(path), "bytes": path.stat().st_size,
                     "mode": oct(path.lstat().st_mode & 0o777)}
            if path.is_symlink():
                entry["symlinkTarget"] = str(path.readlink())
            files.append(entry)
    deleted = sorted(filter(None, git("diff", "HEAD", "--name-only", "--diff-filter=D", "-z").decode().split("\0")))
    return files, deleted


def source_identity(mode, errors):
    files, deleted = source_inventory()
    manifest = "".join(f"{entry['sha256']}  {entry['file']}\n" for entry in files)
    identity = {
        "date": "2026-11-17", "baseCommit": git("rev-parse", "HEAD").decode().strip(),
        "branch": git("branch", "--show-current").decode().strip(), "candidate": "uncommitted maintained source over base commit",
        "sourceFiles": len(files), "sourceManifestSha256": hashlib.sha256(manifest.encode()).hexdigest(),
        "sourceInventorySha256": hashlib.sha256(json.dumps(files, sort_keys=True, separators=(",", ":")).encode()).hexdigest(),
        "deletedTrackedPaths": deleted,
        "trackedWorkingDiffSha256": hashlib.sha256(git("diff", "--binary", "HEAD", "--", ".", ":(exclude)docs/evidence")).hexdigest(),
        "indexDiffSha256": hashlib.sha256(git("diff", "--cached", "--binary", "--", ".", ":(exclude)docs/evidence")).hexdigest(),
        "exclusions": [*EXCLUDED_PREFIXES, *sorted(EXCLUDED_PARTS), "android/**/build/"],
        "files": files,
    }
    if mode == "finalize":
        (RUN / "source-sha256.txt").write_text(manifest)
        write_json(RUN / "source-identity.json", identity)
    elif mode == "verify":
        if not (RUN / "source-identity.json").exists() or not (RUN / "source-sha256.txt").exists():
            errors.append("Frozen source identity is missing; finalize only after source/docs are stable.")
        else:
            frozen = json.loads((RUN / "source-identity.json").read_text())
            for field in ("baseCommit", "sourceManifestSha256", "sourceInventorySha256", "deletedTrackedPaths"):
                if frozen.get(field) != identity[field]:
                    errors.append(f"Frozen source identity mismatch: {field}")
            if (RUN / "source-sha256.txt").read_text() != manifest:
                errors.append("source-sha256.txt differs from current maintained source.")
    return {key: value for key, value in identity.items() if key != "files"}


def png_info(path):
    data = Path(path).read_bytes()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError("Not a PNG image")
    width, height = struct.unpack(">II", data[16:24])
    orientation = 1
    offset = 8
    while offset + 12 <= len(data):
        size = struct.unpack(">I", data[offset:offset + 4])[0]
        kind = data[offset + 4:offset + 8]
        payload = data[offset + 8:offset + 8 + size]
        if kind == b"eXIf":
            if payload.startswith(b"Exif\0\0"):
                payload = payload[6:]
            endian = "<" if payload[:2] == b"II" else ">"
            if len(payload) >= 8:
                start = struct.unpack(endian + "I", payload[4:8])[0]
                count = struct.unpack(endian + "H", payload[start:start + 2])[0]
                for index in range(count):
                    entry = payload[start + 2 + index * 12:start + 14 + index * 12]
                    if len(entry) == 12 and struct.unpack(endian + "H", entry[:2])[0] == 274:
                        orientation = struct.unpack(endian + "H", entry[8:10])[0]
        offset += size + 12
    display = (height, width) if orientation in (5, 6, 7, 8) else (width, height)
    return {"encodedPixels": {"width": width, "height": height}, "orientation": orientation,
            "displayPixels": {"width": display[0], "height": display[1]}}


def hash_check(path, expected, checks, errors, label=None):
    path = Path(path)
    if not path.is_file():
        errors.append(f"Missing artifact: {relative(path)}")
        return
    actual = digest(path)
    checks.append({"file": relative(path), "bytes": path.stat().st_size, "sha256": actual,
                   "expectedSha256": expected, "matchesManifest": actual == expected, "label": label})
    if actual != expected:
        errors.append(f"Hash mismatch: {relative(path)}")


def screenshots(errors, warnings):
    result = {}
    for platform in ("web", "android", "ios"):
        directory = RUN / "screenshots" / platform
        metadata_path = directory / "metadata.json"
        if not metadata_path.exists():
            errors.append(f"Missing final {platform} screenshot metadata.")
            result[platform] = {"count": 0, "checks": []}
            continue
        metadata = json.loads(metadata_path.read_text())
        captures = metadata if isinstance(metadata, list) else metadata.get("captures", [])
        if not captures:
            errors.append(f"No final {platform} captures listed in metadata.")
        checks, listed, findings = [], set(), []
        for capture in captures:
            file = capture.get("file")
            if not file or file in listed:
                errors.append(f"Missing or duplicate {platform} screenshot filename: {file}")
                continue
            listed.add(file)
            path = directory / file
            hash_check(path, capture.get("sha256"), checks, errors, platform)
            if not path.exists():
                continue
            info = png_info(path)
            checks[-1].update(info)
            for key in ("pixels", "encodedPixels", "displayPixels"):
                if key in capture:
                    actual = info["displayPixels" if key == "displayPixels" else "encodedPixels"]
                    expected = capture[key]
                    if isinstance(expected, list) and len(expected) == 2:
                        expected = {"width": expected[0], "height": expected[1]}
                    if expected != actual:
                        errors.append(f"{platform}/{file} {key} mismatch: {expected} vs {actual}")
            if platform == "web":
                expected = {"width": round(capture["width"] * capture["dpr"]), "height": round(capture["height"] * capture["dpr"])}
                if info["encodedPixels"] != expected:
                    errors.append(f"{file} browser viewport/pixel ratio does not match PNG dimensions.")
            if "landscape" in file and info["displayPixels"]["width"] <= info["displayPixels"]["height"]:
                warnings.append(f"{platform}/{file} landscape label has portrait display dimensions; inspect actual state.")
            if "inspection" not in capture and not (isinstance(metadata, dict) and metadata.get("inspection")):
                warnings.append(f"{platform}/{file} has no explicit visual-inspection field; see platform report before accepting.")
            for finding in capture.get("findings", []):
                findings.append({"file": file, **finding})
                if finding.get("status") == "open":
                    warnings.append(f"Open observed finding {platform}/{file}: {finding.get('id')} — {finding.get('detail')}")
        present = {path.name for path in directory.glob("*.png")}
        if present != listed:
            errors.append(f"{platform} metadata/image membership mismatch: unlisted={sorted(present-listed)}, missing={sorted(listed-present)}")
        result[platform] = {"count": len(captures), "metadata": relative(metadata_path), "checks": checks, "findings": findings}
    return result


def artifacts(errors, findings):
    checks = []
    manifest = json.loads((ROOT / "assets/fonts/manifest.json").read_text())
    for face in manifest["faces"]:
        hash_check(ROOT / "assets/fonts" / face["file"], face["sha256"], checks, errors, "source font")
    web_metadata = RUN / "screenshots/web/metadata.json"
    if web_metadata.exists():
        web_assets = json.loads(web_metadata.read_text()).get("assets", [])
        for asset in web_assets:
            hash_check(ROOT / "dist" / asset["file"], asset["sha256"], checks, errors, "captured web build")
        for face in manifest["faces"]:
            emitted = [asset for asset in web_assets if Path(asset["file"]).name.startswith(Path(face["file"]).stem + "-") and asset["file"].endswith(".ttf")]
            if len(emitted) != 1 or emitted[0]["sha256"] != face["sha256"]:
                errors.append(f"Captured web font identity differs from pinned source face: {face['file']}")
    ios_path = RUN / "ios/artifact.json"
    if ios_path.exists():
        ios = json.loads(ios_path.read_text())
        findings.extend({"file": relative(ios_path), **finding} for finding in ios.get("findings", []))
        app = Path(ios.get("appPath", "artifacts/ios-simulator/Build/Products/Release-iphonesimulator/NATOPhonetics.app"))
        if not app.is_absolute():
            app = ROOT / app
        hash_check(app / "NATOPhonetics", ios.get("nativeExecutableSha256"), checks, errors, "iOS executable")
        hash_check(app / "main.jsbundle", ios.get("javaScriptBundleSha256"), checks, errors, "iOS JavaScript")
        if ios.get("archivePath"):
            archive_path = ROOT / ios["archivePath"]
            hash_check(archive_path, ios.get("archiveSha256"), checks, errors, "iOS simulator archive")
            if archive_path.exists():
                expected_members = {"NATOPhonetics": ios.get("nativeExecutableSha256"),
                                    "main.jsbundle": ios.get("javaScriptBundleSha256"),
                                    **{face["file"]: face["sha256"] for face in manifest["faces"]}}
                with zipfile.ZipFile(archive_path) as archive:
                    for filename, expected in expected_members.items():
                        member = "NATOPhonetics.app/" + filename
                        try:
                            actual = hashlib.sha256(archive.read(member)).hexdigest()
                            checks.append({"file": relative(archive_path) + "!" + member, "sha256": actual,
                                           "expectedSha256": expected, "matchesManifest": actual == expected,
                                           "label": "iOS archived candidate"})
                            if actual != expected:
                                errors.append(f"iOS archive differs from captured app: {member}")
                        except KeyError:
                            errors.append(f"Missing iOS archive member: {member}")
        for face in manifest["faces"]:
            hash_check(app / face["file"], face["sha256"], checks, errors, "iOS bundled font")
        if {face["file"]: face["sha256"] for face in ios.get("fonts", [])} != {face["file"]: face["sha256"] for face in manifest["faces"]}:
            errors.append("iOS artifact manifest font hashes do not match the pinned face set.")
        ios_metadata_path = RUN / "screenshots/ios/metadata.json"
        if ios_metadata_path.exists():
            ios_metadata = json.loads(ios_metadata_path.read_text())
            for capture in ios_metadata.get("captures", []):
                captured_app = capture.get("appArtifact", {})
                for captured_field, artifact_field in (("NATOPhonetics", "nativeExecutableSha256"), ("main.jsbundle", "javaScriptBundleSha256")):
                    if captured_field in captured_app and captured_app[captured_field] != ios.get(artifact_field):
                        errors.append(f"iOS {capture['file']} was captured from a different {captured_field} than the final artifact manifest.")
        if (app / "Info.plist").exists():
            info = plistlib.loads((app / "Info.plist").read_bytes())
            if set(info.get("UIAppFonts", [])) != {face["file"] for face in manifest["faces"]}:
                errors.append("iOS Info.plist UIAppFonts does not match the pinned face set.")
    else:
        errors.append("Missing final iOS artifact manifest.")
    android_path = RUN / "android/artifact.json"
    if android_path.exists():
        android = json.loads(android_path.read_text())
        findings.extend({"file": relative(android_path), **finding} for finding in android.get("findings", []))
        apk = android.get("apk", {})
        apk_path = ROOT / apk.get("file", android.get("apkPath", "missing-android-apk"))
        hash_check(apk_path, apk.get("sha256", android.get("apkSha256")), checks, errors, "Android APK")
        if apk_path.exists():
            with zipfile.ZipFile(apk_path) as archive:
                for face in manifest["faces"]:
                    entry = "assets/fonts/" + face["file"]
                    try:
                        actual = hashlib.sha256(archive.read(entry)).hexdigest()
                        checks.append({"file": relative(apk_path) + "!" + entry, "sha256": actual,
                                       "expectedSha256": face["sha256"], "matchesManifest": actual == face["sha256"]})
                        if actual != face["sha256"]:
                            errors.append(f"Android bundled font differs: {entry}")
                    except KeyError:
                        errors.append(f"Missing Android bundled font: {entry}")
        scripts = android.get("runningJavaScript", android.get("javascript", {})).get("scripts", [])
        if not scripts:
            errors.append("Android debug APK lacks captured loaded-JavaScript identity; APK hash alone is insufficient.")
        for script in scripts:
            hash_check(ROOT / script["file"], script["sha256"], checks, errors, "Android loaded JavaScript")
    else:
        errors.append("Missing final Android artifact manifest.")
    return checks


def markdown_anchors(path):
    text = re.sub(r"```.*?```", "", path.read_text(), flags=re.S)
    used, result = collections.Counter(), set()
    for heading in re.findall(r"^#{1,6}\s+(.+?)\s*#*\s*$", text, re.M):
        heading = re.sub(r"\[([^]]+)\]\([^)]*\)", r"\1", heading)
        slug = re.sub(r"[^\w\- ]", "", heading.lower()).replace(" ", "-")
        count = used[slug]
        used[slug] += 1
        result.add(slug + (f"-{count}" if count else ""))
    result.update(re.findall(r'<a\s+(?:id|name)=["\']([^"\']+)', text))
    return result


def links(errors):
    documents = [ROOT / "README.md", ROOT / "PRIVACY.md", *sorted((ROOT / "docs").glob("*.md")), *sorted(RUN.rglob("*.md"))]
    checked, missing = 0, []
    for document in documents:
        text = re.sub(r"```.*?```", "", document.read_text(), flags=re.S)
        destinations = re.findall(r"!?\[[^\]\n]*\]\(([^)\n]+)\)", text)
        destinations += re.findall(r"^\[[^]]+\]:\s*(\S+)", text, re.M)
        for raw in destinations:
            destination = raw[1:raw.index(">") ] if raw.startswith("<") and ">" in raw else raw.split(' "', 1)[0].strip()
            if re.match(r"^[a-z][a-z0-9+.-]*:", destination, re.I) or destination.startswith("//"):
                continue
            file, _, anchor = urllib.parse.unquote(destination).partition("#")
            target = (document.parent / file).resolve() if file else document
            checked += 1
            reason = None
            if not target.exists():
                reason = "target missing"
            elif anchor and target.suffix == ".md" and anchor not in markdown_anchors(target):
                reason = "anchor missing"
            if reason:
                missing.append({"document": relative(document), "destination": destination, "reason": reason})
    errors.extend(f"Broken link: {entry['document']} -> {entry['destination']} ({entry['reason']})" for entry in missing)
    return {"documentsChecked": len(documents), "relativeLinksChecked": checked, "missingLinks": missing}


def status(errors, screenshot_counts):
    plan = (ROOT / "docs/DELIVERY_PLAN.md").read_text()
    review = (ROOT / "docs/APP_REVIEW.md").read_text().split("## Current delivery status", 1)[-1]
    ledger = {}
    for line in plan.splitlines():
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if cells and re.fullmatch(r"[RF]\d{2}", cells[0]):
            ledger[cells[0]] = cells[3]
    expected_ids = {f"R{number:02}" for number in range(1, 26)} | {f"F{number:02}" for number in range(1, 11)}
    if set(ledger) != expected_ids:
        errors.append(f"Ledger IDs mismatch: missing={sorted(expected_ids-set(ledger))}, extra={sorted(set(ledger)-expected_ids)}")
    counts = {value: sum(status == value for status in ledger.values()) for value in VALID_STATUSES}
    if any(value not in VALID_STATUSES for value in ledger.values()):
        errors.append("Ledger has unrecognized item statuses.")
    count_line = next((line.replace("*", "") for line in review.splitlines() if "Item counts" in line), "")
    labels = {"open": r"open", "in-progress": r"in[- ]progress", "implemented-awaiting-M11": r"implemented[- ]awaiting[- ]M11",
              "resolved": r"resolved", "blocked": r"blocked", "scope-change-approved": r"approved scope changes"}
    for value, label in labels.items():
        match = re.search(r"(\d+)\s+" + label, count_line, re.I)
        if not match or int(match[1]) != counts[value]:
            errors.append(f"Review item count differs from ledger: {value}={counts[value]}, stated={match[1] if match else 'missing'}")
    current = next((line for line in plan.splitlines() if line.startswith("**Current state:**")), "")
    updated = next((line for line in review.splitlines() if line.startswith("**Updated:**")), "")
    if "Run 05" not in current or "Run 05" not in updated:
        errors.append("Plan/review current delivery summaries are not both updated for Run 05.")
    phases = {}
    for line in plan.splitlines():
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if cells and re.fullmatch(r"P\d{2}|M11", cells[0]) and len(cells) == 5:
            phases[cells[0]] = cells[-1]
    tasks = {task: checked == "x" for checked, task in re.findall(r"^- \[([ x])\] \*\*((?:P\d{2}|M11)\.\d+)", plan, re.M)}
    for phase, phase_status in phases.items():
        if phase_status == "agent-done":
            unfinished = [task for task, checked in tasks.items() if task.startswith(phase + ".") and not checked]
            if unfinished:
                errors.append(f"{phase} is agent-done with unchecked tasks: {unfinished}")
    screenshot_line = next((line for line in review.splitlines() if "**Screenshots" in line), "")
    total = sum(screenshot_counts.values())
    match = re.search(r"(\d+)\s+(?:(?:inspected|actual|final|application)\s+)*(?:captures|screenshots)", screenshot_line)
    if match and int(match[1]) != total:
        errors.append(f"Review screenshot total {match[1]} differs from final metadata {total}.")
    return {"ledgerCounts": counts, "ledger": ledger, "phases": phases, "tasks": tasks, "reviewUpdated": updated, "planCurrentState": current}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--preview", action="store_true")
    mode.add_argument("--finalize", action="store_true")
    mode.add_argument("--verify", action="store_true")
    args = parser.parse_args()
    selected = "finalize" if args.finalize else "verify" if args.verify else "preview"
    errors, warnings = [], []
    identity = source_identity(selected, errors)
    images = screenshots(errors, warnings)
    artifact_findings = []
    artifact_checks = artifacts(errors, artifact_findings)
    for finding in artifact_findings:
        if finding.get("status") == "open":
            warnings.append(f"Open observed finding {finding['file']}: {finding.get('id')} — {finding.get('detail')}")
    counts = {platform: details["count"] for platform, details in images.items()}
    state = status(errors, counts)
    observed_findings = artifact_findings + [finding for details in images.values() for finding in details.get("findings", [])]
    for finding in observed_findings:
        if finding.get("status") != "open":
            continue
        for owner in re.findall(r"P\d{2}(?:\.\d+)?|[RF]\d{2}", finding.get("owner", "")):
            phase = owner.split(".")[0]
            if state["phases"].get(phase) == "agent-done":
                errors.append(f"{phase} is agent-done despite open observed finding {finding.get('id')}.")
            if state["tasks"].get(owner):
                errors.append(f"{owner} is checked complete despite open observed finding {finding.get('id')}.")
            if state["ledger"].get(owner) in ("resolved", "implemented-awaiting-M11"):
                errors.append(f"{owner} is marked {state['ledger'][owner]} despite open engineering finding {finding.get('id')}.")
    filename = "verification-preview.json" if selected == "preview" else "document-verification.json"
    if selected != "preview":
        # These reports may themselves be linked from the final handoff. Create
        # a clearly incomplete record before checking its local link target.
        write_json(RUN / filename, {"passed": False, "status": "audit in progress"})
        write_json(RUN / "artifact-verification.json", {"date": "2026-11-17", "checks": artifact_checks, "findings": artifact_findings})
    document_links = links(errors)
    report = {"date": "2026-11-17", "checkedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(), "mode": selected,
              "passed": not errors, "source": identity, "screenshotCounts": counts, "screenshots": images,
              "artifacts": artifact_checks, "observedFindings": observed_findings, **state, **document_links, "warnings": warnings, "errors": errors}
    write_json(RUN / filename, report)
    print(json.dumps({"report": relative(RUN / filename), "passed": not errors, "sourceFiles": identity["sourceFiles"],
                      "screenshotCounts": counts, "ledgerCounts": state["ledgerCounts"], "errors": errors, "warnings": warnings}, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main())
