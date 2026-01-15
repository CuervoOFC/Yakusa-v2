import os from 'os';
import { sizeFormatter } from 'human-readable';

// Formateador para que la RAM se vea en GB/MB y no en bytes
const formatSize = sizeFormatter({
    std: 'JEDEC',
    decimalPlaces: 2,
    keepImplicitZero: !0,
    render: (literal, symbol) => `${literal} ${symbol}B`,
});

let handler = async (m, { conn, config }) => {
    await m.react('💻');

    const used = process.memoryUsage();
    const uptime = process.uptime();
    
    // Calculamos el tiempo encendido
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    let txt = `*「✦」SISTEMA - ${config.botName}*\n\n`;
    txt += `> 👑 *Estado:* Acceso Creador Confirmado\n`;
    txt += `> 🕒 *Uptime:* ${hours}h ${minutes}m ${seconds}s\n`;
    txt += `> 📟 *RAM Uso:* ${formatSize(used.rss)}\n`;
    txt += `> 💿 *Plataforma:* ${os.platform()} ${os.release()}\n`;
    txt += `> 🌡️ *Procesador:* ${os.cpus()[0].model}\n\n`;
    txt += `_Servidor funcionando correctamente._`;

    await m.reply(txt);
};

// Configuración del comando
handler.command = ['status', 'sistema', 'recursos'];

// ESTO ES LO MÁS IMPORTANTE: Activa la protección del Handler
handler.owner = true; 

export default handler;
