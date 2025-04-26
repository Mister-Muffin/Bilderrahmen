import express from "express"
import { WebSocket, WebSocketServer } from "ws"
import http from "node:http"
import { readAll, writeAll } from "jsr:@std/io"

import { generateImageArray } from "./util.ts"
import { MessageType } from "./types.ts"
import { broadcastData, terminateDeadConnections } from "./websocket.ts"

export const app = express()
const server = http.createServer(app)
const wss = new WebSocketServer({ server })
const port = 3000

const devHostnames = ["julian-nixos", "codespaces-a22ac8"]
const devMode = devHostnames.includes(Deno.hostname())
export const dir = devMode ? "src/public/images" : "/mnt/bildi"

const configDir = "config"
const lastImageIndexPath = configDir + "/lastImageIndex.txt"

const cylceTime = 10 * 1000

console.log(devMode ? "Running in dev mode!" : "Running in production mode.")

console.log("Generating images array")
const images = generateImageArray(dir)
images.sort()

let currentImageIndex = 0

function sendSwitchImage() {
    broadcastData(wss, MessageType.IndexUpdate, {
        image: images[currentImageIndex],
        index: currentImageIndex,
    })
}

function incrementImageIndex() {
    currentImageIndex++
    if (currentImageIndex >= images.length) {
        currentImageIndex = 0
    }
    console.log("Incrementing image index to", currentImageIndex)
}

// Send the next image to all clients to preload it
function sendPrepreImage() {
    // Check if non-admin clients are connected
    const hasNonAdmin = Array.from(wss.clients).some((client) => !(client as ExtWebSocket).isAdmin)
    if (!hasNonAdmin) {
        console.log("No non-admin clients connected. Skipping image preload.")
        return
    }

    incrementImageIndex()
    broadcastData(wss, MessageType.PrepNext, {
        image: images[currentImageIndex],
        index: currentImageIndex,
    })
    setTimeout(() => {
        sendSwitchImage()
    }, 5000)
}

setInterval(sendPrepreImage, cylceTime)

export interface ExtWebSocket extends WebSocket {
    isAlive: boolean
    isAdmin: boolean
}

wss.on("connection", async (socket: ExtWebSocket, req) => {
    socket.isAlive = true
    console.log(req.url)
    socket.isAdmin = req.url.endsWith("admin")
    socket.on("pong", () => {
        socket.isAlive = true
    })

    if (socket.isAdmin) {
        console.log("Admin connected")
        socket.send(
            JSON.stringify({
                type: MessageType.IndexUpdate,
                ...{ image: images[currentImageIndex], index: currentImageIndex },
            })
        )
        socket.send(JSON.stringify({ type: MessageType.Log, message: "Connected" }))
    } else {
        console.log("Client connected")
        socket.send(
            JSON.stringify({
                type: MessageType.LoadImage,
                ...{ image: images[currentImageIndex], index: currentImageIndex },
            })
        )
    }
})
//https://medium.com/factory-mind/websocket-node-js-express-step-by-step-using-typescript-725114ad5fe4
setInterval(() => {terminateDeadConnections(wss)}, 10000)

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

    broadcastData(wss, MessageType.IndexUpdate, {
        image: images[currentImageIndex],
        index: currentImageIndex,
    })

    res.send({ lastImageIndex: currentImageIndex })
})

app.get("/favicon.ico", (_req, res) => {
    res.status(204)
})

server.listen(port, "::1", () => {
    console.log(`Express listening on port ${port}`)
})
