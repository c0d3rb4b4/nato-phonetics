import subprocess,time
adb='/Users/mac/Library/Android/sdk/platform-tools/adb';serial='emulator-5580'
end=time.monotonic()+120
while time.monotonic()<end:
 try:
  r=subprocess.run([adb,'-s',serial,'shell','getprop','sys.boot_completed'],capture_output=True,text=True,timeout=5)
  if r.returncode==0 and r.stdout.strip()=='1':break
 except subprocess.TimeoutExpired:pass
 time.sleep(.5)
else:raise RuntimeError('Android boot did not complete')
for args in [('shell','wm','size','720x1600'),('shell','wm','density','280')]:subprocess.run([adb,'-s',serial,*args],check=True)
print('Android16 isolated AVD booted;720x1600/280dpi selected')
