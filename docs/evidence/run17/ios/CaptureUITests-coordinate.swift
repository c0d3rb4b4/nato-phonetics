import XCTest
final class BundlerUITests:XCTestCase {
 let app=XCUIApplication(bundleIdentifier:"com.natophonetics.app")
 func item(_ name:String)->XCUIElement {app.descendants(matching:.any).matching(identifier:name).firstMatch}
 func shot(_ name:String){let a=XCTAttachment(screenshot:XCUIScreen.main.screenshot());a.name=name;a.lifetime = .keepAlways;add(a)}
 func tap(_ name:String){
  let e=item(name)
  for _ in 0..<12 {if e.exists && e.isHittable {break};item("screen-scroll").swipeUp(velocity:.slow)}
  XCTAssertTrue(e.exists);XCTAssertTrue(e.isHittable);e.tap()
 }
 func testInstalledReleaseBundlerSmoke(){
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
  tap("Play Full Phrase");XCTAssertTrue(item("Stop playback").waitForExistence(timeout:12));tap("Stop playback")
  XCTAssertTrue(app.staticTexts["No token playing."].waitForExistence(timeout:8))
  tap("Copy conversion");XCTAssertTrue(app.staticTexts["Copied conversion."].waitForExistence(timeout:8))
  XCTAssertEqual(item("converter-input").value as? String,"a3 b!")
  XCTAssertEqual(item("converter-plain-text").label,"Alfa Three / Bravo [not spoken: \"!\" U+0021]")
  shot("release-converter-copy")
  tap("Open menu");tap("Back to App")
  XCTAssertEqual(item("converter-input").value as? String,"a3 b!")
  app.open(URL(string:"natophonetics://alphabet")!)
  XCTAssertTrue(app.staticTexts["Letter and digit reference"].waitForExistence(timeout:20));shot("release-alphabet")
  tap("Digits 0–9");XCTAssertTrue(item("digit-3").waitForExistence(timeout:8));shot("release-digits")
 }
}
