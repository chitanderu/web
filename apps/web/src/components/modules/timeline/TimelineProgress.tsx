'use client'

import NumberFlow from '@number-flow/react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

import {
  dayOfYear,
  daysOfYear,
  secondOfDay,
  secondOfDays,
} from '~/lib/datetime'

const PROGRESS_DURATION = 2000

export const TimelineProgress = () => {
  const t = useTranslations('home')
  const [percentOfYear, setPercentYear] = useState(0)
  const [percentOfDay, setPercentDay] = useState(0)
  const [currentDay, setCurrentDay] = useState(dayOfYear)

  function updatePercent() {
    const nowY = (dayOfYear() / daysOfYear(new Date().getFullYear())) * 100
    const nowD = (secondOfDay() / secondOfDays) * 100
    if (nowY !== percentOfYear) {
      setPercentYear(nowY)
    }
    setPercentDay(nowD)
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDay(dayOfYear())
    }, PROGRESS_DURATION)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    updatePercent()
    const timer = setInterval(updatePercent, PROGRESS_DURATION)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex gap-8">
      <div>
        <div className="text-[2rem] leading-none font-light text-accent">
          <NumberFlow value={Math.round(currentDay)} />
        </div>
        <div className="mt-1 text-[11px] text-neutral-10/30">
          {t('timeline_stat_day')}
        </div>
      </div>
      <div>
        <div className="text-[2rem] leading-none font-light text-neutral-10/50">
          <NumberFlow value={Math.round(percentOfYear)} />
          <span className="ml-0.5 text-base text-neutral-10/30">%</span>
        </div>
        <div className="mt-1 text-[11px] text-neutral-10/30">
          {t('timeline_stat_year')}
        </div>
      </div>
      <div>
        <div className="text-[2rem] leading-none font-light text-neutral-10/50">
          <NumberFlow value={Math.round(percentOfDay)} />
          <span className="ml-0.5 text-base text-neutral-10/30">%</span>
        </div>
        <div className="mt-1 text-[11px] text-neutral-10/30">
          {t('timeline_stat_today')}
        </div>
      </div>
    </div>
  )
}
