export const commissioningSteps = [
  { id: "identityVerified", title: "Capture TV identity", description: "Record manufacturer, model, serial number, asset tag and physical condition.", evidence: "Photo of rear label and asset tag" },
  { id: "powerVerified", title: "Verify power and startup", description: "Confirm stable power, remote control, correct input and recovery after a power cycle.", evidence: "Power-cycle result" },
  { id: "networkVerified", title: "Connect and test network", description: "Record wired or Wi-Fi MAC address and confirm DNS, gateway and internet access.", evidence: "Network test result" },
  { id: "playerVerified", title: "Install signage player", description: "Connect the approved player, disable sleep timers and set automatic startup.", evidence: "Player identifier and startup photo" },
  { id: "displayVerified", title: "Calibrate display", description: "Set 1920x1080 resolution, orientation, overscan, brightness and audio policy.", evidence: "Full-screen calibration image" },
  { id: "xiboPaired", title: "Register secure TDCP player", description: "Verify the authorized browser or native player identity against TDCP before go-live.", evidence: "Device registration reference" },
  { id: "testContentVerified", title: "Run pilot playlist", description: "Play image and video content for at least 30 minutes with no clipping, buffering or sleep.", evidence: "Playback photo and observation notes" },
  { id: "handoverVerified", title: "Approve commissioning", description: "Capture evidence, unresolved risks, responsible owner and the go-live decision.", evidence: "Signed commissioning record" },
] as const;

export type CommissioningStepId = (typeof commissioningSteps)[number]["id"];

export const pilotDevice = {
  screenName: "PILOT-TV-01",
  location: "To be assigned after collection",
  collectionDate: "Tuesday, 4 August 2026",
  targetStatus: "Ready for controlled playback",
};
