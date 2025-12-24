import heic2any from "https://esm.sh/heic2any"

// converts a heic image and puts it in the returned canvas
export async function decodeHeicImage(path) {
    const blob = await fetch(path).then(r => r.blob())

    const converted = await heic2any({
        blob,
        toType: "image/jpeg",
        quality: 0.9
    })

    const img = new Image()
    img.src = URL.createObjectURL(converted)
    await img.decode()

    const originalWidth = img.width
    const originalHeight = img.height

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

    const ctx = canvas.getContext("2d")
    ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight)

    URL.revokeObjectURL(img.src)
    return canvas
}
