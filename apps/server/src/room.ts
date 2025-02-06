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
    // Check if room is full
    if (this.players.size >= ROOM_CONSTANTS.MAX_PLAYERS) {
      return false;
    }

    this.players.set(playerId, connection);

    // Update room status if we have minimum players
    if (this.players.size >= ROOM_CONSTANTS.MIN_PLAYERS_TO_START) {
      this.status = RoomStatus.READY;
    }

    return true;
  }

  removePlayer(playerId: string) {
    this.players.delete(playerId);

    // Update status if we drop below minimum players
    if (this.players.size < ROOM_CONSTANTS.MIN_PLAYERS_TO_START) {
      this.status = RoomStatus.WAITING;
    }
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

  broadcast(message: any) {
    this.players.forEach(connection => {
      connection.send(JSON.stringify(message));
    });
  }
}