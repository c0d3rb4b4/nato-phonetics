require 'xcodeproj'
require 'fileutils'
destination = ARGV.fetch(0)
FileUtils.mkdir_p(destination)
FileUtils.cp(File.join(__dir__, 'window-resize.swift'), File.join(destination, 'WindowResizeUITests.swift'))
project = Xcodeproj::Project.new(File.join(destination, 'WindowResize.xcodeproj'))
target = project.new_target(:ui_test_bundle, 'WindowResizeUITests', :ios, '16.4')
file = project.main_group.new_file('WindowResizeUITests.swift')
target.source_build_phase.add_file_reference(file)
target.build_configurations.each do |config|
  config.build_settings.merge!({
    'PRODUCT_BUNDLE_IDENTIFIER' => 'com.natophonetics.windowresize',
    'GENERATE_INFOPLIST_FILE' => 'YES', 'SWIFT_VERSION' => '5.0',
    'CODE_SIGNING_ALLOWED' => 'NO', 'TARGETED_DEVICE_FAMILY' => '2',
    'ENABLE_TESTING_SEARCH_PATHS' => 'YES',
  })
end
project.save
scheme = Xcodeproj::XCScheme.new
scheme.add_build_target(target); scheme.add_test_target(target)
scheme.save_as(project.path, 'WindowResize', true)
