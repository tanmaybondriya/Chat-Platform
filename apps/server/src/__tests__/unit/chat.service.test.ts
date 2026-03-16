import { ChatService } from '../../modules/chat/chat.service';
import { ChatRepository } from '../../modules/chat/chat.repository';
import { mockChatRepository, mockRoom } from '../mocks/chat.repository.mock';
import { APIError } from '../../shared/utils/api-error';

jest.mock('../../modules/chat/chat.repository');

describe('ChatService', () => {
  let chatService: ChatService;

  beforeEach(() => {
    (ChatRepository as jest.Mock).mockImplementation(() => mockChatRepository);
    chatService = new ChatService();
  });

  // ── createRoom() ─────────────────────────────────────────

  describe('createRoom()', () => {
    const roomData = {
      name: 'general',
      description: 'General chat',
      isPrivate: false,
      createdBy: '69ac902a2de98bbb0e3e59e0',
    };

    it('should create a room successfully', async () => {
      // Arrange
      mockChatRepository.findRoomByName.mockResolvedValue(null); // name not taken
      mockChatRepository.createRoom.mockResolvedValue(mockRoom);

      // Act
      const result = await chatService.createRoom(roomData);

      // Assert
      expect(result.name).toBe('general');
      expect(mockChatRepository.createRoom).toHaveBeenCalledWith(roomData);
    });

    it('should throw CONFLICT when room name is taken', async () => {
      // Arrange — room already exists
      mockChatRepository.findRoomByName.mockResolvedValue(mockRoom);

      // Act + Assert
      await expect(chatService.createRoom(roomData)).rejects.toThrow('Room name already taken');

      expect(mockChatRepository.createRoom).not.toHaveBeenCalled();
    });

    it('should throw APIError with status 409 for duplicate room', async () => {
      mockChatRepository.findRoomByName.mockResolvedValue(mockRoom);

      try {
        await chatService.createRoom(roomData);
      } catch (error) {
        expect(error).toBeInstanceOf(APIError);
        expect((error as APIError).statusCode).toBe(409);
      }
    });
  });

  // ── joinRoom() ───────────────────────────────────────────

  describe('joinRoom()', () => {
    it('should join a public room successfully', async () => {
      // Arrange
      mockChatRepository.findRoomById.mockResolvedValue(mockRoom);
      mockChatRepository.addMemberToRoom.mockResolvedValue(undefined);

      // Act
      const result = await chatService.joinRoom(
        '69ac96fa260cc0a48aa10b4a',
        '69ac902a2de98bbb0e3e59e0',
      );

      // Assert
      expect(result.name).toBe('general');
      expect(mockChatRepository.addMemberToRoom).toHaveBeenCalledWith(
        '69ac96fa260cc0a48aa10b4a',
        '69ac902a2de98bbb0e3e59e0',
      );
    });

    it('should throw NOT_FOUND when room does not exist', async () => {
      mockChatRepository.findRoomById.mockResolvedValue(null);

      await expect(chatService.joinRoom('nonexistent_id', 'user_id')).rejects.toThrow(
        'Room not found',
      );
    });

    it('should throw FORBIDDEN when room is private', async () => {
      const privateRoom = { ...mockRoom, isPrivate: true };
      mockChatRepository.findRoomById.mockResolvedValue(privateRoom);

      await expect(chatService.joinRoom('room_id', 'user_id')).rejects.toThrow(
        'this is a private room',
      );
    });

    it('should throw APIError with status 404 for missing room', async () => {
      mockChatRepository.findRoomById.mockResolvedValue(null);

      try {
        await chatService.joinRoom('bad_id', 'user_id');
      } catch (error) {
        expect(error).toBeInstanceOf(APIError);
        expect((error as APIError).statusCode).toBe(404);
      }
    });
  });

  // ── getRoomMessages() ────────────────────────────────────

  describe('getRoomMessages()', () => {
    it('should return messages for a room member', async () => {
      const mockMessages = [{ _id: '1', content: 'Hello', roomId: mockRoom._id.toString() }];

      mockChatRepository.isRoomMember.mockResolvedValue(true);
      mockChatRepository.getMessagesByRoom.mockResolvedValue(mockMessages);

      const result = await chatService.getRoomMessages(
        '69ac96fa260cc0a48aa10b4a',
        '69ac902a2de98bbb0e3e59e0',
        50,
      );

      expect(result).toEqual(mockMessages);
      expect(mockChatRepository.getMessagesByRoom).toHaveBeenCalledWith(
        '69ac96fa260cc0a48aa10b4a',
        50,
        undefined,
      );
    });

    it('should throw FORBIDDEN for non-members', async () => {
      mockChatRepository.isRoomMember.mockResolvedValue(false);

      await expect(chatService.getRoomMessages('room_id', 'user_id', 50)).rejects.toThrow(
        'You are not a member of this room',
      );
    });
  });
});
