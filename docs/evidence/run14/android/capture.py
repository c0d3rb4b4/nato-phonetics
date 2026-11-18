from verify_native import *
# Begin with the actual themed launcher already enabled through Wallpaper & style.
adb('shell','input','keyevent','KEYCODE_HOME');expect(text='NATO Phonetics');screenshot('launcher-themed','Actual installed package in Pixel Launcher; themed icons ON','system light / wallpaper tint')
mark('themed-launcher-installed-icon',package=APP)
# Restore original ordinary icons using the system Wallpaper & style control.
adb('shell','input','swipe','360','750','360','750','1200');tap(text='Wallpaper & style');expect(text='Themed icons');adb('shell','input','tap','630','1500');adb('shell','input','keyevent','KEYCODE_HOME');expect(text='NATO Phonetics');screenshot('launcher-color','Actual installed adaptive color icon; themed icons OFF','system light')
tap(text='NATO Phonetics');expect(contains='NATO Phonetics',timeout=60);expect(desc='Open menu',timeout=60);screenshot('home-from-launcher','Installed rebuilt Debug app reached by actual launcher icon','light');mark('launcher-opens-running-app')
