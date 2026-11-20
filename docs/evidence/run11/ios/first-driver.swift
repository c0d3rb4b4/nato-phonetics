import XCTest
final class PracticeUITests:XCTestCase {
 let app=XCUIApplication(bundleIdentifier:"com.natophonetics.app")
 func item(_ id:String)->XCUIElement {app.descendants(matching:.any).matching(identifier:id).firstMatch}
 func shot(_ name:String){let a=XCTAttachment(screenshot:XCUIScreen.main.screenshot());a.name=name;a.lifetime = .keepAlways;add(a)}
 func start(_ path:String){
  continueAfterFailure=false
  let spring=XCUIApplication(bundleIdentifier:"com.apple.springboard")
  if spring.buttons["Open"].exists {spring.buttons["Open"].tap()}
  app.terminate();app.launch();app.open(URL(string:"natophonetics://"+path)!)
  XCTAssertTrue(item(path == "alphabet" ? "Letters A–Z" : path == "converter" ? "converter-input" : "practice-digits").waitForExistence(timeout:60))
 }
 func align(_ id:String){for _ in 0..<24 {let e=item(id),v=item("screen-scroll").frame;let bottom=app.keyboards.firstMatch.exists ? min(v.maxY,app.keyboards.firstMatch.frame.minY-12):v.maxY;if e.exists && e.isHittable && e.frame.minY>=v.minY+3 && e.frame.maxY<=bottom-3{return};let down = !e.exists || e.frame.minY>v.minY+6;let o=app.coordinate(withNormalizedOffset:CGVector(dx:0,dy:0));let s=o.withOffset(CGVector(dx:v.maxX-16,dy:down ? bottom-25:v.minY+25));let t=o.withOffset(CGVector(dx:v.maxX-16,dy:down ? v.minY+25:bottom-25));s.press(forDuration:0.01,thenDragTo:t,withVelocity:.slow,thenHoldForDuration:0)};XCTFail("Unreachable \(id)")}
 func tap(_ id:String){align(id);item(id).tap()}
 func testDigitsAndMixed(){start("alphabet");tap("Digits 0–9");XCTAssertTrue(item("digit-3").exists);shot("digit-reference");tap("Play 3, Three");tap("Stop playback");tap("Letters A–Z");XCTAssertFalse(item("digit-3").exists)
  app.open(URL(string:"natophonetics://letter-quiz")!);XCTAssertTrue(item("practice-digits").waitForExistence(timeout:20));tap("practice-digits");shot("numeric-setup");tap("5 questions");tap("quiz-start")
  for index in 0..<5 {
   XCTAssertTrue(item("quiz-letter").exists);let symbol=item("quiz-letter").label;XCTAssertTrue(Int(symbol) != nil);XCTAssertFalse(item("quiz-answer").exists)
   if index == 0 {shot("numeric-question")}
   tap("quiz-choice-0");XCTAssertTrue(item("quiz-answer").exists)
   if index == 0 {tap("Replay answer");tap("Open menu");tap("Back to App");XCTAssertTrue(item("quiz-answer").exists);align("quiz-next");shot("numeric-feedback")}
   tap("quiz-next")
  }
  XCTAssertTrue(item("quiz-results").exists);XCTAssertTrue(item("quiz-score").label.contains("of 5 answered"));shot("numeric-results")
  tap("Choose a new round");tap("practice-mixed");tap("5 questions");tap("quiz-start");shot("mixed-question");tap("End round and review");tap("Choose a new round");tap("practice-postcode");align("practice-example-text");shot("postcode-example");tap("Hear example");tap("Stop playback");tap("practice-callsign");align("practice-example-text");shot("callsign-example");tap("Hear example");tap("quiz-start");tap("End round and review");XCTAssertTrue(item("quiz-score").label.contains("0 correct of 0 answered"));shot("callsign-partial-results")
 }
 func testStopReplayKeyboard(){start("converter");tap("converter-input");item("converter-input").typeText("abcdefghijklmnopqrstuvwxyz")
  XCTAssertTrue(app.keyboards.firstMatch.exists);tap("Play Full Phrase");XCTAssertTrue(item("Stop playback").waitForExistence(timeout:10));tap("Stop playback");XCTAssertEqual(item("converter-current-token").label,"No token playing.")
  for index in 0..<2 {tap("Replay phrase");XCTAssertTrue(item("Stop playback").waitForExistence(timeout:10));print("RUN11 REPLAY cycle=\(index) keyboard=\(app.keyboards.firstMatch.exists) token=\(item("converter-current-token").label)");shot("replay-cycle-\(index)");tap("Stop playback");XCTAssertEqual(item("converter-current-token").label,"No token playing.")}
  XCTAssertEqual(item("converter-input").value as? String,"abcdefghijklmnopqrstuvwxyz")
 }
}
