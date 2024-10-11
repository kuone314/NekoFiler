use std::{
  fs::Metadata,
  fs::{self},
  os::windows::fs::{FileTypeExt, MetadataExt},
  path::PathBuf,
};

use chrono::{DateTime, Local};
use winapi::um::winbase::GetLogicalDriveStringsA;
use winapi::um::winnt::CHAR;

// use super::FileBaseInfo;

///////////////////////////////////////////////////////////////////////////////////////////////////
#[derive(Debug)]
pub struct FileBaseInfo {
  pub(crate) file_name: String,
  meta_data: Option<Metadata>,
}

impl FileBaseInfo {
  pub(crate) fn file_size(&self) -> Option<u64> {
    if self.is_directory() {
      return None;
    }
    self
      .meta_data
      .as_ref()
      .map(|meta_data| meta_data.file_size())
  }

  pub(crate) fn is_directory(&self) -> bool {
    self
      .meta_data
      .as_ref()
      .map(|meta_data| meta_data.file_type())
      .map(|file_type| file_type.is_dir() || file_type.is_symlink_dir())
      .unwrap_or_default()
  }

  pub(crate) fn date(&self) -> Option<String> {
    let Some(meta_data) = self.meta_data.as_ref() else {
      return None;
    };
    get_date_str(&meta_data)
  }

  pub(crate) fn file_extension(&self) -> String {
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

///////////////////////////////////////////////////////////////////////////////////////////////////
pub fn get_file_list(path: &str) -> Option<Vec<FileBaseInfo>> {
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

///////////////////////////////////////////////////////////////////////////////////////////////////
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
