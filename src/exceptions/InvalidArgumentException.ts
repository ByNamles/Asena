import { Exception } from './Exception';

export class InvalidArgumentException extends Exception{

    constructor(private readonly error: string){
        super(error);
    }
    
    public getError = (): string => this.error;

}
