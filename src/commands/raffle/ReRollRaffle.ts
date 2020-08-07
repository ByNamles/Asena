import { Message } from 'discord.js'

import Command from '../Command'
import Constants from '../../Constants'
import SuperClient from '../../SuperClient';
import Server from '../../structures/Server';

export default class ReRollRaffle extends Command{

    constructor(){
        super({
            name: 'reroll',
            aliases: ['tekrarcek', 'tekrarçek'],
            description: 'Çekilişin kazananlarını tekrar belirler.',
            usage: '[mesaj id]',
            permission: 'ADMINISTRATOR'
        });
    }

    async run(client: SuperClient, server: Server, message: Message, args: string[]): Promise<boolean>{
        let message_id: string | undefined = args[0]

        const raffle = await (message_id ? server.raffles.get(message_id) : server.raffles.getLastCreated())
        if(!raffle || !raffle.message_id){
            await message.channel.send({
                embed: this.getErrorEmbed(`Tekrar çekilebilecek bir çekiliş bulunamadı.`)
            })
            return true
        }

        if(raffle.status !== 'FINISHED'){
            await message.channel.send({
                embed: this.getErrorEmbed(raffle.status === 'CONTINUES' ? 'Bu çekiliş daha sonuçlanmamış. Lütfen çekilişin bitmesini bekleyin.' : 'Bu çekiliş iptal edilmiş. İptal edilmiş bir çekilişin sonucu tekrar çekilemez.')
            })
            return true
        }

        const fetch: Message | undefined = await client.fetchMessage(raffle.server_id, raffle.channel_id, raffle.message_id)
        if(!fetch){
            await message.channel.send({
                embed: this.getErrorEmbed('Anlaşılan bu çekiliş mesajı silinmiş veya zaman aşımına uğramış.')
            })

            return true
        }

        const winners = await raffle.identifyWinners(client)
        const _message = raffle.getMessageURL()
        if(winners.length === 0){
            await message.channel.send(`Yeterli katılım olmadığından dolayı çekiliş tekrar çekilemedi.\n**Çekiliş:** ${_message}`)
        }else{
            await message.channel.send(`${Constants.CONFETTI_EMOJI} Tebrikler ${winners.map(winner => `<@${winner}>`).join(', ')}! **${raffle.prize}** kazandınız (Kazananlar tekrar çekildi)\n**Çekiliş:** ${_message}`)
        }

        await message.delete({
            timeout: 100
        })

        return true
    }

}
