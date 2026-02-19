export function invertImageData(imageData: ImageData) {
  const data = imageData.data
  let length = data.length
  for (let i = 0; i < length; i += 4) {
    data[i] = 255 - data[i]!
    data[i + 1] = 255 - data[i + 1]!
    data[i + 2] = 255 - data[i + 2]!
  }
  return imageData
}
