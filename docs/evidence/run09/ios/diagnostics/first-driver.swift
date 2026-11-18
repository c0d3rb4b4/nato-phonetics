import XCTest

final class CaptureUITests: XCTestCase {
  let app=XCUIApplication(bundleIdentifier:"com.natophonetics.app")
  func item(_ id:String)->XCUIElement { app.descendants(matching:.any).matching(identifier:id).firstMatch }
  func route(_ path:String) { app.open(URL(string:"natophonetics://\(path)")!); XCTAssertTrue(app.wait(for:.runningForeground,timeout:15)) }
  func shot(_ name:String) {
    let a=XCTAttachment(screenshot:XCUIScreen.main.screenshot());a.name=name;a.lifetime = .keepAlways;add(a)
    print("CAPTURE \(name)");fflush(stdout)
  }
  func align(_ id:String) {
    for _ in 0..<16 {
      let e=item(id),v=item("screen-scroll").frame
      if e.exists && e.isHittable && e.frame.minY>=v.minY+3 && e.frame.maxY<=v.maxY-3 { return }
      let delta=e.exists ? e.frame.minY-v.minY-14 : 400
      let s=item("screen-scroll")
      let start=s.coordinate(withNormalizedOffset:CGVector(dx:0.5,dy:delta>0 ? 0.82:0.18))
      start.press(forDuration:0.1,thenDragTo:start.withOffset(CGVector(dx:0,dy: -max(-v.height*0.65,min(v.height*0.65,delta)))),withVelocity:.fast,thenHoldForDuration:0.2)
    }
    XCTFail("Unreachable \(id)")
  }
  func tap(_ id:String) { align(id);item(id).tap() }
  func top() { for _ in 0..<3 { item("screen-scroll").swipeDown() } }
  func testConverterExports() {
    continueAfterFailure=false;app.launch();route("settings");tap("Dark");route("converter")
    XCTAssertTrue(item("converter-input").waitForExistence(timeout:20));shot("empty-dark")
    tap("converter-input");item("converter-input").typeText("a3 b-!")
    // Tap outside using an actual control; keyboardShouldPersistTaps is handled.
    tap("Copy conversion")
    XCTAssertTrue(app.staticTexts["Copied conversion."].waitForExistence(timeout:10))
    let expected="Alfa Three / Bravo dash [not spoken: \"!\" U+0021]"
    XCTAssertEqual(item("converter-plain-text").label,expected);align("converter-plain-text");shot("copied-dark")
    tap("Clear input");XCTAssertTrue(["", "Example: CV34 7AP"].contains(item("converter-input").value as? String ?? ""))
    tap("converter-input");item("converter-input").press(forDuration:1.2)
    let paste=app.menuItems["Paste"]
    if paste.waitForExistence(timeout:3) { paste.tap() }
    else { app.buttons["Paste"].tap() }
    XCTAssertEqual(item("converter-input").value as? String,expected)
    shot("clipboard-paste-dark")
    tap("Clear input");tap("converter-input");item("converter-input").typeText("a3 b-!")
    tap("Share conversion");sleep(1);shot("share-sheet-dark")
    let copy=app.buttons["Copy"]
    XCTAssertTrue(copy.waitForExistence(timeout:8));copy.tap()

    tap("Clear input");tap("converter-input");item("converter-input").typeText("cv34 7ap")
    item("Open menu").tap();item("Back to App").tap()
    XCTAssertEqual((item("converter-input").value as? String)?.lowercased(),"cv34 7ap")
    align("converter-0");shot("cards-dark")
    tap("Clear input");align("converter-input");shot("cleared-dark")
    route("privacy");align("privacy-copy-share");shot("privacy-copy-share-dark")
  }
  func testLargeConverterControls() {
    continueAfterFailure=false;app.launch();route("converter")
    tap("converter-input");item("converter-input").typeText("a3 b!")
    tap("Copy conversion");align("converter-plain-text");shot("large-plain-dark")
    align("Share conversion");shot("large-controls-dark")
    tap("Clear input");XCTAssertFalse(item("converter-0").exists)
  }
}
