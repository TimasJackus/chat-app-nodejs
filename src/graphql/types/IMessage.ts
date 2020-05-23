export interface IMessage {
  id?: string;
  senderId: string;
  targetId: string;
  type: string;
  content: string | null;
  imageUrl: string | null;
}
