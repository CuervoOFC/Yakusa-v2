import { downloadMediaMessage } from '@whiskeysockets/baileys';
import { Sticker, StickerTypes } from 'wa-sticker-formatter';

let handler = async (m, { conn, q, mime, isMedia }) => {
    if (!isMedia || !/image|video|webp/.test(mime)) return m.reply('「✦」Responde a una imagen o video.');

    await m.react('🕒');
    try {
        let buffer = await downloadMediaMessage(q, 'buffer', {}, { logger: console, reuploadRequest: conn.updateMediaMessage });
        
        let sticker = new Sticker(buffer, {
            pack: 'YAKUZA',
            author: m.pushName || 'V2',
            type: StickerTypes.FULL,
            quality: 50
        });

        await conn.sendMessage(m.chat, { sticker: await sticker.toBuffer() }, { quoted: m });
        await m.react('✅');
    } catch (e) {
        m.reply('「✦」Error al procesar el archivo.');
        await m.react('❌');
    }
};

handler.command = ['s', 'sticker'];

export default handler;
