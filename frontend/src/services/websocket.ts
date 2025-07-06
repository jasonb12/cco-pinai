import { WebSocketMessage } from '../types'

export class TranscriptWebSocket {
  private ws: WebSocket | null = null
  private url: string
  private onMessage: (data: WebSocketMessage) => void
  private onError: (error: any) => void
  private onClose: () => void

  constructor(
    url: string,
    onMessage: (data: WebSocketMessage) => void,
    onError: (error: any) => void,
    onClose: () => void
  ) {
    this.url = url
    this.onMessage = onMessage
    this.onError = onError
    this.onClose = onClose
  }

  connect() {
    try {
      this.ws = new WebSocket(this.url)
      
      this.ws.onopen = () => {
        console.log('WebSocket connected')
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.onMessage(data)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        this.onError(error)
      }

      this.ws.onclose = () => {
        console.log('WebSocket disconnected')
        this.onClose()
      }
    } catch (error) {
      console.error('Error connecting WebSocket:', error)
      this.onError(error)
    }
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    } else {
      console.error('WebSocket is not connected')
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}