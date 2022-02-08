import { createContext, useContext } from 'react'

export const CanvasSizeContext = createContext({ width: 0, height: 0 })

export function useCanvasSize() {
  return useContext(CanvasSizeContext)
}
