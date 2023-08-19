use std::fs;
use std::io::Write;
use std::path::Path;
use std::path::PathBuf;
use std::process::Stdio;

use std::process::Command;
use tempdir::TempDir;

///////////////////////////////////////////////////////////////////////////////////////////////////
#[tauri::command]
pub fn update_filer(version: &str) -> Result<(), String> {
    let work_dir = TempDir::new_in(
        &crate::setting_file::setting_dir().ok_or("Setting dir unfound.")?,
        "UpdateTemp",
    )
    .ok()
    .ok_or("Fail temp dir create.")?;
    let work_dir_path = work_dir.path();

    let downloaded_exe_path =
        download_latest(&version, &work_dir_path).ok_or("Failed download latest.")?;

    kick_replace_shell_command(&work_dir_path, &downloaded_exe_path)?;

    std::process::exit(0);
}

///////////////////////////////////////////////////////////////////////////////////////////////////
fn get_release_page_htlm() -> Option<String> {
    use curl::easy::Easy;

    let mut data = Vec::new();
    let mut handle = Easy::new();
    handle
        .url("https://github.com/kuone314/AMATERASU-Filer/releases")
        .unwrap();
    {
        let mut transfer = handle.transfer();
        transfer
            .write_function(|new_data| {
                data.extend_from_slice(new_data);
                Ok(new_data.len())
            })
            .unwrap();
        transfer.perform().unwrap();
    }
    Some(String::from_utf8(data).ok()?)
}

#[tauri::command]
pub fn get_latest_version() -> Option<String> {
    let html = get_release_page_htlm()?;
    let key_text_front = r#"kuone314/AMATERASU-Filer/releases/tag/"#;
    let found = html.find(key_text_front)?;

    let remain = &html[found + key_text_front.len()..];

    let key_text_back = r#"""#;
    let found = remain.find(key_text_back)?;
    Some(remain[..found].to_owned())
}

fn download_latest(latest_version: &str, work_dir_path: &Path) -> Option<PathBuf> {
    let download_command = format!(
        "{}{}{}",
        r#"curl.exe -sLJO https://github.com/kuone314/AMATERASU-Filer/releases/download/"#,
        latest_version,
        r#"/amaterasu_filer.exe"#
    );
    let _ = Command::new("Powershell")
        .args(["-Command", &download_command])
        .stdout(Stdio::piped())
        .current_dir(&work_dir_path)
        .output();

    let downloaded_exe_path = &work_dir_path.join("amaterasu_filer.exe");
    if !downloaded_exe_path.is_file() {
        return None;
    }
    Some(downloaded_exe_path.to_owned())
}

///////////////////////////////////////////////////////////////////////////////////////////////////
fn kick_replace_shell_command(
    work_dir_path: &Path,
    downloaded_exe_path: &Path,
) -> Result<(), String> {
    let current_exe = std::env::current_exe()
        .ok()
        .ok_or("Unfond exe path.".to_owned())?;
    let current_exe_str = current_exe.to_string_lossy();

    let src_def = format!(
        r#"$sourceFile = "{}";"#,
        downloaded_exe_path.to_string_lossy()
    );
    let dst_def = format!(r#"$destinationFile = "{}";"#, &current_exe_str);

    let update_command_body = r#"
    while ($true) {
        Copy-Item $sourceFile $destinationFile
        if ($?) { break; }
        sleep 3;
    }
    "#;

    let replace_script_path = &work_dir_path.join("replace_amaterasu_filer_to_newer_ver.ps1");
    let remove_files_command = format!(
        r#"
remove-item "{}" -force
remove-item "{}" -force
remove-item "{}" -force
"#,
        &replace_script_path.to_string_lossy(),
        downloaded_exe_path.to_string_lossy(),
        work_dir_path.to_string_lossy()
    );

    let start_filer_command = format!(r#"&"{}""#, &current_exe_str);

    let update_command = format!(
        r#"
{}
{}
{}
{}
{}
"#,
        src_def, dst_def, update_command_body, remove_files_command, start_filer_command
    );

    let mut file = fs::File::create(&replace_script_path)
        .ok()
        .ok_or("Fail create script file.")?;
    file.write_all(&update_command.as_bytes())
        .ok()
        .ok_or("Fail write script file.")?;

    let parent_dir = work_dir_path.parent().unwrap_or(work_dir_path);

    let script_path = replace_script_path
        .strip_prefix(&parent_dir)
        .unwrap_or(replace_script_path);
    let kick_command = format!(
        r#"start powershell -ArgumentList "-Command {}""#,
        script_path.to_string_lossy()
    );

    let _ = Command::new("Powershell")
        .args(["-Command", &kick_command])
        .stdout(Stdio::inherit())
        .current_dir(&parent_dir)
        .spawn()
        .unwrap();
    Ok(())
}
