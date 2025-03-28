import express from 'express'
import path from 'node:path'
import { readAll, writeAll } from 'jsr:@std/io';

const app = express()
const port = 3000

const devHostname = "julian-nixos"
const devMode = Deno.hostname() == devHostname
const dir = devMode ? "src/public/images" : "/mnt/bildi"

const configDir = "config"
const lastImageIndexPath = configDir + "/lastImageIndex.txt"

console.log(devMode ? "Running in dev mode!" : "Running in production mode.")

function readAllFiles(dir, arr) {
    const files = Deno.readDirSync(dir, { withFileTypes: true })

    for (const file of files) {
        if (file.isDirectory) {
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

app.get("/api/images", (_req, res) => {
    const files = readAllFiles(dir, []).map((name) => name.substring(11))

    res.send(files)
})

app.get("/api/lastImageIndex", async (_req, res) => {
    try {
        Deno.mkdirSync(configDir, { recursive: true });
    } catch (_) { }
    const file = await Deno.open(lastImageIndexPath, { create: true, read: true, write: true });

    const decoder = new TextDecoder("utf-8");
    const fileContent = await readAll(file);

    let value = decoder.decode(fileContent)
    if (value == "") {
        value = 0
        const encoder = new TextEncoder();
        const data = encoder.encode("0");
        writeAll(file, data);
    }

    file.close();

    console.log(Number(value))

    res.send({ lastImageIndex: Number(value) })
})

app.patch("/api/lastImageIndex", async (req, res) => {
    try {
        Deno.mkdirSync(configDir, { recursive: true });
    } catch (_) { }
    const file = await Deno.open(lastImageIndexPath, { create: true, read: true, write: true });
    const encoder = new TextEncoder();
    const data = encoder.encode(req.body.lastImageIndex);
    await writeAll(file, data);

    res.sendStatus(200)
})

app.get("/favicon.ico", (_req, res) => {
    res.status(204)
})


app.listen(port, '::1', () => {
    console.log(`Express listening on port ${port}`)
})
