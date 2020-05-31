import { Message } from 'discord.js'

import { Command } from '../Command'
import call from '../../utils/call'
import { SuperClient } from '../../helpers/Helper';
import { ErrorCodes } from '../../utils/ErrorCodes';

export class EndRaffle extends Command{

    constructor(){
        super(
            'end',
            ['hemenbitir', 'finish', 'bitir', 'erkenbitir'],
            'Çekilişi erken bitirir.',
            '[mesaj id]',
            'ADMINISTRATOR'
        );
    }

    async run(client: SuperClient, message: Message, args: string[]): Promise<boolean>{
        const message_id: string | undefined = args[0]
        if(!message_id) return false

        const FINISH_EARLY_RAFFLE = `
            mutation($message_id: String!){
                finishEarlyRaffle(data: {
                    message_id: $message_id
                }){
                    raffle{
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
                    errorCode
                }
            }
        `

        const result = await call({
            source: FINISH_EARLY_RAFFLE,
            variableValues: {
                message_id
            }
        })
        const finishEarlyRaffle = result.data.finishEarlyRaffle
        const errorCode = finishEarlyRaffle.errorCode

        if(errorCode === ErrorCodes.NOT_FOUND){
            await message.channel.send({
                embed: client.helpers.message.getErrorEmbed('Çekiliş bulunamadı.')
            })

            return true
        }

        if(errorCode === ErrorCodes.RAFFLE_FINISHED_ERROR){
            await message.channel.send({
                embed: client.helpers.message.getErrorEmbed('Anlaşılan bu çekiliş zaten bitmiş veya iptal edilmiş.')
            })

            return true
        }

        await message.channel.send(`**${finishEarlyRaffle.raffle.prize}** çekilişi erken bitirildi. Sonuçlar <#${finishEarlyRaffle.raffle.channel_id}> kanalına gönderildi.`)

        return true
    }
}