Add-Type -AssemblyName System.Windows.Forms;
$dataObj = New-Object System.Windows.Forms.DataObject;
$dataObj.SetFileDropList($selecting_item_path_ary);
$byteStream = [byte[]](([System.Windows.Forms.DragDropEffects]::Move -as [byte]), 0, 0, 0);
$memoryStream = [System.IO.MemoryStream]::new($byteStream);
$dataObj.SetData("Preferred DropEffect", $memoryStream);
[System.Windows.Forms.Clipboard]::SetDataObject($dataObj, $true);
      