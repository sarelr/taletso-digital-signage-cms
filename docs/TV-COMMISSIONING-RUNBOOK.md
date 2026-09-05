# Taletso First-TV Commissioning Runbook

Pilot device: `PILOT-TV-01`

Collection date: Tuesday, 4 August 2026

Target outcome: ready for controlled signage playback

## Before collection

- Confirm the TV includes its remote, stand or mounting hardware, and power cable.
- Ask the client for the intended campus, room, wall position, network owner, and on-site contact.
- Prepare the signage player, player power supply, HDMI cable, Ethernet cable, keyboard, mouse, and asset labels.
- Download one approved 1920×1080 image and one short H.264 test video for offline testing.
- Keep the Xibo integration in mock mode until the real server URL and client credentials are approved.

## Collection inspection

1. Photograph the front, rear label, serial number, ports, remote, and accessories.
2. Record manufacturer, model number, serial number, asset tag, physical condition, and screen size.
3. Check the panel for cracks, pressure marks, dead pixels, image retention, and damaged ports.
4. Confirm ownership and transport responsibility on the collection record.

Do not transport a visibly unsafe or ownership-unclear device without written confirmation.

## Bench commissioning

1. Power on the TV and reset it only if the client has approved removal of its existing configuration.
2. Select the correct HDMI input and disable retail/demo mode, sleep timers, automatic power-off, and screen savers.
3. Set the display to 1920×1080 landscape unless the intended installation is portrait.
4. Connect the signage player and confirm the desktop fills the panel without overscan or clipping.
5. Prefer wired Ethernet. If Wi-Fi is required, record the SSID owner but never store the Wi-Fi password in the CMS.
6. Verify gateway, DNS, internet access, and time synchronization.
7. Record the TV and player MAC addresses separately.
8. Configure the player to start automatically after power recovery.
9. Run the image and video test playlist continuously for at least 30 minutes.
10. Power-cycle the complete setup and confirm unattended recovery to playback.

## Xibo pairing

Phase 1 uses the server-only mock adapter. When the real Xibo server is authorized:

1. Enter `XIBO_BASE_URL`, `XIBO_CLIENT_ID`, and `XIBO_CLIENT_SECRET` only in the server environment.
2. Register the player using the Xibo pairing flow.
3. Map the external display identifier to `PILOT-TV-01`.
4. Assign the display to its campus group.
5. Publish only the approved pilot playlist.
6. Confirm `getDisplayStatus()` reports online and capture the registration reference.

Never expose Xibo credentials in a browser, screenshot, field sheet, or client message.

## Acceptance evidence

- TV identity and asset-tag photographs
- Physical-condition notes
- Network and MAC-address record
- Player identifier
- Display calibration photograph
- Xibo display registration reference
- 30-minute playback result
- Power-cycle recovery result
- Named Taletso approver and go-live decision

## Go/no-go gate

Mark the pilot ready only when power, network, player startup, Xibo pairing, test content, display calibration, evidence, and handover have passed.

Any open safety, ownership, network, credential, mounting, or playback issue makes the status `BLOCKED`, with a responsible owner and next action recorded.
