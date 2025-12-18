// src/redux/userSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  uid: null,
  name: null,
  email: null,
  photoURL: null,
  sport: null,
  latitude: null,
  longitude: null,
  isProfileComplete: false,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    loginUser: (state, action) => {
      const payload = action.payload || {};
      state.uid = payload.uid ?? state.uid;
      state.name = payload.name ?? state.name;
      state.email = payload.email ?? state.email;
      state.photoURL = payload.photoURL ?? state.photoURL;
      state.sport = payload.sport ?? state.sport;
      state.latitude = payload.latitude ?? state.latitude;
      state.longitude = payload.longitude ?? state.longitude;
      state.isProfileComplete = Boolean(
        payload.isProfileComplete ?? state.isProfileComplete
      );
    },
    logoutUser: () => initialState,
    updateSport: (state, action) => {
      state.sport = action.payload;
    },
  },
});

export const { loginUser, logoutUser, updateSport } = userSlice.actions;
export default userSlice.reducer;
