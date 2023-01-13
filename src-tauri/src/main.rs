#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

#[macro_use]
extern crate serde;

use std::fs;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_entries,
            adjust_addressbar_str,
            execute_shell_command,
            read_setting_file,
            write_setting_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

///////////////////////////////////////////////////////////////////////////////////////////////////
use std::env;
use std::io::Write;
#[tauri::command]
fn read_setting_file(filename: &str) -> String {
    fs::read_to_string(setting_dir().join(filename)).unwrap_or_default()
}
#[tauri::command]
fn write_setting_file(filename: &str, content: &str) -> () {
    let _ = fs::create_dir("Settings");
    let mut file = fs::File::create(setting_dir().join(filename)).unwrap();
    file.write_all(content.as_bytes()).unwrap();
}

fn setting_dir() -> std::path::PathBuf {
    std::path::PathBuf::from("Settings")
}

///////////////////////////////////////////////////////////////////////////////////////////////////
use std::process::Command;
#[tauri::command]
fn execute_shell_command(dir: &str, command: &str) -> String {
    let output = Command::new("Powershell")
        .args(["-Command", &command])
        .current_dir(dir)
        .output();
    let output = match output {
        Ok(o) => o,
        Err(_) => return "Err".to_string(),
    };
    String::from_utf8_lossy(&output.stdout).to_string()
}

///////////////////////////////////////////////////////////////////////////////////////////////////
#[derive(Debug, Serialize, Deserialize)]
struct AdjustedAddressbarStr {
    dir: String,
}
#[tauri::command]
fn adjust_addressbar_str(str: &str) -> Result<AdjustedAddressbarStr, String> {
    let Ok(path) = dunce::canonicalize(&str) else {
        return Err("unfond".to_string());
    };

    let Ok(file_info) = fs::metadata(&path) else {
        return Err("unfond".to_string());
    };

    if file_info.is_file() {
        let Some(parent) = path.parent() else {
            return Err("unfond".to_string());
        };
        return Ok(AdjustedAddressbarStr {
            dir: parent.as_os_str().to_str().unwrap_or_default().to_string(),
        });
    }

    if file_info.is_dir() {
        return Ok(AdjustedAddressbarStr {
            dir: path.as_os_str().to_str().unwrap_or_default().to_string(),
        });
    }

    return Err("unfond".to_string());
}

///////////////////////////////////////////////////////////////////////////////////////////////
#[derive(Debug, Serialize, Deserialize)]
struct FileInfo {
    name: String,
    is_dir: bool,
    extension: String,
    size: u64,
    date: String,
}

use std::os::windows::prelude::MetadataExt;
#[tauri::command]
fn get_entries(path: &str) -> Result<Vec<FileInfo>, String> {
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
