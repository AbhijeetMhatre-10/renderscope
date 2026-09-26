import { createSlice } from '@reduxjs/toolkit';

export const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    mobileMenuOpen: false,
    activeAnalyzeTab: 'overview', // 'overview' | 'waterfall' | 'resources' | 'detective'
    isDrawerOpen: false,
    isModalOpen: false,
    activeResourceDetails: null,
    activeFindingDetails: null,
  },
  reducers: {
    setMobileMenuOpen: (state, action) => {
      state.mobileMenuOpen = action.payload;
    },
    toggleMobileMenu: (state) => {
      state.mobileMenuOpen = !state.mobileMenuOpen;
    },
    setActiveAnalyzeTab: (state, action) => {
      state.activeAnalyzeTab = action.payload;
    },
    openDrawer: (state, action) => {
      state.activeResourceDetails = action.payload;
      state.isDrawerOpen = true;
    },
    closeDrawer: (state) => {
      state.isDrawerOpen = false;
      state.activeResourceDetails = null;
    },
    openModal: (state, action) => {
      state.activeFindingDetails = action.payload;
      state.isModalOpen = true;
    },
    closeModal: (state) => {
      state.isModalOpen = false;
      state.activeFindingDetails = null;
    },
  },
});

export const {
  setMobileMenuOpen,
  toggleMobileMenu,
  setActiveAnalyzeTab,
  openDrawer,
  closeDrawer,
  openModal,
  closeModal,
} = uiSlice.actions;

export default uiSlice.reducer;
