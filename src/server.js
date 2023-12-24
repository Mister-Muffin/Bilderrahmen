import express from 'express'
import fs from 'fs'
import path from 'path'

const app = express()
const port = 3000


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
    for (const file of files) {
        // console.log(file)
    }
    res.send(files)

})

app.get("/api/lastImageIndex", (req, res) => {
    const file = fs.readFileSync(configDir + "/config.json")
    
    res.send(file)
})

app.patch("/api/lastImageIndex", (req, res) => {
    const file = JSON.parse(fs.readFileSync(configDir + "/config.json", "utf8"))
    file.lastImageIndex = req.body.lastImageIndex
    fs.writeFileSync(configDir + "/config.json", JSON.stringify(file))
    
    res.sendStatus(200)
})

app.get("/favicon.ico", (req, res) => {
    res.status(204)
})


app.listen(port, () => {
    console.log(`Express listening on port ${port}`)
})
