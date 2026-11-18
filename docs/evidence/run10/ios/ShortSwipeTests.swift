import XCTest
final class CaptureUITests:XCTestCase {
 let app=XCUIApplication(bundleIdentifier:"com.natophonetics.app")
 func item(_ id:String)->XCUIElement {app.descendants(matching:.any).matching(identifier:id).firstMatch}
 func shot(_ name:String){let a=XCTAttachment(screenshot:XCUIScreen.main.screenshot());a.name=name;a.lifetime = .keepAlways;add(a)}
 func testShortKeyboardSwipes(){
  continueAfterFailure=false;app.terminate();app.launch();app.open(URL(string:"natophonetics://converter")!)
  if !item("converter-input").waitForExistence(timeout:8) { item("Word Converter").tap() };XCTAssertTrue(item("converter-input").waitForExistence(timeout:20));item("converter-input").coordinate(withNormalizedOffset:CGVector(dx:0.3,dy:0.5)).tap();XCTAssertTrue(app.keyboards.firstMatch.waitForExistence(timeout:5));item("converter-input").typeText("a3 b!")
  shot("keyboard-before-short-swipes")
  for i in 0..<24 {
   let v=item("screen-scroll").frame
   let bottom=app.keyboards.firstMatch.exists ? min(v.maxY,app.keyboards.firstMatch.frame.minY-12):v.maxY
   let origin=app.coordinate(withNormalizedOffset:CGVector(dx:0,dy:0))
   let start=origin.withOffset(CGVector(dx:v.midX,dy:bottom-20))
   let end=origin.withOffset(CGVector(dx:v.midX,dy:v.minY+20))
   print("RUN10 SHORT SWIPE \(i) scroll=\(v) visibleBottom=\(bottom)");fflush(stdout)
   start.press(forDuration:0.01,thenDragTo:end,withVelocity:.slow,thenHoldForDuration:0)
   XCTAssertEqual(app.state,.runningForeground)
   if item("Copy conversion").isHittable {break}
  }
  shot("keyboard-after-short-swipes")
  print("RUN10 copyHittable=\(item("Copy conversion").isHittable) input=\(String(describing:item("converter-input").value))")
  XCTAssertTrue(item("Copy conversion").isHittable)
  item("Copy conversion").tap();XCTAssertTrue(app.staticTexts["Copied conversion."].waitForExistence(timeout:8))
  XCTAssertEqual(item("converter-input").value as? String,"a3 b!");shot("keyboard-copy-after-short-swipes")
 }
}
