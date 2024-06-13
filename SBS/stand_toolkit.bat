@echo off

:start
if "%~1"=="ELEV" (
    GOTO MainMenu
)

echo.
echo In rare cases, we need admin privileges to do things.
echo If you trust our script, please choose (1)
echo If you do not trust our script, please choose (2)
echo.
set /p userChoiceStart="Enter your choice (1 or 2): "

if "%userChoiceStart%"=="1" (
    GOTO init
) else if "%userChoiceStart%"=="2" (
    echo That's totally fine!
    echo Admin privileges are overrated anyways.
    GOTO MainMenu
) else (
    echo Invalid choice. Please try again.
    pause
    GOTO start
)

:init
setlocal DisableDelayedExpansion
set cmdInvoke=1
set winSysFolder=System32
set "batchPath=%~dpnx0"
for %%k in (%0) do set batchName=%%~nk
set "vbsGetPrivileges=%temp%\OEgetPriv_%batchName%.vbs"
setlocal EnableDelayedExpansion

:checkPrivileges
NET FILE 1>NUL 2>NUL
if '%errorlevel%' == '0' ( goto gotPrivileges ) else ( goto getPrivileges )

:getPrivileges
if '%1'=='ELEV' (echo ELEV & shift /1 & goto gotPrivileges)
ECHO.
ECHO **************************************
ECHO Requesting Admin Priv....
ECHO **************************************

ECHO Set UAC = CreateObject^("Shell.Application"^) > "%vbsGetPrivileges%"
ECHO args = "ELEV " >> "%vbsGetPrivileges%"
ECHO For Each strArg in WScript.Arguments >> "%vbsGetPrivileges%"
ECHO args = args ^& strArg ^& " "  >> "%vbsGetPrivileges%"
ECHO Next >> "%vbsGetPrivileges%"

if '%cmdInvoke%'=='1' goto InvokeCmd 

ECHO UAC.ShellExecute "!batchPath!", args, "", "runas", 1 >> "%vbsGetPrivileges%"
goto ExecElevation

:InvokeCmd
ECHO args = "/c """ + "!batchPath!" + """ " + args >> "%vbsGetPrivileges%"
ECHO UAC.ShellExecute "%SystemRoot%\%winSysFolder%\cmd.exe", args, "", "runas", 1 >> "%vbsGetPrivileges%"

:ExecElevation
"%SystemRoot%\%winSysFolder%\WScript.exe" "%vbsGetPrivileges%" %*
exit /B

:gotPrivileges
setlocal & cd /d %~dp0
if '%1'=='ELEV' (del "%vbsGetPrivileges%" 1>nul 2>nul  &  shift /1)

:: main menu
@echo off
color 1F
setlocal enabledelayedexpansion

:MainMenu
cls
color 1F
echo.
echo ******************************************
echo *           Stand - Toolkit              *
echo * 1. Clear Cache and Bin                 *
echo * 2. Activation Key Placer               *
echo * 3. Update Stand Hotkeys                *
echo * 4. Set GTA V Compatibility Mode        *
echo * 5. [Dangerous Section]                 *
echo ******************************************
echo.
echo --------------------
echo Hey there! Please make sure to close the Stand launchpad and exit GTA 5
echo before we proceed with any of the options. 
echo I want to make sure everything goes smoothly for you! :)
echo --------------------
echo.
echo Just press 1, 2, 3, 4, or 5 to continue our journey! :)
set /p useroption="> "

if "%useroption%"=="1" GOTO ClearCacheBin
if "%useroption%"=="2" GOTO KeyPlacer
if "%useroption%"=="3" GOTO UpdateHotkeys
if "%useroption%"=="4" GOTO SetGTACompatibility
if "%useroption%"=="5" GOTO DangerousSection
echo Oopsie! Looks like we took a wrong turn. Could you please choose an option again? Just a gentle reminder, it should be 1, 2, 3, 4, or 5. :)
pause
GOTO MainMenu


:ClearCacheBin
echo.
echo.
echo Let's make sure everything is in place for a smooth experience!
echo Could you double-check that Stand's launchpad is closed and GTA V is taking a little break? (Close it.)
echo Once you've done that, hit any key and we'll be on our way! :)
echo.
pause >nul
cls
echo Cross your fingers. I'm about to clear out the Stand Cache and Bin for a fresh start. Hang tight! :)
echo.
set "standBin=%appdata%\Stand\Bin"
set "standCache=%appdata%\Stand\Cache"

if exist "%standBin%" (
    rmdir /s /q "%standBin%"
    if errorlevel 1 (
        echo Uh-oh! It looks like I couldn't sweep away the "%standBin%" this time. Could we give it another shot?
        pause
        GOTO END
    ) else (
        echo Hooray"%standBin%" has been successfully tidied up. (:
    )
) else (
    echo It seems like "%standBin%" is already gone. Looks like we're one step ahead! (:
)

if exist "%standCache%" (
    rmdir /s /q "%standCache%"
    if errorlevel 1 (
        echo Trying to clear "%standCache%" didn't quite work out.
        pause
        GOTO END
    ) else (
        echo Great news. "%standCache%" is now cleared out. We're on the right track!
    )
) else (
    echo Looks like "%standCache%" is already out of the picture. Everything is tidy on this end!
)

echo.
echo All clear. The Cache and Bin have been swept clean! Let's keep moving forward. :)
echo.
pause
GOTO END



:DangerousSection
cls
echo ******************************************
echo *         Dangerous Operations           *
echo * 1. Clear Stand folder                  *
echo * 2. Clear Calamity Folders              *
echo * 3. Clear Both Folders                  *
echo ******************************************
echo.
echo Please choose your option (1, 2, or 3):
set /p useroption="> "

if "%useroption%"=="1" (
    set "folderPath=%appdata%\Stand"
    set "newFolderName=_Stand"
    GOTO SubMenu
) else if "%useroption%"=="2" (
    set "CalamityfolderPath1=C:\Users\%username%\AppData\Local\Calamity,_Inc"
    set "CalamitynewFolderName1=Calamity,_Inc_old"
    set "CalamityfolderPath2=C:\ProgramData\Calamity, Inc"
    set "CalamitynewFolderName2=Calamity, Inc_old"
    GOTO SubMenu
) else if "%useroption%"=="3" (
    set "folderPath=%appdata%\Stand"
    set "newFolderName=_Stand"
    set "CalamityfolderPath1=C:\Users\%username%\AppData\Local\Calamity,_Inc"
    set "CalamitynewFolderName1=Calamity,_Inc_old"
    set "CalamityfolderPath2=C:\ProgramData\Calamity, Inc"
    set "CalamitynewFolderName2=Calamity, Inc_old"
    GOTO SubMenu
) else (
    echo Invalid option selected. Please try again.
    pause
    GOTO DangerousSection
)

:SubMenu
cls
echo.
echo ******************************************
echo *  Choose action:                        *
echo * 1. Rename folder(s)                    *
echo * 2. Delete folder(s)                    *
echo ******************************************
echo.
echo Please choose your action (1 or 2):
set /p action="> "
if "%action%"=="1" (
    CALL :FolderAction Rename
) else if "%action%"=="2" (
    CALL :FolderAction Delete
) else (
    echo Invalid action selected. Please try again.
    pause
    GOTO SubMenu
)

GOTO END

:FolderAction
REM Handles folder renaming or deleting
if "%1"=="Rename" (
    if defined folderPath CALL :RenameFunction "%folderPath%" "%newFolderName%"
    if defined CalamityfolderPath1 CALL :RenameFunction "%CalamityfolderPath1%" "%CalamitynewFolderName1%"
    if defined CalamityfolderPath2 CALL :RenameFunction "%CalamityfolderPath2%" "%CalamitynewFolderName2%"
) else if "%1"=="Delete" (
    if defined folderPath CALL :DeleteFunction "%folderPath%"
    if defined CalamityfolderPath1 CALL :DeleteFunction "%CalamityfolderPath1%"
    if defined CalamityfolderPath2 CALL :DeleteFunction "%CalamityfolderPath2%"
)
exit /b

:RenameFunction
REM Function to rename a folder
if exist "%~1" (
    ren "%~1" "%~2"
    if %errorlevel%==0 (
        echo Folder "%~1" successfully renamed to "%~2".
    ) else (
        echo Failed to rename the folder "%~1".
    )
) else (
    echo The folder "%~1" does not exist.
)
exit /b

:DeleteFunction
REM Function to delete a folder
if exist "%~1" (
    rd /s /q "%~1"
    if %errorlevel%==0 (
        echo Folder "%~1" successfully deleted.
    ) else (
        echo Failed to delete the folder "%~1".
    )
) else (
    echo The folder "%~1" does not exist.
)
exit /b

:UpdateHotkeys
REM Code for updating hotkeys
set "hotkeysPath=%USERPROFILE%\AppData\Roaming\Stand\Hotkeys.txt"

echo This will overwrite your current hotkeys to work with 60% keyboards.
echo If you want to proceed, please type 'accept': 
set /p userConfirmation="> "

if /I "%userConfirmation%"=="accept" (

    REM Check if the directory exists, if not, create it
    if not exist "%USERPROFILE%\AppData\Roaming\Stand\" (
        mkdir "%USERPROFILE%\AppData\Roaming\Stand\"
    )

    (
    echo Tree Compatibility Version: 49
    echo Stand
    echo     Settings
    echo         Input
    echo             Keyboard Input Scheme
    echo                 Open/Close Menu: Tab
    echo                 Previous Tab: O
    echo                 Next Tab: P
    echo                 Up: I
    echo                 Down: K
    echo                 Left: J
    echo                 Right: L
    echo                 Click: Enter
    echo                 Back: Backspace
    ) > "%hotkeysPath%"

    if %errorlevel%==0 (
        echo We've successfully updated your Stand hotkeys. Here is how it's bound now:
        type "%hotkeysPath%"
    ) else (
        echo Failed to update the Hotkeys file.
    )
) else (
    echo Hotkey update cancelled.
)

GOTO :END




:KeyPlacer
REM Code for placing activation key
cls
GOTO :KeyInput
:KeyInput
echo.
echo ******************************************
echo *  Please give me the activation key.    *
echo *  It should be in the format:           *
echo *  Stand-Activate-{31 alphanumeric       *
echo *  characters}:                          *
echo ******************************************
echo.
set /p "key= > "

echo %key:~0,15%|findstr /c:"Stand-Activate-" >nul 2>&1
IF NOT %errorLevel% == 0 (
    cls
    echo.
    echo ******************************************
    echo *  The key "%key%" doesn't look right.   *
    echo *  Could you double-check and try again? *
    echo ******************************************
    echo.
    goto KeyInput
)

set "len=0"
for /l %%A in (15,1,45) do (
    if not "!key:~%%A,1!"=="" (
        set /a "len+=1"
    )
)

if !len! neq 31 (
    cls
    echo.
    echo ******************************************
    echo *  The key "%key%" doesn't have the     *
    echo *  correct length. Let's try this again. *
    echo ******************************************
    echo.
    goto KeyInput
)

IF NOT EXIST "%AppData%\Stand" (
    cls
    echo.
    echo ******************************************
    echo *  I couldn't find the directory         *
    echo *  %AppData%\Stand.                      *
    echo ******************************************
    echo.
    pause
    exit /b
)

echo %key% > "%AppData%\Stand\Activation Key.txt"
IF %errorLevel% NEQ 0 (
    cls
    echo.
    echo ******************************************
    echo *  There was an issue creating the       *
    echo *  activation key file.                  *
    echo ******************************************
    echo.
    pause
    exit /b
)
cls
echo.
echo ******************************************
echo *  I successfully saved the activation   *
echo *  key for you! :)                       *
echo ******************************************
echo.
pause
GOTO END

:SetGTACompatibility
@echo off
SETLOCAL ENABLEEXTENSIONS
echo Setting GTA V Compatibility Mode...
echo Ooops. This function is broken atm.
echo For now - you will have to visit https://github.com/AXOca/ToSta
echo and download 'stand-winpreviewfix.exe' to do this.
pause
GOTO MainMenu


:: // // // // // This function is disabled.

:: Function to find GTA V installation path
call :findGtaVInstallPath gtaPath

if not "%gtaPath%"=="" (
    echo Found GTA 5 installation at: %gtaPath%
    SET "gtavExePath=%gtaPath%\GTA5.exe"
    if exist "%gtavExePath%" (
        echo Found GTAV.exe at: %gtavExePath%
        call :setCompatibilityMode "%gtavExePath%"
    ) else (
        echo GTA5.exe not found in the installation directory.
    )
) else (
    echo GTA 5 installation path not found.
)

pause

:findGtaVInstallPath
setlocal
    SET "key1=SOFTWARE\WOW6432Node\Rockstar Games\Grand Theft Auto V"
    SET "value1=InstallFolder"
    SET "key2=SOFTWARE\WOW6432Node\Rockstar Games\GTAV"
    SET "value2=InstallFolderSteam"
    SET "key3=SOFTWARE\WOW6432Node\Rockstar Games\Grand Theft Auto V"
    SET "value3=InstallFolderEGS"

    for %%A in ("%key1%:%value1%" "%key2%:%value2%" "%key3%:%value3%") do (
        FOR /F "tokens=1,* delims=:" %%G IN ("%%A") DO (
            call :getRegistryValue "%%G" "%%H" path
            if not "!path!"=="" (
                SET "%~1=!path!"
                exit /b
            )
        )
    )
endlocal
exit /b

:getRegistryValue
setlocal
    SET "key=%~1"
    SET "valueName=%~2"
    FOR /F "tokens=*" %%A IN ('REG QUERY "HKLM\%key%" /v %valueName% 2^>nul') DO (
        FOR /F "tokens=2,*" %%B IN ("%%A") DO (
            if "%%B"=="%valueName%" (
                SET "%~3=%%C"
                exit /b
            )
        )
    )
    SET "%~3="
endlocal
exit /b

:setCompatibilityMode
setlocal
    SET "exePath=%~1"
    powershell -Command "& {if (-not (Test-Path 'HKCU:\Software\Microsoft\Windows NT\CurrentVersion\AppCompatFlags\Layers')) { New-Item 'HKCU:\Software\Microsoft\Windows NT\CurrentVersion\AppCompatFlags\Layers' -Force }}"
    powershell -Command "& {Set-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows NT\CurrentVersion\AppCompatFlags\Layers' -Name '%exePath%' -Value '~ WIN7RTM'}"
    if %errorlevel%==0 (
        echo Compatibility mode set to ~ WIN7RTM for %exePath%
    ) else (
        echo Error setting compatibility mode.
    )
endlocal
GOTO END

:END
echo.
echo Script completed. What would you like to do next?
echo 1. Return to Main Menu
echo 2. Exit Script
echo.
set /p userChoice="Enter your choice (1 or 2): "

if "%userChoice%"=="1" (
    GOTO MainMenu
) else if "%userChoice%"=="2" (
    echo Exiting script. Have a great day!
    pause
    endlocal
    exit
) else (
    echo Invalid choice. Please try again.
    pause
    GOTO END
)

