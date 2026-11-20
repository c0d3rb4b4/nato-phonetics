require 'xcodeproj'
require 'fileutils'

destination = ARGV.fetch(0)
FileUtils.mkdir_p(destination)
project = Xcodeproj::Project.new(File.join(destination, 'InputControl.xcodeproj'))
app = project.new_target(:application, 'InputControl', :ios, '16.4')
tests = project.new_target(:ui_test_bundle, 'InputControlUITests', :ios, '16.4')
[[app, 'InputControl.swift'], [tests, 'InputControlUITests.swift']].each do |target, name|
  FileUtils.cp(File.join(__dir__, name), File.join(destination, name))
  file = project.main_group.new_file(name)
  target.source_build_phase.add_file_reference(file)
  target.build_configurations.each do |config|
    config.build_settings.merge!({
      'PRODUCT_BUNDLE_IDENTIFIER' => target == app ? 'com.natophonetics.inputcontrol' : 'com.natophonetics.inputcontroltests',
      'GENERATE_INFOPLIST_FILE' => 'YES',
      'SWIFT_VERSION' => '5.0',
      'CODE_SIGNING_ALLOWED' => 'NO',
      'TARGETED_DEVICE_FAMILY' => '1,2',
      'ENABLE_TESTING_SEARCH_PATHS' => 'YES',
      'INFOPLIST_KEY_UIApplicationSceneManifest_Generation' => 'NO',
      'INFOPLIST_KEY_UILaunchScreen_Generation' => 'YES',
      'INFOPLIST_KEY_UISupportedInterfaceOrientations' => 'UIInterfaceOrientationPortrait',
    })
  end
end
project.save
scheme = Xcodeproj::XCScheme.new
scheme.add_build_target(app)
scheme.add_build_target(tests)
scheme.add_test_target(tests)
scheme.save_as(project.path, 'InputControl', true)
