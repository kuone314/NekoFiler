use crate::pane_info::FileListFullInfo;
use super::{FileListUiInfo, PANE_DATA};


///////////////////////////////////////////////////////////////////////////////////////////////////
#[derive(Serialize, Deserialize, Debug)]
pub enum SortKey {
  Name,
  FileType,
  Size,
  Date,
}

#[tauri::command]
pub fn sort_file_list(
  pane_idx: usize,
  sork_key: SortKey,
) -> Option<FileListUiInfo> {
  let mut pane_info = PANE_DATA.pane_info_list[pane_idx].get_info();

  let Some(ref mut file_list_info) = pane_info.file_list_info else {
    return None;
  };

  let focus_file_name = file_list_info.focus_file_name();

  match sork_key {
    SortKey::Name => {
      file_list_info
        .full_item_list
        .sort_by(|a, b| a.file_name.cmp(&b.file_name));
    }
    SortKey::FileType => {
      file_list_info
        .full_item_list
        .sort_by(|a, b| a.file_extension.cmp(&b.file_extension));
    }
    SortKey::Size => {
      file_list_info
        .full_item_list
        .sort_by(|a, b| a.file_size.cmp(&b.file_size));
    }
    SortKey::Date => {
      file_list_info
        .full_item_list
        .sort_by(|a, b| a.date.cmp(&b.date));
    }
  }

  let mut file_list_info = FileListFullInfo::create(
    std::mem::take(&mut file_list_info.full_item_list),
    0,
    &pane_info.filter,
  );

  file_list_info.focus_idx = focus_file_name
    .and_then(|name| {
      file_list_info
        .filtered_item_info
        .iter()
        .position(|item| file_list_info.full_item_list[item.org_idx].file_name == name)
    })
    .unwrap_or(0);

  Some(file_list_info.to_ui_info())
}
