import SuperClient from './SuperClient';
import Constants from './Constants';

export default class Asena extends SuperClient{

    constructor(){
        super({
            prefix: process.env.PREFIX ?? '!a',
            isDevBuild: process.env.NODE_ENV !== 'production'
        })

        // Load all commands
        this.getCommandHandler().registerAllCommands()

        // Activity updater start
        this.getActivityUpdater().start()

        // Command run
        this.on('message', async message => {
            await this.getCommandHandler().run(message)
        })

        // Initialize static values
        this.on('ready', () => {
            this.init()
        })

        // if it's a raffle message, delete the lottery
        this.on('messageDelete', async message => {
            if(message.partial){
                message = await message.fetch()
            }

            const server = await this.servers.get(message.guild?.id)
            const raffle = await server.raffles.get(message.id)
            if(raffle && raffle.isContinues()){
                await raffle.delete()
            }
        })

        // Delete server data from db
        this.on('guildDelete', async guild => {
            await (await this.servers.get(guild.id)).delete()
            await guild.owner?.send([
                `> ${Constants.RUBY_EMOJI} Botun kullanımı ile ilgili sorunlar mı yaşıyorsun? Lütfen bizimle iletişime geçmekten çekinme.\n`,
                `:earth_americas: Website: https://asena.xyz`,
                ':sparkles: Destek Sunucusu: https://discord.gg/CRgXhfs'
            ].join('\n'))
        })

        this.getRaffleTimeUpdater().listenReactions()
        this.getTaskTiming().startTimings()
    }

}
