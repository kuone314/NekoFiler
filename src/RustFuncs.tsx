import { invoke } from '@tauri-apps/api';

///////////////////////////////////////////////////////////////////////////////////////////////////
export function executeShellCommand(command: string, dir: string): void {
  invoke("execute_shell_command", { command: command, dir: dir });
}
