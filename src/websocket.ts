import { WebSocket, WebSocketServer } from "ws";
import { ExtWebSocket } from "./server.ts";
import { MessageType } from "./types.ts";

export function broadcastData(wss: WebSocketServer, type: MessageType, data: any, adminOnly = false) {
    // If no one is connected, don't do anything
    if (wss.clients.size == 0) return;

    wss.clients.forEach(client => {
        if (adminOnly && !(client as ExtWebSocket).isAdmin) return;
        client.send(JSON.stringify({type, ...data}));
    });

    return;
}

export function terminateDeadConnections(wss: WebSocketServer) {
    wss.clients.forEach((ws: WebSocket) => {
        if (ws.readyState != WebSocket.OPEN) {
            console.log("Terminating dead connection");
            ws.terminate();
            return;
        }
    });
    return;
}
