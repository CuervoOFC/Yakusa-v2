import chalk from 'chalk'

let handler = async (m, { conn }) => {

    let activeConns = global.conns || []
    
    let users = [...new Set([...activeConns.filter(c => c && c.user && c.state === 'open').map(c => c.user.jid)])]
    
    if (users.length === 0) {
        return m.reply('❌ *No hay Sub-Bots activos en este momento.*')
    }

    let message = `✨ *PANEL DE SUB-BOTS ACTIVOS* ✨\n`
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`
    message += `🤖 *Total:* ${users.length}\n\n`

    users.forEach((user, i) => {
        let name = conn.getName(user) || 'yakuza'
        message += `${i + 1}. 👤 *Nombre:* ${name}\n`
        message += `   📱 *Número:* @${user.split('@')[0]}\n`
        message += `   🟢 *Estado:* Online\n\n`
    })

    message += `━━━━━━━━━━━━━━━━━━━━\n`
    message += `*Yakuza V2 System*`

    await conn.sendMessage(m.chat, { 
        text: message, 
        mentions: users 
    }, { quoted: m })
}

handler.help = ['listajadibots', 'subbots']
handler.tags = ['main']
handler.command = ['jadibots', 'subbots', 'listajadibots', 'bots']


export default handler
