import { Message } from 'discord.js';

import CommandRunner from './CommandRunner';
import { Command } from './Command';
import { Colors } from '../utils/TextFormat';
import { SuperClient } from '../Asena';
import Constants from '../Constants';
import Factory from '../Factory';

import CancelRaffle from './raffle/CancelRaffle';
import CreateRaffle from './raffle/CreateRaffle';
import ReRollRaffle from './raffle/ReRollRaffle';
import SetupRaffle from './raffle/SetupRaffle';
import EndRaffle from './raffle/EndRaffle';
import Raffles from './raffle/Raffles';
import Vote from './survey/Vote';
import Question from './survey/Question';
import Help from './bot/Help';
import BotInfo from './bot/BotInfo';
import SetPrefix from './server/SetPrefix';
import SetCommandPermission from './server/SetCommandPermission';

export default class CommandHandler extends Factory implements CommandRunner{

    private static readonly COMMANDS: Command[] = [
        new CancelRaffle(),
        new CreateRaffle(),
        new ReRollRaffle(),
        new SetupRaffle(),
        new EndRaffle(),
        new Raffles(),
        new Vote(),
        new Question(),
        new Help(),
        new BotInfo(),
        new SetPrefix(),
        new SetCommandPermission()
    ]

    constructor(client: SuperClient){
        super(client)

        this.load()
    }

    public load(): void{
        this.commands.forEach(command => {
            this.client.commands.set(command.name, command);

            if(command.aliases && Array.isArray(command.aliases)){
                command.aliases.forEach(alias => this.client.aliases.set(alias, command.name));
            }
        })

        this.client.logger.info(`Toplam ${Colors.LIGHT_PURPLE}${this.commands.length} ${Colors.AQUA}komut başarıyla yüklendi.`)
    }

    async run(message: Message){
        const client: SuperClient = this.client

        if(message.guild === null){
            return
        }

        if(message.author.bot){
            return
        }

        const server = await client.getServerManager().getServerData(message.guild.id)
        const prefix = (client.isDevBuild ? 'dev' : '') + (server.prefix || client.prefix)

        if(!message.content.startsWith(prefix)){
            if(message.content === Constants.PREFIX_COMMAND){
                await message.channel.send(`🌈   Botun sunucu içerisinde ki komut ön adı(prefix): **${server.prefix}**`)
            }

            return
        }

        if(!message.member){
            return
        }

        // check setup
        const channel_id: string = client.setups.get(message.member.id)
        if(channel_id && channel_id === message.channel.id){
            return
        }

        const args: string[] = message.content
            .slice(prefix.length)
            .trim()
            .split(/ +/g)
        const cmd = args.shift().toLowerCase()

        if(cmd.length === 0){
            return
        }

        let command: Command | undefined = client.commands.get(cmd);
        if(!command){ // control is alias command
            command = client.commands.get(client.aliases.get(cmd))
        }

        if(command){
            const authorized: boolean = command.hasPermission(message.member) || message.member.roles.cache.filter(role => {
                return role.name.trim().toLowerCase() === Constants.PERMITTED_ROLE_NAME
            }).size !== 0 || server.publicCommands.indexOf(command.name) !== -1
            if(authorized){
                command.run(client, message, args).then(async (result: boolean) => {
                    if(!result){
                        await message.channel.send({
                            embed: command.getUsageEmbed()
                        })
                    }
                })
            }else{
                await message.channel.send({
                    embed: command.getErrorEmbed('Bu komutu kullanmak için **yetkiniz** yok.')
                })
            }
        }
    }

    public get commands(): Command[]{
        return CommandHandler.COMMANDS
    }

}