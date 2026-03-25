import { DMRepository } from './dm.repository';
import { APIError } from '../../shared/utils/api-error';
import { IDMConversation, IDMMessage } from './dm.model';

export class DMService {
  private repository: DMRepository;

  constructor() {
    this.repository = new DMRepository();
  }

  async getOrCreateConversation(
    currentUserId: string,
    targetUserId: string,
  ): Promise<IDMConversation> {
    //Can't dm yourself
    if (currentUserId === targetUserId) {
      throw APIError.badRequest('Your cannot DM yourself');
    }

    //Check if conversation already exists
    let conversation = await this.repository.findConversation(currentUserId, targetUserId);

    //Create if doesn't exists
    if (!conversation) {
      // eslint-disable-next-line no-useless-assignment
      conversation = await this.repository.createConversation(currentUserId, targetUserId);

      //populate after creation
      conversation = (await this.repository.findConversation(
        currentUserId,
        targetUserId,
      )) as IDMConversation;
    }
    return conversation;
  }

  async getUserConversations(userId: string): Promise<IDMConversation[]> {
    return this.repository.getUserConversation(userId);
  }

  async getMessages(
    dmId: string,
    userId: string,
    limit: number,
    cursor?: string,
  ): Promise<IDMMessage[]> {
    const isParticipant = await this.repository.isParticipant(dmId, userId);
    if (!isParticipant) {
      throw APIError.forbidden('You are not a participants in this conversation ');
    }
    return this.repository.getMessages(dmId, limit, cursor);
  }
}
