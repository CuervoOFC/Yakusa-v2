// plugins/botinfo.js
import os from 'os';

let handler = async (m, { conn }) => {
    const uptime = process.uptime();
    const formatUptime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${h}h ${m}m ${s}s`;
    };

    const ram = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
    const totalRam = (os.totalmem() / 1024 / 1024 / 1024).toFixed(1);

    const info = `┏━━━━ *BOT SYSTEM INFO* ━━━━┓\n` +
                 `┃ 🤖 *Nombre:* Yakuza V2\n` +
                 `┃ 🕒 *Uptime:* ${formatUptime(uptime)}\n` +
                 `┃ 📊 *RAM:* ${ram}MB / ${totalRam}GB\n` +
                 `┃ ⚙️ *Plataforma:* ${os.platform()}\n` +
                 `┗━━━━━━━━━━━━━━━━━━━━┛`;

    await m.reply(info);
};

handler.command = ['info', 'botinfo', 'status'];

export default handler;
