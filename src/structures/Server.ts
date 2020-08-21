import Structure from './Structure';
import ServerModel, { IServer } from '../models/Server';
import Timestamps from '../models/legacy/Timestamps';
import ID from '../models/legacy/ID';
import { Snowflake } from 'discord.js';
import RaffleManager from '../managers/RaffleManager';
import Premium from './Premium';

type SuperServer = IServer & Timestamps & ID

class Server extends Structure<typeof ServerModel, SuperServer>{

    public prefix?: string
    public server_id: Snowflake
    public publicCommands: string[]
    public premium?: Premium

    public raffles: RaffleManager = new RaffleManager(this)

    constructor(data: SuperServer){
        super(ServerModel, data)
    }

    protected patch(data: SuperServer){
        this.prefix = data.prefix
        this.server_id = data.server_id
        this.publicCommands = data.publicCommands
        this.premium = data.premium ? new Premium(data.premium) : null

    }

    protected identifierKey(): string{
        return 'server_id'
    }

    async setPrefix(prefix: string){
        await this.update({ prefix })
    }

    isPremium(): boolean{
        return this.premium && this.premium.hasExpired()
    }

    isPublicCommand(command: string){
        return this.publicCommands.includes(command)
    }

    async addPublicCommand(command: string){
        if(!this.isPublicCommand(command)){
            await this.update({
                $push: {
                    publicCommands: command
                }
            })
        }
    }

    async deletePublicCommand(command: string){
        if(this.isPublicCommand(command)){
            await this.update({
                $pull: {
                    publicCommands: command
                }
            })
        }
    }

}

export default Server
