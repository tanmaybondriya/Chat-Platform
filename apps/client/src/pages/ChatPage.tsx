import { useState, useEffect, useRef } from 'react';
import { useRooms, useMessages, useJoinRoom } from '../hooks/useChat';
import { useLogout, useMe } from '../hooks/useAuth';
import { getSocket, connectSocket } from '../socket/socket';
import type { Message } from '../api/chat.api';
import { useQueryClient } from '@tanstack/react-query';
import { CreateRoomModal } from '../components/CreateRoomModal';

export const ChatPage = () => {
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [activeRoomName, setActiveRoomName] = useState<string>('');
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [realTimeMessages, setRealTimeMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const queryClient = useQueryClient();
  const { data: currentUser } = useMe();
  const { data: rooms = [], isLoading: roomsLoading } = useRooms();

  const { data: historicMessages = [] } = useMessages(activeRoomId);
  const joinRoom = useJoinRoom();
  const logout = useLogout();

  const allMessages = [...historicMessages, ...realTimeMessages].filter(
    (msg, index, self) => self.findIndex((m) => m._id === msg._id) === index,
  );

  //auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages]);

  //socket.io event handlers
  useEffect(() => {
    const socket = connectSocket();

    socket.on('message:new', (message: Message) => {
      if (message.roomId === activeRoomId) {
        setRealTimeMessages((prev) => {
          //prevent duplicates
          if (prev.find((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
      }

      //invalidate rooms to update unread counts later
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    });

    socket.on('typing:update', ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
      setTypingUsers((prev) =>
        isTyping
          ? [...prev.filter((id) => id !== userId), userId]
          : prev.filter((id) => id !== userId),
      );
    });

    socket.on('room:joined', ({ roomId }: { roomId: string }) => {
      console.log('joined room:', roomId);
    });

    return () => {
      socket.off('message:new');
      socket.off('typing:update');
      socket.off('room:joined');
    };
  }, [activeRoomId, queryClient]);

  useEffect(() => {
    if (!activeRoomId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRealTimeMessages([]); // clear realtime messages when switching rooms

    const socket = getSocket();
    if (socket?.connected) return;
    setRealTimeMessages([]);
  }, [activeRoomId]);

  const handleRoomSelect = async (roomId: string, roomName: string, isMember: boolean) => {
    if (!isMember) {
      try {
        await joinRoom.mutateAsync(roomId); // ← join via REST first
      } catch (error) {
        console.error('Failed to join room:', error);
        return;
      }
    }
    // Set active room after confirming membership
    setActiveRoomId(roomId);
    setActiveRoomName(roomName);

    // Join via socket AFTER REST join confirms membership
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit('room:join', { roomId });
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeRoomId) return;

    const socket = getSocket();
    socket?.emit('message:send', {
      roomId: activeRoomId,
      content: newMessage.trim(),
    });

    setNewMessage('');
    //stop typing indicator
    socket?.emit('typing:stop', { roomId: activeRoomId });
  };

  const handletyping = (value: string) => {
    setNewMessage(value);

    const socket = getSocket();

    if (!activeRoomId || !socket) return;

    //emit typing start
    socket.emit('typing:start', { roomId: activeRoomId });

    //clear typing after 2 seconds of inactivity
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop', { roomId: activeRoomId });
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getSenderId = (msg: Message): string => {
    return typeof msg.senderId === 'object' ? msg.senderId.username : msg.senderId;
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-white">
      {/* Sidebar */}
      <div className="w-60 bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0">
        {/* Header */}
        <div className="px-4 py-4 border-b border-zinc-800 flex items-center justify-between">
          <span className="font-bold text-white">💬 ChatApp</span>
          <button
            onClick={() => logout.mutate()}
            className="text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-700 px-2 py-1 rounded transition"
          >
            Logout
          </button>
        </div>

        {/* Rooms */}
        <div className="px-3 pt-4 pb-2 flex-1 overflow-y-auto">
          {/* Rooms header with + button */}
          <div className="flex items-center justify-between px-2 mb-2">
            <p className="text-xs text-zinc-600 font-semibold uppercase tracking-wider">Rooms</p>
            <button
              onClick={() => setShowCreateRoom(true)}
              className="text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700 w-5 h-5 rounded flex items-center justify-center transition text-lg leading-none"
              title="Create Room"
            >
              +
            </button>
          </div>

          {roomsLoading ? (
            <div className="text-zinc-600 text-sm px-2">Loading...</div>
          ) : rooms.length === 0 ? (
            <div className="px-2">
              <p className="text-zinc-600 text-xs mb-2">No rooms yet</p>
              <button
                onClick={() => setShowCreateRoom(true)}
                className="text-indigo-400 hover:text-indigo-300 text-xs transition"
              >
                + Create your first room
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {rooms.map((room) => (
                <button
                  key={room._id}
                  onClick={() =>
                    handleRoomSelect(
                      room._id,
                      room.name,
                      room.members.includes(currentUser?.id ?? ''),
                    )
                  }
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm w-full text-left transition
              ${
                activeRoomId === room._id
                  ? 'bg-indigo-600 text-white'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
                >
                  <span className="text-zinc-500">#</span>
                  <span className="truncate">{room.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main content */}

      <div className="flex flex-col flex-1 min-w-0">
        {activeRoomId ? (
          <>
            {/* Room Header */}
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center gap-2">
              <span className="text-zinc-500">#</span>
              <span className="font-semibold text-white">{activeRoomName}</span>
            </div>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-2">
              {allMessages.length === 0 && (
                <div className="flex-1 flex items-center justify-center">
                  <p>No messages yet. Say hello! 👋</p>
                </div>
              )}
              {allMessages.map((msg) => (
                <div key={msg._id} className="flex items-baseline gap-2 group">
                  <span className="text-indigo-400 font-semibold text-sm shrink-0">
                    {getSenderId(msg)}
                  </span>
                  <span className="text-zinc-300 text-sm flex-1">{msg.content}</span>
                  <span className="text-zinc-600 text-xs shrink-0 opacity-0 group-hover:opacity-100 transition">
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <div className="px-6 pb-1 text-xs text-zinc-500 italic">
                {typingUsers.join(', ')}
                {typingUsers.length === 1 ? 'is' : 'are'} typing
              </div>
            )}
            {/* Message Input */}
            <div className="px-6 py-6 border-t border-zinc-800 flex gap-3">
              <input
                className="flex-1 bg-zinc-800 border border-zinc-700 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition placeholder-zinc-600"
                placeholder="Type a message... (Enter to send)"
                value={newMessage}
                onChange={(e) => handletyping(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 rounded-xl transition"
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-zinc-500 text-lg">Select a room to start chatting</p>
              <p className="text-zinc-700 text-sm mt-1">Choose from the sidebar on the left</p>
            </div>
          </div>
        )}
      </div>
      {/* Create Room Modal */}
      {showCreateRoom && <CreateRoomModal onClose={() => setShowCreateRoom(false)} />}
    </div>
  );
};
