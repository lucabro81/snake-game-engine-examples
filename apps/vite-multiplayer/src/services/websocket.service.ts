import { GameMessage } from "../game/connection/types/game-messages";
export class WebSocketService<T extends string = string, MessageType = GameMessage | T> {
  private ws: WebSocket;
  private isConnected: boolean = false;

  // Callback handlers for different message types
  private messageHandlers: Map<MessageType, (data: any) => void> = new Map();

  constructor(serverUrl: string) {
    this.ws = new WebSocket(serverUrl);
    this.setupWebSocket();
  }

  private setupWebSocket() {
    console.log('Setting up WebSocket');
    this.ws.onopen = () => {
      this.isConnected = true;
      console.log('Connected to server');
    };

    this.ws.onclose = () => {
      this.isConnected = false;
      console.log('Disconnected from server');
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const handler = this.messageHandlers.get(message.type);

        if (handler) {
          handler(message.data);
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  // Register handlers for different message types
  on(messageType: MessageType, handler: (data: any) => void) {
    this.messageHandlers.set(messageType, handler);
  }

  // Send a message to the server
  send(type: MessageType, data: any) {
    if (this.isConnected) {
      const message = JSON.stringify({
        type,
        data
      });
      this.ws.send(message);
    }
  }

  // Clean up connection
  disconnect() {
    if (this.isConnected) {
      this.ws.close();
    }
  }
}