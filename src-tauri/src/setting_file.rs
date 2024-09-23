use std::{env, fs};

///////////////////////////////////////////////////////////////////////////////////////////////////
use std::io::Write;
#[tauri::command]
pub fn read_setting_file(file_name: &str) -> Option<String> {
  fs::read_to_string(setting_dir()?.join(file_name)).ok()
}

#[tauri::command]
pub fn write_setting_file(
  file_name: &str,
  content: &str,
) -> Option<()> {
  let file_path = setting_dir()?.join(file_name);
  let _ = std::fs::create_dir_all(file_path.parent()?);
  let mut file = fs::File::create(file_path).ok()?;
  file.write_all(content.as_bytes()).ok()
}

#[tauri::command]
pub fn setting_dir() -> Option<std::path::PathBuf> {
  let dir_name = "neko_filer_settings";

  let current_dir = env::current_dir().ok()?;
  let result = current_dir.join(dir_name);
  if result.exists() {
    return Some(result);
  }

  Some(std::env::current_exe().ok()?.parent()?.join(dir_name))
}
