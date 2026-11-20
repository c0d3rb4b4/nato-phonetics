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
  XCTAssertTrue(item(path == "alphabet" ? "Letters A–Z" : path == "converter" ? "converter-input" : "mode-choice").waitForExistence(timeout:60))
 }
 func align(_ id:String){for _ in 0..<30 {
  let e=item(id),v=item("screen-scroll").frame
  let bottom=app.keyboards.firstMatch.exists ? min(v.maxY,app.keyboards.firstMatch.frame.minY-12):v.maxY
  let f=e.frame
  print("RUN12 ALIGN \(id) frame=\(f) view=\(v) bottom=\(bottom)")
  if e.exists && e.isHittable && f.minY>=v.minY+3 && f.maxY<=bottom-3{return}
  let down = !e.exists || f.midY>(v.minY+bottom)/2
  let distance=min(220.0,max(70.0,down ? f.maxY-bottom+25 : v.minY-f.minY+25))
  let o=app.coordinate(withNormalizedOffset:CGVector(dx:0,dy:0))
  let sy=down ? bottom-25:v.minY+25
  o.withOffset(CGVector(dx:v.maxX-16,dy:sy)).press(forDuration:0.01,thenDragTo:o.withOffset(CGVector(dx:v.maxX-16,dy:sy+(down ? -distance:distance))),withVelocity:.slow,thenHoldForDuration:0)
 };XCTFail("Unreachable \(id)")}

 func tap(_ id:String){align(id);item(id).tap()}
 let words=["A":"Alfa","B":"Bravo","C":"Charlie","D":"Delta","E":"Echo","F":"Foxtrot","G":"Golf","H":"Hotel","I":"India","J":"Juliett","K":"Kilo","L":"Lima","M":"Mike","N":"November","O":"Oscar","P":"Papa","Q":"Quebec","R":"Romeo","S":"Sierra","T":"Tango","U":"Uniform","V":"Victor","W":"Whiskey","X":"X-ray","Y":"Yankee","Z":"Zulu","0":"Zero","1":"One","2":"Two","3":"Three","4":"Four","5":"Five","6":"Six","7":"Seven","8":"Eight","9":"Nine"]
 func enter(_ value:String){for char in value {item("quiz-typed-answer").typeText(String(char))};XCTAssertEqual(item("quiz-typed-answer").value as? String,value)}
 func testListeningAndTyped(){
  start("letter-quiz");tap("mode-listening");shot("listening-setup");tap("practice-digits");tap("5 questions");tap("quiz-start")
  var heard=[String]()
  for index in 0..<5 {
   XCTAssertFalse(item("quiz-card").exists);XCTAssertFalse(item("quiz-letter").exists);XCTAssertFalse(item("quiz-code-word").exists)
   tap("quiz-listen")
   if index==0 {shot("listening-question");if item("Stop playback").exists {tap("Stop playback")};tap("quiz-listen");item("Open menu").tap();tap("Back to App");XCTAssertFalse(item("quiz-card").exists)}
   tap("Show code word as text");let word=item("quiz-code-word").label;let symbol=words.first(where:{$0.value==word})!.key;heard.append(symbol)
   print("RUN12 LISTEN symbol=\(symbol) word=\(word)")
   if index==0 {align("quiz-code-word");shot("listening-text-alternative")}
   tap("Choose \(symbol)");XCTAssertTrue(item("quiz-answer").exists)
   if index==0 {align("quiz-next");shot("listening-feedback")};tap("quiz-next")
  }
  XCTAssertEqual(Set(heard).count,5);XCTAssertTrue(item("quiz-score").label.hasPrefix("5 correct of 5 answered"));align("quiz-score");shot("listening-results")
  tap("Choose a new round");tap("mode-typed");tap("practice-letters");tap("5 questions");tap("quiz-start")
  for index in 0..<5 {
   let symbol=item("quiz-letter").label.replacingOccurrences(of:"Symbol ",with:"");XCTAssertFalse(item("quiz-answer").exists)
   if index==0 {tap("quiz-check");XCTAssertTrue(item("Enter a code word before checking.").exists)}
   tap("quiz-typed-answer");let value=index==0 ? "wrong":words[symbol]!.lowercased();enter(value)
   if index==0 {shot("typed-keyboard");item("Open menu").tap();tap("Back to App");XCTAssertEqual(item("quiz-typed-answer").value as? String,"wrong")}
   tap("quiz-check");XCTAssertTrue(item("quiz-answer").exists);XCTAssertTrue(item("quiz-submitted-answer").label.contains(value));print("RUN12 TYPED symbol=\(symbol) response=\(value)")
   if index==0 {align("quiz-next");shot("typed-feedback")};tap("quiz-next")
  }
  XCTAssertTrue(item("quiz-score").label.hasPrefix("4 correct of 5 answered"));align("quiz-score");shot("typed-results");tap("quiz-retry");let symbol=item("quiz-letter").label.replacingOccurrences(of:"Symbol ",with:"");tap("quiz-typed-answer");enter(words[symbol]!);tap("quiz-check");tap("quiz-next");XCTAssertTrue(item("quiz-score").label.hasPrefix("1 correct of 1 answered"));shot("typed-retry-results")
 }
 func testMaximumRecall(){
  start("letter-quiz");tap("mode-listening");tap("practice-digits");tap("5 questions");tap("quiz-start");tap("quiz-listen");tap("Show code word as text");align("quiz-code-word");shot("listening-maximum");let word=item("quiz-code-word").label;let symbol=words.first(where:{$0.value==word})!.key;tap("Choose \(symbol)");tap("End round and review");tap("Choose a new round");tap("mode-typed");tap("quiz-start");tap("quiz-typed-answer");enter("three");shot("typed-maximum-keyboard");tap("quiz-check");align("quiz-next");shot("typed-maximum-feedback");tap("End round and review");align("quiz-score");shot("typed-maximum-partial-results")
 }
}
