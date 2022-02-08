import { useState, useEffect } from 'react'

export function useKeyPressed(key: string) {
  const [isPressed, setPressed] = useState(false)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === key) setPressed(true)
    }
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === key) setPressed(false)
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  })

  return isPressed
}
