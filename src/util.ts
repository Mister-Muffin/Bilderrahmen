import path from "node:path"

function readAllFiles(dir: string, arr: Array<string>) {
    const files = Deno.readDirSync(dir)

    for (const file of files) {
        if (file.isDirectory) {
            readAllFiles(path.join(dir, file.name), arr)
        } else {
            if (file.name.endsWith(".directory")) continue
            arr.push(path.join(dir, file.name))
        }
    }
    return arr
}

export function generateImageArray(dir: string) {
    return readAllFiles(dir, []).map((name) => name.substring(11))
}
