import { randomBytes } from "crypto";
import { encodeSignedDeviceIdentity, jidDecode, jidEncode } from "@whiskeysockets/baileys";

export const attachOfferCall = (sock) => {
  if (typeof sock.offerCall === "function") return sock;

  sock.offerCall = async (toJid, isVideo = false) => {
    if (typeof toJid !== "string") {
      throw new TypeError("Call target must be a WhatsApp JID string.");
    }
    if (typeof isVideo !== "boolean") {
      throw new TypeError("isVideo must be a boolean.");
    }

    const decoded = jidDecode(toJid);
    if (!decoded?.user || decoded.server !== "s.whatsapp.net") {
      throw new TypeError("Call target must be a personal @s.whatsapp.net JID.");
    }

    const { creds } = sock.authState || {};
    const callerJid = creds?.me?.id;
    if (!callerJid || !creds.account) {
      throw new Error("The bot must be authenticated before placing a call.");
    }
    if (callerJid === toJid) {
      throw new TypeError("The bot cannot call its own account.");
    }

    const callId = randomBytes(16).toString("hex").toUpperCase();
    const offerContent = [
      { tag: "audio", attrs: { enc: "opus", rate: "16000" } },
      { tag: "audio", attrs: { enc: "opus", rate: "8000" } },
    ];

    if (isVideo) {
      offerContent.push({
        tag: "video",
        attrs: {
          orientation: "0",
          screen_width: "1920",
          screen_height: "1080",
          device_orientation: "0",
          enc: "vp8",
          dec: "vp8",
        },
      });
    }

    offerContent.push(
      { tag: "net", attrs: { medium: "3" } },
      {
        tag: "capability",
        attrs: { ver: "1" },
        content: new Uint8Array([1, 4, 255, 131, 207, 4]),
      },
      { tag: "encopt", attrs: { keygen: "2" } },
    );

    const devices = await sock.getUSyncDevices([toJid], true, false);
    if (!devices.length) {
      throw new Error("WhatsApp did not return any callable devices for this JID.");
    }

    const deviceJids = devices.map((device) => {
      if (typeof device.jid === "string" && device.jid) {
        return device.jid;
      }
      if (device.user && device.server && Number.isInteger(device.device)) {
        return jidEncode(device.user, device.server, device.device);
      }
      throw new Error("WhatsApp returned a device without a valid JID.");
    });
    await sock.assertSessions(deviceJids, true);

    const { nodes: destinations, shouldIncludeDeviceIdentity } =
      await sock.createParticipantNodes(deviceJids, {
        call: { callKey: randomBytes(32) },
      });
    if (!destinations.length) {
      throw new Error("Failed to encrypt the call offer for the recipient's devices.");
    }
    offerContent.push({ tag: "destination", attrs: {}, content: destinations });

    if (shouldIncludeDeviceIdentity) {
      offerContent.push({
        tag: "device-identity",
        attrs: {},
        content: encodeSignedDeviceIdentity(creds.account, true),
      });
    }

    await sock.query({
      tag: "call",
      attrs: { to: toJid },
      content: [
        {
          tag: "offer",
          attrs: {
            "call-id": callId,
            "call-creator": callerJid,
          },
          content: offerContent,
        },
      ],
    });

    return { callId, toJid, isVideo };
  };

  return sock;
};
