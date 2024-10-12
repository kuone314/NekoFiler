
use super::{FileListUiInfo, PANE_DATA};

///////////////////////////////////////////////////////////////////////////////////////////////////

#[tauri::command]
pub fn add_selecting_idx(
  pane_idx: usize,
  additional_select_idx_list: Vec<usize>,
) -> Option<FileListUiInfo> {
  let mut pane_info = PANE_DATA.pane_info_list[pane_idx].get_info();

  let Some(ref mut file_list_info) = pane_info.file_list_info else {
    return None;
  };

  for idx in additional_select_idx_list {
    let Some(item) = file_list_info.filtered_item_info.get_mut(idx) else {
      continue;
    };
    file_list_info.full_item_list[item.org_idx].is_selected = true;
  }

  Some(file_list_info.to_ui_info())
}

#[tauri::command]
pub fn set_selecting_idx(
  pane_idx: usize,
  new_select_idx_list: Vec<usize>,
) -> Option<FileListUiInfo> {
  let mut pane_info = PANE_DATA.pane_info_list[pane_idx].get_info();

  let Some(ref mut file_list_info) = pane_info.file_list_info else {
    return None;
  };

  for item in file_list_info.filtered_item_info.iter_mut() {
    file_list_info.full_item_list[item.org_idx].is_selected = false;
  }

  for idx in new_select_idx_list {
    let Some(item) = file_list_info.filtered_item_info.get_mut(idx) else {
      continue;
    };
    file_list_info.full_item_list[item.org_idx].is_selected = true;
  }

  Some(file_list_info.to_ui_info())
}

#[tauri::command]
pub fn toggle_selection(
  pane_idx: usize,
  trg_idx: usize,
) -> Option<FileListUiInfo> {
  let mut pane_info = PANE_DATA.pane_info_list[pane_idx].get_info();

  let Some(ref mut file_list_info) = pane_info.file_list_info else {
    return None;
  };

  file_list_info
    .filtered_item_info
    .get_mut(trg_idx)
    .map(|item| {
      file_list_info.full_item_list[item.org_idx].is_selected =
        !file_list_info.full_item_list[item.org_idx].is_selected
    });

  Some(file_list_info.to_ui_info())
}
