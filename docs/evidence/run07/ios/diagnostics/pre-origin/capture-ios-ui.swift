import XCTest

// A separate UI driver; the application is the uninstrumented Debug candidate.
// The host reads retained native text-layout state during the explicit pause.
final class CaptureUITests: XCTestCase {
  let app=XCUIApplication(bundleIdentifier:"com.natophonetics.app")
  func item(_ id:String)->XCUIElement {app.descendants(matching:.any).matching(identifier:id).firstMatch}
  func route(_ p:String){app.open(URL(string:"natophonetics://\(p)")!);XCTAssertTrue(app.wait(for:.runningForeground,timeout:10))}
  func capture(_ name:String){
    print("BASELINE_READY \(name)");fflush(stdout);sleep(5)
    var frames:[String:[String:Double]]=[:]
    for id in "ABCDEFGHIJKLMNOPQRSTUVWXYZ".map({"alphabet-\($0)"})+(0..<7).map({"converter-\($0)"})+["quiz-card","screen-scroll"] {
      let e=item(id);if e.exists && e.isHittable {let f=e.frame;frames[id]=["x":f.minX,"y":f.minY,"width":f.width,"height":f.height]}
    }
    let data=try! JSONSerialization.data(withJSONObject:frames,options:[.sortedKeys]);print("CAPTUREFRAMES \(name) \(String(data:data,encoding:.utf8)!)");fflush(stdout)
    let a=XCTAttachment(screenshot:XCUIScreen.main.screenshot());a.name=name;a.lifetime = .keepAlways;add(a)
  }
  func drag(_ delta:CGFloat){
    let s=item("screen-scroll"),f=s.frame
    let start=s.coordinate(withNormalizedOffset:CGVector(dx:0.5,dy:delta>0 ? 0.85:0.15))
    start.press(forDuration:0.1,thenDragTo:start.withOffset(CGVector(dx:0,dy: -max(-f.height*0.7,min(f.height*0.7,delta)))),withVelocity:.slow,thenHoldForDuration:0.3)
  }
  func align(_ id:String){
    for _ in 0..<12 {let f=item(id).frame,v=item("screen-scroll").frame
      if f.minY>=v.minY+8 && f.maxY<=v.maxY-8{return}
      let delta=f.minY-v.minY-12;if abs(delta)<2{return};drag(delta)
    }
  }
  func contexts(_ label:String){
    continueAfterFailure=false;XCUIDevice.shared.orientation = .portrait;app.launch()
    XCTAssertTrue(item("app-theme").waitForExistence(timeout:30))
    route("settings");item("Dark").tap();route("alphabet");XCTAssertTrue(item("alphabet-A").waitForExistence(timeout:15))
    capture("\(label)-alphabet-first-dark");align("alphabet-J");capture("\(label)-alphabet-J-dark")
    route("converter");let input=item("converter-input");XCTAssertTrue(input.waitForExistence(timeout:10));input.tap()
    for c in "NUWJ359"{input.typeText(String(c))};input.typeText("\n");XCTAssertEqual(input.value as? String,"NUWJ359")
    align("converter-3");capture("\(label)-converter-J-dark")
    route("letter-quiz");XCTAssertTrue(item("quiz-card").waitForExistence(timeout:10));align("quiz-card");capture("\(label)-quiz-question-dark")
    XCTAssertFalse(item("quiz-card-word").exists)
    for _ in 0..<8{if item("quiz-choice-0").isHittable{break};drag(400)}
    item("quiz-choice-0").tap();XCTAssertTrue(item("Next question").waitForExistence(timeout:10));align("quiz-card")
    XCTAssertTrue(item("quiz-card-word").exists);capture("\(label)-quiz-feedback-dark")
    route("settings");item("System").tap()
  }
  func testDefaultNativeBaselines(){contexts("default")}
  func testMaximumNativeBaselines(){contexts("maximum")}
}
