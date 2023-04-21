#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

#[macro_use]
extern crate serde;

use std::fs;

fn main() {
    std::thread::spawn(|| {
        let init_shell_count = 3;
        for _ in 0..init_shell_count {
            stock_power_shell();
        }
    });

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_entries,
            adjust_addressbar_str,
            execute_shell_command,
            read_setting_file,
            write_setting_file,
            get_exe_dir,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

///////////////////////////////////////////////////////////////////////////////////////////////////
#[tauri::command]
fn get_exe_dir() -> Option<String> {
    Some(std::env::current_exe().ok()?.parent()?.to_str()?.to_string())
}

///////////////////////////////////////////////////////////////////////////////////////////////////
use std::env;
use std::io::Write;
#[tauri::command]
fn read_setting_file(filename: &str) -> Option<String> {
    fs::read_to_string(setting_dir()?.join(filename)).ok()
}

#[tauri::command]
fn write_setting_file(filename: &str, content: &str) -> Option<()> {
    let mut file = fs::File::create(setting_dir()?.join(filename)).ok()?;
    file.write_all(content.as_bytes()).ok()
}

fn setting_dir() -> Option<std::path::PathBuf> {
    let dir_name = "AmaterasuFilerSettings";

    let result = std::path::PathBuf::from(dir_name);
    if result.exists() {
        return Some(result);
    }

    Some(std::env::current_exe().ok()?.parent()?.join(dir_name))
}

///////////////////////////////////////////////////////////////////////////////////////////////////
use once_cell::sync::Lazy;
use std::collections::VecDeque;
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;

fn startup_power_shell() -> Option<Box<Child>> {
    Some(Box::new(
        Command::new("powershell")
            .args(["-WindowStyle", "Hidden"])
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .spawn()
            .ok()?,
    ))
}

fn get_shell() -> Option<Box<Child>> {
    let result = (|| Some(SHELL_ARY.lock().ok()?.pop_front()?))();
    if !result.is_some() {
        return startup_power_shell();
    }

    stock_power_shell;
    return result;
}

fn stock_power_shell() -> Option<()> {
    Some(SHELL_ARY.lock().ok()?.push_back(startup_power_shell()?))
}

static SHELL_ARY: Lazy<Mutex<VecDeque<Box<Child>>>> = Lazy::new(|| Mutex::new(VecDeque::new()));

#[tauri::command]
fn execute_shell_command(dir: &str, command: &str) -> Option<String> {
    let mut shell = get_shell()?;

    let command = "cd ".to_owned() + dir + ";\n" + command + "\n";
    use encoding_rs;
    let (command, _, _) = encoding_rs::SHIFT_JIS.encode(&command);

    let stdin = shell.stdin.as_mut().expect("Failed to open stdin");
    stdin.write_all(command.as_ref()).ok()?;

    let _ = shell.wait();

    use std::io::{BufRead, BufReader, Write};
    let mut reader = BufReader::new(shell.stdout.as_mut()?);
    let (std_out, _, _) = encoding_rs::SHIFT_JIS.decode(&reader.fill_buf().ok()?);

    return Some(std_out.to_string());
}

///////////////////////////////////////////////////////////////////////////////////////////////////
#[derive(Debug, Serialize, Deserialize)]
struct AdjustedAddressbarStr {
    dir: String,
    filename: String,
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
            filename: path.file_name().unwrap().to_str().unwrap_or_default().to_string(),
        });
    }

    if file_info.is_dir() {
        return Ok(AdjustedAddressbarStr {
            dir: path.as_os_str().to_str().unwrap_or_default().to_string(),
            filename: "".to_string(),
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
