GATE ECE Study OS 2.0.0
=======================

Everything works offline. Your data stays on your device.

WINDOWS 10 / 11 (64-bit)
------------------------
1. Double-click GATE-ECE-Study-OS-Setup-2.0.0.exe.
2. If SmartScreen appears: More info -> Run anyway. The app is not code-signed.
3. Choose "Install for me only" (no administrator password needed).
4. Open "GATE ECE Study OS" from the Start menu or desktop shortcut.

Data lives in %APPDATA%\GATE ECE Study OS and survives uninstalling/reinstalling.
Uninstall via Settings > Apps > Installed apps.

ANDROID 7.0 OR NEWER
--------------------
1. Copy GATE-ECE-Study-OS-2.0.0.apk to your phone.
2. Tap it and allow "Install unknown apps" for the file manager or browser.
3. Install, then open "GATE Study OS".

Sideloaded apps may trigger a Play Protect prompt; choose Install anyway if you
trust the source. Back up from Settings > Data > Backup (JSON) before
uninstalling or changing phones.

BACKUPS
-------
Settings > Data > Backup (JSON) saves your complete history, including
screenshots. CSV and Markdown reports are also available. On Android, exports
open the system Save-as picker.

SHA-256 CHECKSUMS
-----------------
8E53BBFEF0465B35624B30C5D5089FCA61E4B7F68B6618361C61AD16D474BDF3  GATE-ECE-Study-OS-Setup-2.0.0.exe
B6873AF980CD6588016A3BE89AB05415A0C7EE76667F525AD80DA36BE3B17EF3  GATE-ECE-Study-OS-2.0.0.apk

Verify on Windows:
  Get-FileHash .\GATE-ECE-Study-OS-Setup-2.0.0.exe -Algorithm SHA256

Verify on macOS/Linux:
  shasum -a 256 GATE-ECE-Study-OS-Setup-2.0.0.exe
