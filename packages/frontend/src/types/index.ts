import { MessageType, User } from '@kodecollab/shared';

export interface WebSocketMessage {
  type: MessageType;
  payload: { 
    content?: string;
    isTyping?: boolean;
  };
  sessionId: string;
  timestamp: number;
  user?: Pick<User, 'id' | 'username' | 'color'>;
}
