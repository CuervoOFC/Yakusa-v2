import {
    makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import chalk from 'chalk';
import fs from 'fs';
import QRCode from 'qrcode';
import { smsg, decodeJid } from './simple.js';
import { handler } from '../handler.js';
import { jadibotSess } from '../web-pager/app.js';

export const subBots = new Map();

export async function iniciarJadibot(conn, m, userJid, usePairing = false, isAutoStart = false) {
    const numeroLimpio = userJid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
    const authPath = `./jadibots_sesiones/${numeroLimpio}`;

    // --- CORRECCIÓN AQUÍ: Crear la ruta completa antes de iniciar auth ---
    if (!fs.existsSync(authPath)) {
        fs.mkdirSync(authPath, { recursive: true });
    }
    // --------------------------------------------------------------------

    const { state, saveCreds } = await useMultiFileAuthState(authPath);
    const { version } = await fetchLatestBaileysVersion();

    const client = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
        },
        browser: ["Ubuntu", "Chrome", "20.0.04"],
    });

    // Solo inicializamos si no existe para no borrar datos previos
    if (!jadibotSess.has(userJid)) {
        jadibotSess.set(userJid, {
            status: 'initializing',
            number: numeroLimpio,
            config: { welcome: true, only_private: false }
        });
    }

    if (usePairing && !client.authState.creds.registered) {
        setTimeout(async () => {
            try {
                let code = await client.requestPairingCode(numeroLimpio);
                code = code?.match(/.{1,4}/g)?.join('-') || code;

                console.log(chalk.black.bgGreen.bold(`\n [JADIBOT] CÓDIGO PARA ${numeroLimpio}: `), chalk.white.bgBlue.bold(` ${code} `));

                // Usamos el spread operator (...) para mantener la 'config' y solo cambiar status/code
                const currentSess = jadibotSess.get(userJid) || {};
                jadibotSess.set(userJid, {
                    ...currentSess,
                    pairingCode: code,
                    status: 'pairing',
                    number: numeroLimpio
                });

                if (m && m.chat && m.chat.endsWith('@s.whatsapp.net')) {
                    await conn.sendMessage(m.chat, { text: `✅ *CÓDIGO DE VINCULACIÓN*\n\nNúmero: ${numeroLimpio}\nCódigo: *${code}*` });
                }
            } catch (e) {
                console.error(chalk.red(`Error generando pairing para ${numeroLimpio}:`), e);
                const currentSess = jadibotSess.get(userJid) || {};
                jadibotSess.set(userJid, { ...currentSess, status: 'error' });
            }
        }, 5000);
    }

    subBots.set(userJid, client);

    client.ev.on('creds.update', saveCreds);

    client.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr && !usePairing) {
            const currentSess = jadibotSess.get(userJid) || {};
            jadibotSess.set(userJid, { ...currentSess, qr, status: 'qr_ready', number: numeroLimpio });

            if (m && m.chat && !isAutoStart) {
                try {
                    const qrBuffer = await QRCode.toBuffer(qr, { scale: 8 });
                    await conn.sendMessage(m.chat, { image: qrBuffer, caption: `🔗 Escanea para ser Sub-Bot` });
                } catch (e) { console.error(e); }
            }
        }

        if (connection === 'open') {
            client.id = decodeJid(client.user.id);
            const currentSess = jadibotSess.get(userJid) || {};
            jadibotSess.set(userJid, { ...currentSess, status: 'connected', number: numeroLimpio });
            console.log(chalk.green(`[JADIBOT] ${numeroLimpio} está Online`));
        }

        if (connection === 'close') {
            const error = new Boom(lastDisconnect?.error)?.output?.statusCode;
            if (error !== DisconnectReason.loggedOut) {
                iniciarJadibot(conn, m, userJid, usePairing, true);
            } else {
                subBots.delete(userJid);
                jadibotSess.delete(userJid);
                if (fs.existsSync(authPath)) fs.rmSync(authPath, { recursive: true, force: true });
            }
        }
    });

    client.decodeJid = (jid) => decodeJid(jid);
    client.ev.on('messages.upsert', async (chat) => {
        let msg = chat.messages[0];
        if (!msg.message || msg.key.fromMe) return;
        msg = smsg(client, msg);

        const currentBot = jadibotSess.get(userJid);
        const settings = currentBot?.config || { welcome: true, only_private: false };

        if (settings.only_private && msg.isGroup) {
            return; 
        }
        await handler(client, msg);
    });

    return client;
}

export async function stopJadibot(jid) {
    if (subBots.has(jid)) {
        const conn = subBots.get(jid);
        const numeroLimpio = jid.split('@')[0];
        const authPath = `./jadibots_sesiones/${numeroLimpio}`;

        try {
            await conn.logout();
            conn.end();
        } catch (e) {
            console.error("Error al cerrar sesión:", e);
        }

        subBots.delete(jid);
        jadibotSess.delete(jid);

        if (fs.existsSync(authPath)) fs.rmSync(authPath, { recursive: true, force: true });

        return true;
    }
    return false;
}

export async function loadSubBots(conn) {
    const baseDir = './jadibots_sesiones';
    if (!fs.existsSync(baseDir)) return;
    const folders = fs.readdirSync(baseDir);
    for (const folder of folders) {
        if (fs.lstatSync(`${baseDir}/${folder}`).isDirectory()) {
            const jid = `${folder}@s.whatsapp.net`;
            await iniciarJadibot(conn, null, jid, false, true);
        }
    }
}