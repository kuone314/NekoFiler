use std::{fs, path::PathBuf, str::FromStr};

///////////////////////////////////////////////////////////////////////////////////////////////////
#[derive(Debug, Serialize, Deserialize)]
pub struct AdjustedAddressbarStr {
  dir: String,
  file_name: String,
}
#[tauri::command]
pub fn adjust_addressbar_str(str: &str) -> Result<AdjustedAddressbarStr, String> {
  let str = &str.trim();
  if str.is_empty() {
    return Ok(AdjustedAddressbarStr {
      dir: "".to_string(),
      file_name: "".to_string(),
    });
  }

  let Ok(path) = PathBuf::from_str(str) else {
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
      file_name: path
        .file_name()
        .unwrap()
        .to_str()
        .unwrap_or_default()
        .to_string(),
    });
  }

  if file_info.is_dir() {
    return Ok(AdjustedAddressbarStr {
      dir: path.as_os_str().to_str().unwrap_or_default().to_string(),
      file_name: "".to_string(),
    });
  }

  return Err("unfond".to_string());
}
