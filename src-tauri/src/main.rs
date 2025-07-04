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

mod pane_info;
use pane_info::set_background_color;
use pane_info::set_ignore_system_file;
use pane_info::is_ignore_system_file;
use pane_info::set_dirctry_path;
use pane_info::set_filter;
use pane_info::set_focus_idx;
use pane_info::set_viewing_idx_range;
use pane_info::update_file_list;
use pane_info::sort::sort_file_list;
use pane_info::selections::add_selecting_idx;
use pane_info::selections::set_selecting_idx;
use pane_info::selections::toggle_selection;

mod setting_file;
use setting_file::read_setting_file;
use setting_file::setting_dir;
use setting_file::write_setting_file;

mod adjust_addressbar_str;
use adjust_addressbar_str::adjust_addressbar_str;

mod resolve_symbolic_link;
use resolve_symbolic_link::resolve_symbolic_link;

mod execute_shell_command;
use execute_shell_command::execute_shell_command;

mod get_latest_version;
mod update_filer;
use get_latest_version::get_latest_version;
use update_filer::update_filer;

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      set_background_color,
      set_ignore_system_file,
      is_ignore_system_file,
      set_dirctry_path,
      set_filter,
      add_selecting_idx,
      set_selecting_idx,
      set_viewing_idx_range,
      toggle_selection,
      set_focus_idx,
      sort_file_list,
      adjust_addressbar_str,
      resolve_symbolic_link,
      execute_shell_command,
      read_setting_file,
      write_setting_file,
      setting_dir,
      get_exe_dir,
      get_latest_version,
      update_filer,
    ])
    .setup(|app| {
      let app_handle = app.app_handle().clone();
      std::thread::spawn(move || loop {
        std::thread::sleep(Duration::from_secs(1));
        update_file_list(&app_handle);
      });

      #[cfg(debug_assertions)]
      app.get_webview_window("main").unwrap().open_devtools();

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
