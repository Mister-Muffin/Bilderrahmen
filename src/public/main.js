import { decodeHeicImage } from "./scripts/heic.js"
import { updateClock } from "./scripts/clock.js"
import {
    createImageElement,
    extractYearFromPath,
    hideFullscreenMessage,
    showFullscreenMessage,
} from "./scripts/util.js"

const containerDiv = document.getElementById("imageContainer")

const loadingText = document.getElementById("loadingText")
const imageIndexElement = document.getElementById("imageIndex")
const imageYearElement = document.getElementById("folder")
const clockElement = document.getElementById("clock")

let fullscreenMessage = null

setImagesCountUi()

let nextImageDiv = null
let activeDiv = null
let oldImage = null

let nextImageYear = ""

const proto = window.location.protocol == "http:" ? "ws://" : "wss://"
let connection = null

connectToServer()

// Check the connection on an interval
setInterval(() => {
    if (connection.readyState != WebSocket.OPEN) {
        if (fullscreenMessage == null) {
            fullscreenMessage = showFullscreenMessage(
                "&#9888; Verbindung zum Server fehlgeschlagen",
                "Wartet auf automatischen Verbindungsaufbau..."
            )
        }
        console.log("Connection closed, trying to reconnect...")
        connectToServer()
    }
}, 10000)

setInterval(updateClock, 1000, clockElement)

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
                imageYearElement.innerText = nextImageYear
                break
            case "prepNext":
                loadNextImage(data.image)
                nextImageYear = extractYearFromPath(data.image)
                break
            case "loadImage":
                setImage(data.index, data.image)
                break
            default:
                console.warn("Unknown message type:", message.type)
                break
        }
    })
    connection.addEventListener(
        "open",
        () => {
            console.log("Connected to server")
            hideFullscreenMessage(fullscreenMessage)
            fullscreenMessage = null
        },
        { once: true }
    )
}

async function setImage(index, path) {
    try {
        await loadNextImage(path)
        switchToNextImage(index)

        imageYearElement.innerText = extractYearFromPath(path)
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

    // If this is the first image, we don't have an activeDiv
    if (activeDiv != null) {
        activeDiv.classList.remove("slidein")
        activeDiv.classList.add("slideout")
    }

    nextImageDiv.classList.add("slidein")
    activeDiv = nextImageDiv

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
        const newImageElement = createImageElement(nextImage)

        nextImageDiv.appendChild(newImageElement)
    }

    nextImageDiv.classList.add("newImage")
    nextImageDiv.classList.add("animation")
    nextImageDiv.classList.add("container")

    containerDiv.appendChild(nextImageDiv)
}
