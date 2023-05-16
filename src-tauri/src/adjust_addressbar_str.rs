use std::fs;

///////////////////////////////////////////////////////////////////////////////////////////////////
#[derive(Debug, Serialize, Deserialize)]
pub struct AdjustedAddressbarStr {
    dir: String,
    filename: String,
}
#[tauri::command]
pub fn adjust_addressbar_str(str: &str) -> Result<AdjustedAddressbarStr, String> {
    let Ok(path) = dunce::canonicalize(&str.trim()) else {
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
            filename: path
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
            filename: "".to_string(),
        });
    }

    return Err("unfond".to_string());
}
