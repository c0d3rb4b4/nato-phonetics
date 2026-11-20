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

final class FeatureUITests:XCTestCase {
 let app=XCUIApplication(bundleIdentifier:"com.natophonetics.app")
 func item(_ id:String)->XCUIElement {app.descendants(matching:.any).matching(identifier:id).firstMatch}
 func shot(_ name:String){let a=XCTAttachment(screenshot:XCUIScreen.main.screenshot());a.name=name;a.lifetime = .keepAlways;add(a)}
 func start(){continueAfterFailure=false;app.terminate();app.launch();app.open(URL(string:"natophonetics://converter")!);if !item("converter-input").waitForExistence(timeout:10){item("Word Converter").tap()};XCTAssertTrue(item("converter-input").waitForExistence(timeout:30))}
 func align(_ id:String){for _ in 0..<30 {let e=item(id),v=item("screen-scroll").frame;let bottom=app.keyboards.firstMatch.exists ? min(v.maxY,app.keyboards.firstMatch.frame.minY-12):v.maxY;if e.exists && e.isHittable && e.frame.minY>=v.minY+3 && e.frame.maxY<=bottom-3{return};let down = !e.exists || e.frame.minY>v.minY+6;let o=app.coordinate(withNormalizedOffset:CGVector(dx:0,dy:0));let s=o.withOffset(CGVector(dx:v.maxX-18,dy:down ? bottom-20:v.minY+20));let t=o.withOffset(CGVector(dx:v.maxX-18,dy:down ? v.minY+20:bottom-20));s.press(forDuration:0.01,thenDragTo:t,withVelocity:.slow,thenHoldForDuration:0)};XCTFail("Unreachable \(id)")}
 func tap(_ id:String){align(id);item(id).tap()}
 func testPacing(){start();tap("converter-input");item("converter-input").typeText("abcdefghijklmnopqrstuvwxyz 0123456789")
  tap("Change playback pace");tap("Rate 0.75×");tap("Word pause 700 ms");shot("pace-selected-default");tap("Hide playback pace")
  tap("Play Full Phrase");XCTAssertTrue(item("Stop playback").waitForExistence(timeout:12));shot("native-phrase-progress");tap("Stop playback");XCTAssertEqual(item("converter-current-token").label,"No token playing.")
  tap("Replay phrase");XCTAssertTrue(item("Stop playback").waitForExistence(timeout:8));tap("Stop playback")
  tap("Next cards");XCTAssertTrue(item("converter-card-page").label.contains("Card page 2 of 2"));align("converter-36");shot("cards-page-2-default")
  item("Open menu").tap();item("Back to App").tap();XCTAssertEqual(item("converter-input").value as? String,"abcdefghijklmnopqrstuvwxyz 0123456789")
  app.terminate();app.launch();app.open(URL(string:"natophonetics://converter")!);XCTAssertTrue(item("converter-input").waitForExistence(timeout:20));XCTAssertTrue(app.staticTexts["Rate 0.75× · word pause 700 ms"].exists);shot("saved-pace-after-relaunch")
  app.open(URL(string:"natophonetics://privacy")!);align("Local data");shot("privacy-storage-pacing")
 }
 func testLongPaste(){start();tap("converter-input");item("converter-input").press(forDuration:1.2);let p=app.menuItems["Paste"];if p.waitForExistence(timeout:3){p.tap()}else{app.buttons["Paste"].tap()}
  let expected=String(String(repeating:"CV34 7AP / G-ABCD\n",count:118).prefix(2000));XCTAssertEqual(item("converter-input").value as? String,expected);item("converter-input").typeText("j");XCTAssertEqual(item("converter-input").value as? String,expected+"j");shot("long-paste-edited-keyboard")
  tap("Copy conversion");XCTAssertTrue(app.staticTexts["Copied conversion."].waitForExistence(timeout:8));XCTAssertTrue(item("converter-plain-text").label.hasSuffix("Juliett"));shot("long-paste-full-output-copy")
  tap("Next cards");XCTAssertTrue(item("converter-card-page").label.contains("Card page 2 of 84"));align("converter-24");shot("long-paste-cards-page-2")
  tap("Clear input");XCTAssertFalse(item("converter-0").exists)
 }
}
