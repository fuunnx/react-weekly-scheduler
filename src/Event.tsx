/* eslint-disable @typescript-eslint/no-use-before-define */

import { useState, useEffect, CSSProperties } from 'react'
import { useSpring, animated, to, AnimatedProps } from '@react-spring/web'
import { useDrag } from '@use-gesture/react'
import { addDays, addMinutes, setMinutes } from 'date-fns'

import { getWeekDay } from './libs/getWeekDay'
import { useKeyPressed } from './libs/useKeyPressed'
import { useCanvasSize } from './canvasSize'

type AnimatedProp<T> = AnimatedProps<{ x: T }>['x']

export type CalendarEvent = {
  start: Date
  end: Date
  title: string
  id: string
}

type EventProps = {
  event: CalendarEvent
  onChange: (newValue: CalendarEvent) => void
  onClone: (newValue: CalendarEvent) => void
  onSelect: () => void
  isSelected?: boolean
}

export function Event(props: EventProps) {
  const { event, onChange, onClone, onSelect, isSelected } = props
  const [isDown, setDown] = useState(false)
  const isCloneMode = useKeyPressed('Alt')
  const canvasSize = useCanvasSize()

  const weekday = getWeekDay(event.start)
  const startMinutes = event.start.getHours() * 60 + event.start.getMinutes()
  const endMinutes = event.end.getHours() * 60 + event.end.getMinutes()
  const duration = endMinutes - startMinutes

  const top = (startMinutes / (24 * 60)) * canvasSize.height
  const left = (weekday / 7) * canvasSize.width
  const dayWidth = canvasSize.width / 7
  const startHeight = (duration / (24 * 60)) * canvasSize.height

  const quartersPerDay = (60 * 24) / 15
  const quartersHeight = canvasSize.height / quartersPerDay

  const [{ x, y, z }, system] = useCoordinatesSpring({ top, left, isDown })
  const [height, heightSystem] = useHeightSpring({
    height: startHeight,
  })

  const bind = useDrag(({ down, movement: [mx, my], first, last }) => {
    setDown(down)
    if (first) {
      onSelect()
    }

    const quartersOffset = Math.round(my / quartersHeight)
    const daysOffset = Math.round(mx / dayWidth)

    if (down) {
      system.start({
        x: left + daysOffset * dayWidth,
        y: top + quartersOffset * quartersHeight,
      })
    }

    if (!last) return

    const applyOffsets = (date: Date) =>
      addMinutes(addDays(date, daysOffset), quartersOffset * 15)

    if (isCloneMode) {
      onClone({
        ...event,
        start: applyOffsets(event.start),
        end: applyOffsets(event.end),
      })
      system.start({ x: left, y: top, immediate: true })
      return
    }

    onChange({
      ...event,
      start: applyOffsets(event.start),
      end: applyOffsets(event.end),
    })
    return
  })

  const zIndex = isSelected ? 10 : 5
  const containerStyle: AnimatedProp<CSSProperties> = {
    position: 'absolute',
    height: to([height], (height) => `${height}px`),
    width: `${dayWidth}px`,
    padding: '0 0.25rem',
    cursor: isDown ? 'grabbing' : 'grab',
    overflow: 'hidden',
  }

  const eventStyle: AnimatedProp<CSSProperties> = {
    borderRadius: '.5rem',
    background: 'lightblue',
    padding: to([height], (height) => {
      if (height < 3 * 16) return `0 1rem`
      return '1rem'
    }),
    height: '100%',
    border: isSelected
      ? '4px solid rgba(100, 100, 100, 0.8)'
      : '4px solid rgba(100, 100, 100, 0.2)',
    userSelect: 'none',
    transition: 'border .1s ease-out',
    position: 'relative',
  }

  return (
    <>
      {isCloneMode && isDown && (
        <animated.div
          style={{
            ...containerStyle,
            zIndex: zIndex - 1,
            transform: `translate(${left}px, ${top}px)`,
          }}
        >
          <animated.div style={eventStyle}>{event.title}</animated.div>
        </animated.div>
      )}

      <animated.div
        data-draggable
        {...bind()}
        style={{
          ...containerStyle,
          zIndex,
          transform: to(
            [x, y, z],
            (x, y, z) => `translate(${x}px, ${y}px) scale(${1 + z / 50})`,
          ),
          touchAction: 'none',
        }}
      >
        <animated.div
          style={{
            ...eventStyle,
            boxShadow: isDown ? '8px 8px 16px rgba(0, 0, 0, 0.1)' : '',
          }}
        >
          {event.title}
        </animated.div>
        <DragHandle
          onDrag={(my) => {
            const finalHeight =
              Math.max(1, Math.round((startHeight + my) / quartersHeight)) *
              quartersHeight

            heightSystem.start({
              height: finalHeight,
            })
          }}
          onRelease={(my) => {
            const finalHeight = Math.max(
              1,
              Math.round((startHeight + my) / quartersHeight),
            )
            const minutes = finalHeight * 15

            onChange({
              ...event,
              end: addMinutes(event.start, minutes),
            })
          }}
        />
      </animated.div>
    </>
  )
}

type DragHandleProps = {
  onDrag: (my: number) => void
  onRelease: (my: number) => void
}

function DragHandle(props: DragHandleProps) {
  const { onDrag, onRelease } = props
  const bind = useDrag(
    ({ down, movement: [_, my], event }) => {
      event.stopPropagation()

      if (down) {
        onDrag(my)
      } else {
        onRelease(my)
      }
    },
    { axis: 'y' },
  )

  return (
    <animated.button
      {...bind()}
      style={{
        position: 'absolute',
        bottom: '1px',
        left: '33%',
        right: '67%',
        width: '33%',
        display: 'block',
        cursor: 'row-resize',
        touchAction: 'none',
        padding: 0,
        background: 'transparent',
        border: 0,
        height: '1rem',
      }}
    >
      ⠶
    </animated.button>
  )
}

function useHeightSpring(params: { height: number }) {
  const [{ height }, heightSpr] = useSpring(
    {
      from: { height: params.height },
      config: {
        mass: 0.1,
        tension: 220,
        friction: 10,
        precision: 0.05,
      },
    },
    [params.height],
  )

  useEffect(() => {
    heightSpr.start({ height: params.height })
  }, [heightSpr, params.height])

  return [height, heightSpr] as const
}

type Params = {
  top: number
  left: number
  isDown: boolean
}

function useCoordinatesSpring({ top, left, isDown }: Params) {
  const { z } = useSpring({
    to: { z: isDown ? 1 : 0 },
    config: {
      mass: 1,
      tension: 180,
      friction: 10,
      precision: 0.02,
    },
  })

  const [{ x, y }, system] = useSpring(
    {
      from: { x: left, y: top },
      config: {
        mass: 0.1,
        tension: 220,
        friction: 10,
      },
    },
    [top, left],
  )

  useEffect(() => {
    system.start({ x: left, y: top })
  }, [system, top, left])

  return [{ x, y, z }, system] as const
}
