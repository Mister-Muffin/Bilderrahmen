export function createImageElement(imagePath) {
    const imageElement = document.createElement("img")

    imageElement.src = imagePath
    imageElement.alt = "Fehler beim Anzeigen des Bildes"
    imageElement.loading = "eager"
    imageElement.addEventListener("load", () => {
        loadingText.classList.add("hidden")
    })

    return imageElement
}

export function extractYearFromPath(path) {
    const splitName = path.split("/")
    const splitYear = splitName[1]
    return splitYear
}
