import UIKit
import React

/// Measures only the custom bar, so window controls do not narrow screen content.
/// UIKit owns the window-control dimensions; no device or orientation constants.
final class NatoHeaderInsetsView: UIView {
  @objc var onInsetsChange: RCTDirectEventBlock? {
    didSet { lastInsets = nil; setNeedsLayout() }
  }
  private var lastInsets: UIEdgeInsets?

  override init(frame: CGRect) {
    super.init(frame: frame)
    isUserInteractionEnabled = false
    isAccessibilityElement = false
  }

  required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    setNeedsLayout()
  }

  override func safeAreaInsetsDidChange() {
    super.safeAreaInsetsDidChange()
    setNeedsLayout()
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    guard window != nil, bounds.width > 0 else { return }
    // RootLayout already applies the normal top/left/right safe area. This
    // child therefore reports only the additional local corner obstruction.
    let insets: UIEdgeInsets
    if #available(iOS 26.0, *) {
      insets = edgeInsets(for: .safeArea(cornerAdaptation: .horizontal))
    } else {
      insets = safeAreaInsets
    }
    guard lastInsets != insets, let onInsetsChange else { return }
    lastInsets = insets
    onInsetsChange(["left": insets.left, "right": insets.right])
  }
}

@objc(NatoHeaderInsetsManager)
final class NatoHeaderInsetsManager: RCTViewManager {
  override static func requiresMainQueueSetup() -> Bool { true }
  override func view() -> UIView! { NatoHeaderInsetsView() }
}
