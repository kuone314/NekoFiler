import { invoke } from '@tauri-apps/api';
import { ShellCommand, writeShellCommandSetting, } from './CommandInfo';


///////////////////////////////////////////////////////////////////////////////////////////////////
export function GenerateDefaultCommandSeting(): ShellCommand[] {
  const result: ShellCommand[] = [
    {
      command_name: 'Copy to clopboard',
      dialog_type: 'none',
      script_path: 'Copy to clopboard.ps1',
    },
    {
      command_name: 'Cut to clopboard',
      dialog_type: 'none',
      script_path: 'Cut to clopboard.ps1',
    },
    {
      command_name: 'Past from clopboard',
      dialog_type: 'none',
      script_path: 'Past from clopboard.ps1',
    },
    {
      command_name: 'Create Copy',
      dialog_type: 'reference_selection',
      script_path: 'Create Copy.ps1',
    },
    {
      command_name: 'Copy and Replace Content',
      dialog_type: 'reference_selection',
      script_path: 'Copy and Replace Content.ps1',
    },
    {
      command_name: 'Copy to opposite dirctory',
      dialog_type: 'reference_selection',
      script_path: 'Copy to opposite dirctory.ps1',
    },
    {
      command_name: 'Move to opposite dirctory',
      dialog_type: 'none',
      script_path: 'Move to opposite dirctory.ps1',
    },
    {
      command_name: 'Delete file',
      dialog_type: 'none',
      script_path: 'Delete file.ps1',
    },
    {
      command_name: 'Copy file path',
      dialog_type: 'none',
      script_path: 'Copy file path.ps1',
    },
    {
      command_name: 'New File',
      dialog_type: 'multi_line',
      script_path: 'New File.ps1',
    },
    {
      command_name: 'New Folder',
      dialog_type: 'multi_line',
      script_path: 'New Folder.ps1',
    },
    {
      command_name: 'Rename',
      dialog_type: 'reference_selection',
      script_path: 'Rename.ps1',
    },
    {
      command_name: 'PowerShell',
      dialog_type: 'none',
      script_path: 'StartUpPowerShell.ps1',
    },
    {
      command_name: 'PowerShell(Admin)',
      dialog_type: 'none',
      script_path: 'StartUpAdminPowerShell.ps1',
    },
  ];

  (async () => {
    const script = `\
Set-Clipboard $selecting_item_path_ary;
`;
    await invoke<void>("write_setting_file", {
      filename: "General/script/Copy file path.ps1",
      content: script
    })
  })();

  (async () => {
    const script = `
Add-Type -AssemblyName System.Windows.Forms;
$dataObj = New-Object System.Windows.Forms.DataObject;
$dataObj.SetFileDropList($selecting_item_path_ary);
$byteStream = [byte[]](([System.Windows.Forms.DragDropEffects]::Copy -as [byte]), 0, 0, 0);
$memoryStream = [System.IO.MemoryStream]::new($byteStream);
$dataObj.SetData("Preferred DropEffect", $memoryStream);
[System.Windows.Forms.Clipboard]::SetDataObject($dataObj, $true);
`;
    await invoke<void>("write_setting_file", {
      filename: "General/script/Copy to clopboard.ps1",
      content: script
    })
  })();

  (async () => {
    const script = `\
for ($index = 0; $index -lt $selecting_item_path_ary.count; $index++) {
  $newName = $opposite_dir+'/'+$dialog_input_str_ary[$index]
  Copy-Item -Recurse -Path $selecting_item_path_ary[$index] -Destination $newName
}
`;
    await invoke<void>("write_setting_file", {
      filename: "General/script/Copy to opposite dirctory.ps1",
      content: script
    })
  })();

  (async () => {
    const script = `
$item_count = $selecting_item_path_ary.count;
for ($index=0; $index -lt $dialog_input_str_ary.count; $index++){
  $selecting_item_name = $selecting_item_name_ary[$index%$item_count];
  $selecting_item_path = $selecting_item_path_ary[$index%$item_count];
  $dialog_input_str = $dialog_input_str_ary[$index];
  $log = $selecting_item_name + " -> " + $dialog_input_str;
  echo $log;

  Copy-Item -Recurse -Path $selecting_item_path -Destination $dialog_input_str
}\
`;
    await invoke<void>("write_setting_file", {
      filename: "General/script/Create Copy.ps1",
      content: script
    })
  })();

  (async () => {
    const script = `
function GetReplaceName {
  param (
    [string]$file_name
  )
  $index = $file_name.IndexOf(".");
  if ($index -eq -1) {
    return $file_name;
  }
  return $file_name.Substring(0, $index);
}

$item_count = $selecting_item_path_ary.count;
for ($index = 0; $index -lt $dialog_input_str_ary.count; $index++) {
  $selecting_item_name = $selecting_item_name_ary[$index % $item_count];
  $selecting_item_path = $selecting_item_path_ary[$index % $item_count];
  $dialog_input_str = $dialog_input_str_ary[$index];
  $log = $selecting_item_name + " -> " + $dialog_input_str;
  echo $log;

  $replaceSrc = GetReplaceName -file_name $selecting_item_name;
  $replaceDst = GetReplaceName -file_name $dialog_input_str;
  $log = "Replace:" + $replaceSrc + " -> " + $replaceDst;
  echo $log;

  Get-Content  -Encoding UTF8 $selecting_item_path | ForEach-Object { $_ -replace $replaceSrc, $replaceDst } | Out-File -Encoding UTF8 $dialog_input_str -NoClobber
}
`;
    await invoke<void>("write_setting_file", {
      filename: "General/script/Copy and Replace Content.ps1",
      content: script
    })
  })();

  (async () => {
    const script = `
Add-Type -AssemblyName System.Windows.Forms;
$dataObj = New-Object System.Windows.Forms.DataObject;
$dataObj.SetFileDropList($selecting_item_path_ary);
$byteStream = [byte[]](([System.Windows.Forms.DragDropEffects]::Move -as [byte]), 0, 0, 0);
$memoryStream = [System.IO.MemoryStream]::new($byteStream);
$dataObj.SetData("Preferred DropEffect", $memoryStream);
[System.Windows.Forms.Clipboard]::SetDataObject($dataObj, $true);
`;
    await invoke<void>("write_setting_file", {
      filename: "General/script/Cut to clopboard.ps1",
      content: script
    })
  })();

  (async () => {
    const script = `
Remove-Item $selecting_item_path_ary -Recurse;
`;
    await invoke<void>("write_setting_file", {
      filename: "General/script/Delete file.ps1",
      content: script
    })
  })();

  (async () => {
    const script = `
Move-Item -Path $selecting_item_path_ary -Destination $opposite_dir
`;
    await invoke<void>("write_setting_file", {
      filename: "General/script/Move to opposite dirctory.ps1",
      content: script
    })
  })();

  (async () => {
    const script = `
$dialog_input_str_ary | % { New-Item $_ -type file };
`;
    await invoke<void>("write_setting_file", {
      filename: "General/script/New File.ps1",
      content: script
    })
  })();

  (async () => {
    const script = `
$dialog_input_str_ary | % { New-Item $_ -type Directory };
`;
    await invoke<void>("write_setting_file", {
      filename: "General/script/New Folder.ps1",
      content: script
    })
  })();

  (async () => {
    const script = `
Add-Type -AssemblyName System.Windows.Forms;

$files = [Windows.Forms.Clipboard]::GetFileDropList() ;
$data = [Windows.Forms.Clipboard]::GetDataObject();
$dropEffect = $data.GetData("Preferred DropEffect");
$flag = $dropEffect.ReadByte();

function GenNewFileName ($fileName) {
  $result = Join-Path $current_dir $fileName;
  if (-not(Test-Path $result)) {
    return $result;
  }

  $extension = [System.IO.Path]::GetExtension($fileName) ;
  $baseName = $fileName.Substring(0, $fileName.Length - $extension.Length);
  for ($idx = 2; $true ; $idx++) {
    $newFileName = $baseName + "(" + $idx + ")" + $extension;
    $result = Join-Path $current_dir $newFileName;
    if (-not(Test-Path $result)) {
      return $result;
    }
  }
}


foreach ($filePath in $files) {
  $fileName = [System.IO.Path]::GetFileName($filePath);
  $trg = GenNewFileName($fileName);
  if ($flag -band [Windows.Forms.DragDropEffects]::Copy) {
    Copy-Item -Recurse $filePath $trg;
  }
  if ($flag -band [Windows.Forms.DragDropEffects]::Move) {
    Move-Item $filePath $trg;
  }
}
`;
    await invoke<void>("write_setting_file", {
      filename: "General/script/Past from clopboard.ps1",
      content: script
    })
  })();

  (async () => {
    const script = `
for ($index=0; $index -lt $selecting_item_path_ary.count; $index++){
  Rename-Item $selecting_item_path_ary[$index] $dialog_input_str_ary[$index]
}
`;
    await invoke<void>("write_setting_file", {
      filename: "General/script/Rename.ps1",
      content: script
    })
  })();

  (async () => {
    const script = `
 Start-Process PowerShell
`;
    await invoke<void>("write_setting_file", {
      filename: "General/script/StartUpPowerShell.ps1",
      content: script
    })
  })();

  (async () => {
    const script = `
Start-Process PowerShell -Verb runas -ArgumentList "-NoExit -Command cd $current_dir"
 `;
    await invoke<void>("write_setting_file", {
      filename: "General/script/StartUpAdminPowerShell.ps1",
      content: script
    })
  })();

  writeShellCommandSetting(result);
  return result;
}

