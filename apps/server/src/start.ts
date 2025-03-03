import { GameServer } from "websocket-game-server";
// import { GameServer } from "./server";
import { SnakeMessageType } from "./utils/snake-messages";

const server = new GameServer();
server.addRelayMessageToRoom(SnakeMessageType.PLAYER_POSITION_UPDATE);
server.addRelayMessageToRoom(SnakeMessageType.FOOD_COLLECTED);

console.log('WebSocket server is running on port 8080');