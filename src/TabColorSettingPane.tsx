import { useState } from 'react';

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

import { TabColorSetting } from './TabColorSetting';


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

  const buttonHeight = 70;
  const heightMergin = 20; // これがないと、スクロールバーが出てしまう…
  const mainHeight = (props.height - buttonHeight - heightMergin);

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
