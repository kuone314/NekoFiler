import { invoke } from '@tauri-apps/api/core';

import JSON5 from 'json5'

///////////////////////////////////////////////////////////////////////////////////////////////////
export interface TabInfo {
  path: string,
  pined: boolean,
}

export interface TabsInfo {
  pathAry: TabInfo[],
  activeTabIndex: number,
}

///////////////////////////////////////////////////////////////////////////////////////////////////
const last_opend_setting_file_name = "last_opend.json5";
const last_opend_setting_current_version = 1;

function IsValid(tabInfo: TabInfo) {
  if (!tabInfo) { return false; }
  if (!tabInfo.path) { return false; }
  return true;
}

///////////////////////////////////////////////////////////////////////////////////////////////////
export async function ReadLastOpenedTabs() {
  const defaultDir = await invoke<string>("get_exe_dir", {});
  const defaultTabInfo = () => ({
    pathAry: [{ path: defaultDir, pined: false }],
    activeTabIndex: 0,
  })

  try {
    const initTabs = await invoke<String>("read_setting_file", { fileName: last_opend_setting_file_name });

    let result = JSON5.parse(initTabs.toString()) as { version: number, data: TabsInfo[], };
    if (result.data.length !== 2) {
      return [{ ...defaultTabInfo() }, { ...defaultTabInfo() }];
    }

    const fixError = (tabInfo: TabsInfo) => {
      tabInfo.pathAry = tabInfo.pathAry.filter(tabInfo => IsValid(tabInfo));
      if (tabInfo.pathAry.length === 0) {
        tabInfo.pathAry.push({ path: defaultDir, pined: false })
      }

      if (tabInfo.activeTabIndex < 0 || tabInfo.pathAry.length <= tabInfo.activeTabIndex) {
        tabInfo.activeTabIndex = 0
      }

      return tabInfo;
    }

    return result.data.map(fixError);
  } catch {
    return [{ ...defaultTabInfo() }, { ...defaultTabInfo() }];
  }
}

export function WriteLastOpenedTabs(value: TabsInfo[]) {
  const data = JSON5.stringify({ version: last_opend_setting_current_version, data: value }, null, 2);
  (async () => {
    await invoke<void>("write_setting_file", { fileName: last_opend_setting_file_name, content: data })
  })()
}