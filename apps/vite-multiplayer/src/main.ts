import './style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
      <button id="counter" type="button">test</button>
      <button id="connect" type="button">connect</button>
  </div>
`;

let ws: WebSocket;

function connect() {
  ws = new WebSocket("http://localhost:8080");
  console.log("connected", ws);
  ws.onmessage = (event) => {
    console.log("event", event.data);
  };
}

function sendMessage() {
  ws.send("hello");
}

document.querySelector<HTMLButtonElement>('#counter')!
  .addEventListener('click', sendMessage)

document.querySelector<HTMLButtonElement>('#connect')!
  .addEventListener('click', connect)