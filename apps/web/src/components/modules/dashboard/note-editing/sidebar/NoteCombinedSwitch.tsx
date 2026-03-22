import { useState } from 'react'

import { AdvancedInput } from '~/components/ui/input'
import { LabelSwitch } from '~/components/ui/switch'

import { useNoteModelSingleFieldAtom } from '../data-provider'

export const NoteCombinedSwitch = () => {
  const [isHide, setIsHide] = useNoteModelSingleFieldAtom('hide')

  const [allowComment, setAllowComment] =
    useNoteModelSingleFieldAtom('allowComment')

  const [bookmark, setHasMemory] = useNoteModelSingleFieldAtom('bookmark')
  const [password, setPassword] = useNoteModelSingleFieldAtom('password')

  const [passwordEnable, setPasswordEnable] = useState(!!password)

  return (
    <>
      <LabelSwitch
        checked={isHide}
        className="shrink-0"
        onCheckedChange={setIsHide}
      >
        <span>隐藏</span>
      </LabelSwitch>

      <LabelSwitch
        checked={passwordEnable}
        className="shrink-0"
        onCheckedChange={(checked) => {
          setPasswordEnable(checked)
          if (!checked) setPassword('')
        }}
      >
        <span>设定密码？</span>
      </LabelSwitch>
      {passwordEnable && (
        <AdvancedInput
          color="primary"
          inputClassName="text-base font-medium"
          label="密码"
          labelClassName="text-xs"
          labelPlacement="left"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      )}

      <LabelSwitch
        checked={allowComment}
        className="shrink-0"
        onCheckedChange={setAllowComment}
      >
        <span>允许评论</span>
      </LabelSwitch>

      <LabelSwitch
        checked={bookmark}
        className="shrink-0"
        onCheckedChange={setHasMemory}
      >
        <span>标记为回忆项</span>
      </LabelSwitch>
    </>
  )
}
