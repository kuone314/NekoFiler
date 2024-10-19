import { invoke } from '@tauri-apps/api/core';

///////////////////////////////////////////////////////////////////////////////////////////////////
export function executeShellCommand(title: string, command: string, dir: string): void {
  invoke("execute_shell_command", {
    title: title,
    command: command,
    dir: dir
  });
}
