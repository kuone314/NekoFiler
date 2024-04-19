use chrono::prelude::*;
use std::{
    fs::{self, Metadata},
    os::windows::fs::FileTypeExt,
    path::PathBuf,
};

use winapi::um::winbase::GetLogicalDriveStringsA;
use winapi::um::winnt::CHAR;


mod get_file_icon;
use get_file_icon::get_file_icon;

///////////////////////////////////////////////////////////////////////////////////////////////
#[derive(Debug, Serialize, Deserialize)]
pub struct FileInfo {
    icon: Option<String>, // BMPのBite列
    name: String,
    is_dir: bool,
    extension: String,
    size: u64,
    date: String,
}

use std::os::windows::prelude::MetadataExt;

#[tauri::command]
pub fn get_entries(path: &str) -> Result<Vec<FileInfo>, String> {
    if path.is_empty() {
        // Windows用 ドライブ一覧の表示
        // Linux対応するなら、この辺の処理の変更が要るはず。
        return Ok(drive_list()
            .into_iter()
            .map(|drive| FileInfo {
                icon: get_file_icon(&PathBuf::from(&drive)),
                name: drive,
                is_dir: true,
                extension: "".to_string(),
                size: 0,
                date: "".to_string(),
            })
            .collect());
    }

    let path = PathBuf::from(path);
    let entries = fs::read_dir(&path).map_err(|e| format!("{}", e))?;

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
                icon: get_file_icon(&path.join(&name)),
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
        .map(|drive| String::from_utf8(drive.to_vec()).unwrap())
        .collect()
}

fn get_logical_drive_strings() -> ([i8; 255], u32) {
    unsafe {
        let mut buffer: [CHAR; 255] = [0; 255];
        let len = GetLogicalDriveStringsA(255, buffer.as_mut_ptr());
        return (buffer, len);
    }
}
