import { createSlice } from "@reduxjs/toolkit";

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    messages: [],
    error: null,
  },
  reducers: {
    addMessage: (state, action) => {
      state.messages.push({
        id: action.payload.id,
        role: action.payload.role, // "user" | "assistant"
        content: action.payload.content,
        status: "sent", // user messages are always "sent"
        timestamp: new Date().toISOString(),
      });
    },
    addPendingAssistant: (state, action) => {
      state.messages.push({
        id: action.payload.id,
        role: "assistant",
        content: "...",
        status: "loading", // placeholder until reply comes
        timestamp: new Date().toISOString(),
      });
    },
    updateMessage: (state, action) => {
      const msg = state.messages.find((m) => m.id === action.payload.id);
      if (msg) {
        msg.content = action.payload.content;
        msg.status = "sent";
        if (action.payload.sources) {
          msg.sources = action.payload.sources;
        }
      }
    },
    setMessageError: (state, action) => {
      const msg = state.messages.find((m) => m.id === action.payload.id);
      if (msg) {
        msg.content = "Sorry, I encountered an error. Please try again.";
        msg.status = "error";
      }
    },
    clearChat: (state) => {
      state.messages = [];
      state.error = null;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  addMessage,
  addPendingAssistant,
  updateMessage,
  setMessageError,
  clearChat,
  setError,
  clearError,
} = chatSlice.actions;

export default chatSlice.reducer;
