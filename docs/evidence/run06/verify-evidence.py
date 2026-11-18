#!/usr/bin/env python3
"""Audit Run 06 evidence integrity, not application or release acceptance.

--preview is read-only and does not freeze candidate identity. --finalize writes
source identity and reports only after integrity checks pass; run it only when
the root agent has finished source/document changes. --verify checks the frozen
manifest without updating it. Missing coverage and observed failures stay in
the delivery plan; an integrity pass does not turn them into application passes.
"""
import argparse
import datetime
import hashlib
import importlib.util
import json
from pathlib import Path
import plistlib
import re
import sys
import zipfile

sys.dont_write_bytecode = True
RUN = Path(__file__).resolve().parent
ROOT = RUN.parents[2]
spec = importlib.util.spec_from_file_location("run05_evidence_helpers", RUN.parent / "run05/verify-evidence.py")
previous = importlib.util.module_from_spec(spec)
spec.loader.exec_module(previous)
previous.RUN = RUN
previous.ROOT = ROOT
VALID_STATUSES = previous.VALID_STATUSES
GENERATED = {"source-identity.json", "source-sha256.txt", "document-verification.json", "artifact-verification.json"}


def diagnostic(capture):
    return (capture.get("diagnostic") is True
            or any(capture.get(key) == "diagnostic" for key in ("role", "classification", "status"))
            or "diagnostics" in Path(capture.get("file", capture.get("path", ""))).parts)


def artifacts(errors, findings):
    """Verify Run 06 manifests, including Android's APK path and JS sidecar."""
    checks = []
    faces = json.loads((ROOT / "assets/fonts/manifest.json").read_text())["faces"]
    pinned = {face["file"]: face["sha256"] for face in faces}

    def check(path, expected, label):
        previous.hash_check(path, expected, checks, errors, label)

    def archive_members(path, members, label):
        if not path.is_file():
            return
        with zipfile.ZipFile(path) as archive:
            for member, expected in members.items():
                try:
                    actual = hashlib.sha256(archive.read(member)).hexdigest()
                except KeyError:
                    errors.append(f"Missing {label} member: {member}")
                    continue
                checks.append({"file": previous.relative(path) + "!" + member,
                               "sha256": actual, "expectedSha256": expected,
                               "matchesManifest": actual == expected, "label": label})
                if actual != expected:
                    errors.append(f"{label} differs from manifest: {member}")

    for name, expected in pinned.items():
        check(ROOT / "assets/fonts" / name, expected, "source font")
    web_path = RUN / "screenshots/web/metadata.json"
    if web_path.is_file():
        assets = json.loads(web_path.read_text()).get("assets", [])
        for asset in assets:
            check(ROOT / "dist" / asset["file"], asset["sha256"], "captured web build")
        for name, expected in pinned.items():
            emitted = [asset for asset in assets if Path(asset["file"]).name.startswith(Path(name).stem + "-")
                       and asset["file"].endswith(".ttf")]
            if len(emitted) != 1 or emitted[0]["sha256"] != expected:
                errors.append(f"Captured web font identity differs from pinned source face: {name}")

    for platform in ("ios", "android"):
        manifest_path = RUN / platform / "artifact.json"
        if not manifest_path.is_file():
            errors.append(f"Missing final {'iOS' if platform == 'ios' else 'Android'} artifact manifest.")
            continue
        artifact = json.loads(manifest_path.read_text())
        findings.extend({"file": previous.relative(manifest_path), **finding} for finding in artifact.get("findings", []))
        recorded_fonts = {face["file"]: face["sha256"] for face in artifact.get("fonts", [])}
        if recorded_fonts != pinned:
            errors.append(f"{platform} artifact manifest font hashes do not match the pinned face set.")
        sources = artifact.get("sourceFiles", {})
        sources.update({source["file"]: source["sha256"] for source in artifact.get("nativeSource", [])})
        for name, expected in sources.items():
            check(ROOT / name, expected, f"{platform} candidate source")
        if platform == "ios":
            app = ROOT / artifact["appPath"]
            members = {"NATOPhonetics": artifact.get("nativeExecutableSha256"),
                       "main.jsbundle": artifact.get("javaScriptBundleSha256"), **pinned}
            for name, expected in members.items():
                check(app / name, expected, "iOS bundled candidate")
            if artifact.get("archivePath"):
                archive = ROOT / artifact["archivePath"]
                check(archive, artifact.get("archiveSha256"), "iOS simulator archive")
                archive_members(archive, {"NATOPhonetics.app/" + name: expected for name, expected in members.items()}, "iOS archive")
            if (app / "Info.plist").is_file():
                info = plistlib.loads((app / "Info.plist").read_bytes())
                if set(info.get("UIAppFonts", [])) != set(pinned):
                    errors.append("iOS Info.plist UIAppFonts does not match the pinned face set.")
        else:
            apk = artifact.get("apk", {})
            if isinstance(apk, str):
                apk = {"file": apk, "sha256": artifact.get("sha256")}
            apk_path = ROOT / apk.get("file", artifact.get("apkPath", "missing-android-apk"))
            apk_hash = apk.get("sha256", artifact.get("apkSha256"))
            check(apk_path, apk_hash, "Android APK")
            if artifact.get("installedSha256") and artifact["installedSha256"] != apk_hash:
                errors.append("Android installed APK hash differs from candidate APK.")
            archive_members(apk_path, {"assets/fonts/" + name: expected for name, expected in pinned.items()}, "Android bundled font")
            javascript = artifact.get("runningJavaScript", artifact.get("javascript", {}))
            if artifact.get("loadedJavaScript"):
                sidecar = manifest_path.parent / artifact["loadedJavaScript"]
                if sidecar.is_file():
                    javascript = json.loads(sidecar.read_text())
                else:
                    errors.append(f"Android loaded-JavaScript manifest missing: {sidecar}")
            scripts = javascript.get("scripts", [])
            if not scripts:
                errors.append("Android debug APK lacks captured loaded-JavaScript identity; APK hash alone is insufficient.")
            for script in scripts:
                check(ROOT / script["file"], script["sha256"], "Android loaded JavaScript")
    return checks


def screenshots(errors, warnings):
    result = {}
    for platform in ("web", "android", "ios"):
        directory = RUN / "screenshots" / platform
        metadata_path = directory / "metadata.json"
        checks, listed, counts = [], set(), {"total": 0, "final": 0, "diagnostic": 0}
        if not metadata_path.exists():
            warnings.append(f"{platform}: screenshot metadata absent; coverage remains unverified.")
            if directory.exists() and list(directory.glob("*.png")):
                errors.append(f"{platform}: screenshots exist without metadata.")
            result[platform] = {"counts": counts, "checks": [], "metadata": None}
            continue
        metadata = json.loads(metadata_path.read_text())
        captures = metadata if isinstance(metadata, list) else metadata.get("captures", metadata.get("screenshots", []))
        if not isinstance(captures, list):
            errors.append(f"{platform}: capture metadata must be a list.")
            continue
        shared = metadata if isinstance(metadata, dict) else {}
        artifact_path = RUN / platform / "artifact.json"
        artifact = json.loads(artifact_path.read_text()) if artifact_path.is_file() else {}
        for capture in captures:
            filename = capture.get("file", capture.get("path"))
            if not filename or filename in listed:
                errors.append(f"{platform}: missing or duplicate screenshot filename {filename!r}.")
                continue
            listed.add(filename)
            counts["total"] += 1
            kind = "diagnostic" if diagnostic(capture) else "final"
            counts[kind] += 1
            candidate = capture.get("candidate", shared.get("candidate", {}))
            if isinstance(candidate, dict) and artifact and kind == "final":
                for field in ("nativeExecutableSha256", "javaScriptBundleSha256", "apkSha256"):
                    if field in candidate and field in artifact and candidate[field] != artifact[field]:
                        errors.append(f"{platform}/{filename}: captured {field} differs from current artifact manifest.")
            path = directory / filename
            expected = capture.get("sha256", capture.get("hash"))
            previous.hash_check(path, expected, checks, errors, f"{platform} {kind}")
            if not path.is_file():
                continue
            try:
                info = previous.png_info(path)
            except (ValueError, IndexError) as error:
                errors.append(f"Invalid screenshot {platform}/{filename}: {error}")
                continue
            checks[-1].update(info)
            for key in ("pixels", "encodedPixels", "displayPixels"):
                if key not in capture:
                    continue
                expected_size = capture[key]
                if isinstance(expected_size, list) and len(expected_size) == 2:
                    expected_size = dict(zip(("width", "height"), expected_size))
                actual_size = info["displayPixels" if key == "displayPixels" else "encodedPixels"]
                if expected_size != actual_size:
                    errors.append(f"{platform}/{filename}: {key} {expected_size} differs from PNG {actual_size}.")
            if platform == "web" and all(key in capture for key in ("width", "height", "dpr")):
                expected_size = {key: round(capture[key] * capture["dpr"]) for key in ("width", "height")}
                if info["encodedPixels"] != expected_size:
                    errors.append(f"web/{filename}: viewport and DPR differ from PNG dimensions.")
            elif platform == "android" and all(key in capture for key in ("width", "height")):
                if {key: capture[key] for key in ("width", "height")} != info["encodedPixels"]:
                    errors.append(f"android/{filename}: recorded dimensions differ from PNG.")
            inspection = capture.get("inspection", shared.get("inspection"))
            if not inspection or "pending" in str(inspection).lower():
                warnings.append(f"{platform}/{filename}: visual inspection is missing/pending ({kind}).")
            checks[-1]["inspection"] = inspection
            checks[-1]["classification"] = kind
        present = {str(path.relative_to(directory)) for path in directory.rglob("*.png")}
        # A nested diagnostic folder can carry its own metadata; the root index
        # covers only files it lists plus PNGs directly under its directory.
        required = {path.name for path in directory.glob("*.png")}
        if not required <= listed or not listed <= present:
            errors.append(f"{platform}: image/metadata mismatch: unlisted={sorted(required-listed)}, missing={sorted(listed-present)}")
        result[platform] = {"counts": counts, "checks": checks, "metadata": previous.relative(metadata_path)}
    return result


def status(errors, warnings, images):
    plan = (ROOT / "docs/DELIVERY_PLAN.md").read_text()
    review = (ROOT / "docs/APP_REVIEW.md").read_text().split("## Current delivery status", 1)[-1]
    ledger, phases = {}, {}
    for line in plan.splitlines():
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if cells and re.fullmatch(r"[RF]\d{2}", cells[0]) and len(cells) >= 5:
            if cells[0] in ledger:
                errors.append(f"Duplicate ledger item {cells[0]}.")
            ledger[cells[0]] = cells[3]
        if cells and re.fullmatch(r"P\d{2}|M11", cells[0]) and len(cells) == 5:
            phases[cells[0]] = cells[-1]
    expected_ids = {f"R{n:02}" for n in range(1, 26)} | {f"F{n:02}" for n in range(1, 11)}
    if set(ledger) != expected_ids:
        errors.append(f"Ledger IDs differ: missing={sorted(expected_ids-set(ledger))}, extra={sorted(set(ledger)-expected_ids)}")
    counts = {value: list(ledger.values()).count(value) for value in VALID_STATUSES}
    if any(value not in VALID_STATUSES for value in ledger.values()):
        errors.append("Ledger contains an unknown item status.")
    count_line = next((line.replace("*", "") for line in review.splitlines() if "Item counts" in line), "")
    labels = {"open": "open", "in-progress": "in[- ]progress", "implemented-awaiting-M11": "implemented[- ]awaiting[- ]M11",
              "resolved": "resolved", "blocked": "blocked", "scope-change-approved": "approved scope changes"}
    for value, label in labels.items():
        match = re.search(r"(\d+)\s+" + label, count_line, re.I)
        if not match or int(match[1]) != counts[value]:
            errors.append(f"Review count differs: {value}={counts[value]}, stated={match[1] if match else 'missing'}")
    tasks = {task: check == "x" for check, task in re.findall(r"^- \[([ x])\] \*\*((?:P\d{2}|M11)\.\d+)", plan, re.M)}
    for phase, phase_status in phases.items():
        unfinished = [task for task, done in tasks.items() if task.startswith(phase + ".") and not done]
        if phase_status in ("agent-done", "done") and unfinished:
            errors.append(f"{phase} marked complete with unchecked tasks {unfinished}.")
    current = next((line for line in plan.splitlines() if line.startswith("**Current state:**")), "")
    updated = next((line for line in review.splitlines() if line.startswith("**Updated:**")), "")
    if "Run 06" not in current or "Run 06" not in updated:
        errors.append("Plan/review current delivery summaries are not both updated for Run 06.")
    screenshot_line = next((line for line in review.splitlines() if "**Screenshots" in line), "")
    match = re.search(r"(\d+)\s+(?:(?:inspected|actual|final|application)\s+)*(?:captures|screenshots)", screenshot_line)
    totals = {kind: sum(value["counts"][kind] for value in images.values()) for kind in ("total", "final", "diagnostic")}
    if "Run 06" in updated and match and int(match[1]) not in (totals["total"], totals["final"]):
        errors.append(f"Review screenshot count {match[1]} matches neither final {totals['final']} nor total {totals['total']} metadata count.")
    if totals["diagnostic"]:
        warnings.append(f"Screenshot counts distinguish {totals['final']} final from {totals['diagnostic']} diagnostic captures; check prose qualification.")
    return {"ledgerCounts": counts, "ledger": ledger, "phases": phases, "tasks": tasks,
            "reviewUpdated": updated, "planCurrentState": current, "captureTotals": totals}


def document_links(errors, warnings, mode):
    link_errors = []
    result = previous.links(link_errors)
    pending = []
    for missing in result["missingLinks"]:
        doc = ROOT / missing["document"]
        target = (doc.parent / missing["destination"].split("#")[0]).resolve()
        if target.parent == RUN and target.name in GENERATED and mode in ("preview", "finalize"):
            pending.append(missing)
        else:
            errors.append(f"Broken link: {missing['document']} -> {missing['destination']} ({missing['reason']})")
    result["pendingGeneratedTargets"] = pending
    if pending:
        warnings.append("Document links to final audit outputs will resolve only after successful --finalize.")
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group()
    for mode in ("preview", "finalize", "verify"):
        group.add_argument("--" + mode, action="store_true")
    args = parser.parse_args()
    mode = "finalize" if args.finalize else "verify" if args.verify else "preview"
    errors, warnings, findings, artifact_errors = [], [], [], []
    identity = previous.source_identity("verify" if mode == "verify" else "preview", errors)
    images = screenshots(errors, warnings)
    artifact_checks = artifacts(artifact_errors, findings)
    for error in artifact_errors:
        if error in ("Missing final iOS artifact manifest.", "Missing final Android artifact manifest."):
            warnings.append(error + " No native application pass is inferred.")
        else:
            errors.append(error)
    state = status(errors, warnings, images)
    links = document_links(errors, warnings, mode)
    report = {"date": "2026-11-17", "checkedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
              "mode": mode, "passed": not errors, "scope": "Evidence integrity only; not application, phase, physical-device or release acceptance",
              "auditScriptSha256": previous.digest(Path(__file__)), "source": identity, "screenshots": images,
              "artifacts": artifact_checks, "artifactFindings": findings, **state, **links, "errors": errors, "warnings": warnings}
    if mode == "finalize" and not errors:
        previous.source_identity("finalize", errors)
    if mode != "preview":
        previous.write_json(RUN / "document-verification.json", report)
        previous.write_json(RUN / "artifact-verification.json", {"date": report["date"], "checks": artifact_checks, "findings": findings})
    print(json.dumps(report if mode == "preview" else {
        "report": previous.relative(RUN / "document-verification.json"), "passed": not errors,
        "sourceFiles": identity["sourceFiles"], "captureTotals": state["captureTotals"],
        "ledgerCounts": state["ledgerCounts"], "errors": errors, "warnings": warnings}, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main())
