import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { petApi } from '../api/petApi';
import { AfkAdventureData, FoodItem, PetState, PetType } from '../types/pet';
import { usePetStore } from '../store/usePetStore';

export const PET_QUERY_KEY = ['pet'] as const;
export const FOODS_QUERY_KEY = ['foods'] as const;

export const usePetQuery = () => {
  return useQuery({
    queryKey: PET_QUERY_KEY,
    queryFn: petApi.getPet,
  });
};

export const useFoodsQuery = () => {
  return useQuery({
    queryKey: FOODS_QUERY_KEY,
    queryFn: petApi.getFoods,
  });
};

export const useAdoptPetMutation = () => {
  const queryClient = useQueryClient();
  const { adoptPet: adoptPetStore } = usePetStore();

  return useMutation({
    mutationFn: async ({ type, customName }: { type: PetType; customName: string }) => {
      return petApi.adoptPet(type, customName);
    },
    onSuccess: (newPet) => {
      queryClient.setQueryData(PET_QUERY_KEY, newPet);
      queryClient.invalidateQueries({ queryKey: FOODS_QUERY_KEY });
      // Keep zustand in sync for 3D reactive animations
      adoptPetStore(newPet.type, newPet.customName);
    },
  });
};

export const useFeedPetMutation = () => {
  const queryClient = useQueryClient();
  const { applyFeeding } = usePetStore();

  return useMutation({
    mutationFn: async ({
      foodId,
      pet,
      foods,
    }: {
      foodId: string;
      pet: PetState;
      foods: FoodItem[];
    }) => {
      return petApi.feedPet(foodId, pet, foods);
    },
    onSuccess: ({ pet: newPet, foods: newFoods }, variables) => {
      queryClient.setQueryData(PET_QUERY_KEY, newPet);
      queryClient.setQueryData(FOODS_QUERY_KEY, newFoods);
      const foodItem = variables.foods.find((f) => f.id === variables.foodId);
      if (foodItem) {
        applyFeeding(foodItem, newPet, newFoods);
      }
    },
  });
};

export const useCompleteSessionMutation = () => {
  const queryClient = useQueryClient();
  const { completeFocusSession: completeSessionStore } = usePetStore();

  return useMutation({
    mutationFn: async ({
      minutes,
      tag,
      pet,
      foods,
    }: {
      minutes: number;
      tag: string;
      pet: PetState;
      foods: FoodItem[];
    }) => {
      return petApi.completeSession(minutes, tag, pet, foods);
    },
    onSuccess: ({ pet, foods }, variables) => {
      queryClient.setQueryData(PET_QUERY_KEY, pet);
      queryClient.setQueryData(FOODS_QUERY_KEY, foods);
      completeSessionStore(variables.minutes, variables.tag);
    },
  });
};

export const useResetPetMutation = () => {
  const queryClient = useQueryClient();
  const { resetPet: resetPetStore } = usePetStore();

  return useMutation({
    mutationFn: petApi.resetPet,
    onSuccess: () => {
      queryClient.setQueryData(PET_QUERY_KEY, null);
      queryClient.invalidateQueries({ queryKey: FOODS_QUERY_KEY });
      resetPetStore();
    },
  });
};

export const useMinigameRewardMutation = () => {
  const queryClient = useQueryClient();
  const { setPet } = usePetStore();

  return useMutation({
    mutationFn: async ({
      score,
      pet,
      foods,
    }: {
      score: number;
      pet: PetState;
      foods: FoodItem[];
    }) => {
      return petApi.claimMinigameReward(score, pet, foods);
    },
    onSuccess: (result) => {
      queryClient.setQueryData(PET_QUERY_KEY, result.pet);
      queryClient.setQueryData(FOODS_QUERY_KEY, result.foods);
      setPet(result.pet);
    },
  });
};

export const useClaimAfkMutation = () => {
  const queryClient = useQueryClient();
  const { setPet, setAfkAdventure } = usePetStore();

  return useMutation({
    mutationFn: async ({
      pet,
      foods,
      afkData,
    }: {
      pet: PetState;
      foods: FoodItem[];
      afkData: AfkAdventureData;
    }) => {
      return petApi.claimAfkReward(pet, foods, afkData);
    },
    onSuccess: (result) => {
      queryClient.setQueryData(PET_QUERY_KEY, result.pet);
      queryClient.setQueryData(FOODS_QUERY_KEY, result.foods);
      setPet(result.pet);
      setAfkAdventure(null);
    },
  });
};
