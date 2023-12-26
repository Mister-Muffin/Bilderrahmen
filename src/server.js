import express from 'express'
import fs from 'fs'
import path from 'path'
import { hostname } from 'os'
import { createClient } from 'redis'

const client = createClient({
    url: 'redis://10.7.7.61:6370'
})
client.on('error', err => console.warn('Redis Client Error', err))

await client.connect();

const app = express()
const port = 3000

const devHostname = "julian-nixos"
const devMode = hostname() == devHostname
const dir = devMode ? "src/public/images" : "/mnt/bildi"

console.log(devMode ? "Running in dev mode!" : "Running in production mode.")

function readAllFiles(dir, arr) {
    const files = fs.readdirSync(dir, { withFileTypes: true })

    for (const file of files) {
        if (file.isDirectory()) {
            readAllFiles(path.join(dir, file.name), arr);
        } else {
            if (file.name.endsWith(".directory")) continue
            arr.push(path.join(dir, file.name))
        }
    }
    return arr
}


app.use(express.json())

app.use(express.static('src/public'))
app.use(express.static(dir))

app.get("/api/images", (req, res) => {
    const files = readAllFiles(dir, []).map((name) => name.substring(11))

    res.send(files)
})

app.get("/api/lastImageIndex", async (req, res) => {
    const value = await client.get("lastImageIndex")
    console.log(Number(value))

    res.send({ lastImageIndex: Number(value) })
})

app.patch("/api/lastImageIndex", async (req, res) => {
    await client.set("lastImageIndex", req.body.lastImageIndex)

    res.sendStatus(200)
})

app.get("/favicon.ico", (req, res) => {
    res.status(204)
})


app.listen(port, () => {
    console.log(`Express listening on port ${port}`)
})
