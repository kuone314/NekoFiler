///////////////////////////////////////////////////////////////////////////////////////////////////
#[tauri::command]
pub fn get_exe_dir() -> Option<String> {
  let result = dunce::canonicalize(std::env::current_exe().ok()?.parent()?);
  Some(result.ok()?.to_str()?.to_owned())
}
