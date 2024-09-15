#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

#[macro_use]
extern crate serde;

use std::time::Duration;
use tauri::Manager;

mod get_exe_dir;
use get_exe_dir::get_exe_dir;

mod get_entries;
use get_entries::add_selecting_idx;
use get_entries::set_dirctry_path;
use get_entries::set_focus_item;
use get_entries::set_selecting_idx;
use get_entries::sort_file_list;
use get_entries::toggle_selection;
use get_entries::update_file_list;

mod setting_file;
use setting_file::read_setting_file;
use setting_file::setting_dir;
use setting_file::write_setting_file;

mod adjust_addressbar_str;
use adjust_addressbar_str::adjust_addressbar_str;

mod execute_shell_command;
use execute_shell_command::execute_shell_command;
use execute_shell_command::notify_command_log;

mod get_latest_version;
mod update_filer;
use get_latest_version::get_latest_version;
use update_filer::update_filer;

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      set_dirctry_path,
      add_selecting_idx,
      set_selecting_idx,
      toggle_selection,
      set_focus_item,
      sort_file_list,
      adjust_addressbar_str,
      execute_shell_command,
      read_setting_file,
      write_setting_file,
      setting_dir,
      get_exe_dir,
      get_latest_version,
      update_filer,
    ])
    .setup(|app| {
      let app_handle = app.app_handle();
      std::thread::spawn(move || loop {
        std::thread::sleep(Duration::from_secs(1));
        notify_command_log(&app_handle);
        update_file_list(&app_handle);
      });

      #[cfg(debug_assertions)]
      app.get_window("main").unwrap().open_devtools();

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
