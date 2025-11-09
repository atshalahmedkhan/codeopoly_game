// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { User, onAuthStateChanged } from 'firebase/auth';
// import { auth } from '../lib/firebase';
// import axios from 'axios';
// import Auth from '../components/Auth';
// // import { LoadingOverlay } from '../components/LoadingSpinner'; // Available if needed

// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// export default function Lobby() {
//   const [user, setUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [playerName, setPlayerName] = useState('');
//   const [roomCode, setRoomCode] = useState('');
//   const [isCreating, setIsCreating] = useState(false);
//   const [isJoining, setIsJoining] = useState(false);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (user) => {
//       setUser(user);
//       setLoading(false);
//       if (user) {
//         setPlayerName(user.displayName || user.email?.split('@')[0] || 'Player');
//       }
//     });

//     return () => unsubscribe();
//   }, []);

//   const handleCreateGame = async () => {
//     if (!playerName.trim()) {
//       alert('Please enter your name');
//       return;
//     }

//     setIsCreating(true);
//     try {
//       const response = await axios.post(`${API_URL}/games/create`, {
//         playerName,
//         avatar: '💻',
//       });

//       const { gameId, roomCode, playerId } = response.data;
//       navigate(`/game/${gameId}`, { state: { roomCode, playerId, playerName } });
//     } catch (error: any) {
//       console.error('Error creating game:', error);
//       alert(error.response?.data?.error || 'Failed to create game');
//     } finally {
//       setIsCreating(false);
//     }
//   };

//   const handleJoinGame = async () => {
//     if (!playerName.trim() || !roomCode.trim()) {
//       alert('Please enter your name and room code');
//       return;
//     }

//     setIsJoining(true);
//     try {
//       const response = await axios.post(`${API_URL}/games/join`, {
//         roomCode: roomCode.toUpperCase(),
//         playerName,
//         avatar: '💻',
//       });

//       const { gameId, playerId } = response.data;
//       navigate(`/game/${gameId}`, { state: { roomCode: roomCode.toUpperCase(), playerId, playerName } });
//     } catch (error: any) {
//       console.error('Error joining game:', error);
//       alert(error.response?.data?.error || 'Failed to join game');
//     } finally {
//       setIsJoining(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
//         <div className="text-white text-xl">Loading...</div>
//       </div>
//     );
//   }

//   if (!user) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
//         <div 
//           className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 max-w-md w-full border border-white/20"
//           style={{
//             boxShadow: '0 0 40px rgba(147, 51, 234, 0.3), inset 0 0 40px rgba(59, 130, 246, 0.2)',
//           }}
//         >
//           <div className="text-center mb-8">
//             <h1 className="text-5xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
//               🎮 CodeOpoly
//             </h1>
//             <p className="text-xl text-white/80">Competitive Coding Meets Monopoly</p>
//           </div>

//           <div className="space-y-4">
//             <button
//               onClick={() => setUser({ displayName: 'Guest', email: 'guest@codeopoly.com' } as User)}
//               className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg"
//               style={{
//                 boxShadow: '0 0 20px rgba(147, 51, 234, 0.5)',
//               }}
//             >
//               🎮 Play as Guest
//             </button>

//             <div className="relative">
//               <div className="absolute inset-0 flex items-center">
//                 <div className="w-full border-t border-white/20"></div>
//               </div>
//               <div className="relative flex justify-center text-sm">
//                 <span className="px-2 bg-transparent text-white/60">or sign in (optional)</span>
//               </div>
//             </div>

//             <Auth onAuthSuccess={(user) => setUser(user)} />
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
//       <div 
//         className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 max-w-md w-full border border-white/20"
//         style={{
//           boxShadow: '0 0 40px rgba(147, 51, 234, 0.3), inset 0 0 40px rgba(59, 130, 246, 0.2)',
//         }}
//       >
//         <div className="text-center mb-8">
//           <h1 className="text-5xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
//             🎮 CodeOpoly
//           </h1>
//           <p className="text-xl text-white/80">Competitive Coding Meets Monopoly</p>
//           <div className="mt-2 text-sm text-white/60">
//             Signed in as: <span className="font-semibold">{user.displayName || user.email}</span>
//           </div>
//         </div>

//         <div className="space-y-6">
//           <div>
//             <label className="block text-white/90 mb-2 font-semibold">Your Name</label>
//             <input
//               type="text"
//               value={playerName}
//               onChange={(e) => setPlayerName(e.target.value)}
//               placeholder="Enter your name"
//               className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
//               onKeyPress={(e) => e.key === 'Enter' && handleCreateGame()}
//             />
//           </div>

//           <div className="space-y-3">
//             <button
//               onClick={handleCreateGame}
//               disabled={isCreating}
//               className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg"
//               style={{
//                 boxShadow: isCreating ? 'none' : '0 0 20px rgba(147, 51, 234, 0.5)',
//               }}
//             >
//               {isCreating ? 'Creating...' : 'Create New Game'}
//             </button>

//             <div className="relative">
//               <div className="absolute inset-0 flex items-center">
//                 <div className="w-full border-t border-white/20"></div>
//               </div>
//               <div className="relative flex justify-center text-sm">
//                 <span className="px-2 bg-transparent text-white/60">or</span>
//               </div>
//             </div>

//             <div>
//               <input
//                 type="text"
//                 value={roomCode}
//                 onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
//                 placeholder="Enter Room Code (e.g., ABCD)"
//                 maxLength={4}
//                 className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 mb-3 uppercase transition-all"
//                 onKeyPress={(e) => e.key === 'Enter' && handleJoinGame()}
//               />
//               <button
//                 onClick={handleJoinGame}
//                 disabled={isJoining}
//                 className="w-full bg-white/20 hover:bg-white/30 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg transition-all border border-white/30"
//               >
//                 {isJoining ? 'Joining...' : 'Join Game'}
//               </button>
//             </div>
//           </div>
//         </div>

//         <div className="mt-8 pt-6 border-t border-white/20">
//           <p className="text-white/60 text-sm text-center">
//             🎯 Solve LeetCode problems to buy properties<br />
//             ⚔️ Challenge opponents to code duels<br />
//             🏆 Win by having the most net worth
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from '../lib/firebase';
import axios from 'axios';
import Auth from '../components/Auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Avatar options for fun
const AVATARS = ['💻', '🎮', '🚀', '🎯', '⚡', '🔥', '🌟', '🎨', '🎭', '🎪'];

export default function Lobby() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('💻');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Try to set up Firebase auth listener, but don't fail if Firebase isn't configured
    try {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        setLoading(false);
        if (user) {
          // Set default player name from user info
          const defaultName = user.displayName || 
                             user.email?.split('@')[0] || 
                             `Player${Math.floor(Math.random() * 1000)}`;
          setPlayerName(defaultName);
        }
      }, (error) => {
        // Firebase auth error - continue without Firebase
        console.warn('Firebase auth not available, continuing without authentication:', error);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      // Firebase not initialized - continue without it
      console.warn('Firebase not initialized, continuing without authentication');
      setLoading(false);
      return () => {}; // Return empty cleanup function
    }
  }, []);

  const handleGuestLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      // Try Firebase if available, otherwise use local guest mode
      try {
        const result = await signInAnonymously(auth);
        setUser(result.user);
        setPlayerName(`Guest${Math.floor(Math.random() * 10000)}`);
      } catch (firebaseError: any) {
        // Firebase not configured or failed - use local guest mode
        console.warn('Firebase not available, using local guest mode:', firebaseError.message);
        setUser({ uid: `guest-${Date.now()}`, isAnonymous: true } as User);
        setPlayerName(`Guest${Math.floor(Math.random() * 10000)}`);
      }
    } catch (error: any) {
      console.error('Error signing in as guest:', error);
      setError('Failed to sign in as guest. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const validatePlayerName = (name: string): boolean => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter your name');
      return false;
    }
    if (trimmed.length < 2) {
      setError('Name must be at least 2 characters');
      return false;
    }
    if (trimmed.length > 20) {
      setError('Name must be less than 20 characters');
      return false;
    }
    return true;
  };

  const validateRoomCode = (code: string): boolean => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setError('Please enter a room code');
      return false;
    }
    if (trimmed.length !== 4) {
      setError('Room code must be exactly 4 characters');
      return false;
    }
    if (!/^[A-Z]+$/.test(trimmed)) {
      setError('Room code can only contain letters');
      return false;
    }
    return true;
  };

  const handleCreateGame = async () => {
    setError(null);
    
    if (!validatePlayerName(playerName)) {
      return;
    }

    setIsCreating(true);
    try {
      const response = await axios.post(
        `${API_URL}/games/create`,
        {
          playerName: playerName.trim(),
          avatar: selectedAvatar,
        },
        {
          timeout: 10000, // 10 second timeout
        }
      );

      const { gameId, roomCode, playerId } = response.data;
      
      // Store in sessionStorage for recovery
      sessionStorage.setItem('currentGame', JSON.stringify({
        gameId,
        roomCode,
        playerId,
        playerName: playerName.trim(),
      }));

      navigate(`/game/${gameId}`, { 
        state: { 
          roomCode, 
          playerId, 
          playerName: playerName.trim(),
          avatar: selectedAvatar,
        },
        replace: true, // Replace history to prevent back button issues
      });
    } catch (error: any) {
      console.error('Error creating game:', error);
      
      if (error.code === 'ECONNABORTED') {
        setError('Request timed out. Please check your connection and try again.');
      } else if (error.response?.status === 500) {
        setError('Server error. Please try again in a moment.');
      } else if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else if (!navigator.onLine) {
        setError('No internet connection. Please check your network.');
      } else {
        setError('Failed to create game. Please try again.');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinGame = async () => {
    setError(null);
    
    if (!validatePlayerName(playerName)) {
      return;
    }

    if (!validateRoomCode(roomCode)) {
      return;
    }

    setIsJoining(true);
    try {
      const upperRoomCode = roomCode.toUpperCase().trim();
      
      const response = await axios.post(
        `${API_URL}/games/join`,
        {
          roomCode: upperRoomCode,
          playerName: playerName.trim(),
          avatar: selectedAvatar,
        },
        {
          timeout: 10000,
        }
      );

      const { gameId, playerId } = response.data;
      
      // Store in sessionStorage for recovery
      sessionStorage.setItem('currentGame', JSON.stringify({
        gameId,
        roomCode: upperRoomCode,
        playerId,
        playerName: playerName.trim(),
      }));

      navigate(`/game/${gameId}`, { 
        state: { 
          roomCode: upperRoomCode, 
          playerId, 
          playerName: playerName.trim(),
          avatar: selectedAvatar,
        },
        replace: true,
      });
    } catch (error: any) {
      console.error('Error joining game:', error);
      
      if (error.code === 'ECONNABORTED') {
        setError('Request timed out. Please check your connection and try again.');
      } else if (error.response?.status === 404) {
        setError('Game not found. Please check the room code.');
      } else if (error.response?.status === 400) {
        setError(error.response.data.error || 'Cannot join this game.');
      } else if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else if (!navigator.onLine) {
        setError('No internet connection. Please check your network.');
      } else {
        setError('Failed to join game. Please try again.');
      }
    } finally {
      setIsJoining(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <div className="text-white text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div 
          className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 max-w-md w-full border border-white/20"
          style={{
            boxShadow: '0 0 40px rgba(147, 51, 234, 0.3), inset 0 0 40px rgba(59, 130, 246, 0.2)',
          }}
        >
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              🎮 CodeOpoly
            </h1>
            <p className="text-xl text-white/80">Competitive Coding Meets Monopoly</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleGuestLogin}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg"
              style={{
                boxShadow: '0 0 20px rgba(147, 51, 234, 0.5)',
              }}
            >
              {loading ? 'Signing in...' : '🎮 Play as Guest'}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-white/60">or sign in</span>
              </div>
            </div>

            <Auth onAuthSuccess={(user) => setUser(user)} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div 
        className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 max-w-md w-full border border-white/20"
        style={{
          boxShadow: '0 0 40px rgba(147, 51, 234, 0.3), inset 0 0 40px rgba(59, 130, 246, 0.2)',
        }}
      >
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            🎮 CodeOpoly
          </h1>
          <p className="text-xl text-white/80">Competitive Coding Meets Monopoly</p>
          <div className="mt-2 text-sm text-white/60">
            Signed in as: <span className="font-semibold">{user.displayName || user.email || 'Guest'}</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center justify-between">
            <span className="text-red-200 text-sm">{error}</span>
            <button 
              onClick={clearError}
              className="text-red-200 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-white/90 mb-2 font-semibold">Your Name</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => {
                setPlayerName(e.target.value);
                clearError();
              }}
              placeholder="Enter your name"
              maxLength={20}
              className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
              onKeyPress={(e) => e.key === 'Enter' && handleCreateGame()}
            />
          </div>

          {/* Avatar Picker */}
          <div>
            <label className="block text-white/90 mb-2 font-semibold">Choose Avatar</label>
            <div className="flex flex-wrap gap-2">
              {AVATARS.map((avatar) => (
                <button
                  key={avatar}
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`text-2xl p-2 rounded-lg transition-all ${
                    selectedAvatar === avatar
                      ? 'bg-blue-500/50 ring-2 ring-blue-400 scale-110'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleCreateGame}
              disabled={isCreating || !playerName.trim()}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg"
              style={{
                boxShadow: isCreating ? 'none' : '0 0 20px rgba(147, 51, 234, 0.5)',
              }}
            >
              {isCreating ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  Creating...
                </span>
              ) : (
                'Create New Game'
              )}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-white/60">or</span>
              </div>
            </div>

            <div>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => {
                  setRoomCode(e.target.value.toUpperCase());
                  clearError();
                }}
                placeholder="Enter Room Code (4 letters)"
                maxLength={4}
                className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 mb-3 uppercase transition-all font-mono tracking-wider"
                onKeyPress={(e) => e.key === 'Enter' && handleJoinGame()}
              />
              <button
                onClick={handleJoinGame}
                disabled={isJoining || !playerName.trim() || !roomCode.trim()}
                className="w-full bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all border border-white/30"
              >
                {isJoining ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    Joining...
                  </span>
                ) : (
                  'Join Game'
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/20">
          <p className="text-white/60 text-sm text-center">
            🎯 Solve coding problems to buy properties<br />
            ⚔️ Challenge opponents to code duels<br />
            🏆 Win by having the most net worth
          </p>
        </div>
      </div>
    </div>
  );
}