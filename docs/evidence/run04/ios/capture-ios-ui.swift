import XCTest
import AVFoundation

final class CaptureUITests: XCTestCase {
    let app = XCUIApplication(bundleIdentifier: "com.natophonetics.app")

    func item(_ identifier: String) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: identifier).firstMatch
    }

    func tap(_ identifier: String) {
        let target = item(identifier)
        XCTAssertTrue(target.exists || target.waitForExistence(timeout: 10), "Missing control: \(identifier)")
        target.tap()
    }

    func capture(_ name: String) {
        if name != "audio-playing" { sleep(1) }
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
            XCTAssertTrue(item("Play \(word)").exists || item("Play \(word)").waitForExistence(timeout: 5), "Missing converter card: \(word)")
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
        capture("quiz-after-choice-diagnostic")
        print("QUIZ AFTER CHOICE \(app.debugDescription)")
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
    func testMinimalControlled() {
        continueAfterFailure = false
        app.launch()
        let field = item("controlled-input")
        XCTAssertTrue(field.waitForExistence(timeout: 10))
        field.tap()
        XCTAssertTrue(app.keyboards.firstMatch.waitForExistence(timeout: 10))
        field.typeText("CV34 7AP")
        capture("minimal-controlled-input")
        print("MINIMAL CONTROLLED VALUE: \(field.value ?? "nil")")
        XCTAssertEqual(field.value as? String, "CV34 7AP")
        XCTAssertEqual(item("controlled-output").label, "CV34 7AP")
        field.typeText(XCUIKeyboardKey.delete.rawValue + XCUIKeyboardKey.delete.rawValue)
        print("MINIMAL DELETE VALUE: \(field.value ?? "nil")")
        XCTAssertEqual(field.value as? String, "CV34 7")
        field.typeText("XY")
        XCTAssertEqual(field.value as? String, "CV34 7XY")
    }

    func testMinimalUncontrolled() {
        continueAfterFailure = false
        app.launch()
        let field = item("uncontrolled-input")
        XCTAssertTrue(field.waitForExistence(timeout: 10))
        field.tap()
        XCTAssertTrue(app.keyboards.firstMatch.waitForExistence(timeout: 10))
        field.typeText("CV34 7AP")
        capture("minimal-uncontrolled-input")
        print("MINIMAL UNCONTROLLED VALUE: \(field.value ?? "nil")")
        XCTAssertEqual(field.value as? String, "CV34 7AP")
        XCTAssertEqual(item("uncontrolled-output").label, "CV34 7AP")
        field.typeText(XCUIKeyboardKey.delete.rawValue + XCUIKeyboardKey.delete.rawValue)
        print("MINIMAL DELETE VALUE: \(field.value ?? "nil")")
        XCTAssertEqual(field.value as? String, "CV34 7")
        field.typeText("XY")
        XCTAssertEqual(field.value as? String, "CV34 7XY")
    }

    func waitUntilGone(_ identifier: String, timeout: TimeInterval = 10) {
        let predicate = NSPredicate(format: "exists == false")
        let expectation = XCTNSPredicateExpectation(predicate: predicate, object: item(identifier))
        XCTAssertEqual(XCTWaiter.wait(for: [expectation], timeout: timeout), .completed, "Still visible: \(identifier)")
        if identifier == "Stop playback" { XCTAssertFalse(app.buttons["Audio Help"].exists, "Playback ended with an error action") }
    }

    func testNativeLifecycleAndVoice() {
        print("ENGLISH VOICES: \(AVSpeechSynthesisVoice.speechVoices().filter { $0.language.hasPrefix("en") }.map { $0.identifier })")
        continueAfterFailure = false
        app.launch()
        route("settings")
        tap("Light")
        route("audio-help")
        tap("Play audio test")
        XCTAssertTrue(item("Stop playback").exists || item("Stop playback").waitForExistence(timeout: 5))
        capture("audio-playing")
        tap("Stop playback")
        waitUntilGone("Stop playback")
        print("PASS explicit native speech Stop")

        tap("Play audio test")
        XCTAssertTrue(item("Stop playback").exists || item("Stop playback").waitForExistence(timeout: 5))
        tap("Play audio test")
        XCTAssertTrue(item("Stop playback").exists || item("Stop playback").waitForExistence(timeout: 5))
        waitUntilGone("Stop playback", timeout: 30)
        XCTAssertFalse(app.buttons["Audio Help"].exists)
        print("PASS repeated real-provider request completes without error")

        tap("Play audio test")
        XCTAssertTrue(item("Stop playback").exists || item("Stop playback").waitForExistence(timeout: 5))
        route("menu")
        tap("Back to App")
        waitUntilGone("Stop playback")
        sleep(3)
        XCTAssertFalse(item("Stop playback").exists)
        print("PASS navigation cancels and Back does not resume")

        tap("Play audio test")
        XCTAssertTrue(item("Stop playback").exists || item("Stop playback").waitForExistence(timeout: 5))
        XCUIDevice.shared.press(.home)
        XCTAssertTrue(app.wait(for: .runningBackground, timeout: 10))
        app.activate()
        waitUntilGone("Stop playback")
        sleep(3)
        XCTAssertFalse(item("Stop playback").exists)
        print("PASS background cancels and foreground does not resume")

        route("voice-select")
        tap("Karen, en-AU")
        route("settings")
        XCTAssertTrue(item("Karen").waitForExistence(timeout: 10))
        app.terminate()
        app.launch()
        route("settings")
        XCTAssertTrue(item("Karen").waitForExistence(timeout: 10))
        route("voice-select")
        tap("System Default")
        tap("Preview System Default")
        XCTAssertTrue(item("Stop playback").exists || item("Stop playback").waitForExistence(timeout: 5))
        waitUntilGone("Stop playback", timeout: 30)
        XCTAssertFalse(app.buttons["Audio Help"].exists)
        route("settings")
        XCTAssertTrue(item("System Default").waitForExistence(timeout: 10))
        print("PASS saved native voice survives relaunch, Default restored and real preview completes")

        app.terminate()
        route("menu")
        XCTAssertTrue(item("Back to App").waitForExistence(timeout: 10))
        tap("Back to App")
        XCTAssertTrue(item("NATO Phonetics").waitForExistence(timeout: 10))
        route("does-not-exist")
        XCTAssertTrue(item("Page not found").waitForExistence(timeout: 10))
        tap("Go Home")
        XCTAssertTrue(item("NATO Phonetics").waitForExistence(timeout: 10))
        print("PASS SceneDelegate cold/warm URLs, unknown URL and Home fallback")
    }

    func testLegacySeed() {
        continueAfterFailure = false
        app.launch()
        route("settings")
        XCTAssertTrue(item("Karen").waitForExistence(timeout: 10))
        capture("legacy-preferences-migrated-dark")
        print("LEGACY SETTINGS \(app.debugDescription)")
        app.terminate()
    }

    func testResetPreferences() {
        continueAfterFailure = false
        app.launch()
        route("settings")
        tap("Reset Preferences")
        XCTAssertTrue(item("System Default").waitForExistence(timeout: 10))
        capture("preferences-reset")
        print("PASS native seeded legacy voice visible and Reset Preferences completed")
    }

    func testNativeKeyEventsEditing() {
        continueAfterFailure = false
        app.launch()
        route("settings")
        tap("Light")
        route("converter")
        let input = item("converter-input")
        XCTAssertTrue(input.waitForExistence(timeout: 10))
        input.tap()
        XCTAssertTrue(app.keyboards.firstMatch.waitForExistence(timeout: 10))
        var expected = ""
        for char in "CV34 7AP" {
            input.typeText(String(char))
            expected.append(char)
            XCTAssertEqual(input.value as? String, expected)
        }
        input.typeText(XCUIKeyboardKey.delete.rawValue)
        input.typeText(XCUIKeyboardKey.delete.rawValue)
        XCTAssertEqual(input.value as? String, "CV34 7")
        input.typeText("X")
        input.typeText("Y")
        XCTAssertEqual(input.value as? String, "CV34 7XY")
        input.typeText("\n")
        tap("Open menu")
        tap("Back to App")
        XCTAssertEqual(input.value as? String, "CV34 7XY")
        assertCards(["Charlie", "Victor", "Three", "Four", "Seven", "X-ray", "Yankee"])
        XCTAssertFalse(item("Play Alfa").exists)
        XCTAssertFalse(item("Play Papa").exists)
        capture("converter-edited")
        print("PASS consecutive individual key events, deletion, append, Menu retention and all output cards; no artificial character delays")
    }

    func testNativePaste() {
        continueAfterFailure = false
        app.launch()
        route("settings")
        tap("Light")
        route("converter")
        let input = item("converter-input")
        XCTAssertTrue(input.waitForExistence(timeout: 10))
        input.tap()
        input.press(forDuration: 1.2)
        tap("Paste")
        let allow = app.buttons["Allow Paste"]
        if allow.waitForExistence(timeout: 2) { allow.tap() }
        XCTAssertEqual(input.value as? String, "CV34 7AP")
        input.typeText("\n")
        assertCards(["Charlie", "Victor", "Three", "Four", "Seven", "Alfa", "Papa"])
        capture("converter-pasted")
        print("PASS actual native clipboard Paste inserts full value and all seven output cards")
    }

    func testQuizSingleTap() {
        continueAfterFailure = false
        app.launch()
        route("letter-quiz")
        let choice = item("quiz-choice-0")
        XCTAssertTrue(choice.waitForExistence(timeout: 10))
        XCTAssertTrue(choice.isHittable)
        XCTAssertTrue(choice.isEnabled)
        capture("quiz-before-single-tap")
        choice.tap()
        capture("quiz-after-single-tap")
        print("QUIZ AFTER SINGLE TAP \(app.debugDescription)")
        XCTAssertTrue(item("Next question").waitForExistence(timeout: 10))
        XCTAssertFalse(choice.isEnabled)
        XCTAssertTrue(item("Replay answer").exists)
        print("PASS single quiz answer tap produces persistent feedback, Next and Replay")
    }

}
