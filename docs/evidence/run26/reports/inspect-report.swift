// Render every PDF page for visual inspection and record extracted text.
// Usage: swift inspect-report.swift INPUT.pdf OUTPUT_DIRECTORY
import Foundation
import PDFKit
import AppKit

let source = URL(fileURLWithPath: CommandLine.arguments[1])
let output = URL(fileURLWithPath: CommandLine.arguments[2], isDirectory: true)
try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)
guard let document = PDFDocument(url: source), document.pageCount > 0 else {
    fatalError("PDF is unreadable or empty")
}
var rows: [[String: Any]] = []
for index in 0..<document.pageCount {
    guard let page = document.page(at: index) else { fatalError("Missing page") }
    let text = page.string ?? ""
    let image = page.thumbnail(of: NSSize(width: 1000, height: 1415), for: .mediaBox)
    guard let tiff = image.tiffRepresentation,
          let bitmap = NSBitmapImageRep(data: tiff),
          let png = bitmap.representation(using: .png, properties: [:]) else {
        fatalError("Cannot render page")
    }
    let name = String(format: "page-%02d.png", index + 1)
    try png.write(to: output.appendingPathComponent(name))
    rows.append(["page": index + 1, "image": name,
                 "textCharacters": text.count,
                 "text": text,
                 "widthPoints": page.bounds(for: .mediaBox).width,
                 "heightPoints": page.bounds(for: .mediaBox).height])
}
let data = try JSONSerialization.data(withJSONObject: ["pages": rows, "pageCount": document.pageCount], options: [.prettyPrinted, .sortedKeys])
try data.write(to: output.appendingPathComponent("inspection.json"))
print("Rendered \(document.pageCount) pages")
