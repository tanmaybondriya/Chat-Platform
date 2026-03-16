export const mockChatRepository = {
  createRoom: jest.fn(),
  findRoomById: jest.fn(),
  findRoomByName: jest.fn(),
  getAllPublicRooms: jest.fn(),
  addMemberToRoom: jest.fn(),
  removeMemberFromRoom: jest.fn(),
  isRoomMember: jest.fn(),
  saveMessage: jest.fn(),
  getMessagesByRoom: jest.fn(),
  markMessageAsRead: jest.fn(),
};

export const mockRoom = {
  _id: { toString: () => '69ac96fa260cc0a48aa10b4a' },
  name: 'general',
  description: 'General chat room',
  isPrivate: false,
  members: ['69ac902a2de98bbb0e3e59e0'],
  createdBy: ['69ac902a2de98bbb0e3e59e0'],
};
