import XCTest
final class BundlerUITests:XCTestCase {
 let app=XCUIApplication(bundleIdentifier:"com.natophonetics.app")
 func item(_ name:String)->XCUIElement {app.descendants(matching:.any).matching(identifier:name).firstMatch}
 func shot(_ name:String){let a=XCTAttachment(screenshot:XCUIScreen.main.screenshot());a.name=name;a.lifetime = .keepAlways;add(a)}
 func align(_ id:String){for _ in 0..<24 {let e=item(id),v=item("screen-scroll").frame;let bottom=app.keyboards.firstMatch.exists ? min(v.maxY,app.keyboards.firstMatch.frame.minY-12):v.maxY;if e.exists && e.isHittable && e.frame.minY>=v.minY+3 && e.frame.maxY<=bottom-3{return};let down = !e.exists || e.frame.minY>v.minY+6;let o=app.coordinate(withNormalizedOffset:CGVector(dx:0,dy:0));let s=o.withOffset(CGVector(dx:v.maxX-16,dy:down ? bottom-25:v.minY+25));let t=o.withOffset(CGVector(dx:v.maxX-16,dy:down ? v.minY+25:bottom-25));s.press(forDuration:0.01,thenDragTo:t,withVelocity:.slow,thenHoldForDuration:0)};XCTFail("Unreachable \(id)")}
 func tap(_ name:String){align(name);item(name).tap()}
 func testReleaseConversionAndReference(){
  continueAfterFailure=false;app.terminate();app.launch()
  XCTAssertTrue(item("app-header").waitForExistence(timeout:60))
  app.open(URL(string:"natophonetics://converter")!)
  XCTAssertTrue(item("converter-input").waitForExistence(timeout:20))
  item("converter-input").coordinate(withNormalizedOffset:CGVector(dx:0.3,dy:0.5)).tap()
  XCTAssertTrue(app.keyboards.firstMatch.waitForExistence(timeout:5))
  // Use real individual key events; historical bulk-injection failures remain.
  for key in ["a","3"," ","b","!"] {item("converter-input").typeText(key)}
  XCTAssertEqual(item("converter-input").value as? String,"a3 b!")
  shot("release-converter-keyboard")
  tap("Copy conversion");XCTAssertTrue(app.staticTexts["Copied conversion."].waitForExistence(timeout:8))
  XCTAssertEqual(item("converter-input").value as? String,"a3 b!")
  XCTAssertEqual(item("converter-plain-text").label,"Alfa Three / Bravo [not spoken: \"!\" U+0021]")
  shot("release-converter-copy")
  item("Open menu").tap();tap("Back to App")
  XCTAssertEqual(item("converter-input").value as? String,"a3 b!")
  app.open(URL(string:"natophonetics://alphabet")!)
  XCTAssertTrue(app.staticTexts["Letter and digit reference"].waitForExistence(timeout:20));shot("release-alphabet")
  tap("Digits 0–9");XCTAssertTrue(item("digit-3").waitForExistence(timeout:8));shot("release-digits")
 }
 func testReleaseLongPhraseStop(){
  continueAfterFailure=false;app.terminate();app.launch();app.open(URL(string:"natophonetics://converter")!)
  XCTAssertTrue(item("converter-input").waitForExistence(timeout:30))
  item("converter-input").coordinate(withNormalizedOffset:CGVector(dx:0.3,dy:0.5)).tap()
  XCTAssertTrue(app.keyboards.firstMatch.waitForExistence(timeout:5))
  for key in "abcdefghijklmnopqrstuvwxyz" {item("converter-input").typeText(String(key))}
  XCTAssertEqual(item("converter-input").value as? String,"abcdefghijklmnopqrstuvwxyz")
  tap("Play Full Phrase");XCTAssertTrue(item("Stop playback").waitForExistence(timeout:12));tap("Stop playback")
  XCTAssertTrue(app.staticTexts["No token playing."].waitForExistence(timeout:8))
  XCTAssertEqual(item("converter-input").value as? String,"abcdefghijklmnopqrstuvwxyz")
  shot("release-long-phrase-stopped")
 }
}
