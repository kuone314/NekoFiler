use std::{
  fs::{self, Metadata},
  os::windows::fs::{FileTypeExt, MetadataExt},
  path::PathBuf,
  sync::Mutex,
};

use chrono::{DateTime, Local};
use winapi::um::winbase::GetLogicalDriveStringsA;
use winapi::um::winnt::CHAR;

use once_cell::sync::Lazy;

mod get_file_icon;
use get_file_icon::get_file_icon;

use tauri::Manager;

#[derive(Debug)]
pub struct FileBaseInfo {
  file_name: String,
  meta_data: Option<Metadata>,
}
impl FileBaseInfo {
  fn file_size(&self) -> Option<u64> {
    if self.is_directory() {
      return None;
    }
    self
      .meta_data
      .as_ref()
      .map(|meta_data| meta_data.file_size())
  }

  fn is_directory(&self) -> bool {
    self
      .meta_data
      .as_ref()
      .map(|meta_data| meta_data.file_type())
      .map(|file_type| file_type.is_dir() || file_type.is_symlink_dir())
      .unwrap_or_default()
  }

  fn date(&self) -> Option<String> {
    let Some(meta_data) = self.meta_data.as_ref() else {
      return None;
    };
    get_date_str(&meta_data)
  }

  fn file_extension(&self) -> String {
    if self.is_directory() {
      return "folder".to_owned();
    }

    let result = PathBuf::from(&self.file_name)
      .extension()
      .unwrap_or_default()
      .to_string_lossy()
      .to_string();
    if result.is_empty() {
      return "-".to_string();
    };
    result
  }
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct FileListItem {
  is_selected: bool,
  file_name: String,
  file_extension: String,
  file_size: Option<u64>,
  is_directory: bool,
  file_icon: Option<String>,
  date: Option<String>,
}

impl FileListItem {
  pub fn new(
    base_info: &FileBaseInfo,
    is_selected: bool,
  ) -> Self {
    FileListItem {
      is_selected,
      file_name: base_info.file_name.to_string(),
      file_extension: base_info.file_extension(),
      file_size: base_info.file_size(),
      is_directory: base_info.is_directory(),
      file_icon: None,
      date: base_info.date(),
    }
  }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileListInfo {
  item_list: Vec<FileListItem>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PaneInfo {
  pane_idx: usize,
  dirctry_path: String,
  init_focus_item: String,
  file_list_info: Option<FileListInfo>,
}
impl PaneInfo {
  fn new(pane_idx: usize) -> Self {
    Self {
      pane_idx,
      dirctry_path: "".to_owned(),
      file_list_info: None,
      init_focus_item: "".to_owned(),
    }
  }
}

#[derive(Debug)]
pub struct FilerData {
  pane_info_list: [PaneInfo; 2],
}
impl FilerData {
  fn new() -> Self {
    Self {
      pane_info_list: [PaneInfo::new(0), PaneInfo::new(1)],
    }
  }
}

static PANE_DATA: Lazy<Mutex<FilerData>> = Lazy::new(|| Mutex::new(FilerData::new()));

#[tauri::command]
pub fn set_dirctry_path(
  pane_idx: usize,
  path: &str,
  initial_focus: Option<String>,
) -> Option<PaneInfo> {
  let Ok(mut data_store) = PANE_DATA.lock() else {
    return None;
  };

  data_store.pane_info_list[pane_idx].dirctry_path = path.to_string();

  data_store.pane_info_list[pane_idx].file_list_info = None;
  initial_focus.map(|initial_focus| {
    data_store.pane_info_list[pane_idx].init_focus_item = initial_focus.to_string()
  });

  update_file_name_list(&mut data_store.pane_info_list[pane_idx]);
  Some(data_store.pane_info_list[pane_idx].clone())
}

#[tauri::command]
pub fn set_focus_item(
  paneidx: usize,
  focusitem: &str,
) -> Option<PaneInfo> {
  let Ok(mut data_store) = PANE_DATA.lock() else {
    return None;
  };

  data_store.pane_info_list[paneidx].init_focus_item = focusitem.to_string();
  Some(data_store.pane_info_list[paneidx].clone())
}

///////////////////////////////////////////////////////////////////////////////////////////////////
pub fn get_pane_data(paneidx: usize) -> Option<PaneInfo> {
  let Ok(data_store) = PANE_DATA.lock() else {
    return None;
  };
  Some(data_store.pane_info_list[paneidx].clone())
}

pub fn update_pane_data(
  app_handle: &tauri::AppHandle,
  pane_idx: usize,
  prev_init_focus_item: &String,
  pane_info: PaneInfo,
) {
  let Ok(mut data_store) = PANE_DATA.lock() else {
    return;
  };

  if data_store.pane_info_list[pane_idx].init_focus_item != *prev_init_focus_item {
    return;
  }
  if data_store.pane_info_list[pane_idx].dirctry_path != pane_info.dirctry_path {
    return;
  }

  let _ = app_handle.emit_all("update_path_list", &pane_info);
  data_store.pane_info_list[pane_idx] = pane_info;
}

pub fn update_file_list(app_handle: &tauri::AppHandle) {
  for pane_idx in 0..=1 {
    let Some(mut pane_info) = get_pane_data(pane_idx) else {
      continue;
    };
    let prev_init_focus_item = pane_info.init_focus_item.clone();

    update_file_name_list(&mut pane_info);
    update_pane_data(
      app_handle,
      pane_idx,
      &prev_init_focus_item,
      pane_info.clone(),
    );

    pane_info.file_list_info.as_mut().map(|file_list_info| {
      for file_list_item in file_list_info.item_list.iter_mut() {
        update_icon_info(&pane_info.dirctry_path, file_list_item);
      }
    });
    update_pane_data(app_handle, pane_idx, &prev_init_focus_item, pane_info);
  }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileUpdateInfo {
  directory_path: String,
  file_name: String,
  file_icon: Option<String>,
  file_size: Option<String>,
  date: Option<String>,
}

fn update_icon_info(
  directory_path: &String,
  file_info: &mut FileListItem,
) {
  let file_path = &PathBuf::from(&directory_path).join(&file_info.file_name);
  file_info.file_icon = get_file_icon(file_path);
}

pub fn update_file_name_list(pane_info: &mut PaneInfo) {
  let new_file_list = get_file_list(&pane_info.dirctry_path);

  let new_file_name_list = new_file_list
    .as_ref()
    .unwrap_or(&vec![])
    .into_iter()
    .map(|item| item.file_name.to_string())
    .collect::<Vec<_>>();

  // 既にある物の位置は変えない。
  // 新規の物を下に追加しする。
  // 新規がある場合は、新規の物のみを選択状態にする。
  if pane_info.file_list_info.is_none() {
    if !new_file_name_list.contains(&pane_info.init_focus_item) {
      pane_info.init_focus_item = new_file_name_list.get(0).cloned().unwrap_or_default();
    }

    let item_list = new_file_list.as_ref().map(|file_list| {
      file_list
        .into_iter()
        .map(|file| FileListItem::new(&file, false))
        .collect()
    });
    pane_info.file_list_info = match item_list {
      Some(item_list) => Some(FileListInfo { item_list }),
      None => None,
    };
    return;
  }

  let mut remain = pane_info
    .file_list_info
    .as_ref()
    .unwrap()
    .item_list
    .iter()
    .filter(|item| {
      new_file_name_list
        .iter()
        .any(|name| *name == item.file_name)
    })
    .cloned()
    .collect::<Vec<_>>();

  let added = new_file_list
    .as_ref()
    .unwrap()
    .into_iter()
    .filter(|file| {
      remain
        .iter()
        .all(|remain| remain.file_name != file.file_name)
    })
    .map(|file| FileListItem::new(file.to_owned(), true))
    .collect::<Vec<_>>();

  if !added.is_empty() {
    for item in &mut remain {
      item.is_selected = false;
    }
  }

  let item_list: Vec<_> = [&remain[..], &added[..]].concat();

  if !new_file_name_list.contains(&pane_info.init_focus_item) {
    let new_idx = pane_info
      .file_list_info
      .as_ref()
      .unwrap()
      .item_list
      .iter()
      .take_while(|&item| item.file_name != pane_info.init_focus_item)
      .filter(|item| {
        new_file_name_list
          .iter()
          .any(|name| *name == item.file_name)
      })
      .count();

    let new_selection = item_list
      .get(new_idx)
      .or_else(|| item_list.last())
      .map(|item| item.file_name.to_owned())
      .unwrap_or("".to_owned());

    pane_info.init_focus_item = new_selection.to_string();
  }

  pane_info.file_list_info = Some(FileListInfo { item_list });
}

///////////////////////////////////////////////////////////////////////////////////////////////////
fn get_file_list(path: &str) -> Option<Vec<FileBaseInfo>> {
  if path.is_empty() {
    // Windows用 ドライブ一覧の表示
    // Linux対応するなら、この辺の処理の変更が要るはず。
    return Some(
      drive_list()
        .into_iter()
        .map(|file_name| FileBaseInfo {
          meta_data: fs::metadata(&file_name).ok(),
          file_name,
        })
        .collect(),
    );
  }

  let path = PathBuf::from(path);
  let result: Vec<FileBaseInfo> = fs::read_dir(path)
    .ok()?
    .filter_map(|entry| entry.ok())
    .map(|entry| FileBaseInfo {
      file_name: entry.file_name().to_string_lossy().to_string(),
      meta_data: entry.metadata().ok(),
    })
    .collect();
  Some(result)
}

fn drive_list() -> Vec<String> {
  let (buffer, len) = get_logical_drive_strings();

  let raw_ary: Vec<u8> = buffer
    .into_iter()
    .take(len as usize)
    .map(|val| val as u8)
    .collect();

  raw_ary
    .split(|&x| x == 0)
    .filter(|x| !x.is_empty())
    .filter_map(|drive| String::from_utf8(drive.to_vec()).ok())
    .map(|drive| drive.replace(r":\", ":"))
    .collect()
}

fn get_logical_drive_strings() -> ([i8; 255], u32) {
  unsafe {
    let mut buffer: [CHAR; 255] = [0; 255];
    let len = GetLogicalDriveStringsA(255, buffer.as_mut_ptr());
    return (buffer, len);
  }
}

///////////////////////////////////////////////////////////////////////////////////////////////////
fn get_date_str(file_data: &Metadata) -> Option<String> {
  let modified_time = file_data.modified().ok()?;

  let local_time: DateTime<Local> = modified_time.into();
  Some(local_time.format("%Y/%m/%d %H:%M:%S").to_string())
}

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
  paneidx: usize,
  sork_key: SortKey,
) -> Option<PaneInfo>{
  let Ok(mut data_store) = PANE_DATA.lock() else {
    return None;
  };

  let Some(ref mut file_list_info) = data_store.pane_info_list[paneidx].file_list_info else {
    return None;
  };
  match sork_key {
    SortKey::Name => {
      file_list_info
        .item_list
        .sort_by(|a, b| a.file_name.cmp(&b.file_name));
    }
    SortKey::FileType => {
      file_list_info
        .item_list
        .sort_by(|a, b| a.file_extension.cmp(&b.file_extension));
    }
    SortKey::Size => {
      file_list_info
        .item_list
        .sort_by(|a, b| a.file_size.cmp(&b.file_size));
    }
    SortKey::Date => {
      file_list_info.item_list.sort_by(|a, b| a.date.cmp(&b.date));
    }
  }

  Some(data_store.pane_info_list[paneidx].clone())
}

///////////////////////////////////////////////////////////////////////////////////////////////////
#[tauri::command]
pub fn add_selecting_idx(
  paneidx: usize,
  additional_select_idx_list: Vec<usize>,
) -> Option<PaneInfo> {
  let Ok(mut data_store) = PANE_DATA.lock() else {
    return None;
  };

  let Some(ref mut file_list_info) = data_store.pane_info_list[paneidx].file_list_info else {
    return None;
  };

  for idx in additional_select_idx_list {
    file_list_info.item_list[idx].is_selected = true;
  }

  Some(data_store.pane_info_list[paneidx].clone())
}

#[tauri::command]
pub fn set_selecting_idx(
  paneidx: usize,
  new_select_idx_list: Vec<usize>,
) -> Option<PaneInfo> {
  let Ok(mut data_store) = PANE_DATA.lock() else {
    return None;
  };

  let Some(ref mut file_list_info) = data_store.pane_info_list[paneidx].file_list_info else {
    return None;
  };

  for item in file_list_info.item_list.iter_mut() {
    item.is_selected = false;
  }

  for idx in new_select_idx_list {
    file_list_info.item_list[idx].is_selected = true;
  }

  Some(data_store.pane_info_list[paneidx].clone())
}

#[tauri::command]
pub fn toggle_selection(
  paneidx: usize,
  trg_idx: usize,
) -> Option<PaneInfo> {
  let Ok(mut data_store) = PANE_DATA.lock() else {
    return None;
  };

  let Some(ref mut file_list_info) = data_store.pane_info_list[paneidx].file_list_info else {
    return None;
  };

  file_list_info.item_list[trg_idx].is_selected = !file_list_info.item_list[trg_idx].is_selected;

  Some(data_store.pane_info_list[paneidx].clone())
}
