import libheif from "https://cdn.jsdelivr.net/npm/libheif-js@1.17.1/libheif-wasm/libheif-bundle.mjs"

// converts a heic image and puts it in the returned canvas
export async function decodeHeicImage(path) {
    const heif = libheif()
    const file = await fetch(path)
        .then((response) => response.blob())
        .then((blob) => {
            return new Promise((resolve) => {
                const reader = new FileReader()
                reader.onload = () => {
                    resolve(reader.result)
                }
                reader.readAsArrayBuffer(blob)
            })
        })

    const decoder = new heif.HeifDecoder()
    const data = decoder.decode(file)

    const image = data[0]
    const originalWidth = image.get_width()
    const originalHeight = image.get_height()

    // Berechne die neue Größe basierend auf der Bildschirmgröße
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight

    const aspectRatio = originalWidth / originalHeight
    let canvasWidth = screenWidth
    let canvasHeight = screenHeight

    if (canvasWidth / aspectRatio > canvasHeight) {
        canvasWidth = canvasHeight * aspectRatio
    } else {
        canvasHeight = canvasWidth / aspectRatio
    }

    const canvas = document.createElement("canvas")
    canvas.width = canvasWidth
    canvas.height = canvasHeight

    const context = canvas.getContext("2d")
    const imageData = context.createImageData(originalWidth, originalHeight)

    await new Promise((resolve, reject) => {
        image.display(imageData, (displayData) => {
            if (!displayData) {
                return reject(new Error("HEIF processing error"))
            }

            resolve()
        })
    })

    // Skaliere das Bild auf die neue Größe
    const tempCanvas = document.createElement("canvas")
    tempCanvas.width = originalWidth
    tempCanvas.height = originalHeight
    const tempContext = tempCanvas.getContext("2d")
    tempContext.putImageData(imageData, 0, 0)

    context.drawImage(tempCanvas, 0, 0, canvasWidth, canvasHeight)

    return canvas
}
