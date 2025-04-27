export function updateClock(clockElement) {
    const date = new Date()
    const hh = date.getHours().toString()
    let mm = date.getMinutes().toString()

    // if (hh.length < 2) {
    //     hh = "0" + hh;
    // }
    if (mm.length < 2) {
        mm = "0" + mm
    }

    const time = hh + ":" + mm

    clockElement.innerText = time
}
