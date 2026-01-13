import { smsg } from './lib/simple.js';
import config from './config.js';
import { plugins } from './index.js';
import { logger } from './lib/logs.js';
import chalk from 'chalk';

export const handler = async (conn, m) => {
    try {
        if (!m || !m.message) return;
        m = smsg(conn, m);

        const str = m.body.trim();
        let usedPrefix = '';
        let isPrefix = false;
        
        const prefixMatch = config.prefix.test(str);
        if (prefixMatch) {
            usedPrefix = str.match(config.prefix)[0];
            isPrefix = true;
        }

        let fullText = isPrefix ? str.slice(usedPrefix.length).trim() : str;
        let args = fullText.split(/\s+/).filter(v => v);
        let command = (args.shift() || '').toLowerCase();
        let text = args.join(' ');

        let plugin = Object.values(plugins).find(p => 
            p?.command && (Array.isArray(p.command) ? p.command.includes(command) : p.command === command)
        );

        if (plugin) {
            // --- DETECCIÓN DE DUEÑO REFORZADA ---
            const senderNumber = m.sender.replace(/[^0-9]/g, ''); // Ejemplo: 51900000000
            
            // Verificamos si el número de quien escribe está en la lista de dueños
            const isOwner = config.owners.some(([number]) => {
                const cleanOwner = number.replace(/[^0-9]/g, '');
                return senderNumber === cleanOwner; // Comparación exacta
            }) || m.fromMe; 

            // LOG PARA DEBUG (Míralo en tu terminal para ver si detecta el isOwner como true o false)
            console.log(chalk.magenta(`[COMMAND] ${command} | isOwner: ${isOwner}`));

            // Bloqueo si el comando requiere dueño (plugin.owner)
            if (plugin.owner === true) { 
                if (!isOwner) {
                    await m.react('🚫');
                    return m.reply(config.messages.owner); // Bloquea a los demás
                }
            }

            if (plugin.group && !m.isGroup) return m.reply(config.messages.group);
            if (plugin.private && m.isGroup) return m.reply(config.messages.private);

            logger.command(m, command, usedPrefix, isPrefix);
            
            let q = m.quoted ? m.quoted : m;
            let mime = (q.msg || q).mimetype || '';
            let isMedia = /image|video|sticker|audio/.test(mime);

            const extra = { conn, text, command, usedPrefix, isPrefix, apikey: config.apiKey, args, q, mime, isMedia, config, isOwner };

            try {
                await plugin(m, extra);
            } catch (e) {
                logger.error(command, e);
                await m.react('❌');
                m.reply(`*ERROR:* ${e.message || e}`);
            }
        }
    } catch (e) {
        console.error(chalk.red.bold('[CRITICAL ERROR]'), e);
    }
};