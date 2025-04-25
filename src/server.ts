import express from "express"
import { readAll, writeAll } from "jsr:@std/io"

import { generateImageArray } from "./util.ts"

export const app = express()
const port = 3000

const devHostnames = ["julian-nixos", "codespaces-a22ac8"]
const devMode = devHostnames.includes(Deno.hostname())
export const dir = devMode ? "src/public/images" : "/mnt/bildi"

const configDir = "config"
const lastImageIndexPath = configDir + "/lastImageIndex.txt"

console.log(devMode ? "Running in dev mode!" : "Running in production mode.")

console.log("Generating images array")
const images = generateImageArray(dir)
images.sort()

let currentImageIndex = 0

app.use(express.json())

app.use(express.static("src/public"))
app.use(express.static(dir))
app.use("/admin", express.static("src/admin"))

app.get("/api/image", (_req, res) => {
    res.send({ image: images[currentImageIndex], index: currentImageIndex })
})

app.get("/api/images", (_req, res) => {
    res.send(images)
})

app.get("/api/imagesCount", (_req, res) => {
    res.send({ count: images.length })
})

app.get("/api/lastImageIndex", async (_req, res) => {
    try {
        Deno.mkdirSync(configDir, { recursive: true })
    } catch (e) {
        console.warn(e)
    }
    const file = await Deno.open(lastImageIndexPath, { create: true, read: true, write: true })

    const decoder = new TextDecoder("utf-8")
    const fileContent = await readAll(file)

    let value = decoder.decode(fileContent)
    if (value == "") {
        value = "0"
        const encoder = new TextEncoder()
        const data = encoder.encode("0")
        writeAll(file, data)
    }

    file.close()

    console.log(Number(value))

    res.send({ lastImageIndex: Number(value) })
})

// Increase the last image index by 1
// Update the last image index if new index is provided in the request body
app.patch("/api/lastImageIndex", async (req, res) => {
    try {
        Deno.mkdirSync(configDir, { recursive: true })
    } catch (e) {
        console.warn(e)
    }
    const file = await Deno.open(lastImageIndexPath, { create: true, read: true, write: true })
    const encoder = new TextEncoder()

    if (req.body.lastImageIndex == undefined) {
        currentImageIndex++
        if (currentImageIndex >= images.length) {
            currentImageIndex = 0
        }
    } else {
        currentImageIndex = req.body.lastImageIndex
        if (currentImageIndex >= images.length) {
            currentImageIndex = 0
        }
    }

    const data = encoder.encode(currentImageIndex.toString())
    await writeAll(file, data)

    file.close()
    res.send({ lastImageIndex: currentImageIndex })
})

app.get("/favicon.ico", (_req, res) => {
    res.status(204)
})

app.listen(port, "::1", () => {
    console.log(`Express listening on port ${port}`)
})
