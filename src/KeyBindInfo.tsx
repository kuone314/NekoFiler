
import React from 'react';

import { ISettingInfo, readSettings, writeSettings } from './ReadWriteSettings';

///////////////////////////////////////////////////////////////////////////////////////////////////
export const COMMAND_TYPE = {
  build_in: "build_in",
  power_shell: "power_shell",
} as const;
export type CommandType = typeof COMMAND_TYPE[keyof typeof COMMAND_TYPE];

export type KeyBindSetting = {
  display_name: string,
  key: string,
  valid_on_addressbar: boolean,
  action: {
    type: CommandType,
    command_name: string,
  }
};

///////////////////////////////////////////////////////////////////////////////////////////////////
export function match(keyboard_event: React.KeyboardEvent<HTMLDivElement>, command_key: string): boolean {

  return toKeyStr(keyboard_event).toLowerCase() === command_key.toLowerCase();
}

export const toKeyStr = (keyEvnet: React.KeyboardEvent<HTMLDivElement> | null) => {
  if (!keyEvnet) { return ''; }

  const strAry = [];
  if (keyEvnet.ctrlKey) { strAry.push('ctrl'); }
  if (keyEvnet.altKey) { strAry.push('alt'); }
  if (keyEvnet.shiftKey) { strAry.push('shift'); }

  const key = keyEvnet.key;
  if (!['Control', 'Alt', 'Shift',].find(item => item === key)) {
    const rowKeyStr = (() => {
      if (key === ' ') { return 'Space'; }
      if (key.length === 1) { return key.toUpperCase(); }
      return key;
    })();
    strAry.push(rowKeyStr);
  }
  return strAry.join('+');
}

class Version {
  static oldest = 5;
  static separet_commands_setting = 6;
  static latest = Version.separet_commands_setting;
}

class SettingInfo implements ISettingInfo<KeyBindSetting[]> {
  filePath = "General/key_bind.json5";
  latestVersion = Version.latest;
  IsValidVersion = (version: number) => {
    if (version < Version.oldest) { return false; }
    if (version > Version.latest) { return false; }
    return true;
  };
  UpgradeSetting = async (readVersion: number, readSetting: KeyBindSetting[]) => readSetting;
}

export async function writeKeyBindSetting(setting: KeyBindSetting[]) {
  writeSettings(new SettingInfo, setting);
}

export async function readKeyBindSetting(): Promise<KeyBindSetting[]> {
  const read = await readSettings(new SettingInfo);
  return read ?? GenerateDefaultKeyBindSeting();
}

