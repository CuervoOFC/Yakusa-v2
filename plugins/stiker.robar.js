import { Sticker, StickerTypes } from 'wa-sticker-formatter';

let handler = async (m, { conn, text, q, mime }) => {
    if (!/webp/.test(mime)) return m.reply('「✦」Responde a un sticker para cambiar sus metadatos.');
    
    let [pack, auth] = text.split('|');
    await m.react('📝');

    try {
        let buffer = await q.download();
        let sticker = new Sticker(buffer, {
            pack: pack || 'Yakuza',
            author: auth || 'V2',
            type: StickerTypes.FULL,
            quality: 60
        });

        await conn.sendMessage(m.chat, { sticker: await sticker.toBuffer() }, { quoted: m });
        await m.react('✅');
    } catch (e) {
        m.reply('「✦」Error al modificar el sticker.');
    }
};

handler.command = ['steal', 'robar', 'wm'];

export default handler;
