/* eslint-disable @typescript-eslint/no-use-before-define */

import './styles.css'
import { TimeGrid } from './TimeGrid'
import { addDays, setHours } from 'date-fns'
import { setMinutes } from 'date-fns'
import { useState } from 'react'
import { Event, CalendarEvent } from './Event'
import * as uuid from 'uuid'
import { getWeekDay } from './libs/getWeekDay'

const weekOffset = 0

export default function App() {
  const [events, setEvents] = useState<CalendarEvent[]>(() => [
    {
      id: 'first',
      start: setMinutes(setHours(new Date(), 12), 0),
      end: setMinutes(setHours(new Date(), 16), 0),
      title: 'test',
    },
  ])
  const [selectedId, setSelected] = useState<string | null>(null)

  const today = addDays(new Date(), weekOffset * 7)
  const firstDayOfWeek = addDays(today, -1 * getWeekDay(today))

  return (
    <TimeGrid
      getQuarterStyle={(quarterTime) => {
        const { weekday, hour } = quarterTime

        const isWorkHour = (8 <= hour && hour < 12) || (14 <= hour && hour < 19)
        const isWorked = weekday <= 4 && isWorkHour
        return {
          background: isWorked ? 'white' : 'lightgrey',
        }
      }}
      onClick={(event) => {
        let element: HTMLElement | null = event.target as HTMLElement
        while (element) {
          if (element.matches('[data-draggable]')) {
            return
          }
          element = element.parentElement
        }

        setSelected(null)
      }}
    >
      {events.map((event) => {
        return (
          <Event
            key={event.id}
            event={event}
            onChange={(newEvent) => {
              setEvents((events) => {
                return events.map((event) => {
                  if (event.id !== newEvent.id) return event
                  return newEvent
                })
              })
            }}
            onClone={(newEvent) => {
              const newId = uuid.v4()
              setEvents((events) => {
                return [...events, { ...newEvent, id: newId }]
              })
              setSelected(newId)
            }}
            onSelect={() => {
              setSelected(event.id)
            }}
            isSelected={event.id === selectedId}
          />
        )
      })}
    </TimeGrid>
  )
}
