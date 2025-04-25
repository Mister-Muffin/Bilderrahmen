// deno-lint-ignore-file no-window
const siteUpdateInterval = 2 * 1000

async function setImage(index, path) {
    try {
        const currentDomain = window.location.origin
        path = currentDomain + "/" + path

        const imageIndexUi = document.getElementById("imageIndex")
        const imagePreviewUi = document.getElementById("imagePreview")

        imagePreviewUi.src = path
        imageIndexUi.innerText = index
    } catch (error) {
        console.error("Error fetching last image index:", error)
    }
}

const proto = window.location.protocol == "http:" ? "ws://" : "wss://"
const connection = new WebSocket(`${proto}${window.location.host}/admin`)
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
