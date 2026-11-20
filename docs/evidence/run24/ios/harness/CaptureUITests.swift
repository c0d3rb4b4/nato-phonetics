import XCTest

final class ExportUITests: XCTestCase {
  let app = XCUIApplication(bundleIdentifier: "com.natophonetics.app")
  let expected = String(String(repeating: "CV34 7AP / G-ABCD\n", count: 118).prefix(2000)) + "j"
  func item(_ id: String) -> XCUIElement { app.descendants(matching: .any).matching(identifier: id).firstMatch }
  func capture(_ name: String) {
    let attachment = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
    attachment.name = name; attachment.lifetime = .keepAlways; add(attachment)
  }
  // Keep drags short and in the outer scroll's margin, outside nested output.
  func align(_ id: String) {
    for _ in 0..<35 {
      let element = item(id), frame = item("screen-scroll").frame
      let bottom = app.keyboards.firstMatch.exists ? min(frame.maxY, app.keyboards.firstMatch.frame.minY - 12) : frame.maxY
      if element.exists && element.isHittable && element.frame.minY >= frame.minY + 3 && element.frame.maxY <= bottom - 3 { return }
      let down = !element.exists || element.frame.minY > frame.minY + 6
      let origin = app.coordinate(withNormalizedOffset: CGVector(dx: 0, dy: 0))
      let start = origin.withOffset(CGVector(dx: frame.maxX - 8, dy: down ? bottom - 20 : frame.minY + 20))
      let end = origin.withOffset(CGVector(dx: frame.maxX - 8, dy: down ? frame.minY + 20 : bottom - 20))
      start.press(forDuration: 0.01, thenDragTo: end, withVelocity: .slow, thenHoldForDuration: 0)
      XCTAssertEqual(app.state, .runningForeground)
    }
    capture("unreachable-" + id); XCTFail("Unreachable " + id)
  }
  func startLongInput() -> XCUIElement {
    continueAfterFailure = false
    app.launch(); app.open(URL(string: "natophonetics://converter")!)
    let input = item("converter-input")
    XCTAssertTrue(input.waitForExistence(timeout: 30)); input.tap()
    if !app.keyboards.firstMatch.waitForExistence(timeout: 5) { input.tap() }
    XCTAssertTrue(app.keyboards.firstMatch.waitForExistence(timeout: 10))
    input.press(forDuration: 1.2)
    let paste = app.menuItems["Paste"].firstMatch
    if paste.waitForExistence(timeout: 3) { paste.tap() } else { app.buttons["Paste"].firstMatch.tap() }
    XCTAssertEqual(input.value as? String, String(expected.dropLast()))
    input.typeText("j"); XCTAssertEqual(input.value as? String, expected)
    capture("long-paste-keyboard")
    return input
  }
  func testLongCopyAndScroll() {
    let input = startLongInput()
    align("Copy conversion"); item("Copy conversion").tap()
    XCTAssertTrue(app.staticTexts["Copied conversion."].waitForExistence(timeout: 8))
    XCTAssertEqual(input.value as? String, expected)
    capture("long-copy")
    // Inspect and exercise the actual nested plain-text region at this size.
    let plainScroll = item("converter-plain-scroll")
    // At maximum text, reaching Copy can put the preceding output wholly above
    // the header. Bring its visible region back with bounded short outer swipes.
    for _ in 0..<6 {
      let viewport = item("screen-scroll").frame
      if plainScroll.frame.intersection(viewport).height > 100 { break }
      let origin = app.coordinate(withNormalizedOffset: .zero)
      let from = origin.withOffset(CGVector(dx: viewport.maxX - 8, dy: viewport.minY + 24))
      let to = origin.withOffset(CGVector(dx: viewport.maxX - 8, dy: min(viewport.maxY - 24, viewport.minY + 274)))
      from.press(forDuration: 0.01, thenDragTo: to, withVelocity: .slow, thenHoldForDuration: 0)
      XCTAssertEqual(app.state, .runningForeground)
    }
    let before = item("converter-plain-text").frame
    // Drag inside the visible nested output above the reachable Copy control.
    var box = plainScroll.frame.intersection(item("screen-scroll").frame)
    box.size.height = min(box.maxY, item("Copy conversion").frame.minY - 16) - box.minY
    print("RUN24 PLAIN scroll=\(plainScroll.frame) text=\(before) visible=\(box)")
    XCTAssertGreaterThan(box.height, 60)
    let start = app.coordinate(withNormalizedOffset: .zero).withOffset(CGVector(dx: box.midX, dy: box.maxY - 25))
    let end = app.coordinate(withNormalizedOffset: .zero).withOffset(CGVector(dx: box.midX, dy: box.minY + 25))
    start.press(forDuration: 0.01, thenDragTo: end, withVelocity: .slow, thenHoldForDuration: 0)
    let after = item("converter-plain-text").frame
    XCTAssertLessThan(after.minY, before.minY - 5)
    XCTAssertTrue(item("converter-plain-text").label.hasSuffix("Juliett"))
    capture("plain-text-interior")
    item("Open menu").tap(); XCTAssertTrue(item("Back to App").waitForExistence(timeout: 10)); item("Back to App").tap()
    XCTAssertEqual(input.value as? String, expected)
    align("Copy conversion"); item("Copy conversion").tap()
    XCTAssertTrue(app.staticTexts["Copied conversion."].waitForExistence(timeout: 8))
    capture("copy-after-menu")
  }
  func testShareAndCancel() {
    let input = startLongInput()
    align("Share conversion"); item("Share conversion").tap()
    // UIKit exposes Copy as a Cell; a Close/Cancel Button is not guaranteed.
    // Wait for the actual sheet before capturing or dismissing it.
    XCTAssertTrue(app.cells["Copy"].firstMatch.waitForExistence(timeout: 10))
    capture("share-sheet")
    print("RUN24 SHARE HIERARCHY\n" + app.debugDescription)
    app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.08)).tap()
    XCTAssertTrue(app.staticTexts["Sharing cancelled."].waitForExistence(timeout: 8))
    XCTAssertEqual(input.value as? String, expected)
    capture("share-cancelled")
  }
}
