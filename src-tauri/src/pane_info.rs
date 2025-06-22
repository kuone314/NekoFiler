use itertools::Itertools;
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
use filter_info::{matching_rate, FilterInfo};
use tauri::Emitter;

pub mod selections;
pub mod sort;

///////////////////////////////////////////////////////////////////////////////////////////////////
pub fn get_file_list_ex(path: &str) -> Option<Vec<FileBaseInfo>> {
  let Some(result) = get_file_list(&path) else {
    return None;
  };

  let ignore_system_file = is_ignore_system_file();
  if !ignore_system_file {
    return Some(result);
  };

  Some(
    result
      .into_iter()
      .filter(|item| !item.is_system_file())
      .collect_vec(),
  )
}

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
    let Some(file_list) = get_file_list_ex(&dirctry_path) else {
      return None;
    };

    let file_list = file_list
      .iter()
      .map(|file_data| FileListItem::new(file_data, false))
      .collect::<Vec<_>>();

    let focus_idx = initial_focus
      .and_then(|initial_focus| {
        file_list
          .iter()
          .position(|file| file.file_name == initial_focus)
      })
      .unwrap_or(0);

    Some(FileListFullInfo {
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
  data: Mutex<PaneInfo>,
  ui_operation_required: Mutex<bool>,
}
pub struct PaneInfoForUiOperation<'a> {
  guard: MutexGuard<'a, PaneInfo>,
  ui_operation_required_ref: &'a Mutex<bool>,
}

impl<'a> Drop for PaneInfoForUiOperation<'a> {
  fn drop(&mut self) {
    *self.ui_operation_required_ref.lock().unwrap() = false;
  }
}

impl<'a> std::ops::Deref for PaneInfoForUiOperation<'a> {
  type Target = PaneInfo;

  fn deref(&self) -> &Self::Target {
    &*self.guard
  }
}

impl<'a> std::ops::DerefMut for PaneInfoForUiOperation<'a> {
  fn deref_mut(&mut self) -> &mut Self::Target {
    &mut *self.guard
  }
}

impl PaneHandler {
  pub fn get_info_for_ui_operation<'a>(&'a self) -> PaneInfoForUiOperation<'a> {
    *self.ui_operation_required.lock().unwrap() = true;
    let guard = self.data.lock().unwrap();
    PaneInfoForUiOperation {
      guard,
      ui_operation_required_ref: &self.ui_operation_required,
    }
  }

  fn ui_operation_required(&self) -> bool {
    let Ok(value) = self.ui_operation_required.try_lock() else {
      return false;
    };
    *value
  }

  fn new(pane_idx: usize) -> Self {
    Self {
      pane_idx,
      data: Mutex::new(PaneInfo::new()),
      ui_operation_required: Mutex::new(false),
    }
  }
}

#[derive(Debug, Clone)]
pub struct PaneInfo {
  dirctry_path: String,
  filter: FilterInfo,
  viewing_idx_range: std::ops::Range<usize>,
  file_list_info: Option<FileListFullInfo>,
}
impl PaneInfo {
  fn new() -> Self {
    Self {
      dirctry_path: "".to_owned(),
      filter: FilterInfo::new(),
      file_list_info: None,
      viewing_idx_range: 0..0,
    }
  }

  fn to_ui_info(self: &PaneInfo) -> Option<FileListUiInfo> {
    self.file_list_info.as_ref().map(|item| item.to_ui_info())
  }
}

#[derive(Debug)]
pub struct FilerData {
  ignore_system_file: Mutex<bool>,
  background: Mutex<Color>,
  pane_info_list: [PaneHandler; 2],
}

impl FilerData {
  fn new() -> Self {
    Self {
      ignore_system_file: Mutex::new(true),
      background: Mutex::new(Color { r: 0, g: 0, b: 0 }),
      pane_info_list: [PaneHandler::new(0), PaneHandler::new(1)],
    }
  }

  fn get_background(self: &FilerData) -> Color {
    self.background.lock().unwrap().clone()
  }
}

static PANE_DATA: Lazy<FilerData> = Lazy::new(|| FilerData::new());

///////////////////////////////////////////////////////////////////////////////////////////////////
#[tauri::command]
pub fn set_background_color(color: Color) {
  *PANE_DATA.background.lock().unwrap() = color;
}

#[tauri::command]
pub fn set_ignore_system_file(
  app_handle: tauri::AppHandle,
  value: bool,
) {
  *PANE_DATA.ignore_system_file.lock().unwrap() = value;
  update_file_list(&app_handle)
}

#[tauri::command]
pub fn is_ignore_system_file() -> bool {
  PANE_DATA.ignore_system_file.lock().unwrap().clone()
}

#[tauri::command]
pub fn set_viewing_idx_range(
  pane_idx: usize,
  range_stt: usize,
  range_end: usize,
) {
  let mut pane_info = PANE_DATA.pane_info_list[pane_idx].data.lock().unwrap();
  pane_info.viewing_idx_range = range_stt..range_end;
}

///////////////////////////////////////////////////////////////////////////////////////////////////
#[tauri::command]
pub fn set_dirctry_path(
  pane_idx: usize,
  path: &str,
  initial_focus: Option<String>,
) -> Option<FileListUiInfo> {
  let mut pane_info = PANE_DATA.pane_info_list[pane_idx].get_info_for_ui_operation();

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
    viewing_idx_range: 0..0,
  };
  pane_info.to_ui_info()
}

#[tauri::command]
pub fn set_focus_idx(
  pane_idx: usize,
  new_focus_idx: usize,
) -> Option<FileListUiInfo> {
  let mut pane_info = PANE_DATA.pane_info_list[pane_idx].get_info_for_ui_operation();

  let Some(file_list_info) = &mut pane_info.file_list_info else {
    return None;
  };

  file_list_info.focus_idx = new_focus_idx;
  pane_info.to_ui_info()
}

#[tauri::command]
pub fn set_filter(
  pane_idx: usize,
  filter: FilterInfo,
) -> Option<FileListUiInfo> {
  let mut pane_info = PANE_DATA.pane_info_list[pane_idx].get_info_for_ui_operation();

  let Some(file_list_info) = &mut pane_info.file_list_info else {
    pane_info.filter = filter;
    return None;
  };

  let full_item_list = std::mem::take(&mut file_list_info.full_item_list);

  let (full_item_list, matching_results) = full_item_list
    .into_iter()
    .map(|item| {
      let matching_result = filter.is_match(&item.file_name);
      (item, matching_result)
    })
    .sorted_by_key(|a| std::cmp::Reverse(matching_rate(&a.1)))
    .unzip::<_, _, Vec<_>, Vec<_>>();

  let filtered_item_info = matching_results
    .into_iter()
    .enumerate()
    .filter_map(|(org_idx, match_result)| {
      match_result.map(|matched_file_name_idx| FilterdFileInfo {
        org_idx,
        matched_file_name_idx,
      })
    })
    .collect_vec();

  pane_info.filter = filter;
  pane_info.file_list_info = Some(FileListFullInfo {
    full_item_list,
    filtered_item_info,
    focus_idx: 0,
  });

  pane_info.to_ui_info()
}

///////////////////////////////////////////////////////////////////////////////////////////////////
#[derive(Debug, Serialize, Clone)]
pub struct UpdateFileListUiInfo {
  pane_idx: usize,
  data: Option<FileListUiInfo>,
}

pub fn update_file_list(app_handle: &tauri::AppHandle) {
  let background = PANE_DATA.get_background();

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

  update_file_name_list(&mut pane_info);
  if pane_handler.ui_operation_required() {
    return;
  }
  let _ = app_handle.emit(
    "update_path_list",
    UpdateFileListUiInfo {
      pane_idx: pane_handler.pane_idx,
      data: pane_info.to_ui_info(),
    },
  );

  let viewing_idx_range = pane_info.viewing_idx_range.clone();
  let dirctry_path = pane_info.dirctry_path.clone();
  let Some(file_list_info) = &mut pane_info.file_list_info else {
    return;
  };

  for filterd_idx in viewing_idx_range {
    let Some(filtered_item_info) = file_list_info.filtered_item_info.get(filterd_idx) else {
      continue;
    };
    let org_idx = filtered_item_info.org_idx;
    let Some(file_list_item) = file_list_info.full_item_list.get_mut(org_idx) else {
      continue;
    };

    let file_path = &PathBuf::from(&dirctry_path).join(&file_list_item.file_name);
    file_list_item.file_icon = get_file_icon(file_path, &background);

    if pane_handler.ui_operation_required() {
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

  let Some(new_file_list) = get_file_list_ex(&pane_info.dirctry_path) else {
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
        .take_while(|item| item.file_name != org_focus_file_name)
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
