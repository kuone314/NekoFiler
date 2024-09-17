import { alfabetList } from './Utility';
import { KeyBindSetting, writeKeyBindSetting } from './KeyBindInfo';


///////////////////////////////////////////////////////////////////////////////////////////////////
export function GenerateDefaultKeyBindSeting(): KeyBindSetting[] {
  const defined: KeyBindSetting[] = [
    {
      display_name: 'Copy to clopboard',
      key: 'ctrl+c',
      action: {
        type: 'power_shell',
        command_name: 'Copy to clopboard',
      },
      valid_on_addressbar: false,
    },
    {
      display_name: 'Cut to clopboard',
      key: 'ctrl+x',
      action: {
        type: 'power_shell',
        command_name: 'Cut to clopboard',
      },
      valid_on_addressbar: false,
    },
    {
      display_name: 'Past from clopboard',
      key: 'ctrl+v',
      action: {
        type: 'power_shell',
        command_name: 'Past from clopboard',
      },
      valid_on_addressbar: false,
    },
    {
      display_name: 'Create Copy',
      key: 'ctrl+c',
      action: {
        type: 'power_shell',
        command_name: 'Create Copy',
      },
      valid_on_addressbar: false,
    },
    {
      display_name: 'Copy and Replace Content',
      key: 'ctrl+c',
      action: {
        type: 'power_shell',
        command_name: 'Copy and Replace Content',
      },
      valid_on_addressbar: false,
    },
    {
      display_name: 'Copy to opposite dirctory',
      key: 'ctrl+c',
      action: {
        type: 'power_shell',
        command_name: 'Copy to opposite dirctory',
      },
      valid_on_addressbar: false,
    },
    {
      display_name: 'Move to opposite dirctory',
      key: 'ctrl+x',
      action: {
        type: 'power_shell',
        command_name: 'Move to opposite dirctory',
      },
      valid_on_addressbar: false,
    },
    {
      display_name: 'Delete file',
      key: 'ctrl+d',
      action: {
        type: 'power_shell',
        command_name: 'Delete file',
      },
      valid_on_addressbar: false,
    },
    {
      display_name: '',
      key: 'ctrl+d',
      action: {
        type: 'power_shell',
        command_name: '',
      },
      valid_on_addressbar: false,
    },
    {
      display_name: 'Delete file',
      key: 'delete',
      action: {
        type: 'power_shell',
        command_name: 'Delete file',
      },
      valid_on_addressbar: false,
    },
    {
      display_name: 'Copy file path',
      key: 'ctrl+c',
      action: {
        type: 'power_shell',
        command_name: 'Copy file path',
      },
      valid_on_addressbar: true,
    },
    {
      display_name: 'New File',
      key: 'ctrl+n',
      action: {
        type: 'power_shell',
        command_name: 'New File',
      },
      valid_on_addressbar: true,
    },
    {
      display_name: 'New Folder',
      key: 'ctrl+n',
      action: {
        type: 'power_shell',
        command_name: 'New Folder',
      },
      valid_on_addressbar: true,
    },
    {
      display_name: 'Rename',
      key: 'ctrl+n',
      action: {
        type: 'power_shell',
        command_name: 'Rename',
      },
      valid_on_addressbar: true,
    },
    {
      display_name: 'moveDown',
      key: 'ArrowDown',
      action: {
        type: 'build_in',
        command_name: 'moveDown',
      },
      valid_on_addressbar: false,
    },
    {
      display_name: 'moveDownSelect',
      key: 'shift+ArrowDown',
      action: {
        type: 'build_in',
        command_name: 'moveDownSelect',
      },
      valid_on_addressbar: false,
    },
    {
      display_name: 'moveUp',
      key: 'ArrowUp',
      action: {
        type: 'build_in',
        command_name: 'moveUp',
      },
      valid_on_addressbar: false,
    },
    {
      display_name: 'moveUpSelect',
      key: 'shift+ArrowUp',
      action: {
        type: 'build_in',
        command_name: 'moveUpSelect',
      },
      valid_on_addressbar: false,
    },
    {
      display_name: 'moveTop',
      key: 'Home',
      action: {
        type: 'build_in',
        command_name: 'moveTop',
      },
      valid_on_addressbar: false,
    },
    {
      display_name: 'moveTopSelect',
      key: 'shift+Home',
      action: {
        type: 'build_in',
        command_name: 'moveTopSelect',
      },
      valid_on_addressbar: false,
    },
    {
      display_name: 'moveBottom',
      key: 'End',
      action: {
        type: 'build_in',
        command_name: 'moveBottom',
      },
      valid_on_addressbar: false,
    },
    {
      display_name: 'moveBottomSelect',
      key: 'shift+End',
      action: {
        type: 'build_in',
        command_name: 'moveBottomSelect',
      },
      valid_on_addressbar: false,
    },
    {
      display_name: 'selectAll',
      key: 'ctrl+a',
      action: {
        type: 'build_in',
        command_name: 'selectAll',
      },
      valid_on_addressbar: false,
    },
    // {
    //   display_name: 'clearSelection',
    //   key: 'Escape',
    //   action: {
    //     type: 'build_in',
    //     command_name: 'clearSelection',
    //   },
    //   valid_on_addressbar: false,
    // },
    {
      display_name: 'toggleSelection',
      key: 'Space',
      action: {
        type: 'build_in',
        command_name: 'toggleSelection',
      },
      valid_on_addressbar: false,
    },
    {
      display_name: 'selectCurrentOnly',
      key: 'shift+Space',
      action: {
        type: 'build_in',
        command_name: 'selectCurrentOnly',
      },
      valid_on_addressbar: false,
    },
    {
      display_name: 'addNewTab',
      key: 'ctrl+t',
      action: {
        type: 'build_in',
        command_name: 'addNewTab',
      },
      valid_on_addressbar: false,
    },
    {
      display_name: 'removeTab',
      key: 'ctrl+w',
      action: {
        type: 'build_in',
        command_name: 'removeTab',
      },
      valid_on_addressbar: false,
    },
    {
      display_name: 'removeOtherTabs',
      key: 'ctrl+Shift+w',
      action: {
        type: 'build_in',
        command_name: 'removeOtherTabs',
      },
      valid_on_addressbar: true,
    },
    {
      display_name: 'removeAllRightTabs',
      key: 'ctrl+Shift+w',
      action: {
        type: 'build_in',
        command_name: 'removeAllRightTabs',
      },
      valid_on_addressbar: true,
    },
    {
      display_name: 'removeAllLeftTabs',
      key: 'ctrl+Shift+w',
      action: {
        type: 'build_in',
        command_name: 'removeAllLeftTabs',
      },
      valid_on_addressbar: true,
    },
    {
      display_name: 'toPrevTab',
      key: 'ctrl+shift+tab',
      action: {
        type: 'build_in',
        command_name: 'toPrevTab',
      },
      valid_on_addressbar: true,
    },
    {
      display_name: 'toNextTab',
      key: 'ctrl+tab',
      action: {
        type: 'build_in',
        command_name: 'toNextTab',
      },
      valid_on_addressbar: true,
    },
    {
      display_name: 'toPrevTab',
      key: 'ctrl+shift+ArrowLeft',
      action: {
        type: 'build_in',
        command_name: 'toPrevTab',
      },
      valid_on_addressbar: true,
    },
    {
      display_name: 'toNextTab',
      key: 'ctrl+Shift+ArrowRight',
      action: {
        type: 'build_in',
        command_name: 'toNextTab',
      },
      valid_on_addressbar: true,
    },
    {
      display_name: 'accessCurrentItem',
      key: 'Enter',
      action: {
        type: 'build_in',
        command_name: 'accessCurrentItem',
      },
      valid_on_addressbar: false,
    },
    {
      display_name: 'accessParentDir',
      key: 'ctrl+shift+ArrowUp',
      action: {
        type: 'build_in',
        command_name: 'accessParentDir',
      },
      valid_on_addressbar: true,
    },
    {
      display_name: 'focusAddoressBar',
      key: 'ctrl+l',
      action: {
        type: 'build_in',
        command_name: 'focusAddoressBar',
      },
      valid_on_addressbar: false,
    },

    {
      display_name: 'clearFilter',
      key: 'Escape',
      action: {
        type: 'build_in',
        command_name: 'clearFilter',
      },
      valid_on_addressbar: false,
    },
    {
      display_name: 'deleteFilterSingleSingle',
      key: 'backspace',
      action: {
        type: 'build_in',
        command_name: 'deleteFilterSingleSingle',
      },
      valid_on_addressbar: false,
    },
    {
      display_name: 'focusFilterBar',
      key: 'ctrl+f',
      action: {
        type: 'build_in',
        command_name: 'focusFilterBar',
      },
      valid_on_addressbar: true,
    },
    {
      display_name: 'Set Filter StrMatch',
      key: 'ctrl+f',
      action: {
        type: 'build_in',
        command_name: 'setFilterStrMatch',
      },
      valid_on_addressbar: true,
    },
    {
      display_name: 'Set Filter RegExp',
      key: 'ctrl+f',
      action: {
        type: 'build_in',
        command_name: 'setFilterRegExp',
      },
      valid_on_addressbar: true,
    },
    {
      display_name: 'focusOppositePane',
      key: 'tab',
      action: {
        type: 'build_in',
        command_name: 'focusOppositePane',
      },
      valid_on_addressbar: true,
    },
    {
      display_name: 'focusCommandBar',
      key: 'Ctrl+@',
      action: {
        type: 'build_in',
        command_name: 'focusCommandBar',
      },
      valid_on_addressbar: true,
    },
    {
      display_name: 'PowerShell',
      key: 'ctrl+@',
      action: {
        type: 'power_shell',
        command_name: 'PowerShell',
      },
      valid_on_addressbar: true,
    },
    {
      display_name: 'PowerShell(Admin)',
      key: 'ctrl+@',
      action: {
        type: 'power_shell',
        command_name: 'PowerShell(Admin)',
      },
      valid_on_addressbar: true,
    },
  ];


  const setCommandCommandList: KeyBindSetting[] = alfabetList.map(key => (
    {
      display_name: 'setKeyBind',
      key: 'ctrl+' + key,
      action: {
        type: 'build_in',
        command_name: 'setKeyBind',
      },
      valid_on_addressbar: false,
    }
  ));
  const result = defined.concat(setCommandCommandList);

  writeKeyBindSetting(result);
  return result;
}

