use super::{FileListItem, FileListUiInfo, PANE_DATA};
use crate::pane_info::FileListFullInfo;

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

  let sorter = match sork_key {
    SortKey::Name => |a: &FileListItem, b: &FileListItem| a.file_name.cmp(&b.file_name),
    SortKey::FileType => |a: &FileListItem, b: &FileListItem| a.file_extension.cmp(&b.file_extension),
    SortKey::Size => |a: &FileListItem, b: &FileListItem| a.file_size.cmp(&b.file_size),
    SortKey::Date => |a: &FileListItem, b: &FileListItem| a.date.cmp(&b.date),
  };
  file_list_info.full_item_list.sort_by(sorter);

  let mut new_file_list_info = FileListFullInfo::create(
    std::mem::take(&mut file_list_info.full_item_list),
    0,
    &pane_info.filter,
  );

  new_file_list_info.focus_idx = focus_file_name
    .and_then(|name| {
      new_file_list_info
        .filtered_item_info
        .iter()
        .position(|item| new_file_list_info.full_item_list[item.org_idx].file_name == name)
    })
    .unwrap_or(0);

  pane_info.file_list_info = Some(new_file_list_info);
  pane_info
    .file_list_info
    .as_ref()
    .map(|item| item.to_ui_info())
}
