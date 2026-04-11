' Launches run.bat with no console window (only the app appears in the taskbar).
' Double-click run.vbs instead of run.bat to start the app without a terminal.

Set fso = CreateObject("Scripting.FileSystemObject")
Set WshShell = CreateObject("WScript.Shell")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = scriptDir
WshShell.Run "cmd /c run.bat", 0, False
