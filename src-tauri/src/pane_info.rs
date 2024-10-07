use std::{
  borrow::Cow,
  collections::HashSet,
  fs::{self, Metadata},
  os::windows::fs::{FileTypeExt, MetadataExt},
  path::PathBuf,
  sync::Mutex,
};

use tauri::regex::Regex;

use chrono::{DateTime, Local};
use winapi::um::winbase::GetLogicalDriveStringsA;
use winapi::um::winnt::CHAR;

use once_cell::sync::Lazy;

mod get_file_icon;
use get_file_icon::get_file_icon;

use tauri::Manager;

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

///////////////////////////////////////////////////////////////////////////////////////////////////
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
#[derive(Debug, Deserialize, Clone, PartialEq)]
pub enum FilterType {
  StrMatch,
  RegExpr,
}

#[derive(Debug, Deserialize, Clone, PartialEq)]
pub struct FilterInfo {
  filter_type: FilterType,
  matcher_str: String,
}

impl FilterInfo {
  fn new() -> Self {
    Self {
      filter_type: FilterType::StrMatch,
      matcher_str: "".to_string(),
    }
  }
}

type MatchResult = Option<Vec<usize>>;
impl FilterInfo {
  fn is_match(
    &self,
    target: &String,
  ) -> MatchResult {
    if self.matcher_str.is_empty() {
      return Some(Vec::new());
    }

    let exist_upper_case = self.matcher_str.chars().any(|c| c.is_uppercase());

    let matcher_str = if !exist_upper_case {
      Cow::Owned(self.matcher_str.to_lowercase())
    } else {
      Cow::Borrowed(&self.matcher_str)
    };

    let target = if !exist_upper_case {
      Cow::Owned(target.to_lowercase())
    } else {
      Cow::Borrowed(target)
    };

    match self.filter_type {
      FilterType::StrMatch => str_match(&matcher_str, &target),
      FilterType::RegExpr => reg_expr_match(&matcher_str, &target),
    }
  }
}

fn str_match(
  matcher_str: &String,
  target: &String,
) -> MatchResult {
  let mut matched_idx_list: Vec<usize> = Vec::new();

  for str_char in matcher_str.chars() {
    let prev_match_idx = matched_idx_list.last().copied();
    let search_start_idx = prev_match_idx.map_or(0, |idx| idx + 1);
    let search_str = &target[search_start_idx..];

    if let Some(found_idx) = search_str.find(str_char) {
      matched_idx_list.push(search_start_idx + found_idx);
    } else {
      return None;
    }
  }

  Some(matched_idx_list)
}

fn reg_expr_match(
  matcher_str: &String,
  target: &String,
) -> MatchResult {
  let Ok(reg_exp) = Regex::new(matcher_str.as_str()) else {
    return None;
  };

  let Some(res) = reg_exp.find(target.as_str()) else {
    return None;
  };
  Some((res.start()..res.end()).collect::<Vec<usize>>())
}

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
  fn new(dirctry_path: &String) -> Option<FileListFullInfo> {
    let file_list = get_file_list(&dirctry_path);
    let file_list = file_list.map(|file_list| {
      file_list
        .iter()
        .map(|file_data| FileListItem::new(file_data, false))
        .collect::<Vec<_>>()
    });
    file_list.map(|file_list| FileListFullInfo {
      filtered_item_info: (0..file_list.len())
        .map(|org_idx| FilterdFileInfo {
          org_idx,
          matched_file_name_idx: Vec::new(),
        })
        .collect(),
      focus_idx: 0,
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
    let before_focus = (0..full_focus_idx)
      .filter_map(|idx| {
        let match_result = filter.is_match(&full_item_list[idx].file_name);
        match_result.map(|matched_file_name_idx| FilterdFileInfo {
          org_idx: idx,
          matched_file_name_idx,
        })
      })
      .collect::<Vec<_>>();
    let after_focus = (full_focus_idx..full_item_list.len())
      .filter_map(|idx| {
        let match_result = filter.is_match(&full_item_list[idx].file_name);
        match_result.map(|matched_file_name_idx| FilterdFileInfo {
          org_idx: idx,
          matched_file_name_idx,
        })
      })
      .collect::<Vec<_>>();

    let filtered_item_list = [&before_focus[..], &after_focus[..]].concat();
    let focus_idx = before_focus.len();

    FileListFullInfo {
      full_item_list,
      filtered_item_info: filtered_item_list,
      focus_idx,
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
  pane_info_list: [Lazy<Mutex<PaneInfo>>; 2],
}

impl FilerData {
  fn new() -> Self {
    Self {
      pane_info_list: [
        Lazy::new(|| Mutex::new(PaneInfo::new())),
        Lazy::new(|| Mutex::new(PaneInfo::new())),
      ],
    }
  }
}

static PANE_DATA: Lazy<FilerData> = Lazy::new(|| FilerData::new());

#[tauri::command]
pub fn set_dirctry_path(
  pane_idx: usize,
  path: &str,
  initial_focus: Option<String>,
) -> Option<FileListUiInfo> {
  let mut pane_info = PANE_DATA.pane_info_list[pane_idx].lock().unwrap();

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
  let file_list_info = FileListFullInfo::new(&path);

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
  let mut pane_info = PANE_DATA.pane_info_list[pane_idx].lock().unwrap();

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
  let mut pane_info = PANE_DATA.pane_info_list[pane_idx].lock().unwrap();

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
pub fn get_pane_data(pane_idx: usize) -> PaneInfo {
  let pane_info = PANE_DATA.pane_info_list[pane_idx].lock().unwrap();
  pane_info.clone()
}

#[derive(Debug, Serialize, Clone)]
pub struct UpdateFileListUiInfo {
  pane_idx: usize,
  data: Option<FileListUiInfo>,
}

pub fn update_pane_data(
  app_handle: &tauri::AppHandle,
  pane_idx: usize,
  prev_filter: &FilterInfo,
  prev_focus_idx: &Option<usize>,
  new_pane_info: PaneInfo,
) {
  let mut current_pane_info = PANE_DATA.pane_info_list[pane_idx].lock().unwrap();

  if current_pane_info.filter != *prev_filter {
    return;
  }
  if current_pane_info
    .file_list_info
    .as_ref()
    .map(|item| item.focus_idx)
    != *prev_focus_idx
  {
    return;
  }
  if current_pane_info.dirctry_path != new_pane_info.dirctry_path {
    return;
  }

  let _ = app_handle.emit_all(
    "update_path_list",
    UpdateFileListUiInfo {
      pane_idx,
      data: new_pane_info
        .file_list_info
        .as_ref()
        .map(|item| item.to_ui_info()),
    },
  );
  *current_pane_info = new_pane_info;
}

pub fn update_file_list(app_handle: &tauri::AppHandle) {
  for pane_idx in 0..=1 {
    let mut pane_info = get_pane_data(pane_idx);

    let prev_filter = pane_info.filter.clone();
    let prev_focus_idx = pane_info
      .file_list_info
      .as_ref()
      .map(|file_list_info| file_list_info.focus_idx);

    update_file_name_list(&mut pane_info);
    update_pane_data(
      app_handle,
      pane_idx,
      &prev_filter,
      &prev_focus_idx,
      pane_info.clone(),
    );

    // 失敗した時点で、更新処理は打ち止めで良いはず…。

    // フィルタ後の物だけで良いかも。
    pane_info.file_list_info.as_mut().map(|file_list_info| {
      for file_list_item in file_list_info.full_item_list.iter_mut() {
        update_icon_info(&pane_info.dirctry_path, file_list_item);
      }
    });
    update_pane_data(
      app_handle,
      pane_idx,
      &prev_filter,
      &prev_focus_idx,
      pane_info,
    );
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
  let Some(file_list_info) = &pane_info.file_list_info else {
    let file_list_info = FileListFullInfo::new(&pane_info.dirctry_path);
    pane_info.file_list_info = file_list_info;
    return;
  };

  let Some(new_file_list) = get_file_list(&pane_info.dirctry_path) else {
    pane_info.file_list_info = None;
    return;
  };

  let org_focus_file_name = file_list_info.focus_file_name();

  let new_file_name_list = new_file_list
    .iter()
    .map(|item| item.file_name.to_string())
    .collect::<HashSet<_>>();

  // 既にある物の位置は変えない。
  // 新規の物を下に追加しする。
  // 新規がある場合は、新規の物のみを選択状態にする。
  let mut remain = file_list_info
    .full_item_list
    .iter()
    .filter(|item| new_file_name_list.contains(&item.file_name))
    .cloned()
    .collect::<Vec<_>>();

  let added = new_file_list
    .iter()
    .filter(|file| {
      remain
        .iter()
        .all(|remain| remain.file_name != file.file_name)
    })
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
        .filter(|item| new_file_name_list.contains(&item.file_name))
        .count()
    }
  };

  pane_info.file_list_info = Some(FileListFullInfo::create(
    full_item_list,
    full_focus_idx,
    &pane_info.filter,
  ));
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
  pane_idx: usize,
  sork_key: SortKey,
) -> Option<FileListUiInfo> {
  let mut pane_info = PANE_DATA.pane_info_list[pane_idx].lock().unwrap();

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

///////////////////////////////////////////////////////////////////////////////////////////////////
#[tauri::command]
pub fn add_selecting_idx(
  pane_idx: usize,
  additional_select_idx_list: Vec<usize>,
) -> Option<FileListUiInfo> {
  let mut pane_info = PANE_DATA.pane_info_list[pane_idx].lock().unwrap();

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
  let mut pane_info = PANE_DATA.pane_info_list[pane_idx].lock().unwrap();

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
  let mut pane_info = PANE_DATA.pane_info_list[pane_idx].lock().unwrap();

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
