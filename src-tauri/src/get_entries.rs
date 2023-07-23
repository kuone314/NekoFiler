use chrono::prelude::*;
use std::{
    fs::{self, Metadata},
    os::windows::fs::FileTypeExt,
};

///////////////////////////////////////////////////////////////////////////////////////////////
#[derive(Debug, Serialize, Deserialize)]
pub struct FileInfo {
    name: String,
    is_dir: bool,
    extension: String,
    size: u64,
    date: String,
}

use std::os::windows::prelude::MetadataExt;
#[tauri::command]
pub fn get_entries(path: &str) -> Result<Vec<FileInfo>, String> {
    let entries = fs::read_dir(path).map_err(|e| format!("{}", e))?;

    let res = entries
        .filter_map(|entry| -> Option<FileInfo> {
            let entry = entry.ok()?;
            let name = entry.file_name().to_string_lossy().to_string();
            let type_ = entry.file_type().ok()?;
            let md = entry.metadata().ok()?;
            let fsize = md.file_size();
            let extension = entry
                .path()
                .extension()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string();

            let date = get_date_str(&md).unwrap_or_default();

            Some(FileInfo {
                name,
                is_dir: type_.is_dir() || type_.is_symlink_dir(),
                extension,
                size: fsize,
                date: date,
            })
        })
        .collect();

    Ok(res)
}

fn get_date_str(file_data: &Metadata) -> Option<String> {
    let modified_time = file_data.modified().ok()?;

    let local_time: DateTime<Local> = modified_time.into();
    Some(local_time.format("%Y/%m/%d %H:%M:%S").to_string())
}
