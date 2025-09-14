import React, { createContext, useContext, useEffect, useState } from "react";
import API from "../API/axios";

const AuthContext = createContext();

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) throw new Error("useAuth must be in an AuthProvider");
    return context;
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // On mount, fetch user info from backend using cookies
    useEffect(() => {
        setLoading(true);
        const fetchUser = async () => {
            try {
                const res = await API.get("/auth/me");                
                setUser(res.data || null);
            }
            catch (error) {
                setUser(null);
            }
            finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    const signin = async (credentials) => {
        setLoading(true);
        try {
            // Send credentials to backend
            const signinRes = await API.post("/auth/signin", credentials);
            
            // Prefer user from signin response if present, otherwise call /auth/me
            const signedInUser = signinRes.data.user;

            if (signedInUser) {
                setUser(signedInUser);
                return signedInUser;
            }

            const res = await API.get("/auth/me");
            setUser(res.data || null);
            return res.data || null;
        }
        catch (error) {            
            setUser(null);
            return null;
        }
        
        finally {
            setLoading(false);
        }
    };

    const signup = signin;

    const logout = async () => {
        try {
            await API.post("/auth/signout");
        }
        
        catch (error) {
            // ignore
        }
        
        finally {
            setUser(null);
        }
    };

    const value = {
        user,
        currentUser: user,
        loading,
        setUser,
        signin,
        signup,
        logout,
        isLoggedIn: !!user,
        isAdmin: user?.role === 'admin',
        isStudent: user?.role === 'student'
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthContext;