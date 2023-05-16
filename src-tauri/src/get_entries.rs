
use std::fs;

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

            let date = file_time_to_system_time(md.last_write_time());
            let date = match date {
                Some(date) => to_str(date),
                None => "".to_owned(),
            };

            Some(FileInfo {
                name,
                is_dir: type_.is_dir(),
                extension,
                size: fsize,
                date: date,
            })
        })
        .collect();

    Ok(res)
}

fn to_str(val: winapi::um::minwinbase::SYSTEMTIME) -> String {
    format!(
        "{year:4}/{month:2}/{day:2} {hour:2}:{minute:2}:{second:2}",
        year = val.wYear,
        month = val.wMonth,
        day = val.wDay,
        hour = val.wHour,
        minute = val.wMinute,
        second = val.wSecond,
    )
}

fn file_time_to_system_time(date: u64) -> Option<winapi::um::minwinbase::SYSTEMTIME> {
    let mut st = winapi::um::minwinbase::SYSTEMTIME {
        wYear: 0,
        wMonth: 0,
        wDayOfWeek: 0,
        wDay: 0,
        wHour: 0,
        wMinute: 0,
        wSecond: 0,
        wMilliseconds: 0,
    };
    unsafe {
        let success =
            winapi::um::timezoneapi::FileTimeToSystemTime((&date as *const u64).cast(), &mut st);
        if success != winapi::shared::minwindef::TRUE {
            return None;
        }
    }
    Some(st)
}
