import UIKit

@main
final class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?

    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        let controller = UIViewController()
        controller.view.backgroundColor = .systemBackground
        let title = UILabel()
        title.text = "Plain UIKit input control"
        title.font = .systemFont(ofSize: 24)
        title.translatesAutoresizingMaskIntoConstraints = false
        let input = UITextField()
        input.accessibilityIdentifier = "converter-input"
        input.accessibilityLabel = "Text to convert"
        input.borderStyle = .roundedRect
        input.font = .systemFont(ofSize: 22)
        input.autocapitalizationType = .allCharacters
        input.autocorrectionType = .no
        input.spellCheckingType = .no
        input.translatesAutoresizingMaskIntoConstraints = false
        controller.view.addSubview(title)
        controller.view.addSubview(input)
        NSLayoutConstraint.activate([
            title.leadingAnchor.constraint(equalTo: controller.view.leadingAnchor, constant: 24),
            title.topAnchor.constraint(equalTo: controller.view.safeAreaLayoutGuide.topAnchor, constant: 48),
            input.leadingAnchor.constraint(equalTo: controller.view.leadingAnchor, constant: 24),
            input.trailingAnchor.constraint(equalTo: controller.view.trailingAnchor, constant: -24),
            input.topAnchor.constraint(equalTo: title.bottomAnchor, constant: 32),
            input.heightAnchor.constraint(equalToConstant: 56),
        ])
        let window = UIWindow(frame: UIScreen.main.bounds)
        window.rootViewController = controller
        window.makeKeyAndVisible()
        self.window = window
        return true
    }
}
