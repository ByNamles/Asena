import { SuperClient } from '../Asena';

export default abstract class Helper<C extends SuperClient>{

    constructor(protected readonly client: C){}

    protected getClient(): C{
        return this.client
    }

}