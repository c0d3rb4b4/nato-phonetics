param(
    [Parameter(Mandatory = $true)][string]$Checkout,
    [Parameter(Mandatory = $true)][string]$Artifacts
)
$ErrorActionPreference = 'Stop'
$apk = Join-Path $Checkout 'android/app/build/outputs/apk/release/app-release-unsigned.apk'
$bundle = Join-Path $Checkout 'android/app/build/outputs/bundle/release/app-release.aab'
if (!(Test-Path $apk -PathType Leaf) -or !(Test-Path $bundle -PathType Leaf)) { throw 'Missing completed Release outputs' }
if (Test-Path $Artifacts) { throw "Preserved output directory must be new: $Artifacts" }
New-Item -ItemType Directory $Artifacts | Out-Null
$Artifacts = (Resolve-Path $Artifacts).Path
Copy-Item -LiteralPath $apk, $bundle -Destination $Artifacts
$apk = Join-Path $Artifacts 'app-release-unsigned.apk'
$engineering = Join-Path $Artifacts 'app-release-local-test.apk'
$signer = Join-Path $env:ANDROID_HOME 'build-tools/36.0.0/apksigner.bat'
$key = Join-Path $Checkout 'android/app/debug.keystore'
if ((Get-FileHash $key).Hash.ToLower() -ne '221e0a3106aa4c3ccc154e0a418b55020b3f9ea6e84f92e8749cd9e2f39f5e58') {
    throw 'Expected the repository public development key'
}
$unsigned = & $signer verify --verbose $apk 2>&1
$unsignedCode = $LASTEXITCODE
$unsigned | Set-Content (Join-Path $PSScriptRoot 'unsigned-signature.log')
if ($unsignedCode -eq 0 -or !($unsigned -match 'DOES NOT VERIFY')) { throw 'Unexpected unsigned verification result' }
& $signer sign --ks $key --ks-key-alias androiddebugkey --ks-pass pass:android --key-pass pass:android --out $engineering $apk
if ($LASTEXITCODE) { throw 'Engineering signature failed' }
& $signer verify --verbose --print-certs $engineering | Tee-Object -FilePath (Join-Path $PSScriptRoot 'engineering-signature.log')
if ($LASTEXITCODE) { throw 'Engineering signature verification failed' }
python (Join-Path $PSScriptRoot 'inspect-products.py') $Checkout $Artifacts
exit $LASTEXITCODE
