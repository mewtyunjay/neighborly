"use client";
import { signOut } from "next-auth/react";

export default function LogoutButton() {
	return (
		<button
			onClick={() => signOut({ callbackUrl: '/' })}
			className="w-full flex items-center gap-4 p-4 text-left text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-xl transition-colors"
		>
			{/* ...existing icon code... */}
			<span>Logout</span>
		</button>
	);
}
