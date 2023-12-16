///////////////////////////////////////////////////////////////////////////////////////////////////
use std::process::Command;

use once_cell::sync::Lazy;
use std::collections::VecDeque;
use std::sync::Mutex;
use tauri::Manager;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LogInfo {
    title: String,
    id: String,
    stdout: String,
    stderr: String,
}

static LOG_STACK: Lazy<Mutex<VecDeque<Box<LogInfo>>>> = Lazy::new(|| Mutex::new(VecDeque::new()));

///////////////////////////////////////////////////////////////////////////////////////////////////
struct Executer {
    title: String,
    dir: String,
    command: String,
    id: String,
    stdout: String,
    stderr: String,
}

impl Executer {
    fn new(title: &str, dir: &str, command: &str) -> Executer {
        Executer {
            title: title.to_string(),
            dir: dir.to_string(),
            stdout: "".to_string(),
            stderr: "".to_string(),
            command: command.to_string(),
            id: Uuid::new_v4().to_string(),
        }
    }

    fn push_log_stack(&self) -> () {
        let Ok(mut log_stack) = LOG_STACK.lock() else {return;};
        log_stack.push_back(Box::new(LogInfo {
            title: self.title.to_string(),
            stdout: self.stdout.to_string(),
            stderr: self.stderr.to_string(),
            id: self.id.to_string(),
        }));
    }

    fn execute(&mut self) -> Option<()> {
        self.push_log_stack();

        let output = Command::new("Powershell")
            .args(["-WindowStyle", "Hidden"])
            .args(["-Command", &self.command])
            .current_dir(&self.dir)
            .output()
            .ok()?;

        let (std_out, _, _) = encoding_rs::SHIFT_JIS.decode(&output.stdout);
        let (std_err, _, _) = encoding_rs::SHIFT_JIS.decode(&output.stderr);
        self.stdout = std_out.to_string();
        self.stderr = std_err.to_string();
        self.push_log_stack();

        Some(())
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////////
#[tauri::command]
pub fn execute_shell_command(title: &str, dir: &str, command: &str) -> () {
    let dir = dir.to_owned();
    let command = command.to_owned();
    let title = title.to_owned();

    std::thread::spawn(move || {
        let mut executer = Executer::new(&title, &dir, &command);
        executer.execute();
    });
}

pub fn notify_command_log(app_handle: &tauri::AppHandle) {
    let Ok(mut log_stack) = LOG_STACK.lock() else {return;};
    let Some(message) = log_stack.pop_front() else {return;};
    let _ = app_handle.emit_all("LogMessageEvent", message);
}
