// multiplayer.ts
export class MultiplayerManager {
  private ws: WebSocket;
  private roomId: string | null = null;
  private playerId: string | null = null;

  constructor(
    serverUrl: string,
    private onGameStart: () => void,
    private onSnakeUpdate: (playerId: string, snake: any) => void,
    private onFoodUpdate: (food: { x: number, y: number }) => void,
    private onPlayerJoined: (playerId: string) => void,
    private onPlayerLeft: (playerId: string) => void
  ) {
    this.ws = new WebSocket(serverUrl);
    this.setupWebSocket();
  }

  private setupWebSocket() {
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'room_created':
        case 'joined_room':
          this.roomId = message.roomId;
          this.playerId = message.playerId;
          break;

        case 'game_start':
          this.onGameStart();
          break;

        case 'snake_updated':
          this.onSnakeUpdate(message.playerId, message.snake);
          break;

        case 'food_updated':
          this.onFoodUpdate(message.food);
          break;
      }
    };
  }

  createRoom() {
    this.ws.send(JSON.stringify({ type: 'create_room' }));
  }

  joinRoom(roomId: string) {
    this.ws.send(JSON.stringify({ type: 'join_room', roomId }));
  }

  updateSnake(snake: any) {
    if (this.roomId) {
      this.ws.send(JSON.stringify({
        type: 'update_snake',
        snake
      }));
    }
  }

  updateFood(food: { x: number, y: number }) {
    if (this.roomId) {
      this.ws.send(JSON.stringify({
        type: 'update_food',
        food
      }));
    }
  }
}