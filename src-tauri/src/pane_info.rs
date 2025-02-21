use std::{
  collections::{HashMap, HashSet},
  path::PathBuf,
  sync::{Mutex, MutexGuard},
};

use once_cell::sync::Lazy;

mod get_file_icon;
use get_file_icon::{get_file_icon, Color};

mod get_file_list;
use get_file_list::{get_file_list, FileBaseInfo};

mod filter_info;
use filter_info::FilterInfo;
use tauri::Emitter;

pub mod selections;
pub mod sort;

///////////////////////////////////////////////////////////////////////////////////////////////////
#[derive(Debug, Serialize, Clone)]
pub struct FileListUiInfo {
  full_item_num: usize,
  filtered_item_list: Vec<FileListFilteredItem>,
  focus_idx: usize,
}

#[derive(Debug, Serialize, Clone)]
pub struct FileListFilteredItem {
  file_list_item: FileListItem,
  matched_idx_list: Vec<usize>,
}

#[derive(Debug, Serialize, Clone)]
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

///////////////////////////////////////////////////////////////////////////////////////////////////
#[derive(Debug, Clone)]
pub struct FilterdFileInfo {
  org_idx: usize,
  matched_file_name_idx: Vec<usize>,
}

#[derive(Debug, Clone)]
pub struct FileListFullInfo {
  full_item_list: Vec<FileListItem>,
  filtered_item_info: Vec<FilterdFileInfo>,
  focus_idx: usize, // filtered_item_list のインデックス
}

impl FileListFullInfo {
  fn new(
    dirctry_path: &String,
    initial_focus: Option<String>,
  ) -> Option<FileListFullInfo> {
    let file_list = get_file_list(&dirctry_path);
    let file_list = file_list.map(|file_list| {
      file_list
        .iter()
        .map(|file_data| FileListItem::new(file_data, false))
        .collect::<Vec<_>>()
    });

    let focus_idx = initial_focus
      .and_then(|initial_focus| {
        file_list
          .as_ref()?
          .iter()
          .position(|file| file.file_name == initial_focus)
      })
      .unwrap_or(0);

    file_list.map(|file_list| FileListFullInfo {
      filtered_item_info: (0..file_list.len())
        .map(|org_idx| FilterdFileInfo {
          org_idx,
          matched_file_name_idx: Vec::new(),
        })
        .collect(),
      focus_idx,
      full_item_list: file_list,
    })
  }

  fn focus_file_name(self: &FileListFullInfo) -> Option<String> {
    self
      .filtered_item_info
      .get(self.focus_idx)
      .map(|item| self.full_item_list[item.org_idx].file_name.clone())
  }

  fn to_ui_info(self: &FileListFullInfo) -> FileListUiInfo {
    let filtered_item_list = self
      .filtered_item_info
      .iter()
      .map(|item| FileListFilteredItem {
        file_list_item: self.full_item_list[item.org_idx].clone(),
        matched_idx_list: item.matched_file_name_idx.clone(),
      })
      .collect::<Vec<_>>();
    FileListUiInfo {
      full_item_num: self.full_item_list.len(),
      filtered_item_list,
      focus_idx: self.focus_idx,
    }
  }

  fn create(
    full_item_list: Vec<FileListItem>,
    full_focus_idx: usize,
    filter: &FilterInfo,
  ) -> FileListFullInfo {
    let before_focus_range = 0..full_focus_idx;
    let after_focus_range = full_focus_idx..full_item_list.len();

    let before_focus = to_filtered_item_info(before_focus_range, &full_item_list, filter);
    let after_focus = to_filtered_item_info(after_focus_range, &full_item_list, filter);

    let filtered_item_info = [&before_focus[..], &after_focus[..]].concat();
    let focus_idx = before_focus.len();

    FileListFullInfo {
      full_item_list,
      filtered_item_info,
      focus_idx,
    }
  }
}

fn to_filtered_item_info(
  idx_range: std::ops::Range<usize>,
  full_item_list: &[FileListItem],
  filter: &FilterInfo,
) -> Vec<FilterdFileInfo> {
  idx_range
    .filter_map(|idx| {
      let match_result = filter.is_match(&full_item_list[idx].file_name);
      match_result.map(|matched_file_name_idx| FilterdFileInfo {
        org_idx: idx,
        matched_file_name_idx,
      })
    })
    .collect::<Vec<_>>()
}

///////////////////////////////////////////////////////////////////////////////////////////////////
#[derive(Debug)]
pub struct PaneHandler {
  pane_idx: usize,
  data: Lazy<Mutex<PaneInfo>>,
  update_cancel_flag: Lazy<Mutex<bool>>,
}
impl PaneHandler {
  fn get_info<'a>(&'a self) -> MutexGuard<'a, PaneInfo> {
    *self.update_cancel_flag.lock().unwrap() = true;
    self.data.lock().unwrap()
  }

  fn update_cancel_required(&self) -> bool {
    let Ok(value) = self.update_cancel_flag.try_lock() else {
      return false;
    };
    *value
  }

  fn new(pane_idx: usize) -> Self {
    Self {
      pane_idx,
      data: Lazy::new(|| Mutex::new(PaneInfo::new())),
      update_cancel_flag: Lazy::new(|| Mutex::new(false)),
    }
  }
}

#[derive(Debug, Clone)]
pub struct PaneInfo {
  dirctry_path: String,
  filter: FilterInfo,
  file_list_info: Option<FileListFullInfo>,
}
impl PaneInfo {
  fn new() -> Self {
    Self {
      dirctry_path: "".to_owned(),
      filter: FilterInfo::new(),
      file_list_info: None,
    }
  }
}

#[derive(Debug)]
pub struct FilerData {
  background: Lazy<Mutex<Color>>,
  pane_info_list: [PaneHandler; 2],
}

impl FilerData {
  fn new() -> Self {
    Self {
      background: Lazy::new(|| Mutex::new(Color { r: 0, g: 0, b: 0 })),
      pane_info_list: [PaneHandler::new(0), PaneHandler::new(1)],
    }
  }
}

static PANE_DATA: Lazy<FilerData> = Lazy::new(|| FilerData::new());

///////////////////////////////////////////////////////////////////////////////////////////////////
#[tauri::command]
pub fn set_background_color(color: Color) {
  *PANE_DATA.background.lock().unwrap() = color;
}

///////////////////////////////////////////////////////////////////////////////////////////////////
#[tauri::command]
pub fn set_dirctry_path(
  pane_idx: usize,
  path: &str,
  initial_focus: Option<String>,
) -> Option<FileListUiInfo> {
  let mut pane_info = PANE_DATA.pane_info_list[pane_idx].get_info();

  if pane_info.dirctry_path == path {
    // パスの変更が無ければ、選択要素のみを変更する。
    let Some(ref mut file_list_info) = &mut pane_info.file_list_info else {
      return None;
    };
    let Some(initial_focus) = initial_focus else {
      return Some(file_list_info.to_ui_info());
    };

    let new_idx = file_list_info
      .filtered_item_info
      .iter()
      .position(|item| file_list_info.full_item_list[item.org_idx].file_name == initial_focus);

    file_list_info.focus_idx = new_idx.unwrap_or(file_list_info.focus_idx);
    return Some(file_list_info.to_ui_info());
  }

  let path = path.to_string();
  let file_list_info = FileListFullInfo::new(&path, initial_focus);

  *pane_info = PaneInfo {
    dirctry_path: path,
    filter: FilterInfo::new(),
    file_list_info,
  };
  pane_info
    .file_list_info
    .as_ref()
    .map(|item| item.to_ui_info())
}

#[tauri::command]
pub fn set_focus_idx(
  pane_idx: usize,
  new_focus_idx: usize,
) -> Option<FileListUiInfo> {
  let mut pane_info = PANE_DATA.pane_info_list[pane_idx].get_info();

  let Some(file_list_info) = &mut pane_info.file_list_info else {
    return None;
  };

  file_list_info.focus_idx = new_focus_idx;
  pane_info
    .file_list_info
    .as_ref()
    .map(|item| item.to_ui_info())
}

#[tauri::command]
pub fn set_filter(
  pane_idx: usize,
  filter: FilterInfo,
) -> Option<FileListUiInfo> {
  let mut pane_info = PANE_DATA.pane_info_list[pane_idx].get_info();

  pane_info.filter = filter;

  let Some(file_list_info) = &mut pane_info.file_list_info else {
    return None;
  };

  pane_info.file_list_info = Some(FileListFullInfo::create(
    file_list_info.full_item_list.clone(),
    0, // インデックスは別途設定
    &pane_info.filter,
  ));

  // TODO:インデックスの設定
  // 元の選択が有るならそれを維持
  // 無いなら、一致度を定めて、最も一致する物にする。

  pane_info
    .file_list_info
    .as_ref()
    .map(|item| item.to_ui_info())
}

///////////////////////////////////////////////////////////////////////////////////////////////////
#[derive(Debug, Serialize, Clone)]
pub struct UpdateFileListUiInfo {
  pane_idx: usize,
  data: Option<FileListUiInfo>,
}

pub fn update_file_list(app_handle: &tauri::AppHandle) {
  let Ok(background) = PANE_DATA.background.try_lock() else {
    return;
  };

  for pane_idx in 0..=1 {
    update_pane_info(&PANE_DATA.pane_info_list[pane_idx], app_handle, &background);
  }
}

fn update_pane_info(
  pane_handler: &PaneHandler,
  app_handle: &tauri::AppHandle,
  background: &Color,
) {
  let Ok(mut pane_info) = pane_handler.data.try_lock() else {
    return;
  };
  *pane_handler.update_cancel_flag.lock().unwrap() = false;

  update_file_name_list(&mut pane_info);
  if pane_handler.update_cancel_required() {
    return;
  }
  let _ = app_handle.emit(
    "update_path_list",
    UpdateFileListUiInfo {
      pane_idx: pane_handler.pane_idx,
      data: pane_info
        .file_list_info
        .as_ref()
        .map(|item| item.to_ui_info()),
    },
  );

  let dirctry_path = pane_info.dirctry_path.clone();
  let Some(file_list_info) = &mut pane_info.file_list_info else {
    return;
  };

  // フィルタ後の物だけで良いかも。
  for file_list_item in file_list_info.full_item_list.iter_mut() {
    let file_path = &PathBuf::from(&dirctry_path).join(&file_list_item.file_name);
    file_list_item.file_icon = get_file_icon(file_path, &background);

    if pane_handler.update_cancel_required() {
      return;
    }
  }
  let _ = app_handle.emit(
    "update_path_list",
    UpdateFileListUiInfo {
      pane_idx: pane_handler.pane_idx,
      data: Some(file_list_info.to_ui_info()),
    },
  );
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileUpdateInfo {
  directory_path: String,
  file_name: String,
  file_icon: Option<String>,
  file_size: Option<String>,
  date: Option<String>,
}

pub fn update_file_name_list(pane_info: &mut PaneInfo) {
  let Some(mut file_list_info) = std::mem::take(&mut pane_info.file_list_info) else {
    let file_list_info = FileListFullInfo::new(&pane_info.dirctry_path, None);
    pane_info.file_list_info = file_list_info;
    return;
  };

  let Some(new_file_list) = get_file_list(&pane_info.dirctry_path) else {
    pane_info.file_list_info = None;
    return;
  };

  let org_focus_file_name = file_list_info.focus_file_name();

  let new_file_list_map = new_file_list
    .iter()
    .map(|file| (&file.file_name, file))
    .collect::<HashMap<_, _>>();

  // 既にある物の位置は変えない。
  // 新規の物を下に追加しする。
  // 新規がある場合は、新規の物のみを選択状態にする。
  let mut remain = file_list_info
    .full_item_list
    .iter_mut()
    .filter_map(|item| {
      new_file_list_map.get(&item.file_name).map(|file| {
        let mut new_item = FileListItem::new(&file, item.is_selected);
        new_item.file_icon = item.file_icon.take();
        new_item
      })
    })
    .collect::<Vec<_>>();

  let remain_file_name_list = remain
    .iter()
    .map(|item| &item.file_name)
    .collect::<HashSet<_>>();

  let added = new_file_list
    .iter()
    .filter(|file| !remain_file_name_list.contains(&file.file_name))
    .map(|file| FileListItem::new(&file, true))
    .collect::<Vec<_>>();

  if !added.is_empty() {
    for item in &mut remain {
      item.is_selected = false;
    }
  }

  let full_item_list: Vec<_> = [&remain[..], &added[..]].concat();

  let full_focus_idx = if !added.is_empty() {
    remain.len()
  } else if org_focus_file_name.is_none() {
    0
  } else {
    let org_focus_file_name = org_focus_file_name.unwrap();
    let full_matched_idx = remain
      .iter()
      .position(|item| item.file_name == org_focus_file_name);
    if full_matched_idx.is_some() {
      full_matched_idx.unwrap()
    } else {
      // 選択要素が無くなっているケース。消えた要素分繰り上げる形にする。
      file_list_info
        .full_item_list
        .iter()
        .take_while(|item| item.file_name == org_focus_file_name)
        .filter(|item| new_file_list_map.contains_key(&item.file_name))
        .count()
    }
  };

  pane_info.file_list_info = Some(FileListFullInfo::create(
    full_item_list,
    full_focus_idx,
    &pane_info.filter,
  ));
}
