import { Message, MessageEmbed } from 'discord.js'

import Command from '../Command'
import SuperClient from '../../SuperClient';

export default class Help extends Command{

    constructor(){
        super({
            name: 'help',
            aliases: ['yardim', 'yardım'],
            description: 'Komutlar hakkında bilgi verir.',
            usage: null,
            permission: undefined
        })
    }

    async run(client: SuperClient, message: Message, args: string[]): Promise<boolean>{
        const command: undefined | string = args[0];
        const prefix = (await client.getServerManager().getServerData(message.guild.id)).prefix
        if(args[0] === undefined){
            const text = client.commands.map(command => {
                return command.permission === 'ADMINISTRATOR' ? (
                    message.member.hasPermission('ADMINISTRATOR') ? `\`${command.name}\`` : undefined
                ) : `\`${command.name}\``;
            }).filter(item => item !== undefined).join(', ');

            const embed = new MessageEmbed()
                .setAuthor('📍 Komut Yardımı', message.author.displayAvatarURL() || message.author.defaultAvatarURL)
                .addField('Komutlar', text)
                .addField(`🌟 Daha Detaylı Yardım?`, `${prefix}help [komut]`)
                .addField(`🌐 Daha Fazla Bilgi?`, '**[Website](https://asena.xyz)**')
                .setColor('RANDOM')

            message.author.send({ embed })
                .then(async () => {
                    await message.channel.send(`<@${message.author.id}> yardım menüsünü DM kutunuza gönderildi.`)
                        .then($message => {
                            $message.delete({ timeout: 2000 }).then(() => {
                                message.delete();
                            })
                        });
                })
                .catch(async () => {
                    await message.channel.send({ embed })
                })

            return true;
        }else{
            const searchCommand: Command | undefined = client.commands.filter($command => $command.name === command.trim()).first();
            if(searchCommand !== undefined){
                const embed = new MessageEmbed()
                    .setAuthor('📍 Komut Yardımı', message.author.displayAvatarURL() || message.author.defaultAvatarURL)
                    .addField('Komut', `${prefix}${searchCommand.name}`)
                    .addField('Takma Adları (Alias)', searchCommand.aliases.map(alias => {
                        return `${prefix}${alias}`
                    }).join('\n'))
                    .addField('Açıklaması', `${searchCommand.description}`)
                    .addField('Min. Yetki Seviyesi', `${searchCommand.permission === 'ADMINISTRATOR' ? 'Admin' : 'Üye'}`)
                    .addField('Kullanımı', `${prefix}${searchCommand.name} ${searchCommand.usage === null ? '' : searchCommand.usage}`)
                    .setColor('GREEN');

                await message.channel.send({ embed });

                return true;
            }else{
                await message.channel.send({
                    embed: this.getErrorEmbed(`**${command}** adında komut bulunamadı.`)
                });

                return true;
            }
        }
    }
}
