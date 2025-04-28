// deno-lint-ignore-file no-window
function setImage(index, path) {
    try {
        const port = parseInt(window.location.port) - 1 || 3000
        const currentDomain = `${window.location.protocol}//${window.location.hostname}:${port}`
        path = currentDomain + "/" + path

        const imageIndexUi = document.getElementById("imageIndex")
        const imagePreviewUi = document.getElementById("imagePreview")

        imagePreviewUi.src = path
        imageIndexUi.innerText = index
    } catch (error) {
        console.error("Error fetching last image index:", error)
    }
}

let connection = null
const connectionErrorElement = document.getElementById("noConnectionAlert")
const proto = window.location.protocol == "http:" ? "ws://" : "wss://"

connectToServer()

function connectToServer() {
    // Discard the old connection if it exists
    if (connection != null) {
        connection.close()
    }
    connection = new WebSocket(`${proto}${window.location.host}`)

    connection.addEventListener("open", () => {
        console.log("Connected to server")
        connectionErrorElement.classList.add("hidden")
    })

    connection.addEventListener("close", () => {
        console.log("Connection closed")
        connectionErrorElement.classList.remove("hidden")
        setTimeout(() => {
            connectToServer()
        }, 10000)
    })

    connection.addEventListener("message", (event) => {
        console.log("Message from server ", event.data)
        const data = JSON.parse(event.data)
        switch (data.type) {
            case "indexUpdate":
                setImage(data.index, data.image)
                break
            case "log": {
                const logContainer = document.getElementById("logContainer")
                const newLogLine = document.createElement("div")
                newLogLine.innerText = data.message
                logContainer.appendChild(newLogLine)
                break
            }
            default:
                console.warn("Unknown message type:", message.type)
                break
        }
    })
}

const setIndexButton = document.getElementById("setIndexButton")
setIndexButton.addEventListener("click", async (event) => {
    event.preventDefault()
    const indexInput = document.getElementById("newImageIndexInput")
    const newIndex = parseInt(indexInput.value)

    try {
        await fetch("/api/lastImageIndex", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ lastImageIndex: newIndex }),
        })
    } catch (e) {
        console.warn(e)
    }
})

const nextImageButton = document.getElementById("skipImageBtn")
nextImageButton.addEventListener("click", async (event) => {
    event.preventDefault()
    try {
        await fetch("/api/nextImage", {
            method: "POST",
        })
    } catch (e) {
        console.warn(e)
    }
})
const previousImageButton = document.getElementById("prevImageBtn")
previousImageButton.addEventListener("click", async (event) => {
    event.preventDefault()
    try {
        await fetch("/api/prevImage", {
            method: "POST",
        })
    } catch (e) {
        console.warn(e)
    }
})

const intervalInput = document.getElementById("inputInterval")
;(async () => {
    intervalInput.value = await getInterval()
})()

const saveConfigButton = document.getElementById("saveConfigBtn")
saveConfigButton.addEventListener("click", async (event) => {
    event.preventDefault()
    const interval = parseInt(intervalInput.value)
    try {
        await fetch("/api/interval", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ interval }),
        })
    } catch (e) {
        console.warn(e)
    }
})

async function getInterval() {
    try {
        const response = await fetch("/api/interval")
        const data = await response.json()
        return data.interval
    } catch (error) {
        console.error("Error fetching interval:", error)
    }
}
