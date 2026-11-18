import XCTest

final class InputControlUITests: XCTestCase {
    func testKeyboardReadyBulkTyping() {
        continueAfterFailure = false
        let app = XCUIApplication(bundleIdentifier: "com.natophonetics.inputcontrol")
        app.launch()
        let input = app.textFields["converter-input"]
        XCTAssertTrue(input.waitForExistence(timeout: 10))
        input.tap()
        XCTAssertTrue(app.keyboards.firstMatch.waitForExistence(timeout: 10))
        XCTAssertTrue(app.keyboards.firstMatch.isHittable)
        sleep(2)
        input.typeText("CV34 7AP")
        sleep(1)
        let attachment = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        attachment.name = "plain-uikit-bulk-input"
        attachment.lifetime = .keepAlways
        add(attachment)
        let actual = input.value as? String
        print("INPUT CONTROL expected=CV34 7AP actual=\(actual ?? "<nil>")")
        XCTAssertEqual(actual, "CV34 7AP")
    }
}
