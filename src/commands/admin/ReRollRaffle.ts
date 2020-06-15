import { Message } from 'discord.js'

import { Command } from '../Command'
import { Constants } from '../../Constants'
import call from '../../utils/call'
import { SuperClient } from '../../Asena';

export class ReRollRaffle extends Command{

    constructor(){
        super({
            name: 'reroll',
            aliases: ['tekrarcek', 'tekrarçek'],
            description: 'Çekilişin kazananlarını tekrar belirler.',
            usage: null,
            permission: 'ADMINISTRATOR'
        });
    }

    async run(client: SuperClient, message: Message, args: string[]): Promise<boolean>{
        let message_id: string | undefined = args[0]

        if(!message_id){
            const raffle = await client.managers.raffle.getServerLastRaffle(message.guild.id)
            if(raffle){
                if(!raffle.message_id){
                    await message.channel.send({
                        embed: client.helpers.message.getErrorEmbed(`Tekrar çekilebilecek çekiliş bulunamadı.`)
                    })

                    return true
                }

                message_id = raffle.message_id
            }
        }

        const SEARCH_RAFFLE = `
            query($message_id: String!){
                searchRaffle(message_id: $message_id){
                    id
                    prize
                    channel_id
                    constituent_id
                    message_id
                    server_id
                    numbersOfWinner
                    status
                    finishAt
                }
            }
        `
        const result = await call({
            source: SEARCH_RAFFLE,
            variableValues: {
                message_id
            }
        })

        const raffle = result.data.searchRaffle
        if(raffle === null){
            await message.channel.send({
                embed: client.helpers.message.getErrorEmbed(`${message_id} ID 'li çekiliş bulunamadı.`)
            })

            return true
        }

        if(raffle.status !== 'FINISHED'){
            await message.channel.send({
                embed: client.helpers.message.getErrorEmbed(raffle.status === 'CONTINUES' ? 'Bu çekiliş daha sonuçlanmamış. Lütfen çekilişin bitmesini bekleyin.' : 'Bu çekiliş iptal edilmiş. İptal edilmiş bir çekilişin sonucu tekrar çekilemez.')
            })

            return true
        }

        const fetch: Message | undefined = await client.helpers.message.fetchMessage(raffle.server_id, raffle.channel_id, raffle.message_id)
        if(!fetch){
            await message.channel.send({
                embed: client.helpers.message.getErrorEmbed('Anlaşılan bu çekiliş mesajı silinmiş veya zaman aşımına uğramış.')
            })

            return true
        }

        const winners = await client.helpers.raffle.identifyWinners(raffle)
        const _message = client.helpers.raffle.getMessageURL(raffle)
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