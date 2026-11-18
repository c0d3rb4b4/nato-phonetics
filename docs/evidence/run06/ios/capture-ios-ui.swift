import XCTest

final class CaptureUITests: XCTestCase {
  let app=XCUIApplication(bundleIdentifier:"com.natophonetics.app")
  func item(_ id:String)->XCUIElement {app.descendants(matching:.any).matching(identifier:id).firstMatch}
  func route(_ p:String){app.open(URL(string:"natophonetics://\(p)")!); XCTAssertTrue(app.wait(for:.runningForeground,timeout:10))}
  func capture(_ name:String){
    var frames:[String:[String:Double]]=[:]
    for id in "ABCDEFGHIJKLMNOPQRSTUVWXYZ".map({"alphabet-\($0)"})+(0..<7).map({"converter-\($0)"})+["quiz-card","screen-scroll"] {
      let e=item(id);if e.exists && e.isHittable {let f=e.frame; frames[id]=["x":f.minX,"y":f.minY,"width":f.width,"height":f.height]}
    }
    let data=try! JSONSerialization.data(withJSONObject:frames,options:[.sortedKeys]);print("CAPTUREFRAMES \(name) \(String(data:data,encoding:.utf8)!)")
    let a=XCTAttachment(screenshot:XCUIScreen.main.screenshot());a.name=name;a.lifetime = .keepAlways;add(a)
  }
  func drag(_ delta:CGFloat){
    let s=item("screen-scroll"), f=s.frame
    let start=s.coordinate(withNormalizedOffset:CGVector(dx:0.5,dy:delta>0 ? 0.85:0.15))
    start.press(forDuration:0.1,thenDragTo:start.withOffset(CGVector(dx:0,dy: -max(-f.height*0.7,min(f.height*0.7,delta)))),withVelocity:.slow,thenHoldForDuration:0.3)
  }
  func align(_ id:String){
    for _ in 0..<8 {let e=item(id),s=item("screen-scroll");let f=e.frame,v=s.frame
      if f.minY>=v.minY+8 && f.maxY<=v.maxY-8 {return}
      let delta=f.minY-v.minY-12
      if abs(delta)<2{return};drag(delta)
    }
  }
  func restoreFullscreen(){
    let screen=XCUIApplication(bundleIdentifier:"com.apple.springboard").frame
    let window=app.windows.firstMatch,f=window.frame
    print("SCREENBOUNDS \(screen) WINDOWBEFORE \(f)")
    XCTAssertGreaterThan(screen.width,700)
    if f.width < screen.width-2 {
      let origin=window.coordinate(withNormalizedOffset:.zero)
      origin.withOffset(CGVector(dx:f.width-12,dy:f.height-12)).press(forDuration:0.15,thenDragTo:origin.withOffset(CGVector(dx:screen.maxX-12-f.minX,dy:screen.maxY-12-f.minY)),withVelocity:.slow,thenHoldForDuration:0.3)
      sleep(2)
    }
    XCTAssertEqual(app.windows.firstMatch.frame.width,screen.width,accuracy:2)
  }
  func testMaximumAlphabetAndContexts(){
    continueAfterFailure=false;XCUIDevice.shared.orientation = .portrait;app.launch()
    restoreFullscreen();route("settings");item("Dark").tap();route("alphabet");XCTAssertTrue(item("alphabet-A").waitForExistence(timeout:15))
    let scale=item("alphabet-A").frame.width/110;XCTAssertGreaterThan(scale,3.5)
    var seen=Set<String>()
    for letter in "ABCDEFGHIJKLMNOPQRSTUVWXYZ" {
      if seen.contains(String(letter)){continue}
      align("alphabet-\(letter)")
      let v=item("screen-scroll").frame
      for c in "ABCDEFGHIJKLMNOPQRSTUVWXYZ" {let e=item("alphabet-\(c)")
        if e.exists && e.isHittable && v.contains(e.frame) {
          XCTAssertEqual(e.frame.width,110*scale,accuracy:0.5);XCTAssertEqual(e.frame.height,150*scale,accuracy:0.5);seen.insert(String(c))
        }
      }
      capture("alphabet-maximum-\(letter)-dark")
    }
    XCTAssertEqual(seen.count,26,"All26 fully visible at maximum category: \(seen.sorted())")
    route("converter");let input=item("converter-input");XCTAssertTrue(input.waitForExistence(timeout:10));input.tap()
    for c in "NUWJ359" {input.typeText(String(c))};input.typeText("\n");XCTAssertEqual(input.value as? String,"NUWJ359")
    for index in 0..<7 {align("converter-\(index)");capture("converter-maximum-\(index)-dark")}
    route("letter-quiz");XCTAssertTrue(item("quiz-card").waitForExistence(timeout:10));align("quiz-card");capture("quiz-maximum-question-dark")
    XCTAssertFalse(item("quiz-card-word").exists)
    for _ in 0..<8 {if item("quiz-choice-0").isHittable{break};drag(400)}
    item("quiz-choice-0").tap();XCTAssertTrue(item("Next question").waitForExistence(timeout:10));align("quiz-card")
    XCTAssertTrue(item("quiz-card-word").exists);capture("quiz-maximum-feedback-dark")
    route("settings");item("System").tap()
  }
  func testDarkContexts(){
    continueAfterFailure=false;XCUIDevice.shared.orientation = .portrait;app.launch();route("settings");item("Dark").tap()
    route("converter");let input=item("converter-input");XCTAssertTrue(input.waitForExistence(timeout:10));input.tap()
    for c in "NUWJ359" {input.typeText(String(c))};input.typeText("\n");XCTAssertEqual(input.value as? String,"NUWJ359")
    capture("converter-default-dark")
    route("letter-quiz");XCTAssertTrue(item("quiz-card").waitForExistence(timeout:10));XCTAssertFalse(item("quiz-card-word").exists);capture("quiz-default-question-dark")
    item("quiz-choice-0").tap();XCTAssertTrue(item("Next question").waitForExistence(timeout:10));capture("quiz-default-feedback-dark")
    route("settings");item("System").tap()
  }
}
