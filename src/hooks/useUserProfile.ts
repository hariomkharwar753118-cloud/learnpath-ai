import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { ApiService } from "@/services/api";

export const useUserProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      return await ApiService.getUserProfile();
    },
    enabled: !!user,
  });
};

export const useUserMemory = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user_memory", user?.id],
    queryFn: async () => {
      if (!user) return null;
      return await ApiService.getUserMemory();
    },
    enabled: !!user,
  });
};

export const useUserConversations = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: async () => {
      if (!user) return [];
      // Use ApiService to fetch from backend (Lovable Cloud)
      return await ApiService.getConversations();
    },
    enabled: !!user,
  });
};

export const useUserDocuments = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user_documents", user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await ApiService.getUserDocuments();
    },
    enabled: !!user,
  });
};
