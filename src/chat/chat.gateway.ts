import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { Server, Socket } from 'socket.io';
import { User } from '../user/entities/user.entity';
import { ParseIntPipe } from '@nestjs/common';
import { LikeDto } from './dto/like.dto';

@WebSocketGateway({ cors: '*' })
export class ChatGateway {
  @WebSocketServer()
  server: Server;
  constructor(private readonly chatService: ChatService) {}
  @SubscribeMessage('message')
  async CreateMessage(
    @MessageBody() createChatDto: CreateChatDto,
    @ConnectedSocket() socket: Socket,
  ): Promise<CreateChatDto> {
    try {
      const message = await this.chatService.createMessage(createChatDto);
      console.log('CreateChatDto', createChatDto);
      let messageToEmit: string;
      if (createChatDto?.parent) {
        messageToEmit = `${message?.author?.username} replied: ${message?.content}`;
      } else {
        messageToEmit = `${message?.author?.username}: ${message?.content}`;
      }

      this.server.emit('messageCreated', messageToEmit);
      // Object.keys(this.chatService.clientToUser).forEach((clientId) => {
      //   this.server.to(clientId).emit('message', messageToEmit);
      // });
      return createChatDto;
    } catch (error) {
      console.error('Error creating message:', error);
      socket.emit(
        'errorMessage',
        'An error occurred while creating the message',
      );
    }
  }
  @SubscribeMessage('findAllMessages')
  async findAllMessages(@ConnectedSocket() socket: Socket) {
    try {
      // console.log('session', session);
      const messages = await this.chatService.findAll();
      console.log('messages', messages);
      // this.server.emit('findAllMessages', messages);
      socket.emit('allMessages', messages);
      return messages;
    } catch (error) {
      console.error('Error finding messages:', error);
      socket.emit(
        'errorMessage',
        'An error occurred while creating the message',
      );
    }
  }

  @SubscribeMessage('deleteMessage')
  async deleteMessage(@MessageBody(ParseIntPipe) id: number): Promise<void> {
    await this.chatService.deleteMessage(+id);
    this.server.emit(
      'deletedMessage',
      `message with id ${id} has been deleted`,
    );
    // Object.keys(this.chatService.clientToUser).forEach((clientId) => {
    //   this.server
    //     .to(clientId)
    //     .emit('deletedMessage', `message with id ${id} has been deleted`);
    // });
  }
  @SubscribeMessage('join')
  joinRoom(@MessageBody() user: User, @ConnectedSocket() socket: Socket): void {
    console.log('this sender', user);
    socket.broadcast.emit(
      'userJoined',
      `${user?.username} has joined the chat`,
    );
    this.chatService.clientToUser[socket.id] = user;
    // console.log('hello', this.chatService.clientToUser[socket.id]);
  }

  @SubscribeMessage('typing')
  typing(
    @MessageBody() isTyping: boolean,
    @ConnectedSocket() socket: Socket,
  ): void {
    const sender = this.chatService.clientToUser[socket.id];
    console.log('sender', sender);
    socket.broadcast.emit('typing', `${sender?.username} is typing...`);
  }

  @SubscribeMessage('like')
  async like(@MessageBody() likeDto: LikeDto, @ConnectedSocket() socket: Socket) {
    const liker = this.chatService.clientToUser[socket.id];
    const type = await this.chatService.likeDislikeMessage(likeDto);
    console.log('sender', liker);
    let messageToEmit: string;
    if (type === 'liked') {
      messageToEmit = `${liker?.username} liked the message with id ${likeDto?.message?.id}`;
    } else {
      messageToEmit = `${liker?.username} disliked the message with id ${likeDto?.message?.id}`;
    }
    this.server.emit(
      'liked',
      messageToEmit,
    );
  }
  @SubscribeMessage('react')
  react(@MessageBody() id: number, @ConnectedSocket() socket: Socket): void {
    const reactor = this.chatService.clientToUser[socket.id];
    console.log('sender', reactor);
    this.server.emit(
      'reacted',
      `${reactor?.username} reacted to the message with id ${id} `,
    );
  }
}
