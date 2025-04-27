import express from "express"
import { WebSocket, WebSocketServer } from "ws"
import http from "node:http"
import { readAll, writeAll } from "jsr:@std/io"

import { generateImageArray } from "./util.ts"
import { MessageType } from "./types.ts"
import { broadcastData, terminateDeadConnections } from "./websocket.ts"
import { getConfig, saveConfig } from "./config.ts";

export const app = express()
export const adminApp = express()

const server = http.createServer(app)
const adminServer = http.createServer(adminApp)

const wss = new WebSocketServer({ server })
const wssAdmin = new WebSocketServer({ server: adminServer })

const port = 3000

const devHostnames = ["julian-nixos", "codespaces-a22ac8"]
const devMode = devHostnames.includes(Deno.hostname())
export const dir = devMode ? "src/public/images" : "/mnt/bildi"

const configDir = "config"
const lastImageIndexPath = configDir + "/lastImageIndex.txt"

let config = await getConfig()

console.log(devMode ? "Running in dev mode!" : "Running in production mode.")

console.log("Generating images array")
const images = generateImageArray(dir)
images.sort()

let currentImageIndex = await getLastImageIndex()


// set, if next image was requested by admin
let skipNextUpdateLoop = false

function sendSwitchImage() {
    if (skipNextUpdateLoop) {
        skipNextUpdateLoop = false
        return
    }
    broadcastData(wss, MessageType.IndexUpdate, {
        image: images[currentImageIndex],
        index: currentImageIndex,
    })
    broadcastData(wssAdmin, MessageType.IndexUpdate, {
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
    if (skipNextUpdateLoop) {
        skipNextUpdateLoop = false
        return
    }
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

let loopInterval = setInterval(sendPrepreImage, config.cycleTime)
function stopLoop() {
    clearInterval(loopInterval)
}
function startLoop() {
    loopInterval = setInterval(sendPrepreImage, config.cycleTime)
}
function restartLoop() {
    stopLoop()
    startLoop()
}

export interface ExtWebSocket extends WebSocket {
    isAlive: boolean
    isAdmin: boolean
}

wss.on("connection", (socket: WebSocket, req) => {
    console.log(req.url)

    console.log("Client connected")
    socket.send(
        JSON.stringify({
            type: MessageType.LoadImage,
            ...{ image: images[currentImageIndex], index: currentImageIndex },
        })
    )
})
wssAdmin.on("connection", (socket: WebSocket, req) => {
    console.log(req.url)

    console.log("Admin connected")
    socket.send(
        JSON.stringify({
            type: MessageType.IndexUpdate,
            ...{ image: images[currentImageIndex], index: currentImageIndex },
        })
    )
    socket.send(JSON.stringify({ type: MessageType.Log, message: "Connected" }))
})

//https://medium.com/factory-mind/websocket-node-js-express-step-by-step-using-typescript-725114ad5fe4
setInterval(() => {
    terminateDeadConnections(wss)
}, 10000)

app.use(express.json())

app.use(express.static("src/public"))
app.use(express.static(dir))

adminApp.use(express.json())
adminApp.use(express.static("src/admin"))

app.get("/api/image", (_req, res) => {
    res.send({ image: images[currentImageIndex], index: currentImageIndex })
})

app.get("/api/images", (_req, res) => {
    res.send(images)
})

app.get("/api/imagesCount", (_req, res) => {
    res.send({ count: images.length })
})

async function getLastImageIndex() {
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

    return Number(value) 
}

// Increase the last image index by 1
// Update the last image index if new index is provided in the request body
adminApp.patch("/api/lastImageIndex", async (req, res) => {
    await updateLastImageIndex(req.body.lastImageIndex)

    broadcastData(wss, MessageType.IndexUpdate, {
        image: images[currentImageIndex],
        index: currentImageIndex,
    })

    res.send({ lastImageIndex: currentImageIndex })
})

adminApp.post("/api/nextImage", (_req, res) => {
    incrementImageIndex()

    broadcastData(wss, MessageType.LoadImage, {
        image: images[currentImageIndex],
        index: currentImageIndex,
    })
    // Send the updated image and index to the admin clients
    broadcastData(wssAdmin, MessageType.IndexUpdate, {
        image: images[currentImageIndex],
        index: currentImageIndex,
    })

    skipNextUpdateLoop = true
    res.sendStatus(200)
})
adminApp.post("/api/prevImage", (_req, res) => {
    currentImageIndex--
    if (currentImageIndex < 0) {
        currentImageIndex = images.length - 1
    }

    broadcastData(wss, MessageType.LoadImage, {
        image: images[currentImageIndex],
        index: currentImageIndex,
    })
    // Send the updated image and index to the admin clients
    broadcastData(wssAdmin, MessageType.IndexUpdate, {
        image: images[currentImageIndex],
        index: currentImageIndex,
    })

    skipNextUpdateLoop = true
    res.sendStatus(200)
})
adminApp.get("/api/interval", (_req, res) => {
    res.send({ interval: config.cycleTime / 1000 })
})
adminApp.patch("/api/interval", async (req, res) => {
    const newInterval = req.body.interval * 1000
    if (newInterval && typeof newInterval === "number") {
        config = await saveConfig({ ...config, cycleTime: newInterval })
        restartLoop()
        res.send({ interval: config.cycleTime })
    } else {
        res.status(400).send({ error: "Invalid interval" })
    }
})

app.get("/favicon.ico", (_req, res) => {
    res.status(204)
})

server.listen(port, "::", () => {
    console.log(`Express listening on port ${port}`)
})
adminServer.listen(port + 1, "::", () => {
    console.log(`Admin Express listening on port ${port + 1}`)
})

async function updateLastImageIndex(index: number) {
    try {
        Deno.mkdirSync(configDir, { recursive: true })
    } catch (e) {
        console.warn(e)
    }
    const file = await Deno.open(lastImageIndexPath, { create: true, read: true, write: true })
    const encoder = new TextEncoder()

    if (index == undefined) {
        currentImageIndex++
        if (currentImageIndex >= images.length) {
            currentImageIndex = 0
        }
    } else {
        currentImageIndex = index
        if (currentImageIndex >= images.length) {
            currentImageIndex = 0
        }
    }

    const data = encoder.encode(currentImageIndex.toString())
    await writeAll(file, data)

    file.close()
}
