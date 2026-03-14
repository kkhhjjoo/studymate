export interface ChatMessage {
  _id?: string | number;
  roomId?: string;
  senderId: string;
  readUserIds?: string[];
  content: string;
  createdAt: string;
}

export interface ChatMember {
  _id: string;
  name: string;
  image?: string;
  leftAt?: string;
}

export interface ChatRoom {
  _id: string;
  resourceType: string;
  resourceId: number;
  roomName: string;
  ownerId: string;
  members: ChatMember[];
  updatedAt: string;
  createdAt: string;
}

export interface ChatRoomState extends ChatRoom {
  unreadCount: number;
  lastMessage?: ChatMessage;
}
