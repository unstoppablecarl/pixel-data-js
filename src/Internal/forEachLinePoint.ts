export function forEachLinePoint(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  callback: (x: number, y: number) => void,
): void {
  let x = Math.floor(x0)
  let y = Math.floor(y0)
  const xEnd = Math.floor(x1)
  const yEnd = Math.floor(y1)

  const dx = Math.abs(xEnd - x)
  const dy = -Math.abs(yEnd - y)
  const sx = x < xEnd ? 1 : -1
  const sy = y < yEnd ? 1 : -1

  let err = dx + dy

  while (true) {
    callback(x, y)

    if (x === xEnd && y === yEnd) break

    const e2 = 2 * err
    if (e2 >= dy) {
      err += dy
      x += sx
    }
    if (e2 <= dx) {
      err += dx
      y += sy
    }
  }
}
