import { Command } from '../Command'
import { DateTimeHelper } from '../../helpers/DateTimeHelper'
import { Message, TextChannel } from 'discord.js'
import { Constants } from '../../Constants'
import { InteractiveSetup, SetupPhase } from '../../utils/InteractiveSetup'
import { ErrorCodes } from '../../utils/ErrorCodes'
import call from '../../utils/call'
import { SuperClient } from '../../Asena';

export class SetupRaffle extends Command{

    constructor(){
        super({
            name: 'setup',
            aliases: ['sihirbaz'],
            description: 'Çekiliş kurulum sihirbazını başlatır.',
            usage: null,
            permission: 'ADMINISTRATOR'
        });
    }

    async run(client: SuperClient, message: Message, args: string[]): Promise<boolean>{
        if(message.channel instanceof TextChannel){
            const GET_CONTINUES_RAFFLES = `
                query($server_id: String!){
                    getContinuesRaffles(server_id: $server_id){
                        id
                    }
                }
            `

            const result = await call({
                source: GET_CONTINUES_RAFFLES,
                variableValues: {
                    server_id: message.guild.id
                }
            })

            if(result.data.getContinuesRaffles.length >= 5){
                await message.channel.send({
                    embed: client.helpers.message.getErrorEmbed('Maksimum çekiliş oluşturma sınırı aşıyorsunuz. (Maks 5)')
                })
                return false
            }

            new InteractiveSetup(
                message.author,
                message.channel,
                client,
                [
                    new SetupPhase(
                        [
                            `${Constants.CONFETTI_REACTION_EMOJI} ${client.user.username} interaktif kurulum sihirbazına **hoşgeldiniz**!`,
                            'Eğer sihirbazdan **çıkmak** isterseniz lütfen sohbete `iptal`, `cancel` veya `exit` yazın. Hadi kuruluma geçelim.\n',
                            '**Adım 1:** Öncelikle çekilişin hangi metin kanalında yapılacağını belirleyelim\n',
                            '`Lütfen sunucuda var olan botun erişebileceği bir metin kanalını etiketlemeniz gerektiğini unutmayın.`'
                        ].join('\n'),
                        (message: Message) => {
                            const channels = message.mentions.channels
                            if(channels.size === 0){
                                message.channel.send(':boom: Lütfen bir metin kanalı etiketleyin.')
                                return {
                                    result: false,
                                    value: null
                                }
                            }

                            const channel = channels.first()
                            if(!(channel instanceof TextChannel)){
                                message.channel.send(':boom: Lütfen geçerli bir metin kanalı etiketleyin.')
                                return {
                                    result: false,
                                    value: null
                                }
                            }

                            message.channel.send(`${Constants.CONFETTI_REACTION_EMOJI} Başarılı! Çekiliş kanalı <#${channel.id}> olarak belirlendi. Hadi sıradaki aşamaya geçelim.`)
                            return {
                                result: true,
                                value: channel.id
                            }
                        }
                    ),
                    new SetupPhase(
                        [
                            '**Adım 2:** Kaç kazanan olucağını belirleyelim\n',
                            '`Lütfen sayısal ve 1 ila 20 aralığında bir sayı girmeniz gerektiğini unutmayın.`'
                        ].join('\n'),
                        (message: Message) => {
                            const toInt: number = Number(message.content.trim())
                            if(isNaN(toInt)){
                                message.channel.send(':boom: Lütfen sayısal bir değer giriniz.')
                                return {
                                    result: false,
                                    value: null
                                }
                            }

                            if(toInt < 1 || toInt > 20){
                                message.channel.send(':boom: Çekiliş kazanan sayısı 1 ila 20 arasında olmalıdır.')
                                return {
                                    result: false,
                                    value: null
                                }
                            }

                            message.channel.send(`${Constants.CONFETTI_REACTION_EMOJI} Çok iyi! Bu çekilişte toplam **${toInt}** kişinin yüzünü güldüreceksiniz :slight_smile:!`)
                            return {
                                result: true,
                                value: toInt
                            }
                        }
                    ),
                    new SetupPhase(
                        [
                            '**Adım 3:** Şimdide insanların çekilişe katılımlarını alabilmek için süre belirleyelim\n',
                            '`Unutmayın süre en az 1 dakika, en fazla 60 gün olabilir. Süre belirlerken m (veya dakika), h (veya saat), d (veya gün) gibi süre belirten' +
                            ' terimler kullanmanız gerekir. Bunu kullanırken önce süre daha sonra boşluk bırakarak süre cinsini yazmayı unutmayın. Sadece tek bir süre tipi' +
                            ' süre cinsi kullanabileceğini unutmayın.`'
                        ].join('\n'),
                        (message: Message) => {
                            const content = message.content
                            const toArray = content.split(' ')
                            const time = Number(toArray.shift())
                            const timeType = toArray.shift()

                            if(isNaN(time) || time <= 0){
                                message.channel.send(':boom: Lütfen zaman değerinin sayısal ve pozitif bir değer olarak girip tekrar deneyin.')
                                return {
                                    result: false,
                                    value: null
                                }
                            }

                            let toSecond: number = -1;
                            switch(timeType){
                                case 'm':
                                case 'dakika':
                                case 'minute':
                                    toSecond = 60 * time
                                    break;

                                case 'h':
                                case 'saat':
                                case 'hour':
                                    toSecond = 60 * 60 * time
                                    break;

                                case 'd':
                                case 'gün':
                                case 'day':
                                    toSecond = ((60 * 60) * 24) * time
                                    break;
                            }

                            if(toSecond === -1){
                                message.channel.send(':boom: Lütfen geçerli bir süre biçimi girin. (m, h, d | Örnek: `1 m`, `3 h`)')
                                return {
                                    result: false,
                                    value: null
                                }
                            }

                            if(toSecond < Constants.MIN_TIME || toSecond > Constants.MAX_TIME){
                                message.channel.send(':boom: Çekiliş süresi en az 1 dakika, en fazla 60 gün olabilir.')
                                return {
                                    result: false,
                                    value: null
                                }
                            }

                            const secondsToTime = DateTimeHelper.secondsToTime(toSecond)
                            message.channel.send(`${Constants.CONFETTI_REACTION_EMOJI} Tebrikler! Çekiliş süresi **${secondsToTime.toString()}** olarak belirlendi.`)
                            return {
                                result: true,
                                value: toSecond
                            }
                        }
                    ),
                    new SetupPhase(
                        [
                            '**Adım 4:** Son olarak çekilişin ödülünü belirleyelim (Aynı zamanda başlık olarak kullanılacak)\n',
                            '`Ödülün maksimum uzunluğunun 255 karakter olabileceğini unutmayın.`'
                        ].join('\n'),
                        (message: Message) => {
                            const prize = message.content
                            if(prize.length > 255){
                                message.channel.send(':boom: Çekiliş başlığı maksimum 255 karakter uzunluğunda olmalıdır.')
                                return {
                                    result: false,
                                    value: null
                                }
                            }

                            message.channel.send(`${Constants.CONFETTI_REACTION_EMOJI} İşte bu kadar! Çekiliş başlığı ve ödülü **${prize}** olarak belirlendi.`)
                            return {
                                result: true,
                                value: prize
                            }
                        }
                    )
                ],
                (store) => {
                    const CREATE_RAFFLE = `
                        mutation(
                            $prize: String!
                            $server_id: String!
                            $constituent_id: String!
                            $channel_id: String!
                            $numbersOfWinner: Int!
                            $finishAt: Date!
                        ){
                            createRaffle(data: {
                                prize: $prize
                                server_id: $server_id
                                constituent_id: $constituent_id
                                channel_id: $channel_id
                                numbersOfWinner: $numbersOfWinner
                                finishAt: $finishAt
                            }){
                                raffle{
                                    id
                                }
                                errorCode
                            }
                        }
                    `;

                    const finishAt: number = Date.now() + (store.get(2) * 1000)
                    call({
                        source: CREATE_RAFFLE,
                        variableValues: {
                            prize: store.get(3),
                            server_id: message.guild.id,
                            constituent_id: message.author.id,
                            channel_id: store.get(0),
                            numbersOfWinner: store.get(1),
                            finishAt: finishAt
                        }
                    }).then(async result => {
                        if(result.data !== null){
                            if(result.data.createRaffle.errorCode === ErrorCodes.SUCCESS){
                                const raffleId = result.data.createRaffle.raffle.id
                                const channel = message.guild.channels.cache.get(store.get(0))
                                if(channel instanceof TextChannel){
                                    await client.helpers.raffle.sendRaffleStartMessage(
                                        message,
                                        channel,
                                        store.get(2),
                                        store.get(3),
                                        store.get(1),
                                        finishAt,
                                        raffleId
                                    )
                                    await message.channel.send(`:star2: Çekiliş başarıyla oluşturuldu! Oluşturduğun çekiliş <#${store.get(0)}> kanalında yayınlandı...`)
                                }else{
                                    await client.helpers.raffle.deleteRaffle(raffleId)
                                    await message.channel.send(`:boom: Çekiliş oluşturulamadı. Girdiğiniz kanal sunucunuzda bulunamadı. Birden bire yok olmuş...`)
                                }
                            }else{
                                await message.channel.send(':boom: Çekiliş oluşturma sınırını aşıyorsunuz. (Max: 5)')
                            }
                        }else{
                            await message.channel.send(':boom: Belirlenemeyen bir sebepten dolayı çekiliş oluşturulamadı.')
                        }
                    })

                    return true
                }
            )
        }

        return true
    }

}