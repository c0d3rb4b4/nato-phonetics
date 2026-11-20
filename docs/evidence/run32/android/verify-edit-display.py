"""Compare the rendered stable paragraph in editing frames to both cold scale controls."""
import argparse
import hashlib
import json
import re
from pathlib import Path

from PIL import Image, ImageChops


def load(path):
    return json.loads(path.read_text(encoding="utf-8"))


def read_capture(directory, stage, captures):
    capture = captures[stage]
    path = directory / capture["file"]
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    if digest != capture["sha256"]:
        raise ValueError(f"Capture digest differs for {path}")
    with Image.open(path) as image:
        return image.convert("RGB"), digest


def paragraph_bounds(sample):
    # The native input's screen origin accounts for the system status bar and
    # the scroll position. A clipped anchor cannot establish that translation.
    widget = sample["native"]
    x1, y1, x2, y2 = map(int, re.findall(r"-?\d+", widget["bounds"]))
    if x2 <= x1 or abs(y2 - y1 - widget["heightPx"]) > 1:
        raise ValueError("Input is clipped; absolute paragraph position is unverified")
    density = sample["dimensions"]["scale"]
    input_frame = sample["frames"]["input"]
    offset_x = x1 - round(density * input_frame["x"])
    offset_y = y1 - round(density * input_frame["y"])
    paragraph = sample["frames"]["stable"]
    return (offset_x + round(density * paragraph["x"]),
            offset_y + round(density * paragraph["y"]),
            offset_x + round(density * (paragraph["x"] + paragraph["width"])),
            offset_y + round(density * (paragraph["y"] + paragraph["height"])))


def crop(image, bounds):
    x1, y1, x2, y2 = bounds
    if not (0 <= x1 < x2 <= image.width and 0 <= y1 < y2 <= image.height):
        raise ValueError(f"Paragraph {bounds} extends beyond display {image.size}")
    return image.crop(bounds)


def different_pixels(a, b):
    if a.size != b.size:
        raise ValueError(f"Paragraph pixel dimensions differ: {a.size} and {b.size}")
    return sum(pixel != (0, 0, 0) for pixel in ImageChops.difference(a, b).getdata())


def check(reference, editing):
    identities = [load(directory / "identity.json") for directory in (reference, editing)]
    packages = [entry["identities"]["com.natophonetics.app"] for entry in identities]
    candidate = packages[0]["sha256"]
    if any(p["sha256"] != candidate or p["expectedSha256"] != candidate for p in packages):
        raise ValueError("Cold and editing samples must use the same verified fixture APK")
    reported_abis = {p["primaryCpuAbi"] for p in packages if "primaryCpuAbi" in p}
    if len(reported_abis) > 1:
        raise ValueError("Cold and editing samples selected different native ABIs")
    if any(identities[0][k] != identities[1][k] for k in ("api", "runtime")):
        raise ValueError("Android versions differ")
    cold, actual = [load(d / "samples.json") for d in (reference, editing)]
    cold_index, edit_index = [{r["stage"]: r for r in load(d / "captures.json")}
                              for d in (reference, editing)]
    controls = {}
    for scale in (1, 2):
        stage = f"cold{scale}"
        if cold[stage]["dimensions"]["fontScale"] != scale:
            raise ValueError(f"Wrong reference scale in {stage}")
        controls[scale] = read_capture(reference, stage, cold_index)

    stages = {"editing-start": 1, "editing-before": 1, "editing-typed-before": 1,
              "editing-live2": 2, "editing-return1": 1, "editing-insert": 1}
    results = []
    for stage, scale in stages.items():
        sample = actual[stage]
        baseline = cold[f"cold{scale}"]
        if sample["dimensions"] != baseline["dimensions"]:
            raise ValueError(f"{stage} and cold{scale} have different display configurations")
        observed, digest = read_capture(editing, stage, edit_index)
        expected, ref_digest = controls[scale]
        opposite, other_digest = controls[3 - scale]
        if observed.size != expected.size or opposite.size != expected.size:
            raise ValueError(f"{stage} and the cold controls have different display sizes")
        actual_bounds = paragraph_bounds(sample)
        cold_bounds = paragraph_bounds(baseline)
        expected_text = crop(expected, cold_bounds)
        if expected_text.convert("L").getextrema() != (0, 255):
            raise ValueError(f"Missing expected black-on-white reference text in cold{scale}")
        actual_text = crop(observed, actual_bounds)
        other_text = crop(opposite, cold_bounds)
        cold_differences = different_pixels(expected_text, other_text)
        if cold_differences == 0:
            raise ValueError(f"Cold controls fail to distinguish scale at {stage}")
        mismatch = different_pixels(actual_text, expected_text)
        results.append({"stage": stage, "logicalScale": scale, "screenshotSha256": digest,
                        "expectedReferenceSha256": ref_digest, "oppositeReferenceSha256": other_digest,
                        "actualParagraphPx": actual_bounds, "expectedParagraphPx": cold_bounds,
                        "differentFromExpectedPixels": mismatch,
                        "differentFromOppositePixels": different_pixels(actual_text, other_text),
                        "pixelsDistinguishingColdScales": cold_differences, "passed": mismatch == 0})
    return {"fixtureApkSha256": candidate, "androidApi": identities[0]["api"],
            "referenceSerial": identities[0]["serial"], "observationSerial": identities[1]["serial"],
            "comparison": "Exact decoded RGB equality inside the measured, fixed-content stable paragraph.",
            "scope": "Fixture visual scale confirmation. Edited glyph, caret and IME visibility require separate inspection.",
            "stages": results, "passed": all(row["passed"] for row in results)}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("reference", type=Path, help="Fixture collector directory with cold1 and cold2")
    parser.add_argument("editing", type=Path, help="Fixture collector directory with all six editing frames")
    parser.add_argument("output", type=Path, help="New JSON result")
    args = parser.parse_args()
    result = check(args.reference, args.editing)
    with args.output.open("x", encoding="utf-8") as report:
        json.dump(result, report, indent=2)
        report.write("\n")
    print(json.dumps({"passed": result["passed"],
                      "rejected": [row["stage"] for row in result["stages"] if not row["passed"]]}))
    raise SystemExit(0 if result["passed"] else 1)
