"use client";
import React from "react";
import { signOut } from "next-auth/react";

const SignOut = () => {
  const handleSignOut = () => {
    // TODO: Implement Google login logic
    signOut({callbackUrl: '/' });
  };

  return (
    // <Button onClick={handleGoogleLogin}>Login with Google</Button>
    // <div className="flex items-center justify-center h-screen dark:bg-gray-800">
      <button className="px-4 py-2 border flex gap-2 border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-900 dark:hover:text-slate-300 hover:shadow transition duration-150"
      onClick={handleSignOut}>
        {/* <Image className="w-6 h-6" src="https://www.svgrepo.com/show/475656/google-color.svg" loading="lazy" alt="google logo"  width={500} height={500}/> */}
          <span>Sign Out</span>
      </button>
    // </div>
  );
};

export default SignOut;