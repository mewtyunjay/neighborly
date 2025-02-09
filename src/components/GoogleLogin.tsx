"use client";
import React from "react";
import { signIn, useSession } from "next-auth/react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

const GoogleLogin = () => {
  const searchParams = useSearchParams();
  
  const handleGoogleLogin = () => {
    // TODO: Implement Google login logic
    var roomCode = searchParams.get('roomCode');
    if(roomCode){
      signIn("google", { callbackUrl: `/` });
    } else {
      signIn("google", { callbackUrl: `/` });
    }
    
  };

  return (
    // <Button onClick={handleGoogleLogin}>Login with Google</Button>
    <div className="flex items-center justify-center h-screen dark:bg-gray-800">
      <button className="px-4 py-2 border flex gap-2 border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-900 dark:hover:text-slate-300 hover:shadow transition duration-150"
      onClick={handleGoogleLogin}>
        <Image className="w-6 h-6" src="https://www.svgrepo.com/show/475656/google-color.svg" loading="lazy" alt="google logo"  width={500} height={500}/>
          <span>Login with Google</span>
      </button>
    </div>
  );
};

export default GoogleLogin;