import { User, IUser } from './auth.model';

export class AuthRepository {
  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email }).select('+password');
  }

  async findById(id: string): Promise<IUser | null> {
    return User.findById(id);
  }

  async findByUsername(username: string): Promise<IUser | null> {
    return User.findOne({ username });
  }

  async create(data: { username: string; email: string; password: string }): Promise<IUser> {
    const user = new User(data);
    return user.save();
  }

  async updateOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      isOnline,
      lastseen: new Date(),
    });
  }
}
