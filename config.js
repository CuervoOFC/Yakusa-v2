import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuramos la ruta raíz de forma automática
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
    // INFORMACIÓN BÁSICA
    botName: 'Yakuza',
    ownerName: 'V2',

    // Usamos un Array por si quieres añadir más de un dueño en el futuro
    owners: [
        ['85295456491', '⁽ᶜᵘᵉʳᵛᵒᴼᶠᶜ⁴⁰⁴⁾'], 
        ['5016613065', 'ᴛʜᴇᴅᴇᴠɪʟ ⁺⁵⁰¹']
    ],
    
    // CONFIGURACIÓN DE COMANDOS
    // Añadimos el símbolo "\" al prefix que es común en bots
    prefix: /^[.!#/\-\\]/, 
    apiKey: 'AdonixKey9khy2p3778',
    
    // RUTAS DEL SISTEMA
    path: {
        root: __dirname,
        plugins: path.join(__dirname, 'plugins'),
        database: path.join(__dirname, 'database.json')
    },

    // ESTILOS DE CONSOLA PERSONALIZADOS
    styles: {
        info: chalk.black.bgCyan.bold,
        success: chalk.black.bgGreen.bold,
        error: chalk.white.bgRed.bold,
        msg: chalk.magenta.bold,
        bot: chalk.blue.bold
    },

    // TEXTOS PREDETERMINADOS (Para ahorrar tiempo en los plugins)
    messages: {
        wait: '⏳ *Cargando... por favor espera.*',
        error: '❌ *Hubo un error inesperado.*',
        owner: '👑 *Este comando es solo para mi dueño.*',
        group: '👥 *Este comando solo sirve en grupos.*',
        private: '👤 *Este comando solo sirve en chat privado.*'
    }
};


export default config;
