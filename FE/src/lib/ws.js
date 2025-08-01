import SockJS from "sockjs-client"
import { Client } from "@stomp/stompjs"

let stompClient = null

export function connectWS(onConnected) {
  stompClient = new Client({
    webSocketFactory: () => new SockJS(`${import.meta.env.VITE_APP_URL}/ws`),
    onConnect: () => {
      console.log("✅ WebSocket Connected")
      if (onConnected) onConnected(stompClient)
    }
  })
  stompClient.activate()
}

export function subscribeWS(topic, callback) {
  stompClient.subscribe(topic, (msg) => {
    callback(JSON.parse(msg.body))
  })
}

export function sendWS(destination, payload) {
  stompClient.publish({ destination, body: JSON.stringify(payload) })
}
