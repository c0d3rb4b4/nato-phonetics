import XCTest

final class CaptureUITests: XCTestCase {
    let app = XCUIApplication(bundleIdentifier: "com.natophonetics.app")
    func item(_ id: String) -> XCUIElement { app.descendants(matching: .any).matching(identifier: id).firstMatch }
    func tap(_ id: String) { let e = item(id); XCTAssertTrue(e.exists || e.waitForExistence(timeout: 10), "Missing \(id)"); e.tap() }
    func route(_ path: String) { app.open(URL(string: "natophonetics://\(path)")!); XCTAssertTrue(app.wait(for: .runningForeground, timeout: 10)) }
    func capture(_ name: String) {
        sleep(1)
        var frames: [String: [String: Double]] = [:]
        let ids = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".map { "alphabet-\($0)" } + (0..<7).map { "converter-\($0)" } + ["quiz-card"]
        for id in ids {
            let element = item(id)
            if element.exists && element.isHittable {
                let f = element.frame
                frames[id] = ["x": Double(f.origin.x), "y": Double(f.origin.y), "width": Double(f.width), "height": Double(f.height)]
            }
        }
        if let data = try? JSONSerialization.data(withJSONObject: frames, options: [.sortedKeys]), let json = String(data: data, encoding: .utf8) {
            print("CAPTUREFRAMES \(name) \(json)")
        }
        let attachment = XCTAttachment(screenshot: XCUIScreen.main.screenshot()); attachment.name = name; attachment.lifetime = .keepAlways; add(attachment)
        print("CAPTURE \(name)")
    }
    func frame(_ id: String) -> CGRect {
        let e = item(id); XCTAssertTrue(e.exists || e.waitForExistence(timeout: 10), "Missing \(id)")
        let f = e.frame
        print("FRAME \(id) \(f.origin.x) \(f.origin.y) \(f.width) \(f.height)")
        return f
    }
    func assertTile(_ id: String, scale: CGFloat = 1) {
        let f = frame(id)
        XCTAssertEqual(f.width, 110 * scale, accuracy: 1.0)
        XCTAssertEqual(f.height, 150 * scale, accuracy: 1.0)
        XCTAssertEqual(f.width / f.height, 11.0 / 15, accuracy: 0.005)
    }
    func testPhoneTiles() {
        continueAfterFailure = false
        XCUIDevice.shared.orientation = .portrait
        app.launch(); route("settings"); tap("Light"); route("alphabet")
        XCTAssertTrue(item("alphabet-A").waitForExistence(timeout: 10))
        assertTile("alphabet-A"); assertTile("alphabet-B")
        capture("alphabet-first-light")
        let scroll = item("screen-scroll")
        var seen = Set<String>()
        for page in 0..<12 {
            capture("alphabet-page-\(page)-light")
            for letter in "ABCDEFGHIJKLMNOPQRSTUVWXYZ" {
                let id = "alphabet-\(letter)"; let e = item(id)
                if e.exists && e.isHittable { assertTile(id); seen.insert(String(letter)) }
            }
            if item("alphabet-Z").isHittable { break }
            scroll.swipeUp()
        }
        XCTAssertEqual(seen.count, 26, "All26 measured: \(seen.sorted())")
        assertTile("alphabet-Z"); capture("alphabet-last-light")
        route("converter"); let input = item("converter-input"); XCTAssertTrue(input.waitForExistence(timeout: 10)); input.tap()
        for char in "NUWJ359" { input.typeText(String(char)) }
        input.typeText("\n"); XCTAssertEqual(input.value as? String, "NUWJ359")
        assertTile("converter-0"); capture("converter-light")
        route("letter-quiz"); XCTAssertTrue(item("quiz-choice-0").waitForExistence(timeout: 10))
        assertTile("quiz-card")
        XCTAssertFalse(item("quiz-card-word").exists); XCTAssertFalse(item("quiz-card-pronunciation").exists)
        capture("quiz-question-light"); tap("quiz-choice-0")
        XCTAssertTrue(item("Next question").waitForExistence(timeout: 10))
        XCTAssertTrue(item("quiz-card-word").exists); assertTile("quiz-card"); capture("quiz-feedback-light")
        route("settings"); tap("Dark"); route("alphabet"); capture("alphabet-dark")
        XCUIDevice.shared.orientation = .landscapeLeft; sleep(2)
        XCTAssertGreaterThan(app.frame.width, app.frame.height)
        assertTile("alphabet-A"); capture("alphabet-landscape-dark")
        XCUIDevice.shared.orientation = .portrait
        route("settings"); tap("System")
    }
    func testAccessibilityTiles() {
        continueAfterFailure = false
        XCUIDevice.shared.orientation = .portrait
        app.launch(); route("settings"); tap("Light"); route("alphabet")
        let f = frame("alphabet-A")
        XCTAssertGreaterThan(f.width, 110)
        XCTAssertEqual(f.width / f.height, 11.0 / 15, accuracy: 0.005)
        capture("alphabet-accessibility-first")
        item("screen-scroll").swipeUp(); capture("alphabet-accessibility-scroll")
        route("letter-quiz"); XCTAssertTrue(item("quiz-choice-0").waitForExistence(timeout: 10)); capture("quiz-accessibility-question")
        let scroll = item("screen-scroll")
        for _ in 0..<8 { if item("quiz-choice-0").isHittable { break }; scroll.swipeUp() }
        tap("quiz-choice-0")
        for _ in 0..<8 { if item("Next question").isHittable { break }; scroll.swipeUp() }
        XCTAssertTrue(item("Next question").isHittable); capture("quiz-accessibility-feedback-reachable")
        route("settings"); tap("System")
    }
    func testViewportTiles() {
        continueAfterFailure = false
        XCUIDevice.shared.orientation = .portrait
        app.launch(); route("settings"); tap("Light"); route("alphabet")
        assertTile("alphabet-A"); assertTile("alphabet-B")
        capture("alphabet-viewport-portrait")
        let scroll = item("screen-scroll")
        var seen = Set<String>()
        for page in 0..<12 {
            for letter in "ABCDEFGHIJKLMNOPQRSTUVWXYZ" {
                let id = "alphabet-\(letter)"; let e = item(id)
                if e.exists && e.isHittable { assertTile(id); seen.insert(String(letter)) }
            }
            if item("alphabet-Z").isHittable { break }
            scroll.swipeUp(); capture("alphabet-viewport-page-\(page)")
        }
        XCTAssertEqual(seen.count, 26)
        capture("alphabet-viewport-last")
        route("menu"); route("alphabet")
        XCUIDevice.shared.orientation = .landscapeLeft; sleep(2)
        XCTAssertGreaterThan(app.frame.width, app.frame.height)
        assertTile("alphabet-A"); capture("alphabet-viewport-landscape")
        XCUIDevice.shared.orientation = .portrait
        route("settings"); tap("System")
    }

    func testAccessibilityOverflow() {
        continueAfterFailure = false
        XCUIDevice.shared.orientation = .portrait
        app.launch(); route("alphabet")
        let before = frame("alphabet-A")
        XCTAssertGreaterThan(before.width, app.frame.width - 32)
        let start = app.coordinate(withNormalizedOffset: CGVector(dx: 0.85, dy: 0.85))
        let end = app.coordinate(withNormalizedOffset: CGVector(dx: 0.15, dy: 0.85))
        start.press(forDuration: 0.1, thenDragTo: end, withVelocity: .slow, thenHoldForDuration: 0.3)
        let right = frame("alphabet-A")
        XCTAssertLessThan(right.origin.x, before.origin.x - 5)
        XCTAssertLessThanOrEqual(right.maxX, app.frame.width - 15)
        capture("alphabet-accessibility-overflow-right")
        let lower = app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.80))
        let upper = app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.425))
        lower.press(forDuration: 0.1, thenDragTo: upper, withVelocity: .slow, thenHoldForDuration: 0.3)
        let after = frame("alphabet-A")
        XCTAssertLessThan(after.origin.y, before.origin.y - 100)
        capture("alphabet-accessibility-overflow-scrolled")
    }

    func testCompleteAlphabetReferences() {
        continueAfterFailure = false
        XCUIDevice.shared.orientation = .portrait
        app.launch(); route("settings"); tap("Light"); route("alphabet")
        let scroll = item("screen-scroll")
        var seen = Set<String>()
        for page in 0..<15 {
            let viewport = scroll.frame
            for letter in "ABCDEFGHIJKLMNOPQRSTUVWXYZ" {
                let e = item("alphabet-\(letter)")
                if e.exists && e.isHittable && viewport.contains(e.frame) {
                    assertTile("alphabet-\(letter)"); seen.insert(String(letter))
                }
            }
            capture("alphabet-reference-\(page)-light")
            if seen.count == 26 { break }
            let start = scroll.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.75))
            let end = start.withOffset(CGVector(dx: 0, dy: -280))
            start.press(forDuration: 0.1, thenDragTo: end, withVelocity: .slow, thenHoldForDuration: 0.3)
        }
        XCTAssertEqual(seen.count, 26, "All26 fully inside scroll viewport: \(seen.sorted())")
        route("settings"); tap("System")
    }

}
