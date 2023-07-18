import { useEffect, useState } from 'react';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

import { TabColorMatchingType, TabColorSetting } from './TabColorSetting';
import { Button } from '@mui/material';
import Select from 'react-select'


///////////////////////////////////////////////////////////////////////////////////////////////////
export function TabColorSettingPane(
  props: {
    height: number
    tabColorSetting: TabColorSetting[]
    setTabColorSetting: (newValue: TabColorSetting[]) => void
    finishSetting: () => void
  }
) {
  const [tabColorSetting, setTabColorSetting] = useState(props.tabColorSetting);
  const [activeIdx, setActiveIdx] = useState<number>(0);

  const buttonHeight = 70;
  const heightMergin = 20; // これがないと、スクロールバーが出てしまう…
  const mainHeight = (props.height - buttonHeight - heightMergin);

  const AddSetting = () => {
    const newSetting = [...tabColorSetting,
    {
      name: 'Setting',
      color: {
        backGround: '',
        string: '',
      },
      match: {
        type: TabColorMatchingType.start_with,
        string: '',
      }
    }]
    setTabColorSetting(newSetting)
  }

  const Impl = () => {
    const idx = activeIdx;
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
          type="Name"
          value={setting.name}
          onChange={e => {
            const newSetting = [...tabColorSetting]
            newSetting[idx].name = e.target.value;
            setTabColorSetting([...newSetting])
          }}
        />
      </label>
      <label>
        BackGroundColor
        <input
          type="color"
          list="color-list"
          value={setting.color.backGround}
          onChange={e => {
            const newSetting = [...tabColorSetting]
            newSetting[idx].color.backGround = e.target.value;
            setTabColorSetting([...newSetting])
          }}
        />
      </label>
      <label>
        StringColor
        <input
          type="color"
          list="color-list"
          value={setting.color.string}
          onChange={e => {
            const newSetting = [...tabColorSetting]
            newSetting[idx].color.string = e.target.value;
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
          defaultValue={toComboItem(tabColorSetting[idx].match.type)}
          onChange={(val) => {
            if (val === null) { return; }
            const newSetting = [...tabColorSetting]
            newSetting[idx].match.type = val.value;
            setTabColorSetting([...newSetting])
          }}
        />
        <input
          type="text"
          value={setting.match.string}
          onChange={e => {
            const newSetting = [...tabColorSetting]
            newSetting[idx].match.string = e.target.value;
            setTabColorSetting([...newSetting])
          }}
        />
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
          {
            tabColorSetting.map((setting, idx) => {
              return <Button
                style={{
                  textTransform: 'none',
                  border: (idx === activeIdx) ? '5px solid #ff0000' : '',
                  background: setting.color.backGround,
                  color: setting.color.string,
                }}
                onClick={() => { setActiveIdx(idx) }}
              >
                {setting.name}
              </Button>
            })
          }
          <button
            onClick={() => AddSetting()}
          >
            +
          </button>
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
