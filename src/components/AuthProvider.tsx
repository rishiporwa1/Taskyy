import React, { createContext, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useClerk } from "@clerk/clerk-react";
import { toast } from "@/components/ui/use-toast";

// Helper to convert Clerk string user ID into a valid, deterministic UUID
export function getDeterministicUUID(str: string): string {
  if (!str) return "";
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57, h3 = 0xfae12f38, h4 = 0x9e3779b9;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
    h3 = Math.imul(h3 ^ ch, 3242194837);
    h4 = Math.imul(h4 ^ ch, 4294967291);
  }
  const hex = (val: number) => (val >>> 0).toString(16).padStart(8, '0');
  const fullHex = hex(h1) + hex(h2) + hex(h3) + hex(h4);
  
  // Format as standard UUID: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  return `${fullHex.substring(0, 8)}-${fullHex.substring(8, 12)}-4${fullHex.substring(13, 16)}-a${fullHex.substring(17, 20)}-${fullHex.substring(20, 32)}`;
}

interface MappedUser {
  id: string;
  email: string;
  user_metadata: {
    full_name: string;
  };
}

interface AuthContextType {
  user: MappedUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut: clerkSignOut } = useClerk();
  const navigate = useNavigate();

  const user: MappedUser | null = clerkUser
    ? {
        id: getDeterministicUUID(clerkUser.id),
        email: clerkUser.primaryEmailAddress?.emailAddress || "",
        user_metadata: {
          full_name: clerkUser.fullName || (clerkUser.unsafeMetadata?.full_name as string) || clerkUser.username || "",
        },
      }
    : null;

  const loading = !isLoaded;

  const signOut = async () => {
    try {
      await clerkSignOut();
      navigate("/auth");
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
