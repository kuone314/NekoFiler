use std::{fs, path::PathBuf};

#[tauri::command]
pub fn resolve_symbolic_link(path: &str) -> Option<PathBuf> {
  let metadata = fs::symlink_metadata(path).ok()?;
  if !metadata.file_type().is_symlink() {
    return None;
  }
  dunce::canonicalize(path).ok()
}
