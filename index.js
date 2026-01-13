import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import pino from 'pino';
import { smsg, decodeJid } from './lib/simple.js';
import { handler } from './handler.js';

export const plugins = {};
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

global.conns = [];
let opcionSeleccionada = null; // Para recordar la elección en reinicios

async function iniciarBot() {
    const { state, saveCreds } = await useMultiFileAuthState('sesion_bot');
    const { version } = await fetchLatestBaileysVersion();

    // Solo preguntamos si no hay sesión guardada y es la primera vez que arranca
    if (!state.creds.registered && !opcionSeleccionada) {
        console.clear();
        const titulo = chalk.magenta.bold;
        const textoOpcion = chalk.cyan;

        console.log(titulo('╭───────────────────────────────────────╮'));
        console.log(titulo('│       CONFIGURACIÓN DE CONEXIÓN       │'));
        console.log(titulo('╰───────────────────────────────────────╯\n'));

        opcionSeleccionada = await question(
            textoOpcion('⌨ Seleccione su método de vinculación:\n\n') +
            chalk.green('  [1] Con código QR\n') +
            chalk.yellow('  [2] Con código de texto (8 dígitos)\n\n') +
            chalk.white('  --> ')
        );
    }

    const usePairingCode = opcionSeleccionada === '2';

    const client = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        // Solo imprime QR si el usuario eligió la opción 1 y no está registrado
        printQRInTerminal: (opcionSeleccionada === '1' && !state.creds.registered),
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
        },
        browser: ["Ubuntu", "Chrome", "20.0.04"],
    });

    // Lógica de Pairing Code (Solo si no está registrado)
    if (usePairingCode && !client.authState.creds.registered) {
        let numero = await question(chalk.cyan('\n[?] Ingresa tu número de WhatsApp (ej: 51900000000):\n--> '));
        numero = numero.replace(/[^0-9]/g, '');

        setTimeout(async () => {
            let code = await client.requestPairingCode(numero);
            code = code?.match(/.{1,4}/g)?.join('-') || code;
            console.log(chalk.black.bgGreen.bold(`\n TU CÓDIGO ES: `), chalk.white.bgBlue.bold(` ${code} `));
        }, 3000);
    }

    // --- CARGADOR DE PLUGINS ---
    const pluginsFolder = path.join(process.cwd(), 'plugins');
    if (!fs.existsSync(pluginsFolder)) fs.mkdirSync(pluginsFolder);
    
    const files = fs.readdirSync(pluginsFolder);
    for (let file of files) {
        if (file.endsWith('.js')) {
            try {
                const module = await import(`./plugins/${file}?update=${Date.now()}`);
                plugins[file] = module.default;
            } catch (e) { console.log(chalk.red(`Error en ${file}`)); }
        }
    }

    client.ev.on('creds.update', saveCreds);

    client.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        // Mostrar QR en terminal solo si se eligió esa opción
        if (qr && opcionSeleccionada === '1') {
            qrcode.generate(qr, { small: true });
            console.log(chalk.blue('Escanea el QR arriba para el Bot Principal.'));
        }

        if (connection === 'close') {
            const error = new Boom(lastDisconnect?.error)?.output?.statusCode;
            if (error !== DisconnectReason.loggedOut) {
                console.log(chalk.yellow('🔄 Reconectando Bot Principal...'));
                iniciarBot();
            } else {
                console.log(chalk.red('❌ Sesión cerrada. Elimine la carpeta "sesion_bot" para volver a vincular.'));
                process.exit();
            }
        }

        else if (connection === 'open') {
            console.log(chalk.green.bold('\n[+] BOT PRINCIPAL ONLINE\n'));

            try {
                const { connectServer } = await import('./web-pager/app.js');
                connectServer(client); 

                const { loadSubBots } = await import('./lib/jadibot-manager.js');
                await loadSubBots(client);

            } catch (err) {
                console.error(chalk.red('[ERROR] No se pudieron cargar componentes adicionales:'), err);
            }
        }
    });

    client.decodeJid = (jid) => decodeJid(jid);

    client.ev.on('messages.upsert', async (chat) => {
        let m = chat.messages[0];
        if (!m.message || m.key.fromMe) return;
        m = smsg(client, m);
        await handler(client, m);
    });
}

// INICIO ÚNICO
iniciarBot();