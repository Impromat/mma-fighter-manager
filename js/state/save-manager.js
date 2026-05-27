/* ============================================
   MMA Fighter Manager — Save Manager
   ============================================ */

const SaveManager = {
  SLOTS_KEY: 'mma_fighter_manager_slots',

  /**
   * Get list of save slots
   */
  getSlots() {
    try {
      const slots = localStorage.getItem(this.SLOTS_KEY);
      return slots ? JSON.parse(slots) : [];
    } catch (e) {
      return [];
    }
  },

  /**
   * Save to a named slot
   */
  saveToSlot(slotName) {
    const state = GameState.get();
    if (!state) return false;

    try {
      const slots = this.getSlots();
      const slotData = {
        name: slotName,
        savedAt: Date.now(),
        week: state.week,
        gymName: state.gymName,
        budget: state.budget,
        data: JSON.stringify(state)
      };

      const existingIndex = slots.findIndex(s => s.name === slotName);
      if (existingIndex >= 0) {
        slots[existingIndex] = slotData;
      } else {
        slots.push(slotData);
      }

      localStorage.setItem(this.SLOTS_KEY, JSON.stringify(slots));
      return true;
    } catch (e) {
      console.error('Failed to save to slot:', e);
      return false;
    }
  },

  /**
   * Load from a named slot
   */
  loadFromSlot(slotName) {
    try {
      const slots = this.getSlots();
      const slot = slots.find(s => s.name === slotName);
      if (slot) {
        GameState._state = JSON.parse(slot.data);
        GameState.save();
        GameState._notify('loaded');
        return true;
      }
    } catch (e) {
      console.error('Failed to load from slot:', e);
    }
    return false;
  },

  /**
   * Delete a save slot
   */
  deleteSlot(slotName) {
    try {
      const slots = this.getSlots().filter(s => s.name !== slotName);
      localStorage.setItem(this.SLOTS_KEY, JSON.stringify(slots));
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * Export save as JSON string
   */
  exportSave() {
    const state = GameState.get();
    if (!state) return null;
    return JSON.stringify(state, null, 2);
  },

  /**
   * Import save from JSON string
   */
  importSave(jsonStr) {
    try {
      const state = JSON.parse(jsonStr);
      if (!state.week || !state.fighters) {
        throw new Error('Invalid save data');
      }
      GameState._state = state;
      GameState.save();
      GameState._notify('loaded');
      return true;
    } catch (e) {
      console.error('Failed to import save:', e);
      return false;
    }
  }
};
