use dirs;
use std::{
  env, fs,
  path::PathBuf,
};

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

  let path = resolve_env_vars(str);
  let path = PathBuf::from(path);
  let path = resolve_home_dir(path);

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


/// 環境変数(e.g. %AppData%)を展開
fn resolve_env_vars(path: &str) -> String {
  let replacer = regex::Regex::new(r"%([^%]+)%").unwrap();

  replacer
    .replace_all(path, |caps: &regex::Captures| {
      let var_name = &caps[1];
      env::var(var_name).unwrap_or_else(|_| caps[0].to_string())
    })
    .to_string()
}

/// `~` を展開
fn resolve_home_dir(path: PathBuf) -> PathBuf {
  let Ok(remain) = path.strip_prefix("~") else {
    return path;
  };

  let Some(home_dir) = dirs::home_dir() else {
    return path;
  };

  home_dir.join(remain)
}

