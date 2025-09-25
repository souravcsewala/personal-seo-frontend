import { createSlice } from "@reduxjs/toolkit";
import {  jwtDecode } from 'jwt-decode';

const initialState = {
  isAuthenticated: false,
  role: "",
  fullName: "",
  email: "",
  userId: "",
  accessToken: "",
  phone:""

};

const authslice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action) => {
      state.isAuthenticated = true;
      state.role = action.payload.user.role;
      state.fullName = action.payload.user.fullname;
      state.email = action.payload.user.email;
      state.phone = action.payload.user.phone;
      state.userId = action.payload.user._id;
      state.accessToken = action.payload.token;
    

     
      if (typeof window !== "undefined") {
        localStorage.setItem("authState", JSON.stringify(state));
      }
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.role = "";
      state.fullName = "";
      state.email = "";
      state.phone = "";
      state.userId = "";
      state.accessToken = "";
    

      if (typeof window !== "undefined") {
        localStorage.removeItem("authState");
      }
    },
    loadAuthStateFromStorage: (state) => {
      if (typeof window !== "undefined") {
        try {
          const serializedState = localStorage.getItem("authState");
          if (serializedState) {
            const parsedState = JSON.parse(serializedState);
            const { accessToken } = parsedState;

            if (accessToken) {
              const decodedToken = jwtDecode(accessToken);
              const currentTime = Math.floor(Date.now() / 1000); 

              if (decodedToken.exp > currentTime) {
             
                state.isAuthenticated = parsedState.isAuthenticated || false;
                state.role = parsedState.role || "";
                state.fullName = parsedState.fullName || "";
                state.email = parsedState.email || "";
                state.phone = parsedState.phone || "";
                state.userId = parsedState.userId || "";
                state.accessToken = accessToken;
            
            } else {
              
                console.warn("Token expired. Logging out.");
                alert("session expire,please login again")
                localStorage.removeItem("authState");
              }
            }
          }
        } catch (err) {
          console.error("Error loading auth state from localStorage", err);
        }
      }
    },
   
  },
});

export const { login, logout, loadAuthStateFromStorage } = authslice.actions;
export default authslice.reducer;
