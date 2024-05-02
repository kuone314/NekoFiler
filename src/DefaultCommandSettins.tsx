import { invoke } from '@tauri-apps/api';
import JSON5 from 'json5'

import { KeyBindSetting, writeKeyBindSetting, } from './CommandInfo';
import { alfabetList } from './Utility';


///////////////////////////////////////////////////////////////////////////////////////////////////
export function GenerateDefaultCommandSeting(): KeyBindSetting[] {
  const defined: KeyBindSetting[] = [
    {
      command_name: 'Copy to clopboard',
      key: 'ctrl+c',
      dialog_type: 'none',
      action: {
        type: 'power_shell',
        command: 'Copy to clopboard.ps1',
      },
      valid_on_addressbar: false,
    },
    {
      command_name: 'Cut to clopboard',
      key: 'ctrl+x',
      dialog_type: 'none',
      action: {
        type: 'power_shell',
        command: 'Cut to clopboard.ps1',
      },
      valid_on_addressbar: false,
    },
    {
      command_name: 'Past from clopboard',
      key: 'ctrl+v',
      dialog_type: 'none',
      action: {
        type: 'power_shell',
        command: 'Past from clopboard.ps1',
      },
      valid_on_addressbar: false,
    },
    {
      command_name: 'Create Copy',
      key: 'ctrl+c',
      dialog_type: 'reference_selection',
      action: {
        type: 'power_shell',
        command: 'Create Copy.ps1',
      },
      valid_on_addressbar: false,
    },
    {
      command_name: 'Copy and Replace Content',
      key: 'ctrl+c',
      dialog_type: 'reference_selection',
      action: {
        type: 'power_shell',
        command: 'Copy and Replace Content.ps1',
      },
      valid_on_addressbar: false,
    },
    {
      command_name: 'Copy to opposite dirctory',
      key: 'ctrl+c',
      dialog_type: 'reference_selection',
      action: {
        type: 'power_shell',
        command: 'Copy to opposite dirctory.ps1',
      },
      valid_on_addressbar: false,
    },
    {
      command_name: 'Move to opposite dirctory',
      key: 'ctrl+x',
      dialog_type: 'none',
      action: {
        type: 'power_shell',
        command: 'Move to opposite dirctory.ps1',
      },
      valid_on_addressbar: false,
    },
    {
      command_name: 'Delete file',
      key: 'ctrl+d',
      dialog_type: 'none',
      action: {
        type: 'power_shell',
        command: 'Delete file.ps1',
      },
      valid_on_addressbar: false,
    },
    {
      command_name: '',
      key: 'ctrl+d',
      dialog_type: 'none',
      action: {
        type: 'power_shell',
        command: '',
      },
      valid_on_addressbar: false,
    },
    {
      command_name: 'Delete file',
      key: 'delete',
      dialog_type: 'none',
      action: {
        type: 'power_shell',
        command: 'Delete file.ps1',
      },
      valid_on_addressbar: false,
    },
    {
      command_name: 'Copy file path',
      key: 'ctrl+alt+c',
      dialog_type: 'none',
      action: {
        type: 'power_shell',
        command: 'Copy file path.ps1',
      },
      valid_on_addressbar: true,
    },
    {
      command_name: 'New File',
      key: 'ctrl+n',
      dialog_type: 'multi_line',
      action: {
        type: 'power_shell',
        command: 'New File.ps1',
      },
      valid_on_addressbar: true,
    },
    {
      command_name: 'New Folder',
      key: 'ctrl+n',
      dialog_type: 'multi_line',
      action: {
        type: 'power_shell',
        command: 'New Folder.ps1',
      },
      valid_on_addressbar: true,
    },
    {
      command_name: 'Rename',
      key: 'ctrl+n',
      dialog_type: 'reference_selection',
      action: {
        type: 'power_shell',
        command: 'Rename.ps1',
      },
      valid_on_addressbar: true,
    },
    {
      command_name: 'moveDown',
      key: 'ArrowDown',
      dialog_type: 'none',
      action: {
        type: 'build_in',
        command: 'moveDown',
      },
      valid_on_addressbar: false,
    },
    {
      command_name: 'moveDownSelect',
      key: 'shift+ArrowDown',
      dialog_type: 'none',
      action: {
        type: 'build_in',
        command: 'moveDownSelect',
      },
      valid_on_addressbar: false,
    },
    {
      command_name: 'moveUp',
      key: 'ArrowUp',
      dialog_type: 'none',
      action: {
        type: 'build_in',
        command: 'moveUp',
      },
      valid_on_addressbar: false,
    },
    {
      command_name: 'moveUpSelect',
      key: 'shift+ArrowUp',
      dialog_type: 'none',
      action: {
        type: 'build_in',
        command: 'moveUpSelect',
      },
      valid_on_addressbar: false,
    },
    {
      command_name: 'moveTop',
      key: 'Home',
      dialog_type: 'none',
      action: {
        type: 'build_in',
        command: 'moveTop',
      },
      valid_on_addressbar: false,
    },
    {
      command_name: 'moveTopSelect',
      key: 'shift+Home',
      dialog_type: 'none',
      action: {
        type: 'build_in',
        command: 'moveTopSelect',
      },
      valid_on_addressbar: false,
    },
    {
      command_name: 'moveBottom',
      key: 'End',
      dialog_type: 'none',
      action: {
        type: 'build_in',
        command: 'moveBottom',
      },
      valid_on_addressbar: false,
    },
    {
      command_name: 'moveBottomSelect',
      key: 'shift+End',
      dialog_type: 'none',
      action: {
        type: 'build_in',
        command: 'moveBottomSelect',
      },
      valid_on_addressbar: false,
    },
    {
      command_name: 'selectAll',
      key: 'ctrl+a',
      dialog_type: 'none',
      action: {
        type: 'build_in',
        command: 'selectAll',
      },
      valid_on_addressbar: false,
    },
    // {
    //   command_name: 'clearSelection',
    //   key: 'Escape',
    //   dialog_type: 'none',
    //   action: {
    //     type: 'build_in',
    //     command: 'clearSelection',
    //   },
    //   valid_on_addressbar: false,
    // },
    {
      command_name: 'toggleSelection',
      key: 'Space',
      dialog_type: 'none',
      action: {
        type: 'build_in',
        command: 'toggleSelection',
      },
      valid_on_addressbar: false,
    },
    {
      command_name: 'selectCurrentOnly',
      key: 'shift+Space',
      dialog_type: 'none',
      action: {
        type: 'build_in',
        command: 'selectCurrentOnly',
      },
      valid_on_addressbar: false,
    },
    {
      command_name: 'addNewTab',
      key: 'ctrl+t',
      dialog_type: 'none',
      action: {
        type: 'build_in',
        command: 'addNewTab',
      },
      valid_on_addressbar: false,
    },
    {
      command_name: 'removeTab',
      key: 'ctrl+w',
      dialog_type: 'none',
      action: {
        type: 'build_in',
        command: 'removeTab',
      },
      valid_on_addressbar: false,
    },
    {
      command_name: 'removeOtherTabs',
      key: 'ctrl+Shift+w',
      dialog_type: 'none',
      action: {
        type: 'build_in',
        command: 'removeOtherTabs',
      },
      valid_on_addressbar: true,
    },
    {
      command_name: 'removeAllRightTabs',
      key: 'ctrl+Shift+w',
      dialog_type: 'none',
      action: {
        type: 'build_in',
        command: 'removeAllRightTabs',
      },
      valid_on_addressbar: true,
    },
    {
      command_name: 'removeAllLeftTabs',
      key: 'ctrl+Shift+w',
      dialog_type: 'none',
      action: {
        type: 'build_in',
        command: 'removeAllLeftTabs',
      },
      valid_on_addressbar: true,
    },
    {
      command_name: 'toPrevTab',
      key: 'ctrl+shift+tab',
      dialog_type: 'none',
      action: {
        type: 'build_in',
        command: 'toPrevTab',
      },
      valid_on_addressbar: true,
    },
    {
      command_name: 'toNextTab',
      key: 'ctrl+tab',
      dialog_type: 'none',
      action: {
        type: 'build_in',
        command: 'toNextTab',
      },
      valid_on_addressbar: true,
    },
    {
      command_name: 'toPrevTab',
      key: 'ctrl+shift+ArrowLeft',
      dialog_type: 'none',
      action: {
        type: 'build_in',
        command: 'toPrevTab',
      },
      valid_on_addressbar: true,
    },
    {
      command_name: 'toNextTab',
      key: 'ctrl+Shift+ArrowRight',
      dialog_type: 'none',
      action: {
        type: 'build_in',
        command: 'toNextTab',
      },
      valid_on_addressbar: true,
    },
    {
      command_name: 'accessCurrentItem',
      key: 'Enter',
      dialog_type: 'none',
      action: {
        type: 'build_in',
        command: 'accessCurrentItem',
      },
      valid_on_addressbar: false,
    },
    {
      command_name: 'accessParentDir',
      key: 'ctrl+shift+ArrowUp',
      dialog_type: 'none',
      action: {
        type: 'build_in',
        command: 'accessParentDir',
      },
      valid_on_addressbar: true,
    },
    {
      command_name: 'focusAddoressBar',
      key: 'ctrl+l',
      dialog_type: 'none',
      action: {
        type: 'build_in',
        command: 'focusAddoressBar',
      },
      valid_on_addressbar: false,
    },

    {
      command_name: 'clearFilter',
      key: 'Escape',
      dialog_type: 'none',
      action: {
        type: 'build_in',
        command: 'clearFilter',
      },
      valid_on_addressbar: false,
    },
    {
      command_name: 'deleteFilterSingleSingle',
      key: 'backspace',
      dialog_type: 'none',
      action: {
        type: 'build_in',
        command: 'deleteFilterSingleSingle',
      },
      valid_on_addressbar: false,
    },
    {
      command_name: 'focusFilterBar',
      key: 'ctrl+f',
      dialog_type: 'none',
      action: {
        type: 'build_in',
        command: 'focusFilterBar',
      },
      valid_on_addressbar: true,
    },
    {
      command_name: 'Set Filter StrMatch',
      key: 'ctrl+f',
      dialog_type: 'none',
      action: {
        type: 'build_in',
        command: 'setFilterStrMatch',
      },
      valid_on_addressbar: true,
    },
    {
      command_name: 'Set Filter RegExp',
      key: 'ctrl+f',
      dialog_type: 'none',
      action: {
        type: 'build_in',
        command: 'setFilterRegExp',
      },
      valid_on_addressbar: true,
    },
    {
      command_name: 'focusOppositePane',
      key: 'tab',
      dialog_type: 'none',
      action: {
        type: 'build_in',
        command: 'focusOppositePane',
      },
      valid_on_addressbar: true,
    },
    {
      command_name: 'focusCommandBar',
      key: 'Ctrl+@',
      dialog_type: 'none',
      action: {
        type: 'build_in',
        command: 'focusCommandBar',
      },
      valid_on_addressbar: true,
    },
    {
      command_name: 'PowerShell',
      key: 'ctrl+@',
      dialog_type: 'none',
      action: {
        type: 'power_shell',
        command: 'General/script/StartUpPowerShell.ps1',
      },
      valid_on_addressbar: true,
    },
    {
      command_name: 'PowerShell(Admin)',
      key: 'ctrl+@',
      dialog_type: 'none',
      action: {
        type: 'power_shell',
        command: 'General/script/StartUpAdminPowerShell.ps1',
      },
      valid_on_addressbar: true,
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


  const setCommandCommandList: KeyBindSetting[] = alfabetList.map(key => (
    {
      command_name: 'setKeyBind',
      key: 'ctrl+' + key,
      dialog_type: 'none',
      action: {
        type: 'build_in',
        command: 'setKeyBind',
      },
      valid_on_addressbar: false,
    }
  ));
  const result = defined.concat(setCommandCommandList);

  writeKeyBindSetting(result);
  return result;
}

