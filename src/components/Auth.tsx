import React, { useState } from 'react';
import { auth } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { motion } from 'motion/react';
import { THEME } from '../constants';

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please login instead.');
        setIsLogin(true);
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password sign-in is not enabled in Firebase. Please enable it in the console.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address format.');
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or access key.');
      } else {
        setError(err.message);
      }
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle, #F2A900 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 rounded-2xl bg-[#1A1A1A] border border-[#333] shadow-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black italic tracking-tighter text-[#F2A900] transform -skew-x-12">
            PUBG TAPPER
          </h1>
          <p className="text-gray-400 mt-2 font-medium tracking-wide uppercase text-sm">Survivor Registration</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1 ml-1">Email Base</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black border border-[#444] rounded-lg px-4 py-3 text-white focus:border-[#F2A900] outline-none transition-colors"
              placeholder="survivor@battleground.com"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1 ml-1">Access Key</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-[#444] rounded-lg px-4 py-3 text-white focus:border-[#F2A900] outline-none transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="text-center text-red-500 text-sm font-medium">{error}</p>}

          <button 
            type="submit"
            disabled={loading}
            className={`w-full ${loading ? 'bg-gray-700 cursor-not-allowed' : 'bg-[#F2A900] hover:bg-[#FFC000]'} text-black font-black uppercase py-4 rounded-lg transition-all transform active:scale-95 shadow-lg shadow-[#F2A900]/20 flex items-center justify-center gap-2`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              isLogin ? 'Drop In' : 'Sign Up'
            )}
          </button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-4">
          <div className="w-full flex items-center gap-4 opacity-50">
            <div className="h-px flex-1 bg-[#444]" />
            <span className="text-xs font-bold uppercase text-gray-500">OR</span>
            <div className="h-px flex-1 bg-[#444]" />
          </div>

          <button 
            onClick={handleGoogleSignIn}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-3 ${loading ? 'bg-gray-800' : 'bg-white hover:bg-gray-100'} text-black font-bold py-3 rounded-lg transition-all`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                Sign in with Google
              </>
            )}
          </button>

          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-gray-400 text-sm hover:text-[#F2A900] transition-colors font-medium"
          >
            {isLogin ? "New Survivor? Create Account" : "Already registered? Login"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
