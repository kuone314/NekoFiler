Add-Type -AssemblyName System.Windows.Forms;

$files = [Windows.Forms.Clipboard]::GetFileDropList() ;
$data = [Windows.Forms.Clipboard]::GetDataObject();
$dropEffect = $data.GetData("Preferred DropEffect");
$flag = $dropEffect.ReadByte();

if ($flag -band [Windows.Forms.DragDropEffects]::Copy) {
    Copy-Item $files $current_dir;
}
if ($flag -band [Windows.Forms.DragDropEffects]::Move) {
    Move-Item $files $current_dir;
}
      