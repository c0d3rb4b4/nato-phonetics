import XCTest

final class CLISmokeUITests: XCTestCase {
  let app = XCUIApplication(bundleIdentifier: "com.natophonetics.app")
  func item(_ id: String) -> XCUIElement { app.descendants(matching: .any).matching(identifier: id).firstMatch }
  func capture(_ name: String) {
    let attachment = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
    attachment.name = name; attachment.lifetime = .keepAlways; add(attachment)
  }
  func testCLIRebuiltApp() {
    continueAfterFailure = false
    app.launch()
    XCTAssertTrue(item("app-header").waitForExistence(timeout: 60))
    capture("home-light")
    app.open(URL(string: "natophonetics://converter")!)
    let input = item("converter-input")
    XCTAssertTrue(input.waitForExistence(timeout: 15))
    input.tap()
    XCTAssertTrue(app.keyboards.firstMatch.waitForExistence(timeout: 5))
    for key in "a3 b!" { input.typeText(String(key)) }
    XCTAssertEqual(input.value as? String, "a3 b!")
    capture("converter-typed-input")
    item("Open menu").tap()
    XCTAssertTrue(item("Back to App").waitForExistence(timeout: 10))
    item("Back to App").tap()
    XCTAssertEqual(input.value as? String, "a3 b!")
    app.open(URL(string: "natophonetics://alphabet")!)
    XCTAssertTrue(item("alphabet-A").waitForExistence(timeout: 15))
    XCTAssertEqual(item("alphabet-A").frame.width / item("alphabet-A").frame.height, 11.0/15.0, accuracy: 0.004)
    capture("alphabet-light")
  }
}
