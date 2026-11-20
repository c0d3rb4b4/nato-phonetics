import XCTest
final class PracticeUITests:XCTestCase {
 let app=XCUIApplication(bundleIdentifier:"com.natophonetics.app")
 func item(_ id:String)->XCUIElement {app.descendants(matching:.any).matching(identifier:id).firstMatch}
 func shot(_ name:String){let a=XCTAttachment(screenshot:XCUIScreen.main.screenshot());a.name=name;a.lifetime = .keepAlways;add(a)}
 func start(_ path:String){
  continueAfterFailure=false
  let spring=XCUIApplication(bundleIdentifier:"com.apple.springboard")
  if spring.buttons["Open"].exists {spring.buttons["Open"].tap()}
  app.terminate();app.launch();XCTAssertTrue(item("app-header").waitForExistence(timeout:60));app.open(URL(string:"natophonetics://"+path)!)
  XCTAssertTrue(item(path == "progress" ? "progress-summary" : path == "settings" ? "Appearance" : "mode-choice").waitForExistence(timeout:60))
 }
 func align(_ id:String){for _ in 0..<30 {
  let e=item(id),v=item("screen-scroll").frame
  let bottom=app.keyboards.firstMatch.exists ? min(v.maxY,app.keyboards.firstMatch.frame.minY-12):v.maxY
  let f=e.frame
  print("RUN13 ALIGN \(id) frame=\(f) view=\(v) bottom=\(bottom)")
  if e.exists && e.isHittable && f.minY>=v.minY+3 && f.maxY<=bottom-3{return}
  let down = !e.exists || f.midY>(v.minY+bottom)/2
  let distance=min(220.0,max(70.0,down ? f.maxY-bottom+25 : v.minY-f.minY+25))
  let o=app.coordinate(withNormalizedOffset:CGVector(dx:0,dy:0))
  let sy=down ? bottom-120:v.minY+25
  o.withOffset(CGVector(dx:v.maxX-16,dy:sy)).press(forDuration:0.01,thenDragTo:o.withOffset(CGVector(dx:v.maxX-16,dy:sy+(down ? -distance:distance))),withVelocity:.slow,thenHoldForDuration:0)
 };XCTFail("Unreachable \(id)")}

 func tap(_ id:String){align(id);item(id).tap()}
 let words=["A":"Alfa","B":"Bravo","C":"Charlie","D":"Delta","E":"Echo","F":"Foxtrot","G":"Golf","H":"Hotel","I":"India","J":"Juliett","K":"Kilo","L":"Lima","M":"Mike","N":"November","O":"Oscar","P":"Papa","Q":"Quebec","R":"Romeo","S":"Sierra","T":"Tango","U":"Uniform","V":"Victor","W":"Whiskey","X":"X-ray","Y":"Yankee","Z":"Zulu","0":"Zero","1":"One","2":"Two","3":"Three","4":"Four","5":"Five","6":"Six","7":"Seven","8":"Eight","9":"Nine"]
 func enter(_ value:String){for char in value {item("quiz-typed-answer").typeText(String(char))};XCTAssertEqual(item("quiz-typed-answer").value as? String,value)}
 func testProgress(){
  start("progress");XCTAssertTrue(item("progress-summary").label.hasPrefix("0 answers saved"));shot("empty-progress")
  start("letter-quiz");tap("practice-digits");tap("review-due");XCTAssertFalse(item("quiz-start").isEnabled);align("review-availability");shot("empty-due-review");tap("review-all");tap("5 questions");tap("quiz-start")
  var missed=""
  for index in 0..<5 {
   let symbol=item("quiz-letter").label.replacingOccurrences(of:"Symbol ",with:"")
   if index==0 {missed=symbol;let first=item("quiz-choice-0");tap(first.label == "Choose \(words[symbol]!)" ? "quiz-choice-1":"quiz-choice-0")}
   else {tap("Choose \(words[symbol]!)")}
   XCTAssertTrue(item("quiz-answer").exists);tap("quiz-next")
  }
  XCTAssertTrue(item("quiz-score").label.hasPrefix("4 correct of 5 answered"))
  start("progress");XCTAssertTrue(item("progress-summary").label.hasPrefix("5 answers saved · 4 correct · 1 errors"));XCTAssertTrue(item("progress-due").label.contains("1 due now · 1 need another try"));align("progress-summary");shot("saved-summary-relaunched");align("progress-symbol-"+missed);shot("saved-symbols")
  tap("Preferences");tap("Reset Preferences");tap("Learning progress and deletion");XCTAssertTrue(item("progress-summary").label.hasPrefix("5 answers saved"));print("RUN13 RESET retains 5 answers")
  start("letter-quiz");tap("practice-digits");tap("review-mistakes");align("review-availability");XCTAssertTrue(item("review-availability").label.hasPrefix("1 saved symbols available"));tap("review-due");align("review-availability");shot("due-review-setup");tap("quiz-start")
  XCTAssertTrue(item("quiz-progress").label.hasPrefix("Question 1 of 1"));XCTAssertEqual(item("quiz-letter").label,"Symbol "+missed);shot("due-review-question");tap("Choose \(words[missed]!)");tap("quiz-next");XCTAssertTrue(item("quiz-score").label.hasPrefix("1 correct of 1 answered"))
  start("progress");XCTAssertTrue(item("progress-summary").label.hasPrefix("6 answers saved · 5 correct · 1 errors"));XCTAssertTrue(item("progress-due").label.contains("0 due now · 0 need another try"));align("progress-summary");shot("recovered-summary");tap("progress-clear");align("progress-delete");shot("clear-confirmation");tap("Keep progress");XCTAssertTrue(item("progress-summary").label.hasPrefix("6 answers saved"));print("RUN13 CANCEL keeps 6 answers; missed=\(missed)")
 }
 func testDueReview(){
  let missed="W"
  start("progress");XCTAssertTrue(item("progress-summary").label.hasPrefix("5 answers saved"))
  start("letter-quiz");tap("practice-letters");tap("review-mistakes");align("review-availability");XCTAssertTrue(item("review-availability").label.hasPrefix("1 saved symbols available"));tap("review-due");align("review-availability");shot("due-review-setup");tap("quiz-start")
  XCTAssertTrue(item("quiz-progress").label.hasPrefix("Question 1 of 1"));XCTAssertEqual(item("quiz-letter").label,"Symbol "+missed);shot("due-review-question");tap("Choose \(words[missed]!)");tap("quiz-next");XCTAssertTrue(item("quiz-score").label.hasPrefix("1 correct of 1 answered"))
  start("progress");XCTAssertTrue(item("progress-summary").label.hasPrefix("6 answers saved · 5 correct · 1 errors"));XCTAssertTrue(item("progress-due").label.contains("0 due now · 0 need another try"));align("progress-summary");shot("recovered-summary");tap("progress-clear");align("progress-delete");shot("clear-confirmation");tap("Keep progress");XCTAssertTrue(item("progress-summary").label.hasPrefix("6 answers saved"));print("RUN13 CANCEL keeps 6 answers; missed=\(missed)")
 }
 func testSetSelection(){
  start("letter-quiz");tap("practice-digits");align("review-availability");XCTAssertTrue(item("review-availability").label.hasPrefix("10 symbols in full practice"));shot("digit-set-count");tap("practice-letters");align("review-availability");XCTAssertTrue(item("review-availability").label.hasPrefix("26 symbols in full practice"));shot("letter-set-count")
 }
 func testMaximumProgress(){
  start("progress");XCTAssertTrue(item("progress-summary").label.hasPrefix("6 answers saved"));align("progress-summary");shot("maximum-summary");let row=app.descendants(matching:.any).matching(NSPredicate(format:"identifier BEGINSWITH %@","progress-symbol-")).firstMatch;align(row.identifier);shot("maximum-symbols");tap("progress-clear");align("progress-delete");shot("maximum-clear-confirmation");tap("progress-delete");XCTAssertTrue(item("progress-summary").label.hasPrefix("0 answers saved"));align("progress-summary");shot("maximum-cleared-summary")
  start("progress");XCTAssertTrue(item("progress-summary").label.hasPrefix("0 answers saved"));print("RUN13 DELETE persists across relaunch")
 }
}
