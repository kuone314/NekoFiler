import { useEffect, useState } from 'react';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

import { Match, TabColorMatchingType, TabColorSetting, } from './TabColorSetting';
import { Button } from '@mui/material';
import Select from 'react-select'
import { DirName } from './Utility';


///////////////////////////////////////////////////////////////////////////////////////////////////
export function TabColorSettingPane(
  props: {
    height: number
    trgDir: string
    tabColorSetting: TabColorSetting[]
    setTabColorSetting: (newValue: TabColorSetting[]) => void
    finishSetting: () => void
  }
) {
  const [tabColorSetting, setTabColorSetting] = useState(props.tabColorSetting);

  const initTab = () => {
    const fondIdx = tabColorSetting.findIndex(setting => Match(setting, props.trgDir));
    return (fondIdx === -1) ? 0 : fondIdx;
  }
  const [activeIdx, setActiveIdx] = useState<number>(initTab());

  const buttonHeight = 70;
  const heightMergin = 20; // これがないと、スクロールバーが出てしまう…
  const mainHeight = (props.height - buttonHeight - heightMergin);

  const AddSetting = () => {
    const newValue = {
      name: DirName(props.trgDir),
      color: {
        backGround: '',
        string: '',
        activeHightlight: '',
      },
      match: {
        type: TabColorMatchingType.start_with,
        string: props.trgDir,
      }
    }
    const newSetting = [...tabColorSetting]
    const fondIdx = tabColorSetting.findIndex(setting => Match(setting, props.trgDir));
    const insertPos = (fondIdx === -1) ? newSetting.length : fondIdx;
    newSetting.splice(insertPos, 0, newValue)
    setTabColorSetting(newSetting)
    setActiveIdx(insertPos);
  }


  function MoveUp(trgIdx: number): void {
    if (trgIdx == 0) { return }

    const newSetting = [...tabColorSetting];
    [newSetting[trgIdx], newSetting[trgIdx - 1]] = [newSetting[trgIdx - 1], newSetting[trgIdx]]
    setTabColorSetting(newSetting)
    setActiveIdx(trgIdx - 1);
  }
  function MoveDown(trgIdx: number): void {
    if (trgIdx == tabColorSetting.length - 1) { return }

    const newSetting = [...tabColorSetting];
    [newSetting[trgIdx], newSetting[trgIdx + 1]] = [newSetting[trgIdx + 1], newSetting[trgIdx]]
    setTabColorSetting(newSetting)
    setActiveIdx(trgIdx + 1);
  }

  function DeleteSetting(trgIdx: number): void {
    const newSetting = [...tabColorSetting];
    newSetting.splice(trgIdx, 1);
    setTabColorSetting(newSetting)

    if (activeIdx >= newSetting.length) {
      setActiveIdx(newSetting.length - 1);
    }
  }

  const Impl = () => {
    const setting = tabColorSetting[activeIdx];

    const toComboItem = (type: TabColorMatchingType) => {
      return { value: type, label: comboLabel(type) };
    }
    const comboLabel = (type: TabColorMatchingType) => {
      switch (type) {
        case 'regexp': return 'Regexp';
        case 'start_with': return 'Start with';
      }
    }

    return <div
      css={css({
        display: 'flex',
        flexDirection: 'column',
        height: mainHeight,
        background: setting.color.backGround,
        color: setting.color.string,
      })}
    >
      <label>
        Name
        <input
          css={css({
            width: '100%',
          })}
          type="Name"
          value={setting.name}
          onChange={e => {
            const newSetting = [...tabColorSetting]
            newSetting[activeIdx].name = e.target.value;
            setTabColorSetting([...newSetting])
          }}
        />
      </label>
      <label>
        BackGroundColor
        <input
          type="text"
          css={css({ width: '5em', })}
          value={setting.color.backGround}
          onChange={e => {
            const newSetting = [...tabColorSetting]
            newSetting[activeIdx].color.backGround = e.target.value;
            setTabColorSetting([...newSetting])
          }}
        />
        <input
          type="color"
          list="color-list"
          value={setting.color.backGround}
          onChange={e => {
            const newSetting = [...tabColorSetting]
            newSetting[activeIdx].color.backGround = e.target.value;
            setTabColorSetting([...newSetting])
          }}
        />
      </label>
      <label>
        StringColor
        <input
          type="text"
          css={css({ width: '5em', })}
          value={setting.color.string}
          onChange={e => {
            const newSetting = [...tabColorSetting]
            newSetting[activeIdx].color.string = e.target.value;
            setTabColorSetting([...newSetting])
          }}
        />
        <input
          type="color"
          list="color-list"
          value={setting.color.string}
          onChange={e => {
            const newSetting = [...tabColorSetting]
            newSetting[activeIdx].color.string = e.target.value;
            setTabColorSetting([...newSetting])
          }}
        />
      </label>
      <label>
        FrameHighlightColor
        <input
          type="text"
          css={css({ width: '5em', })}
          value={setting.color.activeHightlight}
          onChange={e => {
            const newSetting = [...tabColorSetting]
            newSetting[activeIdx].color.activeHightlight = e.target.value;
            setTabColorSetting([...newSetting])
          }}
        />
        <input
          type="color"
          list="color-list"
          value={setting.color.activeHightlight}
          onChange={e => {
            const newSetting = [...tabColorSetting]
            newSetting[activeIdx].color.activeHightlight = e.target.value;
            setTabColorSetting([...newSetting])
          }}
        />
      </label>
      <div
        css={css({
          display: 'flex',
          flexDirection: 'row',
        })}
      >
        <label>
          Match
        </label>
        <Select
          options={Object.values(TabColorMatchingType).map(toComboItem)}
          value={toComboItem(setting.match.type)}
          onChange={(val) => {
            if (val === null) { return; }
            const newSetting = [...tabColorSetting]
            newSetting[activeIdx].match.type = val.value;
            setTabColorSetting([...newSetting])
          }}
        />
        <input
          css={css({
            width: '100%',
          })}
          type="text"
          value={tabColorSetting[activeIdx].match.string}
          onChange={e => {
            const newSetting = [...tabColorSetting]
            newSetting[activeIdx].match.string = e.target.value;
            setTabColorSetting([...newSetting])
          }}
        />
      </div>
      <div>
        <button
          onClick={() => MoveUp(activeIdx)}
        >
          ↑
        </button>
        <button
          onClick={() => MoveDown(activeIdx)}
        >
          ↓
        </button>
        <button
          onClick={() => DeleteSetting(activeIdx)}
        >
          Delete
        </button>
      </div>
    </div>
  }

  return <>
    <div
      css={css({
        display: 'grid',
        gridTemplateRows: '0.9fr 0.1fr',
        width: '100%',
        height: '100%',
      })}
    >
      <div
        css={css({
          display: 'grid',
          gridTemplateColumns: '0.2fr 0.8fr',
          height: mainHeight,
        })}
      >
        <div
          css={css({
            display: 'flex',
            flexDirection: 'column',
            overflow: 'scroll',
          })}
        >
          <button
            onClick={() => AddSetting()}
          >
            +
          </button>
          {
            tabColorSetting.map((setting, idx) => {
              return <Button
                style={{
                  textTransform: 'none',
                  border: (idx === activeIdx) ? '5px solid ' + setting.color.activeHightlight : '',
                  background: setting.color.backGround,
                  color: setting.color.string,
                }}
                onClick={() => { setActiveIdx(idx) }}
                key={'Setting' + idx}
              >
                {setting.name}
              </Button>
            })
          }
        </div>
        <div>
          {Impl()}
        </div>
      </div>
      <div
        css={css({
          marginLeft: 'auto',
          marginRight: 'auto',
          height: buttonHeight,
        })}
      >
        <button
          onClick={() => {
            props.setTabColorSetting(tabColorSetting)
            props.finishSetting()
          }}
        >
          OK
        </button>
        <button
          onClick={() => props.finishSetting()}
        >
          Cancel
        </button>
      </div>
    </div>
  </>
}
