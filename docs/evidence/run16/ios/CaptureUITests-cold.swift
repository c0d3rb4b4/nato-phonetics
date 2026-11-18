import XCTest
final class PracticeUITests:XCTestCase {
 func testNativePolicy() {
  continueAfterFailure=false
  let app=XCUIApplication(bundleIdentifier:"com.natophonetics.app")
  app.terminate();app.launch()
  XCTAssertTrue(app.descendants(matching:.any).matching(identifier:"app-header").firstMatch.waitForExistence(timeout:60))
  app.open(URL(string:"natophonetics://privacy")!)
  let label="Offline availability\nReference and conversion logic run locally once loaded. Audio in airplane mode has not been verified across supported devices."
  let p=app.staticTexts.matching(NSPredicate(format:"label == %@",label)).firstMatch
  let scroll=app.descendants(matching:.any).matching(identifier:"screen-scroll").firstMatch
  for _ in 0..<24 {
   if p.exists && p.isHittable && p.frame.minY>scroll.frame.minY+8 && p.frame.maxY<scroll.frame.maxY-8 {break}
   scroll.swipeUp(velocity:.slow)
  }
  XCTAssertTrue(p.exists);XCTAssertTrue(p.isHittable)
  XCTAssertTrue(p.frame.minY>=scroll.frame.minY);XCTAssertTrue(p.frame.maxY<=scroll.frame.maxY)
  XCTAssertFalse(app.staticTexts.matching(NSPredicate(format:"label CONTAINS %@","Web installation and offline caching have not yet been implemented")).firstMatch.exists)
  let attachment=XCTAttachment(screenshot:XCUIScreen.main.screenshot());attachment.name="native-offline-policy";attachment.lifetime = .keepAlways;add(attachment)
 }
}
