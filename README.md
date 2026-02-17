# Pixel Data JS

A **🔥Performance🔥** library of functions for interacting with pixel data and ImageData objects.
This package is designed to be a tree-shake friendly list of functions.

[Documentation](https://unstoppablecarl.github.io/pixel-data-js/)

## Installation

`$ npm i pixel-data-js`


## High-Performance Pixel Manipulation with `Uint32Array`

The `ImageData.data` object is a `Uint8ClampedArray`.
It is easy to use but, it is inefficient for heavy processing because every single pixel requires four separate write operations (Red, Green, Blue, and Alpha).
By using a `Uint32Array` view, we can treat all four color channels as a single 32-bit integer, allowing us to update an entire pixel in a single CPU operation.

## The Concept: 32-bit Packing
A single pixel consists of four 8-bit channels (R, G, B, A). The entire color's data can fit into a single 32-bit unsigned integer `8 * 4 = 32` (`Color32`).

## Example

```ts
import { packColor } from 'pixel-data-js'

const ctx = canvas.getContext('2d')
const imageData = ctx.getImageData(0, 0, width, height)

// 1. Get the underlying buffer
const buffer = imageData.data.buffer

// 2. Create a 32-bit view of that same buffer
const data32 = new Uint32Array(buffer)

// 3. Write a single pixel (Red: 255, Green: 100, Blue: 0, Alpha: 255)
// This is 4x faster than writing to imageData.data[i...i+3]
data32[0] = packColor(255, 100, 0, 255)

// 4. Push back to canvas
ctx.putImageData(imageData, 0, 0)
```
### Color Integers

You can define colors using the `AABBGGRR` (Little-Endian) to make a `Color32` object.


## Building

`$ pnpm install`

`$ pnpm run build`

## Testing

`$ pnpm run test`

`$ pnpm run test:mutation`

## Releases Automation

- update `package.json` file version (example: `1.0.99`)
- manually create a github release with a tag matching the `package.json` version prefixed with `v` (example: `v1.0.99`)
- npm should be updated automatically
