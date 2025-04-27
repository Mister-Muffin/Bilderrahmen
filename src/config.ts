import { readAll, writeAll } from "jsr:@std/io"

const configDir = "./config"

const defaultConfig: Config = {
    cycleTime: 20 * 1000,
}
const defaultConfigFileName = "config.json"

export type Config = {
    cycleTime: number
}

export async function getConfig(configFile: string = defaultConfigFileName): Promise<Config> {
    try {
        Deno.mkdirSync(configDir, { recursive: true })
    } catch (e) {
        console.warn(e)
    }
    const file = await Deno.open(configDir + "/" + configFile, {
        create: true,
        read: true,
        write: true,
    })

    const decoder = new TextDecoder("utf-8")
    const fileContent = await readAll(file)

    let content = decoder.decode(fileContent)
    if (content == "") {
        content = JSON.stringify(defaultConfig)
        const encoder = new TextEncoder()
        const data = encoder.encode(content)
        writeAll(file, data)
    }

    file.close()
    console.log(content)
    return JSON.parse(content) as Config
}

export async function saveConfig(
    config: Config,
    configFile: string = defaultConfigFileName
): Promise<Config> {
    try {
        Deno.mkdirSync(configDir, { recursive: true })
    } catch (e) {
        console.warn(e)
    }
    const file = await Deno.open(configDir + "/" + configFile, {
        create: true,
        read: true,
        write: true,
        truncate: true,
    })

    const encoder = new TextEncoder()
    const data = encoder.encode(JSON.stringify(config))
    writeAll(file, data)

    file.close()
    return config
}
