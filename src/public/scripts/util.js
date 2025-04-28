export function createImageElement(imagePath) {
    const imageElement = document.createElement("img")

    imageElement.src = imagePath
    imageElement.alt = "Fehler beim Anzeigen des Bildes"
    imageElement.loading = "eager"
    imageElement.addEventListener("load", handleImageLoad, { once: true })
    imageElement.addEventListener("error", handleImageError, { once: true })

    return imageElement
}

export function extractYearFromPath(path) {
    const splitName = path.split("/")
    const splitYear = splitName[1]
    return splitYear
}

export function showFullscreenMessage(title, message) {
    const messageContainer = document.createElement("div")
    messageContainer.classList.add("fillMessage")
    messageContainer.innerHTML = `
        <h1>${title}</h1>
        <span>${message}</span>
    `
    document.body.appendChild(messageContainer)
    return messageContainer
}

export function hideFullscreenMessage(messageContainer) {
    if (messageContainer) {
        messageContainer.remove()
    } else {
        document.querySelectorAll(".fillMessage").forEach((message) => {
            message.remove()
        })
    }
}

function handleImageLoad(_event) {
    loadingText.classList.add("hidden")
}

function handleImageError(_event) {
    loadingText.classList.add("hidden")
    showFullscreenMessage("Fehler beim laden des Bildes", "Das Bild konnte nicht geladen werden.")
    console.warn("Error loading image")
}
