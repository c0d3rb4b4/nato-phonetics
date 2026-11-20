# Restore only the isolated AVD created for this run, after all collectors finish.
$ErrorActionPreference = 'Stop'
$initial = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'device-initial.json') -Raw | ConvertFrom-Json
$created = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'disposable-avd.json') -Raw | ConvertFrom-Json
$adb = Join-Path $env:ANDROID_HOME 'platform-tools/adb.exe'
$serial = $created.serial
$avd = (& $adb -s $serial emu avd name | Select-Object -First 1)
if ($avd -ne 'NatoRun31' -or $serial -ne 'emulator-5582' -or !($created.createdEmptyAVD) -or $initial.packages.Count) {
    throw 'Expected the owned empty Run31 emulator'
}
function DeviceShell([string[]]$ShellArgs) {
    $output = & $adb -s $serial shell @ShellArgs
    if ($LASTEXITCODE) { throw "ADB failed for $ShellArgs" }
    return $output
}
$packages = @('com.natophonetics.fonttest', 'com.natophonetics.app')
foreach ($package in $packages) {
    $remote = DeviceShell @('pm', 'list', 'packages', $package)
    if ($remote -eq "package:$package") {
        & $adb -s $serial uninstall $package
        if ($LASTEXITCODE) { throw "Failed to clear disposable package $package" }
    }
}
$nativeTestDir = '/data/local/tmp/nato-font-regression'
$resolved = DeviceShell @('readlink', '-f', $nativeTestDir)
if ($resolved -ne $nativeTestDir) { throw 'Unexpected test executable path on AVD' }
DeviceShell @('rm', '-rf', $nativeTestDir)
DeviceShell @('rm', '-f', '/sdcard/nato-window.xml')
DeviceShell @('settings', 'put', 'system', 'font_scale', $initial.fontScale)
DeviceShell @('wm', 'size', 'reset')
DeviceShell @('wm', 'density', 'reset')
if ((DeviceShell @('settings', 'get', 'secure', 'default_input_method')) -ne $initial.ime) {
    DeviceShell @('ime', 'set', $initial.ime)
}
$after = [ordered]@{
    dateUTC = [DateTime]::UtcNow.ToString('o')
    serial = $serial
    dedicatedAVD = $avd
    packages = @(DeviceShell @('pm', 'list', 'packages', 'com.natophonetics'))
    ime = DeviceShell @('settings', 'get', 'secure', 'default_input_method')
    fontScale = DeviceShell @('settings', 'get', 'system', 'font_scale')
    density = DeviceShell @('wm', 'density')
    size = DeviceShell @('wm', 'size')
}
if ($after.packages.Count -or $after.ime -ne $initial.ime -or $after.fontScale -ne $initial.fontScale -or
    $after.density -ne $initial.density -or $after.size -ne $initial.size) { throw 'Device state differs from empty baseline' }
& $adb -s $serial emu kill
if ($LASTEXITCODE) { throw 'Could not stop owned emulator' }
$deadline = (Get-Date).AddSeconds(45)
while ((& $adb devices) -match $serial) {
    if ((Get-Date) -gt $deadline) { throw 'Owned emulator still registered after shutdown' }
    Start-Sleep -Seconds 1
}
$after.emulatorStopped = $true
$after.gradleDaemonPid = 72024
$after.ownedGradleDaemonActive = [bool](Get-CimInstance Win32_Process -Filter 'ProcessId=72024' |
    Where-Object { $_.CommandLine -like '*GradleDaemon 8.14.3*' })
$after.adbServerAlreadyListeningBeforeAVD = $created.adbServerAlreadyListening
$after.freeBytesAfterShutdown = (Get-PSDrive C).Free
$after | ConvertTo-Json | Set-Content (Join-Path $PSScriptRoot 'restoration.json') -Encoding utf8
