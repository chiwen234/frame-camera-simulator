; FRAME · 相机公司模拟器 — 安装包
; 编译：ISCC.exe FRAME.iss

#define MyAppName "FRAME · 相机公司模拟器"
#define MyAppVersion "1.2.0"
#define MyAppPublisher "FRAME"
#define MyAppExeName "FRAME.exe"
#define MyAppId "{{8F6A0F3C-5B9E-4D8A-9C71-2F6D3D6B5A10}"

[Setup]
AppId={#MyAppId}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppCopyright=个人自用影像产业模拟沙盒
DefaultDirName={localappdata}\Programs\FRAME Camera Simulator
DefaultGroupName=FRAME
DisableProgramGroupPage=yes
DisableDirPage=yes
DisableWelcomePage=no
PrivilegesRequired=lowest
OutputDir=..\installer
OutputBaseFilename=FRAME-Setup-1.2.0
SetupIconFile=..\build\icon.ico
UninstallDisplayIcon={app}\{#MyAppExeName}
UninstallDisplayName={#MyAppName}
WizardStyle=modern
WizardImageFile=..\build\wizard.bmp
WizardSmallImageFile=..\build\wizard-small.bmp
WizardImageStretch=no
Compression=lzma2/ultra64
SolidCompression=yes
LZMAUseSeparateProcess=yes
MinVersion=10.0.17763
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
CloseApplications=yes
RestartApplications=no
UsePreviousAppDir=no
VersionInfoVersion=1.0.0.0
VersionInfoCompany={#MyAppPublisher}
VersionInfoDescription={#MyAppName} 安装程序
VersionInfoProductName={#MyAppName}
VersionInfoProductVersion={#MyAppVersion}
ShowLanguageDialog=no

[Languages]
Name: "chinesesimplified"; MessagesFile: "compiler:Languages\ChineseSimplified.isl"

[Files]
Source: "..\desktop-app\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; IconFilename: "{app}\{#MyAppExeName}"; Comment: "FRAME 相机公司模拟器"
Name: "{group}\卸载 FRAME"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; IconFilename: "{app}\{#MyAppExeName}"; Comment: "FRAME · 相机公司模拟器"

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "启动 FRAME"; Flags: nowait postinstall skipifsilent
