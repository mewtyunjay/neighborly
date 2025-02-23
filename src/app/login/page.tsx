import React from "react";
import GoogleLogin from "../../components/GoogleLogin"
import SignOut from "../../components/SignOut";
import { getUserSession } from '@/lib/session'

async function checkLogin() {
    const user = await getUserSession()
    if (! user) {
        return (
            <div>
                <GoogleLogin />
            </div>
        );
    }
    
    else {
        return (
            <div>
                <SignOut />
            </div>
        );
    }
};

const IndexPage = () => {
    return checkLogin()

};
export default IndexPage;