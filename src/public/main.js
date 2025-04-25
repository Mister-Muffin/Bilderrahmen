let activeDiv = document.getElementById("c1");
let i1 = document.getElementById("i1");

let images = [];

let imageIndex = 0

let loadingText = document.getElementById("loadingText")
let imageIndexElement = document.getElementById("imageIndex")
let imageYearElement = document.getElementById("folder")

const sleepDuration = 20 * 1000

fetch("/api/lastImageIndex")
    .then((res) => { return res.json(); })
    .then((data) => {
        imageIndex = data.lastImageIndex
    })
    .then(() => { loadFirstImage() })
    .catch((e) => { console.warn(e); });


function updateClock() {
    let date = new Date();
    let hh = date.getHours().toString();
    let mm = date.getMinutes().toString();

    // if (hh.length < 2) {
    //     hh = "0" + hh;
    // }
    if (mm.length < 2) {
        mm = "0" + mm;
    }

    let time = hh + ":" + mm;

    document.getElementById("clock").innerText = time;
    setTimeout(function () { updateClock() }, 1000);
}
updateClock();

function loadFirstImage() {
    fetch("/api/images")
        .then((res) => { return res.json(); })
        .then((data) => {
            data.forEach((element) => {
                images.push(element);
            });

            i1.src = images[imageIndex];
            imageIndexElement.innerText = imageIndex + '/' + images.length

            setTimeout(() => {
                loadNextImage(activeDiv);
            }, sleepDuration);
        })
        .catch((e) => { console.warn(e); });
}

async function loop(nextImageDiv) {
    // incrementImageIndex()
    const oldImage = activeDiv
    // console.log(imageIndex)
    activeDiv.classList.remove("slidein");
    activeDiv.classList.add("slideout");
    // i2.src = images[imageIndex];
    nextImageDiv.classList.add("slidein");
    activeDiv = nextImageDiv;

    const splitName = images[imageIndex].split('/')
    const splitYear = splitName[0]
    imageYearElement.innerText = splitYear
    imageIndexElement.innerText = imageIndex


    setTimeout(function () {
        loadNextImage(oldImage);
    }, sleepDuration / 2);
}

function incrementImageIndex() {
    imageIndex = (imageIndex + 1) % images.length
    fetch("/api/lastImageIndex", {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ lastImageIndex: imageIndex })
    })
        .catch((e) => { console.warn(e); });
}

async function loadNextImage(oldImage) {
    console.info("Loading next image")
    loadingText.classList.toggle("hidden")
    oldImage.remove()
    incrementImageIndex()
    const nextImageDiv = document.createElement("div")
    const nextImageIm = document.createElement("img")

    nextImageIm.src = images[imageIndex]
    nextImageIm.alt = "Fehler beim Anzeigen des Bildes"
    nextImageIm.loading = "eager"

    nextImageDiv.classList.add("newImage")
    nextImageDiv.classList.add("animation")
    nextImageDiv.classList.add("container")

    nextImageDiv.appendChild(nextImageIm)
    document.body.appendChild(nextImageDiv)

    loadingText.classList.toggle("hidden")

    setTimeout(function () {
        loop(nextImageDiv);
    }, sleepDuration / 2);
}
