
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type MessageUser = {
  name: string;
};

export const useMessageDisplayName = (message: {
  user_id: string;
  type?: "text" | "system";
}, isCurrentUser: boolean) => {
  const { user: currentUser } = useAuth();

  return useQuery({
    queryKey: ["user", message.user_id],
    queryFn: async (): Promise<MessageUser> => {
      if (message.type === "system") {
        return { name: "System" };
      }

      if (isCurrentUser && currentUser) {
        return { name: currentUser.name };
      }

      const { data, error } = await supabase
        .from("users")
        .select("name")
        .eq("id", message.user_id)
        .single();

      if (error || !data) {
        console.warn("Failed to fetch user details:", error);
        return { name: isCurrentUser ? "You" : "Unknown User" };
      }

      return data;
    },
    initialData:
      isCurrentUser && currentUser
        ? { name: currentUser.name }
        : message.type === "system"
        ? { name: "System" }
        : { name: "Unknown User" },
  });
};

