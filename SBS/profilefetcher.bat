@echo off
setlocal EnableDelayedExpansion

:: T
echo Welcome to Stand's Profile Copier
echo Let me assist you in managing your profiles with ease.
echo -------------------------------------------------------

:: CD
cd "%appdata%\Stand\Profiles"

:: DISPLAYMETA
set "activeProfile="
for /f "tokens=1,* delims=: " %%a in ('type "%appdata%\Stand\Meta State.txt" ^| find "Active Profile:"') do (
    set activeProfile=%%b
)

if not "!activeProfile!"=="" (
    echo Current Meta State: !activeProfile!
) else (
    echo [Warning] No active profile found.
)
echo -------------------

:: LIST
set i=0
echo Available Profiles:
echo -------------------
for %%f in (*.txt) do (
    set /a i+=1
    set file!i!=%%f
    echo !i!. %%f
)
echo -------------------------------------------------------


:: CHOPRO
echo Please select a profile number to copy to your clipboard.
set /p choice="Enter profile number: "
set selectedFile=!file%choice%!

:: VAL
if not defined selectedFile (
    echo [Error] Invalid selection. Please try again.
    exit /b
) 

:: COP
type "!selectedFile!" | clip
cls
echo [Success] The content of '!selectedFile!' has been copied to your clipboard.
echo You can now paste it (Ctrl+V) into Discord or anywhere else.
echo -------------------------------------------------------

:: END
echo Thank you for using me. Have a great day!
pause
