import { WebSocket } from 'ws';
import { ROOM_CONSTANTS } from './utils/game-messages';
import { RoomStatus } from './utils/room-status';

export class Room {
  private players: Map<string, WebSocket> = new Map();
  private status: RoomStatus = RoomStatus.WAITING;

  constructor(
    private roomId: string,
  ) { }

  addPlayer(playerId: string, connection: WebSocket): boolean {
    if (this.players.size >= ROOM_CONSTANTS.MAX_PLAYERS) {
      return false;
    }

    this.players.set(playerId, connection);

    if (this.players.size >= ROOM_CONSTANTS.MIN_PLAYERS_TO_START) {
      this.status = RoomStatus.READY;
    }

    return true;
  }

  removePlayer(playerId: string) {
    this.players.delete(playerId);

    if (this.players.size < ROOM_CONSTANTS.MIN_PLAYERS_TO_START) {
      this.status = RoomStatus.WAITING;
    }
  }

  broadcast(message: any, excludePlayerId?: string) {
    this.players.forEach((connection, playerId) => {
      if (playerId !== excludePlayerId) {
        connection.send(JSON.stringify(message));
      }
    });
  }

  // Helper methods
  getId(): string {
    return this.roomId;
  }

  getStatus(): RoomStatus {
    return this.status;
  }

  getPlayerCount(): number {
    return this.players.size;
  }
}