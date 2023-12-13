let activeDiv = document.getElementById("c1");
let i1 = document.getElementById("i1");

let images = [];

let imageIndex = 0

let loadingText = document.getElementById("loadingText")

fetch("/api/images")
    .then((res) => {
        return res.json();
    })
    .then((data) => {
        data.forEach((element) => {
            images.push(element);
        });

        i1.src = images[imageIndex];

        setTimeout(() => {
            loadNextImage(activeDiv);
        }, 1000);
    })
    .catch((e) => {
        console.warn(e);
    });


async function loop(nextImageDiv) {
    // incrementImageIndex()
    const oldImage = activeDiv
    // console.log(imageIndex)
    activeDiv.classList.remove("slidein");
    activeDiv.classList.add("slideout");
    // i2.src = images[imageIndex];
    nextImageDiv.classList.add("slidein");
    activeDiv = nextImageDiv;

    // console.log(activeDiv);

    setTimeout(function () {
        loadNextImage(oldImage);
    }, 20000);
}

function incrementImageIndex() {
    imageIndex = (imageIndex + 1) % images.length
}

async function loadNextImage(oldImage) {
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
    }, 5000);
}
