///////////////////////////////////////////////////////////////////////////////////////////////////
use std::process::Command;

use tauri::{AppHandle, Manager};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LogInfo {
  title: String,
  id: String,
  command: String,
  stdout: String,
  stderr: String,
  rc: Option<i32>,
}

///////////////////////////////////////////////////////////////////////////////////////////////////
struct Executer {
  title: String,
  dir: String,
  command: String,
  id: String,
  stdout: String,
  stderr: String,
  return_code: Option<i32>,
}

impl Executer {
  fn new(
    title: &str,
    dir: &str,
    command: &str,
  ) -> Executer {
    Executer {
      title: title.to_string(),
      dir: dir.to_string(),
      stdout: "".to_string(),
      stderr: "".to_string(),
      command: command.to_string(),
      id: Uuid::new_v4().to_string(),
      return_code: None,
    }
  }

  fn push_log(
    &self,
    app_handle: &AppHandle,
  ) -> () {
    let log_info = LogInfo {
      title: self.title.to_string(),
      stdout: self.stdout.to_string(),
      stderr: self.stderr.to_string(),
      id: self.id.to_string(),
      command: self.command.to_string(),
      rc: self.return_code,
    };
    let _ = app_handle.emit_all("LogMessageEvent", log_info);
  }

  fn execute(
    &mut self,
    app_handle: &AppHandle,
  ) -> Option<()> {
    self.push_log(&app_handle);

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
    self.return_code = output.status.code();
    self.push_log(&app_handle);

    Some(())
  }
}

///////////////////////////////////////////////////////////////////////////////////////////////////
#[tauri::command]
pub fn execute_shell_command(
  app_handle: AppHandle,
  title: &str,
  dir: &str,
  command: &str,
) -> () {
  let dir = dir.to_owned();
  let command = command.to_owned();
  let title = title.to_owned();

  std::thread::spawn(move || {
    let mut executer = Executer::new(&title, &dir, &command);
    executer.execute(&app_handle);
  });
}
