import { useState } from 'react';
import { useCreateRoom } from '../hooks/useChat';

interface Props {
  onClose: () => void;
}

export const CreateRoomModal = ({ onClose }: Props) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const createRoom = useCreateRoom();

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await createRoom.mutateAsync({ name: name.trim(), description: description.trim() });
    onClose();
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={onClose}
    >
      {/* Modal — stop click propagation so backdrop click closes */}
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-white font-bold text-lg mb-1">Create a Room</h2>
        <p className="text-zinc-500 text-sm mb-5">Rooms are where conversations happen</p>

        {createRoom.isError && (
          <div className="bg-red-950 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-lg mb-4">
            Room name already taken — try a different name
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1 block">
              Room Name
            </label>
            <input
              className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 transition placeholder-zinc-600"
              placeholder="e.g. general, random, design"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1 block">
              Description <span className="text-zinc-600 normal-case">(optional)</span>
            </label>
            <input
              className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 transition placeholder-zinc-600"
              placeholder="What's this room about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={100}
            />
          </div>

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-sm font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || createRoom.isPending}
              className="flex-1 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition"
            >
              {createRoom.isPending ? 'Creating...' : 'Create Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
