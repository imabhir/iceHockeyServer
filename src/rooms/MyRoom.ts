import { Room, Client } from "colyseus";
import { MyRoomState, Vec2 } from "./schema/MyRoomState";
import { type, Schema, MapSchema, ArraySchema } from "@colyseus/schema";

export class MyRoom extends Room<MyRoomState> {
    room: any;
    topPlayer: string = "";
    bottomPlayer: string = "";

    onCreate(options: any) {
        this.setState(new MyRoomState());

        this.setSimulationInterval((deltaTime) => this.update(deltaTime));

        this.onMessage("onScoreChange", (client, data) => {
            console.log("Player Scored: ", data);
            this.broadcast("UpdatedScoreFromTheServer", data);
        });

        this.onMessage("strikerMoved", (client, data) => {
            console.log("striker move data ", client, data);

            let senderSpeedQueue = data.speedQueue;
            let newSpeedQueue = new ArraySchema<Vec2>();

            if (client.sessionId === this.topPlayer) {
                // console.log("changing topPlayer state>>>>>>>", data.positions.x / 10, data.positions.y / 10);
                this.state.playerTop.x = data.positions.x;
                this.state.playerTop.y = data.positions.y;

                senderSpeedQueue.forEach((point: { x: number; y: number }) => {
                    let vec2 = new Vec2();
                    vec2.x = point.x;
                    vec2.y = point.y;
                    newSpeedQueue.push(vec2);
                });
                this.state.playerTop.speedQueue = newSpeedQueue;
            } else {
                console.log("changing bottomPlayer state>>>>>>>");
                this.state.playerBottom.x = data.positions.x;
                this.state.playerBottom.y = data.positions.y;

                senderSpeedQueue.forEach((point: { x: number; y: number }) => {
                    let vec2 = new Vec2();
                    vec2.x = point.x;
                    vec2.y = point.y;
                    newSpeedQueue.push(vec2);
                });

                this.state.playerBottom.speedQueue = newSpeedQueue;
            }
        });
        this.onMessage("PuckState", (client, data) => {
            console.log("Puck Position Changing!", data);
            this.state.PuckState.client = client.sessionId;
            this.state.PuckState.x = data.position.x * 10;
            this.state.PuckState.y = data.position.y * 10;
            this.state.PuckState.angularVelocity = data.angularVelocity * 10;
            this.state.PuckState.velocityX = data.velocity.x * 10;
            this.state.PuckState.velocityY = data.velocity.y * 10;
        });
    }

    update(deltaTime: number) {}

    onJoin(client: Client, options: any) {
        console.log("joined!", client.sessionId);

        if (!this.topPlayer.length) {
            this.topPlayer = client.sessionId;
            this.state.playerInfo.topPlayer = this.topPlayer;
        } else {
            this.bottomPlayer = client.sessionId;
            this.state.playerInfo.bottomPlayer = this.bottomPlayer;
            this.broadcast("AllPlayersHasJoined");
        }
    }

    onLeave(client: Client, consented: boolean) {
        console.log(client.sessionId, "left!");
    }

    onDispose() {
        console.log("room", this.roomId, "disposing...");
    }
}
