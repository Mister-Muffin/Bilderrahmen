let activeDiv = document.getElementById("c1")
let i1 = document.getElementById("i1")

let loadingText = document.getElementById("loadingText")
let imageIndexElement = document.getElementById("imageIndex")
let imageYearElement = document.getElementById("folder")

const sleepDuration = 20 * 1000

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

async function loadFirstImage() {
    try {
        const res = await fetch("/api/image");
        const data = await res.json();

        const imagePath = data.image;
        const index = data.index;

        i1.src = imagePath;
        setCurrentImageNumberUi(index);

        setTimeout(() => {
            loadNextImage(activeDiv);
        }, sleepDuration);
    } catch (e) {
        console.warn(e);
    }
}

// Returns the image path from the server
async function getImage() {
    try {
        const res = await fetch("/api/image");
        const data = await res.json();
        return data.image;
    } catch (e) {
        console.warn(e);
        throw e;
    }
}

function setCurrentImageNumberUi(index) {
    imageIndexElement.innerText = index
}

// Fetches the number of images from the server and sets the UI
async function setImagesCountUi() {
    const imagesCountElement = document.getElementById("imagesCount")
    try {
        const res = await fetch("/api/imagesCount");
        const data = await res.json();
        imagesCountElement.innerText = data.count;
    } catch (e) {
        console.warn(e);
        throw e;
    }
}

function loop(nextImageDiv, newIndex) {
    const oldImage = activeDiv
    
    activeDiv.classList.remove("slidein")
    activeDiv.classList.add("slideout")
    
    nextImageDiv.classList.add("slidein")
    activeDiv = nextImageDiv

    const splitName = nextImageDiv.firstChild.src.split("/")
    const splitYear = splitName[0]
    imageYearElement.innerText = splitYear

    setCurrentImageNumberUi(newIndex)

    setTimeout(async function () {
        await loadNextImage(oldImage)
    }, sleepDuration / 2)
}

async function incrementImageIndex(newIndex) {
    try {
        const res = await fetch("/api/lastImageIndex", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ lastImageIndex: newIndex }),
        });

        if (!res.ok) {
            throw new Error("Network response was not ok");
        }

        const body = await res.json();
        return body.lastImageIndex;
    } catch (e) {
        console.warn(e);
        throw e;
    }
}

async function loadNextImage(oldImage) {
    // console.info("Loading next image")
    loadingText.classList.toggle("hidden")
    oldImage.remove()
    const nextIndex = await incrementImageIndex()
    const nextImage = await getImage()
    const nextImageDiv = document.createElement("div")
    const nextImageIm = document.createElement("img")

    nextImageIm.src = nextImage
    nextImageIm.alt = "Fehler beim Anzeigen des Bildes"
    nextImageIm.loading = "eager"

    nextImageDiv.classList.add("newImage")
    nextImageDiv.classList.add("animation")
    nextImageDiv.classList.add("container")

    nextImageDiv.appendChild(nextImageIm)
    document.body.appendChild(nextImageDiv)

    loadingText.classList.toggle("hidden")

    setTimeout(function () {
        loop(nextImageDiv, nextIndex)
    }, sleepDuration / 2)
}

setImagesCountUi()
updateClock()
loadFirstImage()
