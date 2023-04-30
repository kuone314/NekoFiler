for ($index=0; $index -lt $selecting_item_path_ary.count; $index++){
  Rename-Item $selecting_item_path_ary[$index] $dialog_input_str_ary[$index]
}
      