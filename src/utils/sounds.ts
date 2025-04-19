
// These functions play various sounds for different app interactions

// Play success sound when tasks/projects are created/completed
export const playSuccessSound = () => {
  try {
    const audio = new Audio('/sounds/success.mp3');
    audio.volume = 0.5;
    audio.play();
  } catch (error) {
    console.error('Error playing success sound:', error);
  }
};

// Play error sound when operations fail
export const playErrorSound = () => {
  try {
    const audio = new Audio('/sounds/error.mp3');
    audio.volume = 0.5;
    audio.play();
  } catch (error) {
    console.error('Error playing error sound:', error);
  }
};

// Play status change sound when task status changes
export const playStatusChangeSound = () => {
  try {
    const audio = new Audio('/sounds/status-change.mp3');
    audio.volume = 0.4;
    audio.play();
  } catch (error) {
    console.error('Error playing status change sound:', error);
  }
};
