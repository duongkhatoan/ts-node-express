import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";


const { SECRET_KEY: SECRET1 } = process.env;

class WebSocket {

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

        const io = new Server(server, {
            path: "/ws",
        })

        io.of("/data-subscription").use((socket, next) => this.__authenticate(socket, next))

        io.of("/data-subscription").on("connection", this.__handleDataSubscription)

        io.on("connection", (socket) => {
            socket.on('chat message', (msg) => {
                console.log('message: ' + msg);
            });
            socket.disconnect();
            // socket.co();
        })

        this._io = io
    }
    broadcastChange(collection: string, action: string, data: any) {
        if (this._io) {
            this._io.of("data-subscription").to(`${collection}-${action}`).emit("change", {
                collection,
                action,
                data,
            });
            console.log("emit", collection, action, data)
        } else {
            console.error("WebSocket server not initialized. Cannot emit message.");
        }

    }
}


const ws = WebSocket.getInstance()

export default ws