import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { EventEmitter } from "events";

const { SECRET1 } = process.env;

class WebSocket {
    private channels: { [key: string]: EventEmitter } = {};

    private _io: Server | null = null;
    static _instance: WebSocket;
    static getInstance() {
        if (!WebSocket._instance) {
            WebSocket._instance = new WebSocket();
        }
        return WebSocket._instance;
    }
    __handleUnauthorize(socket: Socket) {
        socket.disconnect(true)
        console.log("Socket Unauthorized")
    }
    __authenticate(socket: Socket, next: any) {
        const { auth, headers } = socket.handshake
        if (!auth.token && !headers.token) {
            return this.__handleUnauthorize(socket)
        }
        const token = auth.token || headers.token
        try {
            if (!token) {
                throw new Error()
            }

            const user = jwt.verify(token, SECRET1 as string)
            socket.data.user = user
            next()
        } catch (err) {
            return this.__handleUnauthorize(socket)
        }
    }
    __handleDataSubscription(socket: Socket) {
        socket.on("subscribe", (data) => {
            const { collection, actions } = data
            if (!collection || !actions) {
                socket.disconnect(true)
                console.log("Invalid Subscribe", data)
            }

            for (const action of actions) {
                socket.join(`${collection}-${action}`)
            }
        })
    }
    init(server: any) {
        // console.log("vao init");
        const io = new Server(server, {
            path: "/ws",
        })


        io.of("/data-subscription").use((socket, next) => this.__authenticate(socket, next))

        io.of("/data-subscription").on("connection", this.__handleDataSubscription)

        io.on("connection", (socket) => {
            const { headers } = socket.handshake
            console.log(headers);
            // headers.channel = headers.channel || ""
            if (!headers.channel) {
                socket.disconnect()
                return console.log("Channel not found. Please make sure you add 'channel' to headers")
            }

            socket.on("message", (data) => {
                if (this.channels[headers.channel as string]) {
                    this.channels[headers.channel as string].emit("message", data);
                }
            })
            
            socket.join(headers.channel)
        })


        this.channels = {}
        this._io = io
    }
    broadcastChange(collection: string, action: string, data: any) {
        if (this._io) {
            this._io.of("data-subscription").to(`${collection}-${action}`).emit("change", {
                action,
                data,
            });
        } else {
            console.error("WebSocket server not initialized. Cannot emit message.");
        }
    }

    on(channel: string, cb: (data: any) => void) {

        this.channels[channel] = this.channels[channel] || new EventEmitter();
        this.channels[channel].on("message", cb);
    }

    emit(channel: string, data: any) {
        if (this._io) {
            this._io.sockets.in(channel).emit("message", data);
        } else {
            console.error("WebSocket server not initialized. Cannot emit message.");
        }
    }
}


const ws = WebSocket.getInstance()

export default ws