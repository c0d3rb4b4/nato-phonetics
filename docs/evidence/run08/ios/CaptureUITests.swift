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
  func testRoundResultsAndRetry() {
    continueAfterFailure=false;app.launch()
    XCTAssertTrue(item("app-theme").waitForExistence(timeout:30))
    route("settings");tap("Dark");route("letter-quiz")
    XCTAssertTrue(item("quiz-start").waitForExistence(timeout:10));shot("setup-dark")
    tap("5 questions");tap("quiz-start")
    let words=["A":"Alfa","B":"Bravo","C":"Charlie","D":"Delta","E":"Echo","F":"Foxtrot","G":"Golf","H":"Hotel","I":"India","J":"Juliett","K":"Kilo","L":"Lima","M":"Mike","N":"November","O":"Oscar","P":"Papa","Q":"Quebec","R":"Romeo","S":"Sierra","T":"Tango","U":"Uniform","V":"Victor","W":"Whiskey","X":"X-ray","Y":"Yankee","Z":"Zulu"]
    var seen=Set<String>()
    for index in 0..<5 {
      align("quiz-letter");XCTAssertTrue(item("quiz-letter").waitForExistence(timeout:10))
      let letter=item("quiz-letter").label.replacingOccurrences(of:"Letter ",with:"")
      seen.insert(letter);XCTAssertFalse(item("quiz-answer").exists)
      XCTAssertTrue(item("quiz-progress").label.contains("Question \(index+1) of 5"))
      if index==0 {shot("question-dark")}
      var chosen=false
      for option in 0..<4 {
        let id="quiz-choice-\(option)";align(id)
        if item(id).label != "Choose \(words[letter]!)" {item(id).tap();chosen=true;break}
      }
      XCTAssertTrue(chosen)
      let next=index==4 ? "View results":"Next question"
      XCTAssertTrue(item(next).waitForExistence(timeout:10));align(next)
      if index==0 {
        tap("Replay answer");item("Open menu").tap();XCTAssertTrue(item("Back to App").waitForExistence(timeout:10));item("Back to App").tap()
        XCTAssertTrue(item(next).exists);shot("feedback-dark")
      }
      tap(next)
    }
    XCTAssertEqual(seen.count,5);align("quiz-score")
    XCTAssertEqual(item("quiz-score").label,"0 correct of 5 answered · 0% accuracy");shot("results-dark")
    tap("quiz-retry");align("quiz-progress");XCTAssertEqual(item("quiz-progress").label,"Question 1 of 5 · 0 correct");shot("retry-dark")
    tap("End round and review");align("quiz-score");XCTAssertEqual(item("quiz-score").label,"0 correct of 0 answered · 0% accuracy");shot("early-end-dark")
    item("Open menu").tap();item("Back to App").tap();XCTAssertTrue(item("quiz-results").exists)
  }
  func testLargeTextSetupAndEarlyReview() {
    continueAfterFailure=false;app.launch();route("letter-quiz")
    XCTAssertTrue(item("quiz-start").waitForExistence(timeout:15));align("5 questions");shot("large-setup-dark")
    tap("5 questions");tap("quiz-start");align("quiz-letter");shot("large-question-dark")
    tap("End round and review");align("quiz-score");shot("large-results-dark")
    XCTAssertEqual(item("quiz-score").label,"0 correct of 0 answered · 0% accuracy")
  }
}
