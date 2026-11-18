# React Native 0.81.5 pins fmt 11.0.2. Apple clang 21 rejects that version's
# consteval path. Select fmt's existing runtime-checked fallback on that compiler.
# https://github.com/fmtlib/fmt/issues/4740
# https://github.com/react/react-native/issues/55601
def patch_fmt_for_apple_clang(installer)
  specification = installer.analysis_result.specifications.find { |spec| spec.name == 'fmt' }
  unless specification && specification.version.to_s == '11.0.2'
    raise 'Review/remove the NATO fmt compatibility patch: expected fmt 11.0.2.'
  end

  header = installer.sandbox.root.join('fmt', 'include', 'fmt', 'base.h')
  original = <<~'CPP'.strip
    #elif defined(__apple_build_version__) && __apple_build_version__ < 14000029L
    #  define FMT_USE_CONSTEVAL 0  // consteval is broken in Apple clang < 14.
  CPP
  replacement = <<~'CPP'.strip
    #elif defined(__apple_build_version__) && \
        (__apple_build_version__ < 14000029L || __apple_build_version__ >= 21000000L)
    #  define FMT_USE_CONSTEVAL 0  // NATO: fmt 11.0.2 / Apple clang 21 compatibility.
  CPP
  source = File.read(header)
  return if source.include?(replacement) && !source.include?(original)

  unless source.scan(original).size == 1
    raise 'Review the NATO fmt compatibility patch: expected source pattern changed.'
  end
  File.chmod(File.stat(header).mode | 0o200, header)
  File.write(header, source.sub(original, replacement))
  Pod::UI.puts 'Applied version-guarded fmt 11.0.2 / Apple clang 21 compatibility fallback.'
end
