import { decodeHeicImage } from "./heic.js"

let activeDiv = document.getElementById("c1")
let i1 = document.getElementById("i1")

let loadingText = document.getElementById("loadingText")
let imageIndexElement = document.getElementById("imageIndex")
let imageYearElement = document.getElementById("folder")

const connectionErrorElement = document.getElementById("connectionError")

setImagesCountUi()
updateClock()

let nextImageDiv = null
let oldImage = null

const proto = window.location.protocol == "http:" ? "ws://" : "wss://"
let connection = null

connectToServer()

// Check the connection on an interval
setInterval(() => {
    if (connection.readyState != WebSocket.OPEN) {
        connectionErrorElement.classList.remove("hidden")
        console.log("Connection closed, trying to reconnect...")
        connectToServer()
    }
}, 10000)

function connectToServer() {
    // Discard the old connection if it exists
    if (connection != null) {
        connection.close()
    }

    connection = new WebSocket(`${proto}${window.location.host}`)
    connection.addEventListener("message", (event) => {
        console.log("Message from server ", event.data)
        const data = JSON.parse(event.data)
        switch (data.type) {
            case "indexUpdate":
                switchToNextImage(data.index)
                break
            case "prepNext":
                loadNextImage(data.image)
                break
            case "loadImage":
                setImage(data.index, data.image)
                break
            default:
                console.warn("Unknown message type:", message.type)
                break
        }
    })
    connection.addEventListener("open", () => {
        console.log("Connected to server")
        connectionErrorElement.classList.add("hidden")
    })
}

function updateClock() {
    let date = new Date()
    let hh = date.getHours().toString()
    let mm = date.getMinutes().toString()

    // if (hh.length < 2) {
    //     hh = "0" + hh;
    // }
    if (mm.length < 2) {
        mm = "0" + mm
    }

    let time = hh + ":" + mm

    document.getElementById("clock").innerText = time
    setTimeout(function () {
        updateClock()
    }, 1000)
}

function setImage(index, path) {
    try {
        i1.src = path
        setCurrentImageNumberUi(index)
    } catch (e) {
        console.warn(e)
    }
}

function setCurrentImageNumberUi(index) {
    imageIndexElement.innerText = index
}

// Fetches the number of images from the server and sets the UI
async function setImagesCountUi() {
    const imagesCountElement = document.getElementById("imagesCount")
    try {
        const res = await fetch("/api/imagesCount")
        const data = await res.json()
        imagesCountElement.innerText = data.count
    } catch (e) {
        console.warn(e)
        throw e
    }
}

function switchToNextImage(newIndex) {
    if (nextImageDiv == null) {
        console.warn("No next image loaded")
        return
    }
    oldImage = activeDiv

    activeDiv.classList.remove("slidein")
    activeDiv.classList.add("slideout")

    nextImageDiv.classList.add("slidein")
    activeDiv = nextImageDiv

    const splitName = nextImageDiv.firstChild.src.split("/")
    const splitYear = splitName[3]
    imageYearElement.innerText = splitYear

    setCurrentImageNumberUi(newIndex)
}

async function loadNextImage(nextImage) {
    loadingText.classList.remove("hidden")
    if (oldImage != null) {
        oldImage.remove()
    }

    nextImageDiv = document.createElement("div")

    if (nextImage.endsWith(".heic")) {
        // Decode the heic image
        const canvas = await decodeHeicImage(nextImage)

        nextImageDiv.appendChild(canvas)
        loadingText.classList.add("hidden")
    } else {
        const nextImageIm = document.createElement("img")

        nextImageIm.src = nextImage
        nextImageIm.alt = "Fehler beim Anzeigen des Bildes"
        nextImageIm.loading = "eager"
        nextImageIm.addEventListener("load", () => {
            loadingText.classList.add("hidden")
        })

        nextImageDiv.appendChild(nextImageIm)
    }

    nextImageDiv.classList.add("newImage")
    nextImageDiv.classList.add("animation")
    nextImageDiv.classList.add("container")

    document.body.appendChild(nextImageDiv)
}
