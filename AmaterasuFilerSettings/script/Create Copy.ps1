for ($index=0; $index -lt $selecting_item_path_ary.count; $index++){
  $selecting_item_path = $selecting_item_path_ary[$index];
  $dialog_input_str = $dialog_input_str_ary[$index];
  Copy-Item -Recurse -Path $selecting_item_path -Destination $dialog_input_str
}
      