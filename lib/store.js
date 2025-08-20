import { configureStore } from "@reduxjs/toolkit";
import chatReducer from "@/lib/features/chat/chatSlice.js";

export const makeStore = () => {
  return configureStore({
    reducer: {
      chat: chatReducer,
    },
  });
};
