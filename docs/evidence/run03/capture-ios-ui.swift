import XCTest

final class CaptureUITests: XCTestCase {
    let app = XCUIApplication(bundleIdentifier: "com.natophonetics.app")

    func item(_ identifier: String) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: identifier).firstMatch
    }

    func tap(_ identifier: String) {
        let target = item(identifier)
        XCTAssertTrue(target.waitForExistence(timeout: 10), "Missing control: \(identifier)")
        target.tap()
    }

    func capture(_ name: String) {
        sleep(1)
        let image = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        image.name = name
        image.lifetime = .keepAlways
        add(image)
        print("CAPTURE \(name)")
    }

    func route(_ name: String) {
        app.open(URL(string: "natophonetics://\(name)")!)
        XCTAssertTrue(app.wait(for: .runningForeground, timeout: 10))
    }

    func assertCards(_ words: [String]) {
        for word in words {
            XCTAssertTrue(item("Play \(word)").waitForExistence(timeout: 5), "Missing converter card: \(word)")
        }
    }

    func testCaptureNativeStates() {
        continueAfterFailure = false
        app.launch()
        route("settings")
        print(app.debugDescription)
        tap("Light")
        tap("Home")
        XCTAssertTrue(item("NATO Phonetics").waitForExistence(timeout: 10))
        capture("home-light")

        route("alphabet")
        XCTAssertTrue(item("Play A, Alfa").waitForExistence(timeout: 10))
        capture("alphabet-light")

        route("converter")
        let input = item("converter-input")
        XCTAssertTrue(input.waitForExistence(timeout: 10))
        capture("converter-empty-light")
        input.tap()
        XCTAssertTrue(app.keyboards.firstMatch.waitForExistence(timeout: 10))
        sleep(2)
        var expected = ""
        for character in "CV34 7AP" {
            input.typeText(String(character))
            expected.append(character)
            sleep(1)
            XCTAssertEqual(input.value as? String, expected)
        }
        input.typeText("\n")
        XCTAssertEqual(input.value as? String, "CV34 7AP")
        assertCards(["Charlie", "Victor", "Three", "Four", "Seven", "Alfa", "Papa"])
        capture("converter-populated-light")

        route("letter-quiz")
        XCTAssertTrue(item("quiz-choice-0").waitForExistence(timeout: 10))
        capture("quiz-light")
        tap("quiz-choice-0")
        XCTAssertTrue(item("Next question").waitForExistence(timeout: 10))
        capture("quiz-feedback-light")

        route("settings")
        tap("Dark")
        capture("settings-dark")
        tap("Home")
        app.terminate()
        app.launch()
        XCTAssertTrue(item("NATO Phonetics").waitForExistence(timeout: 10))
        capture("home-dark-restarted")

        route("voice-select")
        XCTAssertTrue(item("System Default").waitForExistence(timeout: 10))
        sleep(3)
        capture("voice-dark")

        route("settings")
        tap("Light")
        route("audio-help")
        XCTAssertTrue(item("Play audio test").waitForExistence(timeout: 10))
        capture("audio-help-light")

        app.terminate()
        route("menu")
        XCTAssertTrue(item("Back to App").waitForExistence(timeout: 10))
        capture("menu-cold-light")
        tap("Back to App")
        XCTAssertTrue(item("NATO Phonetics").waitForExistence(timeout: 10))
        print("PASS cold Menu Back to App returns Home")
        route("settings")
        tap("System")
    }

    func testConverterInputFollowup() {
        continueAfterFailure = false
        app.launch()
        route("settings")
        tap("Light")
        route("converter")
        let input = item("converter-input")
        XCTAssertTrue(input.waitForExistence(timeout: 10))
        input.tap()
        var expected = ""
        for character in "CV34 7AP" {
            input.typeText(String(character))
            expected.append(character)
            sleep(1)
            XCTAssertEqual(input.value as? String, expected)
        }
        input.typeText("\n")
        XCTAssertEqual(input.value as? String, "CV34 7AP")
        capture("converter-populated-light")
        route("settings")
        tap("System")
    }

    func testFastInputWithoutReturn() {
        continueAfterFailure = false
        app.launch()
        route("settings")
        tap("Light")
        route("converter")
        let input = item("converter-input")
        XCTAssertTrue(input.waitForExistence(timeout: 10))
        input.tap()
        input.typeText("CV34 7AP")
        sleep(1)
        capture("converter-fast-before-return")
        XCTAssertEqual(input.value as? String, "CV34 7AP")
        input.typeText("\n")
        sleep(1)
        XCTAssertEqual(input.value as? String, "CV34 7AP")
        assertCards(["Charlie", "Victor", "Three", "Four", "Seven", "Alfa", "Papa"])
        route("settings")
        tap("System")
    }

    func testConverterEditingAndMenuRetention() {
        continueAfterFailure = false
        app.launch()
        route("converter")
        let input = item("converter-input")
        XCTAssertTrue(input.waitForExistence(timeout: 10))
        input.tap()
        input.typeText("CV34 7AP")
        XCTAssertEqual(input.value as? String, "CV34 7AP")
        assertCards(["Charlie", "Victor", "Three", "Four", "Seven", "Alfa", "Papa"])
        input.typeText(XCUIKeyboardKey.delete.rawValue + XCUIKeyboardKey.delete.rawValue)
        XCTAssertEqual(input.value as? String, "CV34 7")
        input.typeText("XY")
        XCTAssertEqual(input.value as? String, "CV34 7XY")
        tap("Open menu")
        tap("Back to App")
        XCTAssertTrue(input.waitForExistence(timeout: 10))
        XCTAssertEqual(input.value as? String, "CV34 7XY")
        assertCards(["Charlie", "Victor", "Three", "Four", "Seven", "X-ray", "Yankee"])
        XCTAssertFalse(item("Play Alfa").exists)
        XCTAssertFalse(item("Play Papa").exists)
        print("PASS exact fast text, deletion, append and Menu/Back retention")
    }

    func testKeyboardReadyFastInputAndEditing() {
        continueAfterFailure = false
        app.launch()
        route("settings")
        tap("Light")
        route("converter")
        let input = item("converter-input")
        XCTAssertTrue(input.waitForExistence(timeout: 10))
        input.tap()
        XCTAssertTrue(app.keyboards.firstMatch.waitForExistence(timeout: 10))
        XCTAssertTrue(app.keyboards.firstMatch.isHittable)
        sleep(2)
        input.typeText("CV34 7AP")
        sleep(1)
        capture("converter-keyboard-ready-fast")
        XCTAssertEqual(input.value as? String, "CV34 7AP")
        assertCards(["Charlie", "Victor", "Three", "Four", "Seven", "Alfa", "Papa"])
        input.typeText(XCUIKeyboardKey.delete.rawValue + XCUIKeyboardKey.delete.rawValue)
        XCTAssertEqual(input.value as? String, "CV34 7")
        input.typeText("XY")
        XCTAssertEqual(input.value as? String, "CV34 7XY")
        tap("Open menu")
        tap("Back to App")
        XCTAssertTrue(input.waitForExistence(timeout: 10))
        XCTAssertEqual(input.value as? String, "CV34 7XY")
        assertCards(["Charlie", "Victor", "Three", "Four", "Seven", "X-ray", "Yankee"])
        XCTAssertFalse(item("Play Alfa").exists)
        XCTAssertFalse(item("Play Papa").exists)
        print("PASS keyboard-ready fast text, deletion, append and Menu/Back retention")
    }
}
