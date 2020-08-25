import Command from '../Command'
import { secondsToTime, detectTime } from '../../utils/DateTimeHelper'
import { Message, TextChannel } from 'discord.js'
import Constants from '../../Constants'
import InteractiveSetup from '../../setup/InteractiveSetup'
import SetupPhase from '../../setup/SetupPhase'
import SuperClient from '../../SuperClient';
import { IRaffle } from '../../models/Raffle';
import Server from '../../structures/Server';
import Raffle from '../../structures/Raffle';

export default class SetupRaffle extends Command{

    constructor(){
        super({
            name: 'setup',
            aliases: ['sihirbaz'],
            description: 'Çekiliş kurulum sihirbazını başlatır.',
            usage: null,
            permission: 'ADMINISTRATOR'
        })
    }

    async run(client: SuperClient, server: Server, message: Message, args: string[]): Promise<boolean>{
        if(message.channel instanceof TextChannel){
            if(client.getSetupManager().inSetup(message.author.id)){
                await message.channel.send({
                    embed: this.getErrorEmbed('Zaten bir kurulum sihirbazı içindesin. Lütfen önce başlattığınız kurulumu bitirin veya iptal edin.')
                })
                return true
            }

            const server = await client.servers.get(message.guild.id)
            const result = await server.raffles.getContinues()
            if(result.length >= 5){
                await message.channel.send({
                    embed: this.getErrorEmbed('Maksimum çekiliş oluşturma sınırı aşıyorsunuz. (Maks 5)')
                })
                return true
            }

            const setup = new InteractiveSetup({
                user_id: message.author.id,
                channel_id: message.channel.id,
                client,
                phases: [
                    new SetupPhase({
                        message: [
                            `${Constants.CONFETTI_REACTION_EMOJI} ${client.user.username} interaktif kurulum sihirbazına **hoşgeldiniz**!`,
                            'Eğer sihirbazdan **çıkmak** isterseniz lütfen sohbete `iptal`, `cancel` veya `exit` yazın. Hadi kuruluma geçelim.\n',
                            '**Adım 1:** Öncelikle çekilişin hangi metin kanalında yapılacağını belirleyelim\n',
                            '`Lütfen sunucuda var olan botun erişebileceği bir metin kanalını etiketlemeniz gerektiğini unutmayın.`'
                        ],
                        validator: (message: Message) => {
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
                    }),
                    new SetupPhase({
                        message: [
                            '**Adım 2:** Kaç kazanan olucağını belirleyelim\n',
                            '`Lütfen sayısal ve 1 ila 20 aralığında bir sayı girmeniz gerektiğini unutmayın.`'
                        ],
                        validator: (message: Message) => {
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
                    }),
                    new SetupPhase({
                        message: [
                            '**Adım 3:** Şimdide insanların çekilişe katılımlarını alabilmek için süre belirleyelim\n',
                            '`Unutmayın süre en az 1 dakika, en fazla 60 gün olabilir. Süre belirlerken m (dakika), h (saat), d (gün) gibi süre belirten' +
                            ' terimler kullanmanız gerekir. Bunu kullanırken önce süre daha sonra boşluk bırakarak veya bırakmadan süre cinsini yazmayı unutmayın. Sadece tek bir süre tipi' +
                            ' kullanabileceğini unutmayın.`'
                        ],
                        validator: (message: Message) => {
                            const time = message.content.replace(/ /g, '')
                            const toSecond = detectTime(time)
                            if(!toSecond){
                                message.channel.send('Lütfen geçerli bir süre giriniz. (Örn; **1s** - **1m** - **5m** - **1h** vb.)')
                                return {
                                    result: false,
                                    value: null
                                }
                            }

                            if(toSecond < Constants.MIN_RAFFLE_TIME || toSecond > Constants.MAX_RAFFLE_TIME){
                                message.channel.send(':boom: Çekiliş süresi en az 1 dakika, en fazla 60 gün olabilir.')
                                return {
                                    result: false,
                                    value: null
                                }
                            }

                            const $secondsToTime = secondsToTime(toSecond)
                            message.channel.send(`${Constants.CONFETTI_REACTION_EMOJI} Tebrikler! Çekiliş süresi **${$secondsToTime.toString()}** olarak belirlendi.`)
                            return {
                                result: true,
                                value: toSecond
                            }
                        }
                    }),
                    new SetupPhase({
                        message: [
                            '**Adım 4:** Son olarak çekilişin ödülünü belirleyelim (Aynı zamanda başlık olarak kullanılacak)\n',
                            '`Ödülün maksimum uzunluğunun 255 karakter olabileceğini unutmayın.`'
                        ],
                        validator: (message: Message) => {
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
                    })
                ],
                onFinishCallback: (store) => {
                    const channel = message.guild.channels.cache.get(store.get(0))
                    if(channel instanceof TextChannel){
                        const finishAt: number = Date.now() + (store.get(2) * 1000)
                        const data = {
                            prize: store.get(3),
                            server_id: message.guild.id,
                            constituent_id: message.author.id,
                            channel_id: store.get(0),
                            numberOfWinners: store.get(1),
                            status: 'CONTINUES',
                            finishAt: new Date(finishAt)
                        }

                        const raffle = new Raffle(Object.assign({
                            createdAt: new Date()
                        }, data as IRaffle))

                        channel.send(Raffle.getStartMessage(), {
                            embed: raffle.getEmbed()
                        }).then(async $message => {
                            await $message.react(Constants.CONFETTI_REACTION_EMOJI)

                            await server.raffles.create(Object.assign({
                                message_id: $message.id
                            }, data) as IRaffle)
                        }).catch(async () => {
                            await message.channel.send(':boom: Botun yetkileri, bu kanalda çekiliş oluşturmak için yetersiz olduğu için çekiliş başlatılamadı.')
                        })

                        message.channel.send(`:star2: Çekiliş başarıyla oluşturuldu! Oluşturduğun çekiliş <#${store.get(0)}> kanalında yayınlandı...`)
                    }else{
                        message.channel.send(`:boom: Çekiliş oluşturulamadı. Girdiğiniz kanal sunucunuzda bulunamadı. Birden bire yok olmuş...`)
                    }

                    return true
                },
                timeout: 60 * 5
            })

            setup.on('stop', async reason => {
                await message.channel.send(`:boom: ${reason}`)
            })
            setup.on('message', async content => {
                await message.channel.send(content)
            })

            setup.start()
        }

        return true
    }

}
