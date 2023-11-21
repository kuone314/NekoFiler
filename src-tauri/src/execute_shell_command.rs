///////////////////////////////////////////////////////////////////////////////////////////////////
use std::process::Command;

use once_cell::sync::Lazy;
use std::collections::VecDeque;
use std::sync::Mutex;
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LogInfo {
    stdout: String,
    stderr: String,
}

static LOG_STACK: Lazy<Mutex<VecDeque<Box<LogInfo>>>> = Lazy::new(|| Mutex::new(VecDeque::new()));

#[tauri::command]
pub fn execute_shell_command(dir: &str, command: &str) -> () {
    let dir = dir.to_owned();
    let command = command.to_owned();
    std::thread::spawn(move || {
        let Some(output) = execute_shell_command_impl(&dir, &command) else{return;};
        let Ok(mut log_stack) = LOG_STACK.lock() else {return;};
        log_stack.push_back(Box::new(output));
    });
}

fn execute_shell_command_impl(dir: &str, command: &str) -> Option<LogInfo> {
    let output = Command::new("Powershell")
        .args(["-WindowStyle", "Hidden"])
        .args(["-Command", &command])
        .current_dir(dir)
        .output()
        .ok()?;

    let (std_out, _, _) = encoding_rs::SHIFT_JIS.decode(&output.stdout);
    let (std_err, _, _) = encoding_rs::SHIFT_JIS.decode(&output.stderr);
    Some(LogInfo {
        stdout: std_out.to_string(),
        stderr: std_err.to_string(),
    })
}

pub fn push_log_message(app_handle: &tauri::AppHandle) {
    let Ok(mut log_stack) = LOG_STACK.lock() else {return;};
    let Some(message) = log_stack.pop_front() else {return;};
    let _ = app_handle.emit_all("LogMessageEvent", message);
}
