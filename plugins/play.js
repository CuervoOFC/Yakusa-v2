import axios from 'axios';

let handler = async (m, { conn, text, command }) => {
    // 1. Validación rápida usando el config o mensajes directos
    if (!text) return m.reply(`「✦」Ingresa el nombre o link de la canción.`);

    // 2. Reacción de "procesando" (ya soporta await gracias a simple.js)
    await m.react('🕒');

    try {
        const res = await fetch(`https://api.darkcore.xyz/api/descargar/mp3?url=${encodeURIComponent(text)}`);
        const json = await res.json();

        if (!json.success) {
            await m.react('❌');
            return m.reply("「✦」No se pudo encontrar el video.");
        }

        const { titulo, canal, duracion, imagen, url, id } = json.data;

        let txt = `「✦」*YAKUZA V2 - PLAY*\n\n`
            txt += `> 🎵 *Título:* ${titulo}\n`
            txt += `> ❀ *Canal:* ${canal}\n`
            txt += `> ⴵ *Duración:* ${duracion}\n\n`
            txt += `_Enviando audio, espere un momento..._`

        // Enviamos la miniatura con la info
        await conn.sendMessage(m.chat, { image: { url: imagen }, caption: txt }, { quoted: m });

        // 3. Descarga del buffer
        const response = await axios.get(url, { 
            responseType: 'arraybuffer',
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        const audioBuffer = Buffer.from(response.data);

        // 4. Envío del audio con ExternalAdReply (Miniatura en el reproductor)
        await conn.sendMessage(m.chat, {
            audio: audioBuffer,
            mimetype: 'audio/mp4',
            fileName: `${titulo}.mp3`,
            ptt: false, // Cambia a true si quieres que se envíe como nota de voz
            contextInfo: {
                externalAdReply: {
                    showAdAttribution: true,
                    title: titulo,
                    body: 'Yakuza V2 - Audio Player',
                    thumbnailUrl: imagen,
                    sourceUrl: `https://www.youtube.com/watch?v=${id}`,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: m });

        await m.react('✔️');

    } catch (e) {
        console.error(e);
        await m.react('❌');
        m.reply("「✦」Error: El servidor está saturado o el link es inválido.");
    }
}

// Vinculamos el comando
handler.command = ['play', 'audio', 'mp3'];

// Exportación única

export default handler;
