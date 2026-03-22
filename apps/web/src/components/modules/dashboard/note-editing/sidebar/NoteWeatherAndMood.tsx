import { Autocomplete } from '~/components/ui/auto-completion'

import { SidebarSection } from '../../writing/SidebarBase'
import { MOOD_SET, WEATHER_SET } from '../constants'
import { useNoteModelSingleFieldAtom } from '../data-provider'

export const NoteWeatherAndMood = () => {
  const [weather, setWeather] = useNoteModelSingleFieldAtom('weather')
  const [mood, setMood] = useNoteModelSingleFieldAtom('mood')

  return (
    <>
      <SidebarSection
        className="flex items-center justify-between"
        label="天气"
      >
        <Autocomplete
          className="w-full"
          defaultValue={weather}
          placeholder=" "
          suggestions={WEATHER_SET.map((w) => ({ name: w, value: w }))}
          wrapperClassName="flex-1"
          onChange={(e) => {
            setWeather(e.target.value)
          }}
          onConfirm={(value) => {
            setWeather(value)
          }}
          onSuggestionSelected={(suggestion) => {
            setWeather(suggestion.value)
          }}
        />
      </SidebarSection>

      <SidebarSection
        className="flex items-center justify-between"
        label="心情"
      >
        <Autocomplete
          className="w-full"
          defaultValue={mood}
          label=""
          placeholder=" "
          suggestions={MOOD_SET.map((w) => ({ name: w, value: w }))}
          wrapperClassName="flex-1"
          onChange={(e) => {
            setMood(e.target.value)
          }}
          onConfirm={(value) => {
            setMood(value)
          }}
          onSuggestionSelected={(suggestion) => {
            setMood(suggestion.value)
          }}
        />
      </SidebarSection>
    </>
  )
}
