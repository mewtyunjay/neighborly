import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import LogoutButton from './LogoutButton';

export default async function ProfilePage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/login');
    }

    return (
        <div className="min-h-screen bg-[#111111] text-white p-4">
            <div className="max-w-2xl mx-auto py-8">
                <h1 className="text-2xl font-bold mb-6">Profile</h1>

                {/* Logout Button */}
                <LogoutButton />

                {/* Profile Card */}
                <div className="bg-[#1D1D1D] rounded-2xl p-6 space-y-4">
                    <div className="flex items-center space-x-4">
                        {session.user?.image ? (
                            <img
                                src={session.user.image}
                                alt="Profile"
                                className="w-16 h-16 rounded-full"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
                                <span className="text-2xl font-semibold text-white">
                                    {session.user.name?.[0]?.toUpperCase()}
                                </span>
                            </div>
                        )}
                        <div>
                            <h2 className="text-xl font-semibold">{session.user.name}</h2>
                            <p className="text-gray-400">{session.user.email}</p>
                        </div>
                    </div>

                    {/* Add more profile sections here */}
                </div>
            </div>
        </div>
    );
}