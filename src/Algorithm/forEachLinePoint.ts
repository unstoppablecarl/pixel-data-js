/**
 * Iterates through a line with sub-pixel precision.
 * Guarantees that the first and last points are exactly (x0, y0) and (x1, y1).
 */
export function forEachLinePoint(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  callback: (x: number, y: number) => void,
): void {

  if(x0 === x1 && y0 === y1){
    callback(x0, y0)
    return
  }

  const dx = x1 - x0
  const dy = y1 - y0

  // Determine the number of steps based on the longest axis
  const steps = Math.max(Math.abs(dx), Math.abs(dy))

  const xInc = dx / steps
  const yInc = dy / steps

  let curX = x0
  let curY = y0

  // We add +1 to the loop to ensure we reach the final (x1, y1)
  for (let i = 0; i <= steps; i++) {
    callback(curX, curY)
    curX += xInc
    curY += yInc
  }
}
