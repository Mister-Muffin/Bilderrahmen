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
