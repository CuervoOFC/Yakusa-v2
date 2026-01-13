import pkg from '@whiskeysockets/baileys';

const getContentType = pkg.getContentType || pkg.default?.getContentType;
const proto = pkg.proto || pkg.default?.proto;

/**
 * Formatea el mensaje de Baileys para que sea más fácil de usar e inyecta métodos de respuesta rápidos
 */
export function smsg(conn, m, store) {
    if (!m) return m;

    let M = proto?.WebMessageInfo; 

    if (m.key) {
        m.id = m.key.id;
        m.isBaileys = m.id.startsWith('BAE5') && m.id.length === 16;
        m.chat = m.key.remoteJid;
        m.fromMe = m.key.fromMe;
        m.isGroup = m.chat.endsWith('@g.us');
        m.sender = conn.decodeJid(m.fromMe ? conn.user.id : m.participant || m.key.participant || m.chat || '');
    }

    if (m.message) {
        m.mtype = getContentType ? getContentType(m.message) : Object.keys(m.message)[0];
        
        m.msg = (m.mtype == 'viewOnceMessageV2' 
            ? m.message[m.mtype].message[getContentType(m.message[m.mtype].message)] 
            : m.message[m.mtype]);
        
        m.body = m.message.conversation || 
                 m.msg?.caption || 
                 m.msg?.text || 
                 (m.mtype == 'listResponseMessage' && m.msg?.singleSelectReply?.selectedRowId) || 
                 (m.mtype == 'buttonsResponseMessage' && m.msg?.selectedButtonId) || 
                 (m.mtype == 'viewOnceMessageV2' && m.msg?.caption) || 
                 (typeof m.msg == 'string' ? m.msg : '');

        // --- MÉTODOS INYECTADOS MEJORADOS ---

        // 1. Responder con Texto
        m.reply = (text, chatId = m.chat, options = {}) => 
            conn.sendMessage(chatId, { text: text, ...options }, { quoted: m });

        // 2. Reaccionar
        m.react = (emoji) => 
            conn.sendMessage(m.chat, { react: { text: emoji, key: m.key } });

        // 3. Responder con Audio (Voz o Archivo)
        m.replyAudio = (url, ptt = true) => 
            conn.sendMessage(m.chat, { audio: { url }, ptt: ptt, mimetype: 'audio/mpeg' }, { quoted: m });

        // 4. Responder con Imagen
        m.replyImage = (url, caption = '') => 
            conn.sendMessage(m.chat, { image: { url }, caption: caption }, { quoted: m });

        // 5. Responder con Video
        m.replyVideo = (url, caption = '', gif = false) => 
            conn.sendMessage(m.chat, { video: { url }, caption: caption, gifPlayback: gif }, { quoted: m });

        // 6. Responder con Sticker
        m.replySticker = (url) => 
            conn.sendMessage(m.chat, { sticker: { url } }, { quoted: m });

        // 7. Responder con Documento
        m.replyDoc = (url, fileName = 'archivo', mimetype = 'application/pdf') => 
            conn.sendMessage(m.chat, { document: { url }, fileName, mimetype }, { quoted: m });

        // 8. Eliminar un mensaje
        m.delete = () => conn.sendMessage(m.chat, { delete: m.key });

        // 9. Descargar Multimedia (útil para cuando te envían fotos/videos/audios)
        m.download = () => conn.downloadMediaMessage(m);
    }
    return m;
}

/**
 * Limpia y decodifica JIDs de WhatsApp
 */
export function decodeJid(jid) {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
        let decode = jid.split(':');
        return (decode[0] + decode[decode.length - 1].replace(/(\d+)@/gi, '$1@')).trim();
    } else return jid.trim();
}