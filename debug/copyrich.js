 sock.relayMessage(m.chat, {
botForwardedMessage: {
message: {
richResponseMessage: {
messageType: 1,
unifiedResponse: {
data: Buffer.from(JSON.stringify({
__typename: "GenAIUnifiedResponse",
response_id: `bokep-${Date.now()}`,
sections: [
{
__typename: "GenAIUnifiedResponseSection",
view_model: {
__typename: "GenAIAddonActionLayoutViewModel",
addon_action_type: "COPY_TO_CLIPBOARD",
addon_action_alignment: "END",
primitives: [
{
__typename: "GenAIMarkdownTextUXPrimitive",
text: "`alah nyocot`",
inline_entities: []
}
]
}
}
]
})).toString("base64")
},
contextInfo: {
isForwarded: true,
forwardOrigin: 4
}
}
}
}
}, {}) 