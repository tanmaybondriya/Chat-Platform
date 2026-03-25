import { useState } from 'react';
import { dmApi } from '../api/chat.api';
import { useStartDM } from '../hooks/useChat';

interface User {
  _id: string;
  username: string;
  email: string;
  isOnline: boolean;
}

interface Props {
  onClose: () => void;
  onSelectConversation: (dmId: string, username: string) => void;
}

export const UserSearchModal = ({ onClose, onSelectConversation }: Props) => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setloading] = useState(false);
  const startDm = useStartDM();

  const handleSearch = async (value: string) => {
    setQuery(value);
    if (value.length < 2) {
      setUsers([]);
      return;
    }
    setloading(true);
    try {
      const results = await dmApi.searchUsers(value);
      setUsers(results);
    } finally {
      setloading(false);
    }
  };
  const handleSelectUser = async (user: User) => {
    const conversation = await startDm.mutateAsync(user._id);
    onSelectConversation(conversation._id, user.username);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-white font-bold text-lg mb-1">New Message</h2>
        <p className="text-zinc-500 text-sm mb-4">Search for a user to start a DM</p>

        <input
          className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 transition placeholder-zinc-600 mb-3"
          placeholder="Search by username..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          autoFocus
        />
        <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
          {loading && <p className="text-zinc-500 text-sm px-2">Searching...</p>}
          {!loading && query.length >= 2 && users.length === 0 && (
            <p className="text-zinc-500 text-sm px-2">No users found</p>
          )}
          {users.map((user) => (
            <button
              key={user._id}
              onClick={() => handleSelectUser(user)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-800 transition text-left"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                {user.username[0].toUpperCase()}
              </div>
              <div>
                <p className="text-white text-sm font-medium"> {user.username}</p>
                <p className="text-zinc-500 text-xs">{user.email}</p>
              </div>
              <div
                className={`ml-auto w-2 h-2 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-zinc-600'}`}
              />
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-sm transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
